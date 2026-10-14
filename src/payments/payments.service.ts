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
    if (amountInPaise < 100) {
      throw new BadRequestException('Amount must be at least ₹1 (100 paise)');
    }

    if (this.razorpayInstance) {
      try {
        const order = await this.razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: dto.receipt,
          notes: dto.notes || {},
        });

        return {
          order_id: order.id,
          razorpayOrderId: order.id,
          amount: order.amount,
          currency: 'INR',
          keyId: this.keyId,
        };
      } catch (err: any) {
        this.logger.error('Razorpay API order creation failed:', err);
        throw new BadRequestException(err?.error?.description || err?.message || 'Razorpay order creation failed');
      }
    }

    // Fallback development simulation
    const simulatedOrderId = `order_sim_${Date.now()}`;
    return {
      order_id: simulatedOrderId,
      razorpayOrderId: simulatedOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: this.keyId,
    };
  }

  async createStandardOrder(dto: { amount: number; currency?: string; receipt?: string; notes?: Record<string, string> }) {
    // Expect amount in paise or validate >= 100
    const amountInPaise = Math.round(dto.amount);
    if (amountInPaise < 100) {
      throw new BadRequestException('Amount must be at least 100 paise');
    }

    const currency = dto.currency || 'INR';
    const receipt = dto.receipt || `rcpt_${Date.now()}`;

    if (this.razorpayInstance) {
      try {
        const order = await this.razorpayInstance.orders.create({
          amount: amountInPaise,
          currency,
          receipt,
          notes: dto.notes || {},
        });

        return {
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          key_id: this.keyId,
        };
      } catch (err: any) {
        this.logger.error('Razorpay API order creation failed:', err);
        throw new BadRequestException(err?.error?.description || err?.message || 'Razorpay order creation failed');
      }
    }

    const simulatedOrderId = `order_sim_${Date.now()}`;
    return {
      order_id: simulatedOrderId,
      amount: amountInPaise,
      currency,
      key_id: this.keyId,
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
      throw new BadRequestException('Payment verification failed: Signature mismatch or invalid payment credentials.');
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

  async verifyStandardPayment(dto: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; orderId?: string }) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = dto;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new BadRequestException('Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.');
    }

    let isValid = false;

    if (this.keySecret && !this.keySecret.includes('placeholder')) {
      const generatedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = generatedSignature === razorpay_signature;
    } else {
      isValid = !razorpay_payment_id.includes('fail') && !razorpay_signature.includes('invalid');
    }

    if (!isValid) {
      throw new BadRequestException('Payment verification failed: Signature mismatch.');
    }

    // If orderId is provided, update DB
    if (orderId) {
      try {
        const order = await this.prisma.order.findFirst({
          where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
        });

        if (order) {
          await this.prisma.$transaction([
            this.prisma.order.update({
              where: { id: order.id },
              data: {
                status: OrderStatus.CONFIRMED,
                paymentStatus: PaymentStatus.SUCCESS,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
              },
            }),
            this.prisma.payment.create({
              data: {
                orderId: order.id,
                userId: order.userId,
                provider: PaymentProvider.RAZORPAY,
                providerOrderId: razorpay_order_id,
                providerPaymentId: razorpay_payment_id,
                amount: order.grandTotal,
                currency: 'INR',
                status: PaymentStatus.SUCCESS,
                signature: razorpay_signature,
                method: 'razorpay',
              },
            }),
          ]);
        }
      } catch (err: any) {
        this.logger.warn('Failed to update DB order during standard verify:', err?.message);
      }
    }

    return {
      status: 'success',
      verified: true,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      message: 'Payment signature verified successfully.',
    };
  }

  async getPaymentStatus(paymentId: string) {
    return this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
  }
}
