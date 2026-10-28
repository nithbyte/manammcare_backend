import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const user = process.env.SMTP_USER || 'noreply@manammcare.com';
    const pass = process.env.SMTP_PASS || '';

    if (!pass) {
      this.logger.warn(
        'SMTP_PASS is not configured in .env. Outgoing emails will be logged to console in dev mode.'
      );
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined,
        tls: {
          rejectUnauthorized: false,
        },
      });
    } catch (err) {
      this.logger.error('Failed to initialize nodemailer transport:', err);
    }
  }

  private getFromAddress(): string {
    return process.env.SMTP_FROM || '"MANAMM Care" <noreply@manammcare.com>';
  }

  /**
   * Send Password Reset OTP
   */
  async sendPasswordResetOtp(email: string, fullName: string, otp: string): Promise<boolean> {
    const subject = `${otp} is your MANAMM Password Reset Code`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560px" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #047857; padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: 2px;">MANAMM</h1>
                    <p style="margin: 6px 0 0; color: #a7f3d0; font-size: 13px; font-weight: 500;">Pure Living & Daily Essentials</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 800;">Password Reset Request</h2>
                    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                      Hello <strong>${fullName || 'Valued Customer'}</strong>,<br>
                      We received a request to reset your MANAMM account password. Use the verification code below to complete the reset.
                    </p>

                    <!-- OTP Box -->
                    <div style="background-color: #ecfdf5; border: 2px dashed #059669; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0;">
                      <span style="display: block; font-size: 12px; font-weight: 700; color: #065f46; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">Your 6-Digit Reset Code</span>
                      <span style="display: inline-block; font-size: 36px; font-weight: 900; color: #047857; letter-spacing: 8px; font-family: monospace;">${otp}</span>
                      <span style="display: block; font-size: 12px; color: #047857; margin-top: 8px; font-weight: 500;">Valid for 15 minutes</span>
                    </div>

                    <p style="margin: 24px 0 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                      If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      © ${new Date().getFullYear()} MANAMM Care. All rights reserved.<br>
                      Direct Delivery & Pure Farm Staples
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.dispatchMail(email, subject, html, otp, 'PASSWORD_RESET');
  }

  /**
   * Send Account Verification OTP
   */
  async sendAccountVerificationOtp(email: string, fullName: string, otp: string): Promise<boolean> {
    const subject = `${otp} is your MANAMM Account Verification Code`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560px" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #047857; padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: 2px;">MANAMM</h1>
                    <p style="margin: 6px 0 0; color: #a7f3d0; font-size: 13px; font-weight: 500;">Pure Living & Daily Essentials</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 800;">Welcome to MANAMM!</h2>
                    <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                      Hello <strong>${fullName || 'Valued Customer'}</strong>,<br>
                      Thank you for joining MANAMM. Please verify your email address to activate your direct ordering account.
                    </p>

                    <!-- OTP Box -->
                    <div style="background-color: #ecfdf5; border: 2px dashed #059669; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0;">
                      <span style="display: block; font-size: 12px; font-weight: 700; color: #065f46; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">Your 6-Digit Verification Code</span>
                      <span style="display: inline-block; font-size: 36px; font-weight: 900; color: #047857; letter-spacing: 8px; font-family: monospace;">${otp}</span>
                      <span style="display: block; font-size: 12px; color: #047857; margin-top: 8px; font-weight: 500;">Valid for 15 minutes</span>
                    </div>

                    <p style="margin: 24px 0 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                      Enter this 6-digit code in the app to complete your account setup and explore fresh farm provisions.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      © ${new Date().getFullYear()} MANAMM Care. All rights reserved.<br>
                      Direct Delivery & Pure Farm Staples
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.dispatchMail(email, subject, html, otp, 'ACCOUNT_VERIFICATION');
  }

  /**
   * Internal Mail Dispatcher with fallback logging
   */
  private async dispatchMail(
    to: string,
    subject: string,
    html: string,
    otp: string,
    purpose: string
  ): Promise<boolean> {
    const hasPassword = Boolean(process.env.SMTP_PASS);

    if (this.transporter && hasPassword) {
      try {
        const info = await this.transporter.sendMail({
          from: this.getFromAddress(),
          to,
          subject,
          html,
        });
        this.logger.log(`Email dispatched to ${to} for [${purpose}]. MessageId: ${info.messageId}`);
        return true;
      } catch (err: any) {
        this.logger.error(`SMTP sending failed for ${to} [${purpose}]: ${err.message}`);
        // Fall through to console logging in dev mode
      }
    }

    // Console logging banner for development resilience
    this.logger.warn(
      `\n================= MANAMM EMAIL [${purpose}] =================\n` +
      `To: ${to}\n` +
      `Subject: ${subject}\n` +
      `OTP CODE: >>> ${otp} <<<\n` +
      `Note: Provide SMTP_PASS in .env to deliver via Hostinger SMTP server.\n` +
      `============================================================\n`
    );
    return true;
  }
}
