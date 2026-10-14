import { Test, TestingModule } from '@nestjs/testing';
import { NetworkingService } from './networking.service';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipStatus, OrderStatus, UserStatus } from '@prisma/client';

describe('NetworkingService', () => {
  let service: NetworkingService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      referral: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NetworkingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NetworkingService>(NetworkingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateOrderEligibility', () => {
    it('₹499.99 with DELIVERED status: Not eligible', () => {
      const result = service.evaluateOrderEligibility({
        grandTotal: 499.99,
        status: OrderStatus.DELIVERED,
      });
      expect(result.eligible).toBe(false);
      expect(result.threshold).toBe(500);
    });

    it('Exactly ₹500.00 with DELIVERED status: Not eligible (must be strictly > 500)', () => {
      const result = service.evaluateOrderEligibility({
        grandTotal: 500.0,
        status: OrderStatus.DELIVERED,
      });
      expect(result.eligible).toBe(false);
      expect(result.orderAmount).toBe(500.0);
    });

    it('₹500.01 with DELIVERED status: Meets amount threshold and is eligible', () => {
      const result = service.evaluateOrderEligibility({
        grandTotal: 500.01,
        status: OrderStatus.DELIVERED,
      });
      expect(result.eligible).toBe(true);
      expect(result.orderAmount).toBe(500.01);
    });

    it('₹600.00 with DELIVERED status: Meets threshold and is eligible', () => {
      const result = service.evaluateOrderEligibility({
        grandTotal: 600,
        status: OrderStatus.DELIVERED,
      });
      expect(result.eligible).toBe(true);
    });

    it('₹600.00 with PENDING status: Not eligible until delivered', () => {
      const result = service.evaluateOrderEligibility({
        grandTotal: 600,
        status: OrderStatus.PENDING,
      });
      expect(result.eligible).toBe(false);
    });

    it('₹600.00 with PROCESSING status: Not eligible until delivered', () => {
      const result = service.evaluateOrderEligibility({
        grandTotal: 600,
        status: OrderStatus.PROCESSING,
      });
      expect(result.eligible).toBe(false);
    });

    it('₹600.00 with SHIPPED status: Not eligible until delivered', () => {
      const result = service.evaluateOrderEligibility({
        grandTotal: 600,
        status: OrderStatus.SHIPPED,
      });
      expect(result.eligible).toBe(false);
    });

    it('₹600.00 with CANCELLED status: Not eligible', () => {
      const result = service.evaluateOrderEligibility({
        grandTotal: 600,
        status: OrderStatus.CANCELLED,
      });
      expect(result.eligible).toBe(false);
    });
  });

  describe('generateUniqueReferralCode', () => {
    it('should generate a code with prefix MNM and length 9', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const code = await service.generateUniqueReferralCode();
      expect(code.startsWith('MNM')).toBe(true);
      expect(code.length).toBe(9);
    });

    it('should retry if collision occurs', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'existing_user' })
        .mockResolvedValueOnce(null);

      const code = await service.generateUniqueReferralCode();
      expect(code.startsWith('MNM')).toBe(true);
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateReferralCode', () => {
    it('should validate an active member referral code', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'usr_referrer',
        fullName: 'Ramesh Kumar',
        membershipStatus: MembershipStatus.MEMBER,
        status: UserStatus.ACTIVE,
        referralCode: 'MNM8A9B2C',
      });

      const result = await service.validateReferralCode('MNM8A9B2C', 'usr_other');
      expect(result.valid).toBe(true);
      expect(result.code).toBe('MNM8A9B2C');
      expect(result.referrerName).toBe('Ramesh K.');
    });

    it('should reject self-referral', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'usr_same',
        fullName: 'Self User',
        membershipStatus: MembershipStatus.MEMBER,
        status: UserStatus.ACTIVE,
        referralCode: 'MNM8A9B2C',
      });

      const result = await service.validateReferralCode('MNM8A9B2C', 'usr_same');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('cannot use your own referral code');
    });

    it('should reject non-existent code', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateReferralCode('INVALID123');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid referral code');
    });

    it('should reject referrer who is not a MEMBER', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'usr_customer',
        fullName: 'Regular Customer',
        membershipStatus: MembershipStatus.CUSTOMER,
        status: UserStatus.ACTIVE,
        referralCode: 'MNMCUST01',
      });

      const result = await service.validateReferralCode('MNMCUST01');
      expect(result.valid).toBe(false);
    });
  });

  describe('activateMembershipForDeliveredOrder', () => {
    it('should activate membership on first qualifying delivered order > ₹500', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord_1',
        orderNumber: 'MNM-2026-1001',
        grandTotal: 599.0,
        status: OrderStatus.DELIVERED,
        user: {
          id: 'usr_customer',
          fullName: 'Ananya Sharma',
          email: 'ananya@example.com',
          membershipStatus: MembershipStatus.CUSTOMER,
          membershipActivatedAt: null,
          referralCode: null,
        },
      });

      prisma.user.findUnique.mockResolvedValue(null); // for code generation check
      prisma.user.update.mockResolvedValue({
        id: 'usr_customer',
        membershipStatus: MembershipStatus.MEMBER,
        referralCode: 'MNMNEWCOD',
      });

      const result = await service.activateMembershipForDeliveredOrder('ord_1');
      expect(result.activated).toBe(true);
      expect(result.alreadyMember).toBe(false);
      expect(result.membershipStatus).toBe(MembershipStatus.MEMBER);
      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.referral.updateMany).toHaveBeenCalled();
    });

    it('should be idempotent and not re-activate an existing member', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'ord_2',
        orderNumber: 'MNM-2026-1002',
        grandTotal: 750.0,
        status: OrderStatus.DELIVERED,
        user: {
          id: 'usr_already_member',
          fullName: 'Existing Member',
          email: 'member@example.com',
          membershipStatus: MembershipStatus.MEMBER,
          membershipActivatedAt: new Date(),
          referralCode: 'MNMEXIST1',
        },
      });

      const result = await service.activateMembershipForDeliveredOrder('ord_2');
      expect(result.activated).toBe(false);
      expect(result.alreadyMember).toBe(true);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
