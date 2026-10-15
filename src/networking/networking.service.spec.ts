import { Test, TestingModule } from '@nestjs/testing';
import { NetworkingService } from './networking.service';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipStatus, OrderStatus, UserStatus } from '@prisma/client';
import {
  calculatePaymentDueDate,
  deriveBenefitDisplayStatus,
  evaluateAchievedStages,
  getCurrentStageFromCount,
  NETWORKING_STAGES,
} from './networking.stages';

describe('NetworkingService', () => {
  let service: NetworkingService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
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
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      networkingCycle: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      stageAchievement: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      stageBenefit: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      benefitAuditLog: {
        create: jest.fn(),
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

    it('₹600.00 with CANCELLED status: Not eligible', () => {
      const result = service.evaluateOrderEligibility({
        grandTotal: 600,
        status: OrderStatus.CANCELLED,
      });
      expect(result.eligible).toBe(false);
    });
  });

  describe('Payment Due Date Calculation (Exact 30 Calendar Days)', () => {
    it('Achievement on 15 October -> Due on 14 November', () => {
      const achieved = new Date('2026-10-15T00:00:00Z');
      const due = calculatePaymentDueDate(achieved);
      expect(due.getUTCDate()).toBe(14);
      expect(due.getUTCMonth()).toBe(10); // November (0-indexed: 10)
    });

    it('Achievement on 17 October -> Due on 16 November', () => {
      const achieved = new Date('2026-10-17T00:00:00Z');
      const due = calculatePaymentDueDate(achieved);
      expect(due.getUTCDate()).toBe(16);
      expect(due.getUTCMonth()).toBe(10); // November
    });

    it('Achievement on 31 January in non-leap year (2025) -> Due on 2 March', () => {
      const achieved = new Date('2025-01-31T00:00:00Z');
      const due = calculatePaymentDueDate(achieved);
      expect(due.getUTCDate()).toBe(2);
      expect(due.getUTCMonth()).toBe(2); // March (0-indexed: 2)
    });

    it('Achievement on 31 January in leap year (2024) -> Due on 1 March', () => {
      const achieved = new Date('2024-01-31T00:00:00Z');
      const due = calculatePaymentDueDate(achieved);
      expect(due.getUTCDate()).toBe(1);
      expect(due.getUTCMonth()).toBe(2); // March
    });
  });

  describe('Stage Thresholds and Benefits Table', () => {
    it('should have 12 stages with verified thresholds and benefits', () => {
      expect(NETWORKING_STAGES.length).toBe(12);

      expect(NETWORKING_STAGES[0]).toEqual({ stage: 1, requiredDirectMembers: 5, benefitAmountINR: 0, isPayable: false });
      expect(NETWORKING_STAGES[1]).toEqual({ stage: 2, requiredDirectMembers: 25, benefitAmountINR: 0, isPayable: false });
      expect(NETWORKING_STAGES[2]).toEqual({ stage: 3, requiredDirectMembers: 125, benefitAmountINR: 2500, isPayable: true });
      expect(NETWORKING_STAGES[3]).toEqual({ stage: 4, requiredDirectMembers: 625, benefitAmountINR: 10000, isPayable: true });
      expect(NETWORKING_STAGES[4]).toEqual({ stage: 5, requiredDirectMembers: 3125, benefitAmountINR: 10000, isPayable: true });
      expect(NETWORKING_STAGES[5]).toEqual({ stage: 6, requiredDirectMembers: 15625, benefitAmountINR: 10000, isPayable: true });
      expect(NETWORKING_STAGES[6]).toEqual({ stage: 7, requiredDirectMembers: 78125, benefitAmountINR: 12000, isPayable: true });
      expect(NETWORKING_STAGES[7]).toEqual({ stage: 8, requiredDirectMembers: 390625, benefitAmountINR: 14000, isPayable: true });
      expect(NETWORKING_STAGES[8]).toEqual({ stage: 9, requiredDirectMembers: 1953125, benefitAmountINR: 16000, isPayable: true });
      expect(NETWORKING_STAGES[9]).toEqual({ stage: 10, requiredDirectMembers: 9765625, benefitAmountINR: 18000, isPayable: true });
      expect(NETWORKING_STAGES[10]).toEqual({ stage: 11, requiredDirectMembers: 48828125, benefitAmountINR: 20000, isPayable: true });
      expect(NETWORKING_STAGES[11]).toEqual({ stage: 12, requiredDirectMembers: 244140625, benefitAmountINR: 22000, isPayable: true });
    });

    it('evaluateAchievedStages: correctly finds multiple crossed thresholds', () => {
      // From 0 members to 30 members: crossed stage 1 (5) and stage 2 (25)
      const achieved = evaluateAchievedStages(0, 30);
      expect(achieved.map((s) => s.stage)).toEqual([1, 2]);

      // From 120 members to 630 members: crossed stage 3 (125) and stage 4 (625)
      const multi = evaluateAchievedStages(120, 630);
      expect(multi.map((s) => s.stage)).toEqual([3, 4]);
    });

    it('getCurrentStageFromCount: accurately derives current stage', () => {
      expect(getCurrentStageFromCount(4)).toBe(0);
      expect(getCurrentStageFromCount(5)).toBe(1);
      expect(getCurrentStageFromCount(24)).toBe(1);
      expect(getCurrentStageFromCount(25)).toBe(2);
      expect(getCurrentStageFromCount(125)).toBe(3);
      expect(getCurrentStageFromCount(625)).toBe(4);
    });
  });

  describe('Derived Benefit Statuses', () => {
    const baseAchievement = new Date('2026-10-15T00:00:00Z');
    const dueDate = calculatePaymentDueDate(baseAchievement); // 14 Nov 2026

    it('should be PAID when status is PAID', () => {
      expect(deriveBenefitDisplayStatus('PAID', dueDate)).toBe('PAID');
    });

    it('should be PENDING when far from due date', () => {
      const now = new Date('2026-10-20T00:00:00Z');
      expect(deriveBenefitDisplayStatus('PENDING', dueDate, now)).toBe('PENDING');
    });

    it('should be DUE SOON when within 5 calendar days of due date', () => {
      const now = new Date('2026-11-10T00:00:00Z');
      expect(deriveBenefitDisplayStatus('PENDING', dueDate, now)).toBe('DUE SOON');
    });

    it('should be OVERDUE when past due date and still unpaid', () => {
      const now = new Date('2026-11-15T00:00:00Z');
      expect(deriveBenefitDisplayStatus('PENDING', dueDate, now)).toBe('OVERDUE');
    });
  });

  describe('Admin GPay Payment Confirmation & Stage 12 Reset', () => {
    it('should reject payment confirmation without screenshot proof', async () => {
      prisma.stageBenefit.findUnique.mockResolvedValue({
        id: 'ben_1',
        status: 'PENDING',
        stageNumber: 3,
        amount: 2500,
      });

      await expect(
        service.recordAndConfirmPayment('usr_admin_1', 'ben_1', {
          paymentDate: '2026-10-15T00:00:00.000Z',
          paymentProofUrl: '',
        }),
      ).rejects.toThrow('payment screenshot proof is strictly required');
    });

    it('should confirm payment, set status to PAID, and audit log', async () => {
      prisma.stageBenefit.findUnique.mockResolvedValue({
        id: 'ben_1',
        userId: 'usr_mem_1',
        status: 'PENDING',
        stageNumber: 3,
        amount: 2500,
        cycleId: 'cyc_1',
        cycle: { cycleNumber: 1 },
      });

      prisma.stageBenefit.update.mockResolvedValue({
        id: 'ben_1',
        status: 'PAID',
        stageNumber: 3,
        amount: 2500,
        confirmedAt: new Date(),
      });

      const result = await service.recordAndConfirmPayment('usr_admin_1', 'ben_1', {
        paymentDate: '2026-10-15T00:00:00.000Z',
        paymentProofUrl: '/uploads/proofs/gpay_screenshot.png',
        gpayReferenceId: 'GPAY-123456',
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('PAID');
      expect(result.data.cycleResetCompleted).toBe(false);
      expect(prisma.stageBenefit.update).toHaveBeenCalled();
      expect(prisma.benefitAuditLog.create).toHaveBeenCalled();
    });

    it('should trigger Stage 12 cycle reset when Stage 12 benefit is marked as PAID', async () => {
      prisma.stageBenefit.findUnique.mockResolvedValue({
        id: 'ben_12',
        userId: 'usr_top_member',
        status: 'PENDING',
        stageNumber: 12,
        amount: 22000,
        cycleId: 'cyc_1',
        cycle: { id: 'cyc_1', cycleNumber: 1 },
      });

      prisma.stageBenefit.update.mockResolvedValue({
        id: 'ben_12',
        status: 'PAID',
        stageNumber: 12,
        amount: 22000,
        confirmedAt: new Date(),
      });

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.networkingCycle.findFirst.mockResolvedValue(null);
      prisma.networkingCycle.update.mockResolvedValue({ id: 'cyc_1', status: 'COMPLETED' });
      prisma.networkingCycle.create.mockResolvedValue({ id: 'cyc_2', cycleNumber: 2 });
      prisma.user.update.mockResolvedValue({ id: 'usr_top_member' });

      const result = await service.recordAndConfirmPayment('usr_admin_1', 'ben_12', {
        paymentDate: '2026-10-15T00:00:00.000Z',
        paymentProofUrl: '/uploads/proofs/gpay_stage12_proof.png',
      });

      expect(result.success).toBe(true);
      expect(result.data.cycleResetCompleted).toBe(true);
      expect(result.data.newCycleNumber).toBe(2);
      expect(result.data.newReferralCode).toBeDefined();
      expect(prisma.networkingCycle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cyc_1' },
          data: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
      expect(prisma.networkingCycle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cycleNumber: 2, qualifyingDirectMembersCount: 0, status: 'ACTIVE' }),
        }),
      );
    });
  });
});
