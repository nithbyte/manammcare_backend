import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CouponType } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async validateCoupon(code: string, subtotal: number) {
    if (!code || !code.trim()) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Please provide a coupon code.',
      };
    }

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Invalid or expired coupon code.',
      };
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'This coupon has expired.',
      };
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'This coupon has reached its maximum usage limit.',
      };
    }

    const minOrder = Number(coupon.minimumOrderValue);
    if (subtotal < minOrder) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Minimum order value of ₹${minOrder} required for this coupon.`,
      };
    }

    let discountAmount = 0;
    const value = Number(coupon.value);

    if (coupon.type === CouponType.PERCENTAGE) {
      discountAmount = Math.round((subtotal * value) / 100);
      if (coupon.maximumDiscount) {
        discountAmount = Math.min(discountAmount, Number(coupon.maximumDiscount));
      }
    } else {
      discountAmount = value;
    }

    // Discount cannot exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return {
      isValid: true,
      discountAmount,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        title: coupon.title,
        description: coupon.description,
        type: coupon.type,
        value: Number(coupon.value),
        minimumOrderValue: Number(coupon.minimumOrderValue),
        maximumDiscount: coupon.maximumDiscount ? Number(coupon.maximumDiscount) : undefined,
      },
      message: `Coupon applied! You saved ₹${discountAmount}.`,
    };
  }
}
