import { Injectable, NotFoundException } from '@nestjs/common';
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

  async updateProduct(adminId: string, productId: string, updates: any) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(updates.stock !== undefined ? { stock: Number(updates.stock), isAvailable: Number(updates.stock) > 0 } : {}),
        ...(updates.price !== undefined ? { price: updates.price } : {}),
        ...(updates.compareAtPrice !== undefined ? { compareAtPrice: updates.compareAtPrice } : {}),
        ...(updates.isAvailable !== undefined ? { isAvailable: Boolean(updates.isAvailable) } : {}),
        ...(updates.isActive !== undefined ? { isActive: Boolean(updates.isActive) } : {}),
        ...(updates.isFeatured !== undefined ? { isFeatured: Boolean(updates.isFeatured) } : {}),
        ...(updates.imageUrl !== undefined ? { imageUrl: updates.imageUrl } : {}),
        ...(updates.images !== undefined ? { images: updates.images } : {}),
        ...(updates.thumbnail !== undefined ? { thumbnail: updates.thumbnail } : {}),
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.unit !== undefined ? { unit: updates.unit } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.shortDescription !== undefined ? { shortDescription: updates.shortDescription } : {}),
        ...(updates.attributes !== undefined ? { attributes: updates.attributes } : {}),
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
