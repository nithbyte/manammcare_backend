import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipStatus, OrderStatus, UserStatus } from '@prisma/client';
import * as crypto from 'crypto';

export interface MembershipEligibilityResult {
  eligible: boolean;
  reason?: string;
  orderAmount: number;
  threshold: number;
}

@Injectable()
export class NetworkingService {
  private readonly logger = new Logger(NetworkingService.name);
  public static readonly MEMBERSHIP_THRESHOLD_INR = 500;

  constructor(private prisma: PrismaService) {}

  /**
   * Helper to format a privacy-safe customer display name
   * e.g., "Ramesh Kumar" -> "Ramesh K."
   */
  private formatPrivacySafeName(fullName?: string | null): string {
    if (!fullName || !fullName.trim()) return 'Valued Customer';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstName} ${lastInitial}.`;
  }

  /**
   * Centralised business rule:
   * Order must be DELIVERED and eligible amount strictly greater than ₹500 (amount > 500.00).
   * Cancelled, returned, refunded, or non-delivered orders do not qualify.
   */
  public evaluateOrderEligibility(order: {
    id?: string;
    grandTotal: any;
    status: OrderStatus;
  }): MembershipEligibilityResult {
    const threshold = NetworkingService.MEMBERSHIP_THRESHOLD_INR;
    const amount = Number(order.grandTotal);

    if (order.status !== OrderStatus.DELIVERED) {
      return {
        eligible: false,
        reason: `Order is not delivered (current status: ${order.status}).`,
        orderAmount: amount,
        threshold,
      };
    }

    // Rule: eligibleOrderAmount > ₹500 strictly
    if (amount <= threshold) {
      return {
        eligible: false,
        reason: `Order amount (₹${amount}) must be strictly greater than ₹${threshold}.`,
        orderAmount: amount,
        threshold,
      };
    }

    return {
      eligible: true,
      orderAmount: amount,
      threshold,
    };
  }

  /**
   * Generates a unique, collisions-checked referral code
   * Format: MNM + 6 alphanumeric characters (excluding confusing chars: 0, O, 1, I)
   */
  public async generateUniqueReferralCode(prismaClient?: any): Promise<string> {
    const client = prismaClient || this.prisma;
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const prefix = 'MNM';
    const codeLength = 6;
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let randomPart = '';
      const bytes = crypto.randomBytes(codeLength);
      for (let i = 0; i < codeLength; i++) {
        randomPart += alphabet[bytes[i] % alphabet.length];
      }
      const candidateCode = `${prefix}${randomPart}`;

      const existing = await client.user.findUnique({
        where: { referralCode: candidateCode },
        select: { id: true },
      });

      if (!existing) {
        return candidateCode;
      }
    }

    // Fallback timestamp suffix if extreme collision
    return `${prefix}${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }

  /**
   * Validates a referral code against business constraints
   * - Cannot be empty
   * - Must exist in database
   * - Must belong to an active member
   * - Cannot be used for self-referral
   */
  public async validateReferralCode(
    rawCode: string,
    currentUserId?: string,
  ): Promise<{
    valid: boolean;
    code?: string;
    referrerId?: string;
    referrerName?: string;
    message?: string;
  }> {
    if (!rawCode || !rawCode.trim()) {
      return { valid: false, message: 'Please provide a valid referral code.' };
    }

    const normalized = rawCode.trim().toUpperCase();

    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: normalized },
      select: {
        id: true,
        fullName: true,
        membershipStatus: true,
        status: true,
        referralCode: true,
      },
    });

    if (!referrer || !referrer.referralCode) {
      return {
        valid: false,
        message: 'Invalid referral code. Please verify the code and try again.',
      };
    }

    if (currentUserId && referrer.id === currentUserId) {
      return {
        valid: false,
        message: 'You cannot use your own referral code.',
      };
    }

    if (referrer.status === UserStatus.SUSPENDED) {
      return {
        valid: false,
        message: 'This referral code belongs to a suspended account.',
      };
    }

    if (referrer.membershipStatus !== MembershipStatus.MEMBER) {
      return {
        valid: false,
        message: 'Referral code is not currently active for membership sharing.',
      };
    }

    return {
      valid: true,
      code: referrer.referralCode,
      referrerId: referrer.id,
      referrerName: this.formatPrivacySafeName(referrer.fullName),
    };
  }

  /**
   * Records referral attribution during registration
   * Called within a transaction or service workflow
   */
  public async recordAttribution(
    tx: any,
    newUserId: string,
    referralCode: string,
  ): Promise<void> {
    const validation = await this.validateReferralCode(referralCode, newUserId);
    if (!validation.valid || !validation.referrerId || !validation.code) {
      throw new BadRequestException(validation.message || 'Invalid referral code.');
    }

    // Ensure user was not already referred
    const existing = await tx.referral.findUnique({
      where: { referredUserId: newUserId },
    });

    if (existing) {
      return; // Already attributed
    }

    await tx.referral.create({
      data: {
        referrerId: validation.referrerId,
        referredUserId: newUserId,
        referralCodeUsed: validation.code,
        status: 'REGISTERED',
      },
    });

    this.logger.log(
      `Attributed new customer ${newUserId} to referrer ${validation.referrerId} via code ${validation.code}`,
    );
  }

  /**
   * Authoritative Delivery Hook:
   * Called when an order reaches DELIVERED status.
   * Evaluates eligibility and idempotently activates membership + generates referral code.
   */
  public async activateMembershipForDeliveredOrder(orderId: string): Promise<{
    activated: boolean;
    alreadyMember: boolean;
    orderId: string;
    userId: string;
    membershipStatus: MembershipStatus;
    referralCode?: string | null;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            membershipStatus: true,
            membershipActivatedAt: true,
            referralCode: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found.`);
    }

    const user = order.user;
    if (!user) {
      throw new NotFoundException(`Customer for order ${orderId} not found.`);
    }

    // 1. Evaluate centralized eligibility rules
    const eligibility = this.evaluateOrderEligibility(order);
    if (!eligibility.eligible) {
      this.logger.log(
        `Order ${order.orderNumber} does not qualify for membership activation: ${eligibility.reason}`,
      );
      return {
        activated: false,
        alreadyMember: user.membershipStatus === MembershipStatus.MEMBER,
        orderId: order.id,
        userId: user.id,
        membershipStatus: user.membershipStatus,
        referralCode: user.referralCode,
      };
    }

    // 2. If user is already a member, maintain idempotency
    if (user.membershipStatus === MembershipStatus.MEMBER) {
      // Check if this user was referred and the attribution needs activation
      await this.prisma.referral.updateMany({
        where: {
          referredUserId: user.id,
          status: 'REGISTERED',
        },
        data: {
          status: 'ACTIVATED',
          activatedAt: new Date(),
          qualifyingOrderId: order.id,
        },
      });

      return {
        activated: false,
        alreadyMember: true,
        orderId: order.id,
        userId: user.id,
        membershipStatus: user.membershipStatus,
        referralCode: user.referralCode,
      };
    }

    // 3. User qualifies for initial membership activation!
    const uniqueReferralCode = await this.generateUniqueReferralCode();
    const activationDate = new Date();

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      // Activate member
      const member = await tx.user.update({
        where: { id: user.id },
        data: {
          membershipStatus: MembershipStatus.MEMBER,
          membershipActivatedAt: activationDate,
          referralCode: uniqueReferralCode,
        },
      });

      // Update referral attribution if user was referred by someone
      await tx.referral.updateMany({
        where: {
          referredUserId: user.id,
          status: 'REGISTERED',
        },
        data: {
          status: 'ACTIVATED',
          activatedAt: activationDate,
          qualifyingOrderId: order.id,
        },
      });

      return member;
    });

    this.logger.log(
      `🎉 Membership activated for user ${user.id} (${user.fullName}). Assigned referral code: ${uniqueReferralCode}. Qualifying Order: ${order.orderNumber} (₹${order.grandTotal})`,
    );

    return {
      activated: true,
      alreadyMember: false,
      orderId: order.id,
      userId: user.id,
      membershipStatus: updatedUser.membershipStatus,
      referralCode: updatedUser.referralCode,
    };
  }

  /**
   * Retrieves networking dashboard overview for the authenticated customer
   */
  public async getDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        membershipStatus: true,
        membershipActivatedAt: true,
        referralCode: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    const isMember = user.membershipStatus === MembershipStatus.MEMBER;
    const threshold = NetworkingService.MEMBERSHIP_THRESHOLD_INR;

    if (isMember) {
      const [totalInvited, membersActivated] = await Promise.all([
        this.prisma.referral.count({ where: { referrerId: userId } }),
        this.prisma.referral.count({
          where: { referrerId: userId, status: 'ACTIVATED' },
        }),
      ]);

      const customersPending = totalInvited - membersActivated;

      return {
        success: true,
        data: {
          membershipStatus: user.membershipStatus,
          isMember: true,
          membershipActivatedAt: user.membershipActivatedAt?.toISOString() || null,
          referralCode: user.referralCode,
          stats: {
            totalInvited,
            membersActivated,
            customersPending,
          },
          sharing: {
            code: user.referralCode,
            shareMessage: `Join MANAM for pure daily essentials and farm-fresh staples! Use my referral code ${user.referralCode} when registering.`,
          },
        },
      };
    }

    // Customer status (not yet member)
    const qualifyingOrdersCount = await this.prisma.order.count({
      where: {
        userId,
        status: OrderStatus.DELIVERED,
        grandTotal: { gt: threshold },
      },
    });

    return {
      success: true,
      data: {
        membershipStatus: user.membershipStatus,
        isMember: false,
        membershipActivatedAt: null,
        referralCode: null,
        eligibilityCriteria: {
          thresholdAmount: threshold,
          rule: 'A customer automatically becomes a MANAM member after their first delivered qualifying order strictly greater than ₹500.',
          qualifyingOrdersCount,
          isEligibleForImmediateActivation: qualifyingOrdersCount > 0,
        },
      },
    };
  }

  /**
   * Retrieves paginated list of people referred by the authenticated member
   */
  public async getReferrals(userId: string, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { membershipStatus: true },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    const skip = (page - 1) * limit;

    const [referrals, total] = await Promise.all([
      this.prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          referredUser: {
            select: {
              fullName: true,
              membershipStatus: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.referral.count({ where: { referrerId: userId } }),
    ]);

    const formatted = referrals.map((r) => ({
      id: r.id,
      displayName: this.formatPrivacySafeName(r.referredUser?.fullName),
      status: r.status,
      isMember: r.status === 'ACTIVATED' || r.referredUser?.membershipStatus === MembershipStatus.MEMBER,
      membershipStatus: r.referredUser?.membershipStatus || MembershipStatus.CUSTOMER,
      joinedAt: r.createdAt.toISOString(),
      activatedAt: r.activatedAt?.toISOString() || null,
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
