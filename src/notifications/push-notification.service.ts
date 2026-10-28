import { Injectable, Logger } from '@nestjs/common';

export interface PushNotificationPayload {
  to: string; // ExponentPushToken[...]
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  channelId?: string;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private readonly expoPushUrl = 'https://exp.host/--/api/v2/push/send';

  /**
   * Validates if a token matches the standard Expo push token structure
   */
  public isExpoPushToken(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    return (
      token.startsWith('ExponentPushToken[') ||
      token.startsWith('ExpoPushToken[') ||
      /^[a-zA-Z0-9-_]{20,}$/.test(token)
    );
  }

  /**
   * Sends a single push notification through the Expo Push Notification Service
   */
  public async sendPushNotification(payload: PushNotificationPayload): Promise<{
    success: boolean;
    ticketId?: string;
    error?: string;
  }> {
    if (!this.isExpoPushToken(payload.to)) {
      this.logger.warn(`Invalid or unrecognised push token format: ${payload.to}`);
      return { success: false, error: 'Invalid Expo push token' };
    }

    try {
      const response = await fetch(this.expoPushUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: payload.to,
          title: payload.title,
          body: payload.body,
          sound: payload.sound || 'default',
          badge: payload.badge,
          data: payload.data || {},
          channelId: payload.channelId || 'default',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        this.logger.error(`Expo push API returned error status ${response.status}:`, result);
        return { success: false, error: JSON.stringify(result) };
      }

      const ticket = result.data;
      if (ticket?.status === 'error') {
        this.logger.warn(`Expo push failed for token: ${ticket.message} (${ticket.details?.error})`);
        return { success: false, error: ticket.message };
      }

      this.logger.log(`Push notification sent successfully to ${payload.to}: ${payload.title}`);
      return { success: true, ticketId: ticket?.id };
    } catch (err: any) {
      this.logger.error(`Failed to send push notification via Expo: ${err.message}`, err.stack);
      return { success: false, error: err.message };
    }
  }

  /**
   * Sends batch push notifications in chunks of 100
   */
  public async sendBatchPushNotifications(
    payloads: PushNotificationPayload[]
  ): Promise<{ sent: number; failed: number }> {
    const validPayloads = payloads.filter((p) => this.isExpoPushToken(p.to));
    let sent = 0;
    let failed = payloads.length - validPayloads.length;

    const chunkSize = 100;
    for (let i = 0; i < validPayloads.length; i += chunkSize) {
      const chunk = validPayloads.slice(i, i + chunkSize);
      try {
        const response = await fetch(this.expoPushUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        const result = await response.json();
        if (Array.isArray(result.data)) {
          for (const item of result.data) {
            if (item.status === 'ok') sent++;
            else failed++;
          }
        } else {
          sent += chunk.length;
        }
      } catch (err: any) {
        this.logger.error(`Error sending push notification chunk: ${err.message}`);
        failed += chunk.length;
      }
    }

    return { sent, failed };
  }
}
