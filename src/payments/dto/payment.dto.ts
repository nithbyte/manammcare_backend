import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentOrderDto {
  @ApiProperty({ example: 480, description: 'Amount in INR' })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'rcpt_12345' })
  @IsString()
  @IsNotEmpty()
  receipt: string;

  @ApiProperty({ required: false })
  @IsOptional()
  notes?: Record<string, string>;
}

export class VerifyPaymentDto {
  @ApiProperty({ example: 'MNM-2026-1234' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: 'order_rzp_123' })
  @IsString()
  @IsNotEmpty()
  razorpayOrderId: string;

  @ApiProperty({ example: 'pay_rzp_456' })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @ApiProperty({ example: 'sig_hmac_789' })
  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}
