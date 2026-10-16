import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipStatus, OrderStatus, UserStatus } from '@prisma/client';
import * as crypto from 'crypto';
import {
  NETWORKING_STAGES,
  MAX_NETWORKING_STAGE,
  calculatePaymentDueDate,
  deriveBenefitDisplayStatus,
  evaluateAchievedStages,
  getCurrentStageFromCount,
  getNextStageProgress,
  getStageConfig,
} from './networking.stages';
import { QueryBenefitsDto, RecordBenefitPaymentDto } from './dto/networking.dto';

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
    const maxAttempts = 15;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let randomPart = '';
      const bytes = crypto.randomBytes(codeLength);
      for (let i = 0; i < codeLength; i++) {
        randomPart += alphabet[bytes[i] % alphabet.length];
      }
      const candidateCode = `${prefix}${randomPart}`;

      // Check both User.referralCode and NetworkingCycle.referralCode
      const [existingUser, existingCycle] = await Promise.all([
        client.user.findUnique({
          where: { referralCode: candidateCode },
          select: { id: true },
        }),
        client.networkingCycle.findFirst({
          where: { referralCode: candidateCode },
          select: { id: true },
        }),
      ]);

      if (!existingUser && !existingCycle) {
        return candidateCode;
      }
    }

    // Fallback timestamp suffix if extreme collision
    return `${prefix}${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }

  /**
   * Validates a referral code against business constraints:
   * - Cannot be empty
   * - Must exist in database and belong to an ACTIVE NetworkingCycle
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
    cycleId?: string;
    message?: string;
  }> {
    if (!rawCode || !rawCode.trim()) {
      return { valid: false, message: 'Please provide a valid referral code.' };
    }

    const normalized = rawCode.trim().toUpperCase();

    // Check referrer user and their active cycle
    const referrer = await this.prisma.user.findFirst({
      where: {
        referralCode: normalized,
      },
      select: {
        id: true,
        fullName: true,
        membershipStatus: true,
        status: true,
        referralCode: true,
        networkingCycles: {
          where: { status: 'ACTIVE', referralCode: normalized },
          select: { id: true, cycleNumber: true },
        },
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

    const activeCycle = referrer.networkingCycles[0];

    return {
      valid: true,
      code: referrer.referralCode,
      referrerId: referrer.id,
      referrerName: this.formatPrivacySafeName(referrer.fullName),
      cycleId: activeCycle?.id,
    };
  }

  /**
   * Records referral attribution during customer registration
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
        cycleId: validation.cycleId || null,
        status: 'REGISTERED',
      },
    });

    this.logger.log(
      `Attributed new customer ${newUserId} to referrer ${validation.referrerId} via code ${validation.code}`,
    );
  }

  /**
   * Helper to ensure a member has an active NetworkingCycle
   */
  private async getOrCreateActiveCycle(userId: string, txClient?: any) {
    const client = txClient || this.prisma;
    let activeCycle = await client.networkingCycle.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { cycleNumber: 'desc' },
    });

    if (!activeCycle) {
      const user = await client.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      });
      const code = user?.referralCode || (await this.generateUniqueReferralCode(client));

      activeCycle = await client.networkingCycle.create({
        data: {
          userId,
          cycleNumber: 1,
          referralCode: code,
          status: 'ACTIVE',
          qualifyingDirectMembersCount: 0,
          currentStage: 0,
        },
      });
    }

    return activeCycle;
  }

  /**
   * Authoritative Delivery Hook:
   * Called when an order reaches DELIVERED status.
   * Evaluates eligibility and idempotently:
   * 1. Activates membership for customer + creates cycle 1 + generates referral code
   * 2. If referred, activates Referral record, advances referrer's direct member count,
   *    and creates independent stage achievements and 30-day payable benefit records.
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

    // 1. Evaluate centralized eligibility rules (> ₹500 & DELIVERED)
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

    // 2. If user is already a member, maintain strict idempotency
    if (user.membershipStatus === MembershipStatus.MEMBER) {
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
    const activationDate = new Date();
    const uniqueReferralCode = await this.generateUniqueReferralCode();

    return await this.prisma.$transaction(async (tx) => {
      // Activate Member
      const member = await tx.user.update({
        where: { id: user.id },
        data: {
          membershipStatus: MembershipStatus.MEMBER,
          membershipActivatedAt: activationDate,
          referralCode: uniqueReferralCode,
        },
      });

      // Create Initial Active Networking Cycle for new member
      await tx.networkingCycle.create({
        data: {
          userId: user.id,
          cycleNumber: 1,
          referralCode: uniqueReferralCode,
          status: 'ACTIVE',
          qualifyingDirectMembersCount: 0,
          currentStage: 0,
          startedAt: activationDate,
        },
      });

      // Find referral attribution if this customer was referred by someone
      const referralAttribution = await tx.referral.findUnique({
        where: { referredUserId: user.id },
      });

      if (referralAttribution) {
        // Mark referral as ACTIVATED
        await tx.referral.update({
          where: { id: referralAttribution.id },
          data: {
            status: 'ACTIVATED',
            activatedAt: activationDate,
            qualifyingOrderId: order.id,
          },
        });

        const referrerId = referralAttribution.referrerId;
        const referrerCycle = await this.getOrCreateActiveCycle(referrerId, tx);

        // Associate referral with referrer cycle if not already set
        if (!referralAttribution.cycleId) {
          await tx.referral.update({
            where: { id: referralAttribution.id },
            data: { cycleId: referrerCycle.id },
          });
        }

        // Count all direct activated referrals for referrer in this cycle
        const activatedCount = await tx.referral.count({
          where: {
            referrerId,
            status: 'ACTIVATED',
            OR: [
              { cycleId: referrerCycle.id },
              { referralCodeUsed: referrerCycle.referralCode },
            ],
          },
        });

        const previousCount = referrerCycle.qualifyingDirectMembersCount;
        const newCount = activatedCount;

        // Determine newly achieved stages
        const newlyAchievedStages = evaluateAchievedStages(previousCount, newCount);

        // Update referrer's cycle stats
        const highestStageNumber = getCurrentStageFromCount(newCount);
        await tx.networkingCycle.update({
          where: { id: referrerCycle.id },
          data: {
            qualifyingDirectMembersCount: newCount,
            currentStage: Math.max(referrerCycle.currentStage, highestStageNumber),
          },
        });

        // For each newly achieved stage, record stage achievement & 30-day payable benefit record
        for (const stage of newlyAchievedStages) {
          // Idempotent check
          let achievement = await tx.stageAchievement.findUnique({
            where: {
              cycleId_stageNumber: {
                cycleId: referrerCycle.id,
                stageNumber: stage.stage,
              },
            },
          });

          if (!achievement) {
            achievement = await tx.stageAchievement.create({
              data: {
                userId: referrerId,
                cycleId: referrerCycle.id,
                stageNumber: stage.stage,
                requiredDirectMembers: stage.requiredDirectMembers,
                achievedAt: activationDate,
              },
            });
          }

          // Rule: Stages 1 and 2 have ₹0 benefit -> DO NOT create payable benefit records
          if (stage.isPayable && stage.benefitAmountINR > 0) {
            const existingBenefit = await tx.stageBenefit.findUnique({
              where: { stageAchievementId: achievement.id },
            });

            if (!existingBenefit) {
              const paymentDueDate = calculatePaymentDueDate(activationDate);

              await tx.stageBenefit.create({
                data: {
                  userId: referrerId,
                  cycleId: referrerCycle.id,
                  stageAchievementId: achievement.id,
                  stageNumber: stage.stage,
                  amount: stage.benefitAmountINR,
                  achievementDate: activationDate,
                  paymentDueDate,
                  status: 'PENDING',
                },
              });

              this.logger.log(
                `Created Stage ${stage.stage} Benefit (₹${stage.benefitAmountINR}) for referrer ${referrerId}. Due on ${paymentDueDate.toISOString()}`,
              );
            }
          }
        }
      }

      this.logger.log(
        `Membership activated for user ${user.id} (${user.fullName}). Code: ${uniqueReferralCode}. Order: ${order.orderNumber} (₹${order.grandTotal})`,
      );

      return {
        activated: true,
        alreadyMember: false,
        orderId: order.id,
        userId: user.id,
        membershipStatus: member.membershipStatus,
        referralCode: member.referralCode,
      };
    });
  }

  /**
   * Retrieves full networking dashboard for the authenticated customer
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
      },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    const isMember = user.membershipStatus === MembershipStatus.MEMBER;
    const threshold = NetworkingService.MEMBERSHIP_THRESHOLD_INR;

    if (!isMember) {
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

    // Active cycle for the member
    const activeCycle = await this.getOrCreateActiveCycle(userId);

    const [totalDirectReferrals, qualifyingDirectMembers, achievements, benefits] =
      await Promise.all([
        this.prisma.referral.count({ where: { referrerId: userId } }),
        this.prisma.referral.count({
          where: {
            referrerId: userId,
            status: 'ACTIVATED',
            OR: [
              { cycleId: activeCycle.id },
              { referralCodeUsed: activeCycle.referralCode },
            ],
          },
        }),
        this.prisma.stageAchievement.findMany({
          where: { cycleId: activeCycle.id },
          orderBy: { stageNumber: 'asc' },
        }),
        this.prisma.stageBenefit.findMany({
          where: { userId },
          orderBy: { achievementDate: 'desc' },
        }),
      ]);

    const progress = getNextStageProgress(qualifyingDirectMembers);
    const now = new Date();

    const formattedBenefits = benefits.map((b) => {
      const displayStatus = deriveBenefitDisplayStatus(b.status, b.paymentDueDate, now);
      return {
        id: b.id,
        stageNumber: b.stageNumber,
        amount: Number(b.amount),
        achievementDate: b.achievementDate.toISOString(),
        paymentDueDate: b.paymentDueDate.toISOString(),
        status: b.status,
        displayStatus,
        paymentDate: b.paymentDate?.toISOString() || null,
        gpayReferenceId: b.gpayReferenceId || null,
        hasProof: Boolean(b.paymentProofUrl),
      };
    });

    const formattedAchievements = achievements.map((a) => ({
      id: a.id,
      stageNumber: a.stageNumber,
      requiredDirectMembers: a.requiredDirectMembers,
      achievedAt: a.achievedAt.toISOString(),
    }));

    const nextStageConfig = progress.nextStage
      ? NETWORKING_STAGES.find((s) => s.stage === progress.nextStage)
      : null;

    return {
      success: true,
      data: {
        membershipStatus: user.membershipStatus,
        isMember: true,
        membershipActivatedAt: user.membershipActivatedAt?.toISOString() || null,
        cycle: {
          id: activeCycle.id,
          cycleId: activeCycle.id,
          cycleNumber: activeCycle.cycleNumber,
          qualifyingDirectMembersCount: activeCycle.qualifyingDirectMembersCount,
          status: activeCycle.status,
          startedAt: activeCycle.startedAt.toISOString(),
        },
        referralCode: activeCycle.referralCode || user.referralCode,
        stageProgress: {
          currentStage: progress.currentStage,
          currentStageDetails: NETWORKING_STAGES.find((s) => s.stage === progress.currentStage) || null,
          nextStage: nextStageConfig
            ? {
                stage: nextStageConfig.stage,
                requiredDirectMembers: nextStageConfig.requiredDirectMembers,
                benefitAmountINR: nextStageConfig.benefitAmountINR,
                isPayable: nextStageConfig.isPayable,
              }
            : null,
          qualifyingDirectMembersCount: qualifyingDirectMembers,
          membersNeededForNextStage: progress.membersNeededForNextStage,
          progressPercent: progress.nextStageRequiredCount > 0
            ? Math.min(100, Math.round((qualifyingDirectMembers / progress.nextStageRequiredCount) * 100))
            : 100,
        },
        stages: NETWORKING_STAGES,
        stagesRoadmap: NETWORKING_STAGES,
        sharing: {
          code: activeCycle.referralCode || user.referralCode,
          shareMessage: `Join MANAM for pure daily essentials and farm-fresh staples! Use my referral code ${
            activeCycle.referralCode || user.referralCode
          } when creating your account.`,
        },
        stats: {
          totalInvited: totalDirectReferrals,
          totalDirectReferrals,
          membersActivated: qualifyingDirectMembers,
          qualifyingDirectMembers,
          customersPending: Math.max(0, totalDirectReferrals - qualifyingDirectMembers),
          currentStage: progress.currentStage,
          nextStage: progress.nextStage,
          nextStageRequiredCount: progress.nextStageRequiredCount,
          membersNeededForNextStage: progress.membersNeededForNextStage,
          isMaxStageReached: progress.isMaxStageReached,
        },
        achievements: formattedAchievements,
        benefits: formattedBenefits,
      },
    };
  }

  /**
   * Retrieves paginated list of direct referrals for the member
   */
  public async getReferrals(userId: string, page = 1, limit = 20) {
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
      isMember:
        r.status === 'ACTIVATED' ||
        r.referredUser?.membershipStatus === MembershipStatus.MEMBER,
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

  /**
   * Retrieves access-controlled payment proof screenshot for member or admin
   */
  public async getBenefitProof(userId: string, benefitId: string, isAdmin = false) {
    const benefit = await this.prisma.stageBenefit.findUnique({
      where: { id: benefitId },
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
      },
    });

    if (!benefit) {
      throw new NotFoundException('Benefit payment record not found.');
    }

    // Security check: Only the owner or an admin may access this payment proof
    if (!isAdmin && benefit.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this payment proof.');
    }

    if (benefit.status !== 'PAID' || !benefit.paymentProofUrl) {
      throw new NotFoundException('Payment proof has not been uploaded or confirmed yet.');
    }

    return {
      success: true,
      data: {
        benefitId: benefit.id,
        stageNumber: benefit.stageNumber,
        amount: Number(benefit.amount),
        paymentDate: benefit.paymentDate?.toISOString() || null,
        gpayReferenceId: benefit.gpayReferenceId || null,
        paymentProofUrl: benefit.paymentProofUrl,
        confirmedAt: benefit.confirmedAt?.toISOString() || null,
      },
    };
  }

  /**
   * Admin: List all member benefits with fulfillment statuses & search filters
   */
  public async getAdminBenefits(query: QueryBenefitsDto) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status && query.status !== 'ALL') {
      const now = new Date();
      if (query.status === 'PAID') {
        where.status = 'PAID';
      } else if (query.status === 'PENDING') {
        where.status = 'PENDING';
      } else if (query.status === 'OVERDUE') {
        where.status = 'PENDING';
        where.paymentDueDate = { lt: now };
      } else if (query.status === 'DUE_SOON') {
        const soonDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
        where.status = 'PENDING';
        where.paymentDueDate = { gte: now, lte: soonDate };
      }
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { user: { fullName: { contains: s } } },
        { user: { phone: { contains: s } } },
        { user: { email: { contains: s } } },
        { user: { referralCode: { contains: s } } },
      ];
    }

    const [benefits, total] = await Promise.all([
      this.prisma.stageBenefit.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              referralCode: true,
            },
          },
          cycle: {
            select: {
              cycleNumber: true,
            },
          },
          paidByAdmin: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { paymentDueDate: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.stageBenefit.count({ where }),
    ]);

    const now = new Date();

    const formatted = benefits.map((b) => {
      const displayStatus = deriveBenefitDisplayStatus(b.status, b.paymentDueDate, now);
      return {
        id: b.id,
        userId: b.userId,
        memberId: b.userId,
        memberName: b.user.fullName || 'Member',
        memberPhone: b.user.phone || 'No phone',
        memberEmail: b.user.email,
        user: {
          id: b.userId,
          fullName: b.user.fullName || 'Member',
          phone: b.user.phone || 'No phone',
          email: b.user.email || null,
        },
        cycleNumber: b.cycle?.cycleNumber || 1,
        stageNumber: b.stageNumber,
        amount: Number(b.amount),
        achievementDate: b.achievementDate.toISOString(),
        paymentDueDate: b.paymentDueDate.toISOString(),
        status: b.status,
        displayStatus,
        paymentDate: b.paymentDate?.toISOString() || null,
        gpayReferenceId: b.gpayReferenceId || null,
        paymentProofUrl: b.paymentProofUrl || null,
        confirmedAt: b.confirmedAt?.toISOString() || null,
        confirmedByAdmin: b.paidByAdmin?.fullName || null,
        notes: b.notes || null,
      };
    });

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

  /**
   * Admin: Record manual GPay payment & mark benefit as PAID
   * Enforces that screenshot and payment date are supplied.
   * If Stage 12 is confirmed as paid, safely triggers the Stage 12 Cycle Reset!
   */
  public async recordAndConfirmPayment(
    adminId: string,
    benefitId: string,
    dto: RecordBenefitPaymentDto,
  ) {
    const benefit = await this.prisma.stageBenefit.findUnique({
      where: { id: benefitId },
      include: {
        user: true,
        cycle: true,
      },
    });

    if (!benefit) {
      throw new NotFoundException(`Benefit record ${benefitId} not found.`);
    }

    if (benefit.status === 'PAID') {
      throw new BadRequestException('This benefit has already been confirmed as paid.');
    }

    if (!dto.paymentProofUrl || !dto.paymentProofUrl.trim()) {
      throw new BadRequestException('A valid payment screenshot proof is strictly required.');
    }

    if (!dto.paymentDate) {
      throw new BadRequestException('Payment date is required.');
    }

    const paymentDate = new Date(dto.paymentDate);
    const confirmedAt = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Mark benefit as PAID
      const updatedBenefit = await tx.stageBenefit.update({
        where: { id: benefitId },
        data: {
          status: 'PAID',
          paymentDate,
          gpayReferenceId: dto.gpayReferenceId?.trim() || null,
          paymentProofUrl: dto.paymentProofUrl.trim(),
          paidByAdminId: adminId,
          confirmedAt,
          notes: dto.notes?.trim() || null,
        },
      });

      // 2. Audit Trail
      await tx.benefitAuditLog.create({
        data: {
          benefitId: benefit.id,
          adminId,
          action: 'CONFIRMED_PAID',
          details: {
            amount: Number(benefit.amount),
            stageNumber: benefit.stageNumber,
            paymentDate: paymentDate.toISOString(),
            gpayReferenceId: dto.gpayReferenceId || null,
            paymentProofUrl: dto.paymentProofUrl,
            notes: dto.notes || null,
          },
        },
      });

      // 3. Stage 12 Cycle Reset Rule:
      // When Stage 12 benefit is confirmed as paid, close cycle and start new cycle with new code!
      let cycleResetCompleted = false;
      let newCycleNumber: number | null = null;
      let newReferralCode: string | null = null;

      if (benefit.stageNumber === MAX_NETWORKING_STAGE) {
        this.logger.log(
          `Stage 12 Benefit confirmed as PAID for member ${benefit.userId}. Triggering Networking Cycle Reset.`,
        );

        // Close current cycle
        await tx.networkingCycle.update({
          where: { id: benefit.cycleId },
          data: {
            status: 'COMPLETED',
            completedAt: confirmedAt,
          },
        });

        // Generate new referral code
        newReferralCode = await this.generateUniqueReferralCode(tx);
        const nextCycleNumber = benefit.cycle.cycleNumber + 1;

        // Create new active cycle
        await tx.networkingCycle.create({
          data: {
            userId: benefit.userId,
            cycleNumber: nextCycleNumber,
            referralCode: newReferralCode,
            status: 'ACTIVE',
            qualifyingDirectMembersCount: 0,
            currentStage: 0,
            startedAt: confirmedAt,
          },
        });

        // Update member's active referral code
        await tx.user.update({
          where: { id: benefit.userId },
          data: {
            referralCode: newReferralCode,
          },
        });

        cycleResetCompleted = true;
        newCycleNumber = nextCycleNumber;
      }

      return {
        benefit: updatedBenefit,
        cycleResetCompleted,
        newCycleNumber,
        newReferralCode,
      };
    });

    this.logger.log(
      `Admin ${adminId} marked Stage ${benefit.stageNumber} Benefit ${benefit.id} as PAID for member ${benefit.userId}`,
    );

    return {
      success: true,
      message: result.cycleResetCompleted
        ? `Payment confirmed. Member completed Stage 12 and Cycle ${benefit.cycle.cycleNumber} was reset into Cycle ${result.newCycleNumber} with new code ${result.newReferralCode}.`
        : `Payment successfully marked as PAID. Proof attached.`,
      data: {
        benefitId: result.benefit.id,
        stageNumber: result.benefit.stageNumber,
        amount: Number(result.benefit.amount),
        status: result.benefit.status,
        confirmedAt: result.benefit.confirmedAt,
        cycleResetCompleted: result.cycleResetCompleted,
        newCycleNumber: result.newCycleNumber,
        newReferralCode: result.newReferralCode,
      },
    };
  }

  /**
   * Admin: Real-time operational alerts for networking benefits
   */
  public async getAdminAlerts() {
    const now = new Date();
    const soonDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const [overdueCount, dueSoonCount, newlyAchievedCount, recentlyPaidCount] =
      await Promise.all([
        this.prisma.stageBenefit.count({
          where: {
            status: 'PENDING',
            paymentDueDate: { lt: now },
          },
        }),
        this.prisma.stageBenefit.count({
          where: {
            status: 'PENDING',
            paymentDueDate: { gte: now, lte: soonDate },
          },
        }),
        this.prisma.stageBenefit.count({
          where: {
            status: 'PENDING',
          },
        }),
        this.prisma.stageBenefit.count({
          where: {
            status: 'PAID',
            confirmedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

    return {
      success: true,
      data: {
        overdueCount,
        dueSoonCount,
        newlyAchievedCount,
        recentlyPaidCount,
        warningPeriodDays: 5,
      },
    };
  }
}
