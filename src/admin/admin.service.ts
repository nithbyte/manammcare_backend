import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { NetworkingService } from '../networking/networking.service';
import { OrderStatus, Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
    private ordersService: OrdersService,
    private networkingService: NetworkingService,
  ) {}

  private async logActivity(adminId: string, action: string, entity: string, entityId: string, description: string) {
    try {
      await this.prisma.adminActivityLog.create({
        data: {
          adminId,
          action,
          entity,
          entityId,
          description,
        },
      });
    } catch {
      // Non-blocking log failure
    }
  }

  async getDashboard() {
    const [
      totalCustomers,
      totalProducts,
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      recentOrdersRaw,
      revenueResult,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.PROCESSING } }),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      this.prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.order.aggregate({
        where: {
          status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        },
        _sum: {
          grandTotal: true,
        },
      }),
    ]);

    const totalRevenue = Number(revenueResult._sum?.grandTotal || 0);
    const recentOrders = recentOrdersRaw.map((o) => this.ordersService.formatOrder(o));

    // Inventory & Low Stock Alerts
    const defaultLowStockThreshold = 10;
    const [outOfStockCount, lowStockCount, lowStockProductsRaw] = await Promise.all([
      this.prisma.product.count({
        where: {
          isActive: true,
          OR: [{ stock: { lte: 0 } }, { isAvailable: false }],
        },
      }),
      this.prisma.product.count({
        where: {
          isActive: true,
          stock: { gt: 0, lte: defaultLowStockThreshold },
        },
      }),
      this.prisma.product.findMany({
        where: {
          isActive: true,
          stock: { gt: 0, lte: defaultLowStockThreshold },
        },
        take: 10,
        select: {
          id: true,
          name: true,
          stock: true,
          unit: true,
          imageUrl: true,
        },
      }),
    ]);

    // Top products
    const topProductsRaw = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { reviewCount: 'desc' },
      take: 5,
    });

    const topProducts = topProductsRaw.map((p) => ({
      productId: p.id,
      productName: p.name,
      totalQuantitySold: (p.reviewCount || 1) * 3,
      totalRevenue: Number(p.price) * (p.reviewCount || 1) * 3,
      imageUrl: p.imageUrl,
    }));

    return {
      totalCustomers,
      totalProducts,
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      outOfStockCount,
      lowStockCount,
      lowStockProducts: lowStockProductsRaw,
      recentOrders,
      topProducts,
    };
  }

  async getAllOrders(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status.toUpperCase() as OrderStatus;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: orders.map((o) => this.ordersService.formatOrder(o)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async updateOrderStatus(adminId: string, orderId: string, status: string) {
    const enumStatus = status.toUpperCase() as OrderStatus;

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: enumStatus },
      include: { items: true },
    });

    await this.logActivity(
      adminId,
      'ORDER_STATUS_UPDATED',
      'Order',
      orderId,
      `Updated order status to ${enumStatus}`,
    );

    // Authoritative backend delivery event: evaluate and activate membership
    if (enumStatus === OrderStatus.DELIVERED) {
      try {
        await this.networkingService.activateMembershipForDeliveredOrder(orderId);
      } catch (err) {
        // Non-blocking for status update transaction, but logged
      }
    }

    return this.ordersService.formatOrder(order);
  }

  async getAdminProducts(page = 1, limit = 100) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: products.map((p) => this.productsService.formatProduct(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async createProduct(adminId: string, data: any) {
    if (!data.name) {
      throw new BadRequestException('Product name is required');
    }
    if (!data.categoryId) {
      throw new BadRequestException('Category is required');
    }
    if (data.price === undefined || data.price === null || isNaN(Number(data.price))) {
      throw new BadRequestException('Valid selling price is required');
    }

    const price = Number(data.price);
    const compareAtPrice = data.compareAtPrice ? Number(data.compareAtPrice) : null;
    const stock = data.stock !== undefined ? Math.max(0, Number(data.stock)) : 50;
    const unit = data.unit?.trim() || '1 Unit';
    const description = data.description?.trim() || data.name.trim();
    const shortDescription = data.shortDescription?.trim() || description;
    const imageUrl = data.imageUrl?.trim() ||
      'https://res.cloudinary.com/hawhugfs/image/upload/v1792654494/manamm/categories/asset_7.jpg';
    const images = Array.isArray(data.images) && data.images.length > 0 ? data.images : [imageUrl];

    const slug = data.slug || `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const sku = data.sku || `MNM-${Date.now().toString().slice(-6)}`;

    // Ensure category exists
    let category = await this.prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      category = await this.prisma.category.findFirst();
    }

    const created = await this.prisma.product.create({
      data: {
        name: data.name.trim(),
        sku,
        slug,
        description,
        shortDescription,
        categoryId: category ? category.id : data.categoryId,
        brandId: data.brandId || null,
        price,
        compareAtPrice,
        discountPercentage: compareAtPrice && compareAtPrice > price
          ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
          : 0,
        stock,
        isAvailable: stock > 0 ? (data.isAvailable ?? true) : false,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        imageUrl,
        images,
        thumbnail: data.thumbnail || imageUrl,
        unit,
        rating: 5.0,
        reviewCount: 0,
        attributes: data.attributes || (data.lowStockThreshold ? { lowStockThreshold: Number(data.lowStockThreshold) } : []),
        tags: data.tags || [],
      },
      include: { category: true },
    });

    await this.logActivity(
      adminId,
      'PRODUCT_CREATED',
      'Product',
      created.id,
      `Created product ${created.name}`,
    );

    return this.productsService.formatProduct(created);
  }

  async updateProduct(adminId: string, productId: string, updates: any) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    // Merge lowStockThreshold into attributes
    let updatedAttributes = product.attributes;
    if (updates.lowStockThreshold !== undefined) {
      const currentAttrs =
        typeof product.attributes === 'object' && product.attributes !== null && !Array.isArray(product.attributes)
          ? { ...product.attributes }
          : {};
      currentAttrs.lowStockThreshold = Number(updates.lowStockThreshold);
      updatedAttributes = currentAttrs;
    } else if (updates.attributes !== undefined) {
      updatedAttributes = updates.attributes;
    }

    const hasNewStock = updates.stock !== undefined;
    const numStock = hasNewStock ? Math.max(0, Number(updates.stock)) : product.stock;
    let newIsAvailable: boolean | undefined = undefined;
    if (updates.isAvailable !== undefined) {
      newIsAvailable = Boolean(updates.isAvailable);
    }
    if (hasNewStock && numStock <= 0) {
      newIsAvailable = false;
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(hasNewStock ? { stock: numStock } : {}),
        ...(newIsAvailable !== undefined ? { isAvailable: newIsAvailable } : {}),
        ...(updatedAttributes !== undefined ? { attributes: updatedAttributes } : {}),
        ...(updates.price !== undefined ? { price: updates.price } : {}),
        ...(updates.compareAtPrice !== undefined ? { compareAtPrice: updates.compareAtPrice } : {}),
        ...(updates.isActive !== undefined ? { isActive: Boolean(updates.isActive) } : {}),
        ...(updates.isFeatured !== undefined ? { isFeatured: Boolean(updates.isFeatured) } : {}),
        ...(updates.imageUrl !== undefined ? { imageUrl: updates.imageUrl } : {}),
        ...(updates.images !== undefined ? { images: updates.images } : {}),
        ...(updates.thumbnail !== undefined ? { thumbnail: updates.thumbnail } : {}),
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.unit !== undefined ? { unit: updates.unit } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.shortDescription !== undefined ? { shortDescription: updates.shortDescription } : {}),
        ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
      },
      include: { category: true },
    });

    await this.logActivity(
      adminId,
      'PRODUCT_UPDATED',
      'Product',
      productId,
      `Updated product ${product.name}`,
    );

    return this.productsService.formatProduct(updated);
  }

  async syncCatalog(adminId: string, productsList?: any[]) {
    const list = Array.isArray(productsList) && productsList.length > 0 ? productsList : [];
    let upsertCount = 0;

    for (const p of list) {
      if (!p.id || !p.name) continue;
      await this.prisma.product.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          sku: p.sku || null,
          slug: p.slug || null,
          description: p.description || p.name,
          shortDescription: p.shortDescription || null,
          price: p.price ?? 0,
          compareAtPrice: p.compareAtPrice || null,
          stock: p.stock ?? 50,
          isAvailable: p.isAvailable ?? true,
          isActive: p.isActive ?? true,
          imageUrl: p.imageUrl || '',
          images: p.images || (p.imageUrl ? [p.imageUrl] : []),
          thumbnail: p.thumbnail || p.imageUrl || null,
          unit: p.unit || '1 Unit',
          attributes: p.attributes || [],
          tags: p.tags || [],
        },
        create: {
          id: p.id,
          name: p.name,
          sku: p.sku || null,
          slug: p.slug || null,
          description: p.description || p.name,
          shortDescription: p.shortDescription || null,
          categoryId: p.categoryId,
          brandId: p.brandId || null,
          price: p.price ?? 0,
          compareAtPrice: p.compareAtPrice || null,
          stock: p.stock ?? 50,
          isAvailable: p.isAvailable ?? true,
          isActive: p.isActive ?? true,
          imageUrl: p.imageUrl || '',
          images: p.images || (p.imageUrl ? [p.imageUrl] : []),
          thumbnail: p.thumbnail || p.imageUrl || null,
          unit: p.unit || '1 Unit',
          attributes: p.attributes || [],
          tags: p.tags || [],
        },
      });
      upsertCount++;
    }

    await this.logActivity(
      adminId,
      'CATALOG_SYNCED',
      'ProductCatalog',
      'all',
      `Synchronized ${upsertCount} products into database`,
    );

    return {
      success: true,
      message: `Successfully synchronized ${upsertCount} products.`,
      count: upsertCount,
    };
  }

  async getAdminUsers(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: Role.CUSTOMER },
        select: {
          id: true,
          email: true,
          phone: true,
          fullName: true,
          role: true,
          status: true,
          membershipStatus: true,
          membershipActivatedAt: true,
          referralCode: true,
          profileImage: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              referralsGiven: true,
            },
          },
          referralReceived: {
            select: {
              id: true,
              referrerId: true,
              referralCodeUsed: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getActivityLogs() {
    return this.prisma.adminActivityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
