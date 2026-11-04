import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductsService implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.ensureTrophiesCatalog();
    } catch (e: any) {
      console.warn('[ProductsService] Trophy sync warning:', e.message);
    }
  }
  constructor(private prisma: PrismaService) {}

  private async ensureTrophiesCatalog() {
    await this.prisma.category.upsert({
      where: { id: 'cat_trophies' },
      update: {
        name: 'Trophies & Awards',
        slug: 'trophies-awards',
        icon: 'trophy',
        imageUrl: 'https://res.cloudinary.com/hawhugfs/image/upload/v1793793724/manamm/products/trophies/prod_trp_02_01_01_clean_v2.jpg',
        isActive: true,
      },
      create: {
        id: 'cat_trophies',
        name: 'Trophies & Awards',
        slug: 'trophies-awards',
        description: 'Prestige cups, recognition awards, metal & acrylic trophies and mementos.',
        icon: 'trophy',
        imageUrl: 'https://res.cloudinary.com/hawhugfs/image/upload/v1793793724/manamm/products/trophies/prod_trp_02_01_01_clean_v2.jpg',
        sortOrder: 8,
        isActive: true,
      },
    });

    const count = await this.prisma.product.count({
      where: { categoryId: 'cat_trophies' },
    });

    if (count < 300) {
      const candidates = [
        path.resolve(__dirname, '../../data/products/trophy_active_products.json'),
        path.resolve(process.cwd(), 'data/products/trophy_active_products.json'),
      ];
      const dataPath = candidates.find((p) => fs.existsSync(p));
      if (dataPath) {
        const trophies = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log(`[ProductsService] Seeding ${trophies.length} trophies into MySQL...`);
        for (const t of trophies) {
          const variants = t.variants || [];
          const attributes = [
            ...(t.attributes || []),
            { name: 'variants', value: JSON.stringify(variants) },
          ];

          await this.prisma.product.upsert({
            where: { id: t.id },
            update: {
              name: t.name,
              sku: t.sku,
              slug: t.slug,
              price: t.price,
              stock: t.stock ?? 100,
              isAvailable: true,
              isActive: true,
              imageUrl: t.imageUrl,
              images: t.images || [t.imageUrl],
              thumbnail: t.thumbnail || t.imageUrl,
              attributes,
              tags: t.tags || ['trophy', 'award'],
            },
            create: {
              id: t.id,
              name: t.name,
              sku: t.sku,
              slug: t.slug,
              description: t.description || t.name,
              shortDescription: t.shortDescription || t.name,
              categoryId: 'cat_trophies',
              brandId: t.brandId || null,
              price: t.price,
              compareAtPrice: t.compareAtPrice || null,
              discountPercentage: t.discountPercentage || 0,
              stock: t.stock ?? 100,
              isAvailable: true,
              isActive: true,
              isFeatured: true,
              imageUrl: t.imageUrl,
              images: t.images || [t.imageUrl],
              thumbnail: t.thumbnail || t.imageUrl,
              unit: t.unit || '1 Piece',
              attributes,
              tags: t.tags || ['trophy', 'award'],
              rating: 5.0,
              reviewCount: 0,
            },
          });
        }
        console.log('[ProductsService] Successfully seeded trophies into MySQL.');
      }
    }
  }

  private resolveImageUrl(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = process.env.API_BASE_URL || 'https://api.manammcare.com';
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${base}${cleanPath}`;
  }

  public formatProduct(p: any) {
    if (!p) return null;
    const rawImage = p.imageUrl || (Array.isArray(p.images) && p.images[0]) || '';
    const imageUrl = this.resolveImageUrl(rawImage);
    const images = Array.isArray(p.images) && p.images.length > 0
      ? p.images.map((img: string) => this.resolveImageUrl(img))
      : [imageUrl];
    const thumbnail = this.resolveImageUrl(p.thumbnail || rawImage);

    const lowStockThreshold =
      typeof p.attributes === 'object' && p.attributes !== null && !Array.isArray(p.attributes)
        ? (p.attributes.lowStockThreshold ?? 10)
        : 10;

    let variants: any[] | undefined = undefined;
    if (Array.isArray(p.attributes)) {
      const varAttr = p.attributes.find((a: any) => a && a.name === 'variants');
      if (varAttr && varAttr.value) {
        try {
          variants = typeof varAttr.value === 'string' ? JSON.parse(varAttr.value) : varAttr.value;
        } catch {}
      }
    } else if (Array.isArray(p.variants) && p.variants.length > 0) {
      variants = p.variants;
    }

    return {
      id: p.id,
      variants,
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
      lowStockThreshold,
      isAvailable: Boolean(p.isAvailable && p.stock > 0),
      inStock: Boolean(p.isAvailable && p.stock > 0),
      isFeatured: Boolean(p.isFeatured),
      isActive: Boolean(p.isActive),
      imageUrl,
      images,
      thumbnail,
      attributes: p.attributes || [],
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
    const rawCatImg = c.imageUrl || c.image || undefined;
    const catImageUrl = rawCatImg ? this.resolveImageUrl(rawCatImg) : undefined;
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || undefined,
      imageUrl: catImageUrl,
      image: catImageUrl,
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
    const limit = Math.max(1, Math.min(10000, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    const andConditions: any[] = [];

    if (query.categoryId && query.categoryId !== 'ALL') {
      andConditions.push({
        OR: [
          { categoryId: query.categoryId },
          { category: { slug: query.categoryId } },
          { category: { name: query.categoryId } },
        ],
      });
    }

    if (query.brandId) {
      where.brandId = query.brandId;
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      andConditions.push({
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
          { shortDescription: { contains: q } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
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
