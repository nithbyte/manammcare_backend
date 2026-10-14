import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
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
