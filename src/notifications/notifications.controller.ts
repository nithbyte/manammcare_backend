import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { InactiveReferralsService, InactiveReferralAlertOptions } from './inactive-referrals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private inactiveReferralsService: InactiveReferralsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List customer notifications' })
  async getNotifications(@CurrentUser() user: any) {
    return this.notificationsService.getNotifications(user.id);
  }

  @Post('push-token')
  @ApiOperation({ summary: 'Register customer device Expo push token' })
  async registerPushToken(
    @CurrentUser() user: any,
    @Body('pushToken') pushToken: string,
  ) {
    return this.notificationsService.registerPushToken(user.id, pushToken);
  }

  @Get('inactive-referrals-preview')
  @ApiOperation({ summary: 'Preview inactive referrals who have not placed an order' })
  async getInactiveReferralsPreview() {
    return this.inactiveReferralsService.getInactiveReferralsPreview();
  }

  @Post('trigger-inactivity-alerts')
  @ApiOperation({ summary: 'Trigger daily or on-demand push alerts to referrers of inactive customers' })
  async triggerInactivityAlerts(@Body() options: InactiveReferralAlertOptions) {
    return this.inactiveReferralsService.processInactiveReferrals(options || {});
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark single notification as read' })
  async markAsRead(
    @CurrentUser() user: any,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(user.id, notificationId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all customer notifications as read' })
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification communication preferences' })
  async getPreferences(@CurrentUser() user: any) {
    return this.notificationsService.getPreferences(user.id);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification communication preferences' })
  async updatePreferences(
    @CurrentUser() user: any,
    @Body() updates: any,
  ) {
    return this.notificationsService.updatePreferences(user.id, updates);
  }
}
