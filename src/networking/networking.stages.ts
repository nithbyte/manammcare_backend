/**
 * Centralized MANAM Networking Stage Definitions & Due Date Utilities
 * Strictly enforces business rules from the confirmed specification.
 */

export interface StageConfig {
  stage: number;
  requiredDirectMembers: number;
  benefitAmountINR: number;
  isPayable: boolean;
}

export const NETWORKING_STAGES: StageConfig[] = [
  { stage: 1, requiredDirectMembers: 5, benefitAmountINR: 0, isPayable: false },
  { stage: 2, requiredDirectMembers: 25, benefitAmountINR: 0, isPayable: false },
  { stage: 3, requiredDirectMembers: 125, benefitAmountINR: 2500, isPayable: true },
  { stage: 4, requiredDirectMembers: 625, benefitAmountINR: 10000, isPayable: true },
  { stage: 5, requiredDirectMembers: 3125, benefitAmountINR: 10000, isPayable: true },
  { stage: 6, requiredDirectMembers: 15625, benefitAmountINR: 10000, isPayable: true },
  { stage: 7, requiredDirectMembers: 78125, benefitAmountINR: 12000, isPayable: true },
  { stage: 8, requiredDirectMembers: 390625, benefitAmountINR: 14000, isPayable: true },
  { stage: 9, requiredDirectMembers: 1953125, benefitAmountINR: 16000, isPayable: true },
  { stage: 10, requiredDirectMembers: 9765625, benefitAmountINR: 18000, isPayable: true },
  { stage: 11, requiredDirectMembers: 48828125, benefitAmountINR: 20000, isPayable: true },
  { stage: 12, requiredDirectMembers: 244140625, benefitAmountINR: 22000, isPayable: true },
];

export const MAX_NETWORKING_STAGE = 12;
export const PAYMENT_DUE_DAYS = 30;
export const DUE_SOON_THRESHOLD_DAYS = 5;

/**
 * Calculates payment due date: exactly 30 calendar days after stage achievement date.
 * paymentDueDate = achievementDate + 30 calendar days
 */
export function calculatePaymentDueDate(achievementDate: Date): Date {
  const dueDate = new Date(achievementDate.getTime());
  dueDate.setDate(dueDate.getDate() + PAYMENT_DUE_DAYS);
  return dueDate;
}

export type BenefitDisplayStatus = 'PENDING' | 'DUE SOON' | 'OVERDUE' | 'PAID';

/**
 * Derives user-facing display status for a benefit record
 */
export function deriveBenefitDisplayStatus(
  status: string,
  paymentDueDate: Date,
  now: Date = new Date(),
): BenefitDisplayStatus {
  if (status.toUpperCase() === 'PAID') {
    return 'PAID';
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil((paymentDueDate.getTime() - now.getTime()) / msPerDay);

  if (diffDays < 0) {
    return 'OVERDUE';
  }

  if (diffDays <= DUE_SOON_THRESHOLD_DAYS) {
    return 'DUE SOON';
  }

  return 'PENDING';
}

/**
 * Get config for a specific stage
 */
export function getStageConfig(stageNumber: number): StageConfig | undefined {
  return NETWORKING_STAGES.find((s) => s.stage === stageNumber);
}

/**
 * Determine newly achieved stages based on previous member count vs new member count
 */
export function evaluateAchievedStages(
  previousCount: number,
  newCount: number,
): StageConfig[] {
  return NETWORKING_STAGES.filter(
    (s) => newCount >= s.requiredDirectMembers && previousCount < s.requiredDirectMembers,
  );
}

/**
 * Get current stage based on qualifying members count
 */
export function getCurrentStageFromCount(count: number): number {
  let highest = 0;
  for (const s of NETWORKING_STAGES) {
    if (count >= s.requiredDirectMembers) {
      highest = s.stage;
    } else {
      break;
    }
  }
  return highest;
}

/**
 * Get next stage threshold info
 */
export function getNextStageProgress(count: number) {
  const currentStage = getCurrentStageFromCount(count);
  const nextConfig = NETWORKING_STAGES.find((s) => s.stage === currentStage + 1);

  return {
    currentStage,
    qualifyingCount: count,
    nextStage: nextConfig ? nextConfig.stage : null,
    nextStageRequiredCount: nextConfig ? nextConfig.requiredDirectMembers : null,
    membersNeededForNextStage: nextConfig
      ? Math.max(0, nextConfig.requiredDirectMembers - count)
      : 0,
    isMaxStageReached: currentStage >= MAX_NETWORKING_STAGE,
  };
}
