import { IsOptional, IsString, IsNotEmpty, IsISO8601 } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateReferralDto {
  @ApiProperty({ example: 'MNM8A9B2C' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class QueryReferralsDto {
  @ApiPropertyOptional({ example: '1', default: '1' })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ example: '20', default: '20' })
  @IsOptional()
  limit?: string;
}

export class RecordBenefitPaymentDto {
  @ApiProperty({ example: '2026-10-15T00:00:00.000Z', description: 'ISO date when GPay transfer was completed' })
  @IsString()
  @IsNotEmpty()
  paymentDate: string;

  @ApiPropertyOptional({ example: 'GPAY-49281048201', description: 'Optional GPay transaction reference number' })
  @IsOptional()
  @IsString()
  gpayReferenceId?: string;

  @ApiProperty({ example: 'https://...', description: 'URL or path to uploaded payment proof screenshot' })
  @IsString()
  @IsNotEmpty()
  paymentProofUrl: string;

  @ApiPropertyOptional({ example: 'Paid via GPay to Ramesh phone', description: 'Optional admin notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryBenefitsDto {
  @ApiPropertyOptional({ example: 'PENDING', enum: ['ALL', 'PENDING', 'DUE_SOON', 'OVERDUE', 'PAID'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '1', default: '1' })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ example: '20', default: '20' })
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional({ example: 'Ramesh', description: 'Filter by member name, phone, or referral code' })
  @IsOptional()
  @IsString()
  search?: string;
}
