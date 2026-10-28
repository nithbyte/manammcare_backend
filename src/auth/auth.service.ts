import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import {
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SendRegisterOtpDto,
  VerifyRegisterOtpDto,
} from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { Role, UserStatus, OtpPurpose } from '@prisma/client';

import { NetworkingService } from '../networking/networking.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private networkingService: NetworkingService,
    private emailService: EmailService,
  ) {}

  private generateTokens(user: { id: string; email: string; role: Role }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });
    return { token, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { password, ...safeUser } = user;
    return {
      ...safeUser,
      membershipStatus: safeUser.membershipStatus || 'CUSTOMER',
      membershipActivatedAt: safeUser.membershipActivatedAt || null,
      referralCode: safeUser.referralCode || null,
      isValidCustomer: Boolean(safeUser.isValidCustomer || safeUser.customerVerification),
      customerVerification: safeUser.customerVerification || null,
    };
  }

  async register(dto: RegisterDto) {
    const emailNormalized = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists.');
    }

    // Optional referral validation before transaction
    let referrerInfo: { id: string; code: string } | null = null;
    if (dto.referralCode && dto.referralCode.trim()) {
      const validation = await this.networkingService.validateReferralCode(dto.referralCode);
      if (!validation.valid || !validation.referrerId || !validation.code) {
        throw new BadRequestException(validation.message || 'Invalid referral code provided.');
      }
      referrerInfo = { id: validation.referrerId, code: validation.code };
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Direct registration within transaction: Customer account creation + optional referral attribution
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: dto.fullName.trim(),
          email: emailNormalized,
          phone: dto.phone.trim(),
          password: hashedPassword,
          role: Role.CUSTOMER,
          status: UserStatus.ACTIVE,
          profile: {
            create: {
              preferredLanguage: 'en',
            },
          },
          cart: {
            create: {},
          },
          notificationPreferences: {
            create: {},
          },
        },
      });

      if (referrerInfo) {
        await tx.referral.create({
          data: {
            referrerId: referrerInfo.id,
            referredUserId: newUser.id,
            referralCodeUsed: referrerInfo.code,
            status: 'REGISTERED',
          },
        });
      }

      return newUser;
    });

    const { token, refreshToken } = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const identifier = dto.emailOrPhone.trim().toLowerCase();

    // Find user by either email or phone
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: dto.emailOrPhone.trim() }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials. Please verify your email/phone and password.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials. Please verify your email/phone and password.');
    }

    // Update lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { token, refreshToken } = this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send Password Reset Code via Nodemailer
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const identifier = dto.emailOrPhone.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: dto.emailOrPhone.trim() }],
      },
    });

    if (!user) {
      throw new NotFoundException('No account found matching this email or mobile number.');
    }

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.authOtp.create({
      data: {
        email: user.email.toLowerCase(),
        code: otp,
        purpose: OtpPurpose.PASSWORD_RESET,
        expiresAt,
      },
    });

    await this.emailService.sendPasswordResetOtp(user.email, user.fullName, otp);

    return {
      success: true,
      email: user.email,
      message: `Password reset code sent to ${user.email}. Valid for 15 minutes.`,
    };
  }

  /**
   * Reset Password with Verified OTP Code
   */
  async resetPassword(dto: ResetPasswordDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanOtp = dto.otp.trim();

    const validOtp = await this.prisma.authOtp.findFirst({
      where: {
        email: cleanEmail,
        code: cleanOtp,
        purpose: OtpPurpose.PASSWORD_RESET,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!validOtp) {
      throw new BadRequestException('Invalid or expired reset code. Please request a new code.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      throw new NotFoundException('Account not found.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      this.prisma.authOtp.update({
        where: { id: validOtp.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return {
      success: true,
      message: 'Your password has been reset successfully. You can now sign in with your new password.',
    };
  }

  /**
   * Send Account Verification OTP via Nodemailer before finalizing signup
   */
  async sendRegisterOtp(dto: SendRegisterOtpDto) {
    const cleanEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists. Please sign in instead.');
    }

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.authOtp.create({
      data: {
        email: cleanEmail,
        code: otp,
        purpose: OtpPurpose.ACCOUNT_VERIFICATION,
        expiresAt,
      },
    });

    await this.emailService.sendAccountVerificationOtp(cleanEmail, dto.fullName, otp);

    return {
      success: true,
      email: cleanEmail,
      message: `Verification code sent to ${cleanEmail}. Valid for 15 minutes.`,
    };
  }

  /**
   * Verify Account Creation OTP and Finalize Registration
   */
  async verifyRegisterOtp(dto: VerifyRegisterOtpDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanOtp = dto.otp.trim();

    const validOtp = await this.prisma.authOtp.findFirst({
      where: {
        email: cleanEmail,
        code: cleanOtp,
        purpose: OtpPurpose.ACCOUNT_VERIFICATION,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!validOtp) {
      throw new BadRequestException('Invalid or expired verification code. Please check and try again.');
    }

    // Check if user was registered in the meantime
    const existingUser = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists.');
    }

    // Referral validation
    let referrerInfo: { id: string; code: string } | null = null;
    if (dto.referralCode && dto.referralCode.trim()) {
      const validation = await this.networkingService.validateReferralCode(dto.referralCode);
      if (validation.valid && validation.referrerId && validation.code) {
        referrerInfo = { id: validation.referrerId, code: validation.code };
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: dto.fullName.trim(),
          email: cleanEmail,
          phone: dto.phone.trim(),
          password: hashedPassword,
          role: Role.CUSTOMER,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          profile: {
            create: {
              preferredLanguage: 'en',
            },
          },
          cart: {
            create: {},
          },
          notificationPreferences: {
            create: {},
          },
        },
      });

      if (referrerInfo) {
        await tx.referral.create({
          data: {
            referrerId: referrerInfo.id,
            referredUserId: newUser.id,
            referralCodeUsed: referrerInfo.code,
            status: 'REGISTERED',
          },
        });
      }

      await tx.authOtp.update({
        where: { id: validOtp.id },
        data: { usedAt: new Date() },
      });

      return newUser;
    });

    const { token, refreshToken } = this.generateTokens(user);

    return {
      success: true,
      user: this.sanitizeUser(user),
      token,
      refreshToken,
      message: 'Account verified and registered successfully! Welcome to MANAMM.',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User account not found.');
    }

    const isMatch = await bcrypt.compare(dto.currentPass, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPass, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully.' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        customerVerification: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return this.sanitizeUser(user);
  }
}
