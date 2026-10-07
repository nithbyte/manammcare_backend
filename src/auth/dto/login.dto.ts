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
  @ApiProperty({ example: 'Customer@123' })
  @IsString()
  @IsNotEmpty()
  currentPass: string;

  @ApiProperty({ example: 'NewSecret@123', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPass: string;
}
