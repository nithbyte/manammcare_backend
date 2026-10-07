import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  public formatOrder(order: any) {
    if (!order) return null;

    const items = (order.items || []).map((item: any) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.productName || item.product?.name || 'Item',
      productImage: item.productImage || item.product?.imageUrl || '',
      image: item.productImage || item.product?.imageUrl || '',
      unit: item.unit || item.product?.unit || '1 Unit',
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      totalPrice: Number(item.totalPrice),
      lineTotal: Number(item.totalPrice),
    }));

    const subtotal = Number(order.subtotal);
    const discount = Number(order.discount);
    const shippingFee = Number(order.deliveryCharge);
    const grandTotal = Number(order.grandTotal);
    const totalItems = items.reduce((sum: number, i: any) => sum + i.quantity, 0);

    const shippingAddress = typeof order.shippingAddress === 'string'
      ? JSON.parse(order.shippingAddress)
      : order.shippingAddress || {};

    const statusLower = order.status.toLowerCase();
    const paymentStatusLower = order.paymentStatus.toLowerCase();

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      customerId: order.userId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items,
      address: shippingAddress,
      shippingAddress,
      subtotal,
      discount,
      deliveryCharge: shippingFee,
      tax: Number(order.tax || 0),
      grandTotal,
      currency: order.currency || 'INR',
      pricing: {
        subtotal,
        discount,
        shippingFee,
        grandTotal,
        totalItems,
      },
      paymentId: order.razorpayPaymentId || undefined,
      razorpayOrderId: order.razorpayOrderId || undefined,
      razorpayPaymentId: order.razorpayPaymentId || undefined,
      paymentMethod: order.paymentMethod.toLowerCase(),
      paymentStatus: paymentStatusLower,
      orderStatus: statusLower,
      status: statusLower,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
      updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
    };
  }

  private generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `MNM-${year}-${random}`;
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item.');
    }

    // 1. Authoritative Server-side product price & inventory verification
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map<string, any>(products.map((p) => [p.id, p]));

    let calculatedSubtotal = 0;
    const orderItemsData: any[] = [];

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product || !product.isAvailable) {
        throw new BadRequestException(`Product with ID ${item.productId} is unavailable.`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Only ${product.stock} items remaining.`,
        );
      }

      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * item.quantity;
      calculatedSubtotal += lineTotal;

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        unit: product.unit,
        unitPrice,
        quantity: item.quantity,
        totalPrice: lineTotal,
      });
    }

    const deliveryCharge = calculatedSubtotal >= 499 ? 0 : 40;
    const discount = 0; // Coupons can adjust this if applied
    const grandTotal = calculatedSubtotal + deliveryCharge - discount;

    const isCod = dto.paymentMethod.toLowerCase().includes('cod') || dto.paymentMethod.toLowerCase() === 'cash_on_delivery';
    const initialStatus = isCod ? OrderStatus.CONFIRMED : (dto.razorpayPaymentId ? OrderStatus.CONFIRMED : OrderStatus.PENDING);
    const paymentStatus = isCod ? PaymentStatus.PENDING : (dto.razorpayPaymentId ? PaymentStatus.SUCCESS : PaymentStatus.PENDING);
    const paymentMethod = isCod ? PaymentMethod.COD : PaymentMethod.RAZORPAY;

    // 2. Atomic Database Transaction: Order creation + Inventory decrement + Cart clearing
    const order = await this.prisma.$transaction(async (tx) => {
      // Decrement inventory
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          userId,
          customerName: dto.shippingAddress.fullName,
          customerPhone: dto.shippingAddress.phone,
          shippingAddress: dto.shippingAddress as any,
          subtotal: calculatedSubtotal,
          discount,
          deliveryCharge,
          tax: 0,
          grandTotal,
          currency: 'INR',
          status: initialStatus,
          paymentStatus,
          paymentMethod,
          razorpayOrderId: dto.razorpayOrderId || null,
          razorpayPaymentId: dto.razorpayPaymentId || null,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // Clear user cart
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return newOrder;
    });

    return this.formatOrder(order);
  }

  async getOrders(userId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { userId };

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
      data: orders.map((o) => this.formatOrder(o)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getOrderById(userId: string, orderId: string, isAdmin = false) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException('You cannot access an order belonging to another customer.');
    }

    return this.formatOrder(order);
  }

  async cancelOrder(userId: string, orderId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You cannot cancel an order belonging to another user.');
    }

    if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Order cannot be cancelled after shipment.');
    }

    if (order.status === OrderStatus.CANCELLED) {
      return this.formatOrder(order);
    }

    // Atomic transaction: Restore inventory + Update status to CANCELLED
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelReason: reason || 'Customer requested cancellation',
        },
        include: { items: true },
      });
    });

    return this.formatOrder(updatedOrder);
  }
}
