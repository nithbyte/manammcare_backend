import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentOrderDto, VerifyPaymentDto } from './dto/payment.dto';
import * as crypto from 'crypto';
import Razorpay = require('razorpay');
import { PaymentStatus, OrderStatus, PaymentProvider } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpayInstance: any = null;
  private keyId: string;
  private keySecret: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID', 'rzp_test_placeholder');
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', 'rzp_test_secret_placeholder');

    if (this.keyId && !this.keyId.includes('placeholder')) {
      try {
        this.razorpayInstance = new (Razorpay as any)({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
      } catch (err) {
        this.logger.warn('Failed to initialize Razorpay SDK client:', err.message);
      }
    }
  }

  async createRazorpayOrder(dto: CreatePaymentOrderDto) {
    const amountInPaise = Math.round(dto.amount * 100);

    if (this.razorpayInstance) {
      try {
        const order = await this.razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: dto.receipt,
          notes: dto.notes || {},
        });

        return {
          razorpayOrderId: order.id,
          amount: order.amount,
          currency: 'INR',
          keyId: this.keyId,
        };
      } catch (err) {
        this.logger.error('Razorpay API order creation failed:', err);
      }
    }

    // Fallback development simulation
    const simulatedOrderId = `order_sim_${Date.now()}`;
    return {
      razorpayOrderId: simulatedOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: this.keyId,
    };
  }

  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = dto;

    let isValid = false;

    // Check HMAC SHA-256 signature if real credentials exist
    if (this.keySecret && !this.keySecret.includes('placeholder')) {
      const generatedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      isValid = generatedSignature === razorpaySignature;
    } else {
      // In development / demo simulation mode, accept signatures unless explicit 'fail' flag
      isValid = !razorpayPaymentId.includes('fail') && !razorpaySignature.includes('invalid');
    }

    if (!isValid) {
      return {
        verified: false,
        orderId,
        paymentStatus: 'failed',
        message: 'Payment verification failed: Signature mismatch or declined.',
      };
    }

    // Update or create Payment and Order status in database
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
    });

    if (order) {
      await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.SUCCESS,
            razorpayOrderId,
            razorpayPaymentId,
          },
        }),
        this.prisma.payment.create({
          data: {
            orderId: order.id,
            userId: order.userId,
            provider: PaymentProvider.RAZORPAY,
            providerOrderId: razorpayOrderId,
            providerPaymentId: razorpayPaymentId,
            amount: order.grandTotal,
            currency: 'INR',
            status: PaymentStatus.SUCCESS,
            signature: razorpaySignature,
            method: 'razorpay',
          },
        }),
      ]);
    }

    return {
      verified: true,
      orderId,
      paymentStatus: 'completed',
      message: 'Payment verified successfully by backend.',
    };
  }

  async getPaymentStatus(paymentId: string) {
    return this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
  }
}
