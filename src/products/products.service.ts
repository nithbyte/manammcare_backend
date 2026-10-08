import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  public formatProduct(p: any) {
    if (!p) return null;
    return {
      id: p.id,
      sku: p.sku || undefined,
      slug: p.slug || undefined,
      name: p.name,
      shortDescription: p.shortDescription || undefined,
      description: p.description,
      categoryId: p.categoryId,
      category: p.category?.name || 'Daily Essentials',
      brandId: p.brandId || undefined,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
      discountPercentage: p.discountPercentage ?? 0,
      currency: p.currency || 'INR',
      stock: p.stock,
      isAvailable: Boolean(p.isAvailable && p.stock > 0),
      isFeatured: Boolean(p.isFeatured),
      isActive: Boolean(p.isActive),
      imageUrl: p.imageUrl,
      images: Array.isArray(p.images) ? p.images : [p.imageUrl],
      thumbnail: p.thumbnail || p.imageUrl,
      attributes: Array.isArray(p.attributes) ? p.attributes : [],
      tags: Array.isArray(p.tags) ? p.tags : [],
      rating: Number(p.rating ?? 5.0),
      reviewCount: p.reviewCount ?? 0,
      unit: p.unit || '1 Unit',
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
    };
  }

  public formatCategory(c: any) {
    if (!c) return null;
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || undefined,
      imageUrl: c.imageUrl || c.image || undefined,
      image: c.image || c.imageUrl || undefined,
      icon: c.icon || 'grid',
      parentId: c.parentId || null,
      sortOrder: c.sortOrder ?? 0,
      isActive: c.isActive ?? true,
      productCount: c._count?.products ?? 0,
      itemCount: c._count?.products ?? 0,
    };
  }

  async getProducts(query: ProductQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.brandId) {
      where.brandId = query.brandId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
        { shortDescription: { contains: query.search } },
      ];
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
    }

    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    if (query.inStockOnly) {
      where.isAvailable = true;
      where.stock = { gt: 0 };
    }

    let orderBy: any = { createdAt: 'desc' };
    switch (query.sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'name':
        orderBy = { name: 'asc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popularity':
        orderBy = { reviewCount: 'desc' };
        break;
      case 'featured':
        orderBy = [{ isFeatured: 'desc' }, { rating: 'desc' }];
        break;
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: items.map((p) => this.formatProduct(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getFeaturedProducts() {
    const products = await this.prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: { category: true },
      take: 10,
    });
    return products.map((p) => this.formatProduct(p));
  }

  async searchProducts(q: string) {
    if (!q || !q.trim()) return [];
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q.trim() } },
          { description: { contains: q.trim() } },
        ],
      },
      include: { category: true },
      take: 20,
    });
    return products.map((p) => this.formatProduct(p));
  }

  async getProductById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: { category: true, variants: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return this.formatProduct(product);
  }

  async getCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return categories.map((c) => this.formatCategory(c));
  }

  async getCategoryById(id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    return this.formatCategory(category);
  }

  async getProductsByCategory(categoryId: string, page = 1, limit = 20) {
    return this.getProducts({ categoryId, page, limit });
  }
}
