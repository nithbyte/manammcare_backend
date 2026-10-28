import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationType } from '@prisma/client';

export interface InactiveReferralAlertOptions {
  minHoursSinceRegistration?: number;
  maxDaysSinceRegistration?: number;
  dryRun?: boolean;
}

export interface InactiveReferralResult {
  referralId: string;
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
  referrerPhone?: string | null;
  hasPushToken: boolean;
  referredUserId: string;
  referredUserName: string;
  referredUserPhone?: string | null;
  registeredAt: string;
  inactivityAlertCount: number;
  alertSent: boolean;
  pushSent: boolean;
  reason?: string;
}

@Injectable()
export class InactiveReferralsService {
  private readonly logger = new Logger(InactiveReferralsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushNotificationService: PushNotificationService
  ) {}

  /**
   * Daily Automated Cron Job:
   * Runs daily at 10:00 AM to alert referrers about referred customers who haven't placed an order.
   */
  @Cron('0 10 * * *')
  async handleDailyInactivityAlerts() {
    this.logger.log('Starting daily scheduled check for inactive referrals...');
    try {
      const result = await this.processInactiveReferrals({ minHoursSinceRegistration: 0 });
      this.logger.log(
        `Daily inactive referral check complete: ${result.alertsSent} alerts sent across ${result.totalScanned} candidates.`
      );
    } catch (err: any) {
      this.logger.error(`Error in daily inactive referral cron: ${err.message}`, err.stack);
    }
  }

  /**
   * Retrieves preview of all registered referrals who haven't ordered yet
   */
  async getInactiveReferralsPreview(options: InactiveReferralAlertOptions = {}) {
    const minHours = options.minHoursSinceRegistration ?? 0;
    const maxDays = options.maxDaysSinceRegistration ?? 60;

    const minDate = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000);
    const maxDate = new Date(Date.now() - minHours * 60 * 60 * 1000);

    const candidates = await this.prisma.referral.findMany({
      where: {
        status: 'REGISTERED',
        createdAt: {
          gte: minDate,
          lte: maxDate,
        },
        referredUser: {
          orders: {
            none: {
              status: {
                in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
              },
            },
          },
        },
      },
      include: {
        referrer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            pushToken: true,
            notificationPreferences: true,
          },
        },
        referredUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return candidates.map((cand) => {
      const alreadyAlertedToday =
        cand.lastInactivityAlert && cand.lastInactivityAlert > twentyFourHoursAgo;

      return {
        referralId: cand.id,
        referrerId: cand.referrerId,
        referrerName: cand.referrer?.fullName || 'Unknown Referrer',
        referrerEmail: cand.referrer?.email || '',
        referrerPhone: cand.referrer?.phone || null,
        hasPushToken: Boolean(cand.referrer?.pushToken),
        referredUserId: cand.referredUserId,
        referredUserName: cand.referredUser?.fullName || 'New Customer',
        referredUserPhone: cand.referredUser?.phone || null,
        registeredAt: cand.createdAt.toISOString(),
        lastInactivityAlert: cand.lastInactivityAlert?.toISOString() || null,
        inactivityAlertCount: cand.inactivityAlertCount,
        eligibleForAlertToday: !alreadyAlertedToday,
      };
    });
  }

  /**
   * Scans and dispatches inactivity alerts to referrers
   */
  async processInactiveReferrals(options: InactiveReferralAlertOptions = {}): Promise<{
    success: boolean;
    totalScanned: number;
    alertsSent: number;
    pushesSent: number;
    details: InactiveReferralResult[];
  }> {
    const minHours = options.minHoursSinceRegistration ?? 0;
    const maxDays = options.maxDaysSinceRegistration ?? 60;
    const dryRun = Boolean(options.dryRun);

    const minDate = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000);
    const maxDate = new Date(Date.now() - minHours * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Fetch eligible referrals: status REGISTERED + 0 active/delivered orders
    const referrals = await this.prisma.referral.findMany({
      where: {
        status: 'REGISTERED',
        createdAt: {
          gte: minDate,
          lte: maxDate,
        },
        referredUser: {
          orders: {
            none: {
              status: {
                in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
              },
            },
          },
        },
      },
      include: {
        referrer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            pushToken: true,
            notificationPreferences: true,
          },
        },
        referredUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results: InactiveReferralResult[] = [];
    let alertsSent = 0;
    let pushesSent = 0;

    for (const ref of referrals) {
      if (!ref.referrer || !ref.referredUser) continue;

      // Ensure at most 1 reminder alert per 24-hour day
      if (ref.lastInactivityAlert && ref.lastInactivityAlert > twentyFourHoursAgo) {
        results.push({
          referralId: ref.id,
          referrerId: ref.referrerId,
          referrerName: ref.referrer.fullName,
          referrerEmail: ref.referrer.email,
          referrerPhone: ref.referrer.phone,
          hasPushToken: Boolean(ref.referrer.pushToken),
          referredUserId: ref.referredUserId,
          referredUserName: ref.referredUser.fullName,
          referredUserPhone: ref.referredUser.phone,
          registeredAt: ref.createdAt.toISOString(),
          inactivityAlertCount: ref.inactivityAlertCount,
          alertSent: false,
          pushSent: false,
          reason: 'Alert already sent to this referrer within the last 24 hours.',
        });
        continue;
      }

      const regDateStr = new Date(ref.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const title = `Referral Inactivity Alert: ${ref.referredUser.fullName} hasn't ordered yet`;
      const message = `Hi ${ref.referrer.fullName}, your referred member ${ref.referredUser.fullName} registered on ${regDateStr} but hasn't placed their first order yet. Reach out to encourage them to explore MANAMM and start shopping!`;

      if (dryRun) {
        results.push({
          referralId: ref.id,
          referrerId: ref.referrerId,
          referrerName: ref.referrer.fullName,
          referrerEmail: ref.referrer.email,
          referrerPhone: ref.referrer.phone,
          hasPushToken: Boolean(ref.referrer.pushToken),
          referredUserId: ref.referredUserId,
          referredUserName: ref.referredUser.fullName,
          referredUserPhone: ref.referredUser.phone,
          registeredAt: ref.createdAt.toISOString(),
          inactivityAlertCount: ref.inactivityAlertCount,
          alertSent: true,
          pushSent: Boolean(ref.referrer.pushToken),
          reason: 'Dry run - alert preview only.',
        });
        alertsSent++;
        if (ref.referrer.pushToken) pushesSent++;
        continue;
      }

      // 2. Create in-app notification in MySQL AppNotification table
      await this.prisma.appNotification.create({
        data: {
          userId: ref.referrer.id,
          type: NotificationType.ACCOUNT,
          title,
          message,
          data: {
            type: 'INACTIVE_REFERRAL_ALERT',
            referralId: ref.id,
            referredUserId: ref.referredUser.id,
            referredUserName: ref.referredUser.fullName,
            referredUserPhone: ref.referredUser.phone,
            registeredAt: ref.createdAt.toISOString(),
          },
        },
      });
      alertsSent++;

      // 3. Dispatch mobile push notification if pushToken exists and pushEnabled
      let pushSuccess = false;
      const pushToken = ref.referrer.pushToken || ref.referrer.notificationPreferences?.pushToken;
      const isPushEnabled = ref.referrer.notificationPreferences?.pushEnabled ?? true;

      if (pushToken && isPushEnabled) {
        const pushResult = await this.pushNotificationService.sendPushNotification({
          to: pushToken,
          title,
          body: message,
          data: {
            type: 'INACTIVE_REFERRAL_ALERT',
            referralId: ref.id,
            referredUserId: ref.referredUser.id,
            referredUserName: ref.referredUser.fullName,
          },
        });
        pushSuccess = pushResult.success;
        if (pushSuccess) pushesSent++;
      }

      // 4. Update referral tracking fields
      await this.prisma.referral.update({
        where: { id: ref.id },
        data: {
          lastInactivityAlert: new Date(),
          inactivityAlertCount: { increment: 1 },
        },
      });

      results.push({
        referralId: ref.id,
        referrerId: ref.referrerId,
        referrerName: ref.referrer.fullName,
        referrerEmail: ref.referrer.email,
        referrerPhone: ref.referrer.phone,
        hasPushToken: Boolean(pushToken),
        referredUserId: ref.referredUserId,
        referredUserName: ref.referredUser.fullName,
        referredUserPhone: ref.referredUser.phone,
        registeredAt: ref.createdAt.toISOString(),
        inactivityAlertCount: ref.inactivityAlertCount + 1,
        alertSent: true,
        pushSent: pushSuccess,
      });
    }

    return {
      success: true,
      totalScanned: referrals.length,
      alertsSent,
      pushesSent,
      details: results,
    };
  }
}
