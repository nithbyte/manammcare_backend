import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
    }

    return cart;
  }

  public formatCart(cart: any) {
    if (!cart) return null;

    const items = (cart.items || []).map((item: any) => {
      const p = item.product;
      const unitPrice = Number(p.price);
      const lineTotal = unitPrice * item.quantity;

      return {
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        product: {
          id: p.id,
          sku: p.sku || undefined,
          slug: p.slug || undefined,
          name: p.name,
          description: p.description,
          price: unitPrice,
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
          stock: p.stock,
          isAvailable: Boolean(p.isAvailable && p.stock > 0),
          imageUrl: p.imageUrl,
          unit: p.unit,
        },
      };
    });

    const subtotal = items.reduce((sum: number, i: any) => sum + i.lineTotal, 0);
    const totalItems = items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    const deliveryCharge = totalItems > 0 ? (subtotal >= 499 ? 0 : 40) : 0;
    const discount = 0;
    const tax = 0;
    const grandTotal = subtotal + deliveryCharge - discount;

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      subtotal,
      discount,
      deliveryCharge,
      shippingFee: deliveryCharge,
      tax,
      grandTotal,
      currency: 'INR',
      totalItems,
      updatedAt: cart.updatedAt instanceof Date ? cart.updatedAt.toISOString() : cart.updatedAt,
    };
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return this.formatCart(cart);
  }

  async addItem(userId: string, productId: string, quantity = 1) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero.');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isAvailable || product.stock <= 0) {
      throw new BadRequestException('Product is currently out of stock or unavailable.');
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    const currentQty = existingItem ? existingItem.quantity : 0;
    const newQty = currentQty + quantity;

    if (newQty > product.stock) {
      throw new BadRequestException(`Cannot add ${quantity} more. Only ${product.stock} items in stock.`);
    }

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: Math.min(newQty, 10), // Max 10 per item limit
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItemQuantity(userId: string, cartItemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: true, cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found.');
    }

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({
        where: { id: cartItemId },
      });
    } else {
      if (quantity > item.product.stock) {
        throw new BadRequestException(`Only ${item.product.stock} items available in stock.`);
      }

      await this.prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity: Math.min(quantity, 10) },
      });
    }

    return this.getCart(userId);
  }

  async removeItem(userId: string, cartItemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found.');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getCart(userId);
  }
}
