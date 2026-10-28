import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PushNotificationService } from './push-notification.service';
import { InactiveReferralsService } from './inactive-referrals.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    PushNotificationService,
    InactiveReferralsService,
  ],
  exports: [
    NotificationsService,
    PushNotificationService,
    InactiveReferralsService,
  ],
})
export class NotificationsModule {}
