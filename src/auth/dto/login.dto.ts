import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'ananya.sharma@example.com' })
  @IsString()
  @IsNotEmpty()
  emailOrPhone: string;

  @ApiProperty({ example: 'Customer@123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'ananya.sharma@example.com' })
  @IsString()
  @IsNotEmpty()
  emailOrPhone: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'Customer@123', required: false })
  @IsString()
  @IsOptional()
  currentPass?: string;

  @ApiProperty({ example: 'Customer@123', required: false })
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @ApiProperty({ example: 'NewSecret@123', minLength: 6, required: false })
  @IsString()
  @IsOptional()
  newPass?: string;

  @ApiProperty({ example: 'NewSecret@123', minLength: 6, required: false })
  @IsString()
  @IsOptional()
  newPassword?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'ananya.sharma@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ example: 'NewPassword@123', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class SendRegisterOtpDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Ananya Sharma' })
  @IsString()
  @IsNotEmpty()
  fullName: string;
}

export class VerifyRegisterOtpDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ example: 'Ananya Sharma' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Customer@123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'MNMF3MTBD', required: false })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

