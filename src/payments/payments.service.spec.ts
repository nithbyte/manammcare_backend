import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('PaymentsService - Razorpay Standard Checkout', () => {
  let service: PaymentsService;
  const mockKeyId = 'rzp_test_TnmKGF88MwwpyD';
  const mockKeySecret = 'PwdlFTMvcZVAh6vVnQMtEsKI';

  const mockPrismaService = {
    order: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'RAZORPAY_KEY_ID') return mockKeyId;
              if (key === 'RAZORPAY_KEY_SECRET') return mockKeySecret;
              return defaultValue;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createStandardOrder', () => {
    it('should reject orders with amount less than 100 paise', async () => {
      await expect(
        service.createStandardOrder({ amount: 99 })
      ).rejects.toThrow(BadRequestException);
    });

    it('should create order when amount >= 100 paise', async () => {
      const result = await service.createStandardOrder({
        amount: 50000,
        currency: 'INR',
        receipt: 'rcpt_test_1',
      });

      expect(result).toBeDefined();
      expect(result.order_id).toBeDefined();
      expect(result.amount).toBe(50000);
      expect(result.currency).toBe('INR');
    });
  });

  describe('verifyStandardPayment', () => {
    it('should fail with BadRequestException on signature mismatch', async () => {
      await expect(
        service.verifyStandardPayment({
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_456',
          razorpay_signature: 'invalid_signature_string',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should verify successfully with valid HMAC-SHA256 signature', async () => {
      const orderId = 'order_valid_123';
      const paymentId = 'pay_valid_456';
      const validSignature = crypto
        .createHmac('sha256', mockKeySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const result = await service.verifyStandardPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      });

      expect(result.verified).toBe(true);
      expect(result.status).toBe('success');
      expect(result.order_id).toBe(orderId);
      expect(result.payment_id).toBe(paymentId);
    });
  });
});
