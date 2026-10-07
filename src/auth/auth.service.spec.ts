import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    jwt = {
      sign: jest.fn().mockReturnValue('mock_jwt_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'usr_1', email: 'test@example.com' });

      await expect(
        service.register({
          fullName: 'Test User',
          email: 'test@example.com',
          phone: '+91 9999999999',
          password: 'Password@123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should register new customer directly without any membership fee', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'usr_new',
        fullName: 'New Customer',
        email: 'new@example.com',
        phone: '+91 9999999999',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        password: 'hashed_password',
      });

      const result = await service.register({
        fullName: 'New Customer',
        email: 'new@example.com',
        phone: '+91 9999999999',
        password: 'Password@123',
      });

      expect(result.token).toBe('mock_jwt_token');
      expect(result.user.role).toBe('CUSTOMER');
      expect(result.user.email).toBe('new@example.com');
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('should reject invalid password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword', 10);
      prisma.user.findFirst.mockResolvedValue({
        id: 'usr_1',
        email: 'test@example.com',
        password: hashedPassword,
        status: 'ACTIVE',
      });

      await expect(
        service.login({
          emailOrPhone: 'test@example.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should authenticate user and return tokens on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword', 10);
      prisma.user.findFirst.mockResolvedValue({
        id: 'usr_1',
        email: 'test@example.com',
        password: hashedPassword,
        status: 'ACTIVE',
        role: 'CUSTOMER',
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.login({
        emailOrPhone: 'test@example.com',
        password: 'CorrectPassword',
      });

      expect(result.token).toBe('mock_jwt_token');
      expect(result.user.email).toBe('test@example.com');
    });
  });
});
