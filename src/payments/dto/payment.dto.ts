import { IsNotEmpty, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentOrderDto {
  @ApiProperty({ example: 480, description: 'Amount in INR (must be >= 1 INR / 100 paise)' })
  @IsNumber()
  @Min(1, { message: 'Amount must be at least ₹1 (100 paise)' })
  amount: number;

  @ApiProperty({ example: 'rcpt_12345' })
  @IsString()
  @IsNotEmpty()
  receipt: string;

  @ApiProperty({ required: false })
  @IsOptional()
  notes?: Record<string, string>;
}

export class StandardCreateOrderDto {
  @ApiProperty({ example: 100, description: 'Amount in paise (or INR if converted)' })
  @IsNumber()
  @Min(100, { message: 'Amount must be at least 100 paise' })
  amount: number;

  @ApiProperty({ example: 'INR', required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 'rcpt_12345', required: false })
  @IsString()
  @IsOptional()
  receipt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  notes?: Record<string, string>;
}

export class StandardVerifyPaymentDto {
  @ApiProperty({ example: 'order_rzp_123' })
  @IsString()
  @IsNotEmpty({ message: 'razorpay_order_id is required' })
  razorpay_order_id: string;

  @ApiProperty({ example: 'pay_rzp_456' })
  @IsString()
  @IsNotEmpty({ message: 'razorpay_payment_id is required' })
  razorpay_payment_id: string;

  @ApiProperty({ example: 'sig_hmac_789' })
  @IsString()
  @IsNotEmpty({ message: 'razorpay_signature is required' })
  razorpay_signature: string;

  @ApiProperty({ example: 'ord_12345', required: false })
  @IsString()
  @IsOptional()
  orderId?: string;
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
