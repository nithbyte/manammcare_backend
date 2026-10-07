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
import { LoginDto, ChangePasswordDto, ForgotPasswordDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { Role, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private generateTokens(user: { id: string; email: string; role: Role }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });
    return { token, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async register(dto: RegisterDto) {
    const emailNormalized = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Direct registration: NO ₹200 subscription, instant ACTIVE customer account
    const user = await this.prisma.user.create({
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const identifier = dto.emailOrPhone.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: dto.emailOrPhone.trim() }],
      },
    });

    // Don't disclose if user exists for security
    return {
      message: 'If the provided account exists, instructions have been sent.',
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
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return this.sanitizeUser(user);
  }
}
