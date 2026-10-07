import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AddressType {
  HOME = 'HOME',
  WORK = 'WORK',
  OTHER = 'OTHER',
}

export class CreateAddressDto {
  @ApiProperty({ enum: AddressType, default: AddressType.HOME })
  @IsEnum(AddressType)
  @IsOptional()
  type?: AddressType;

  @ApiProperty({ example: 'Home' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ example: 'Ananya Sharma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Flat 402, Green Meadows Residency' })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiProperty({ example: 'Road No. 12, Banjara Hills' })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ example: 'Hyderabad' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Telangana' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '500034' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ example: 'India', default: 'India' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 'Near Lotus Pond' })
  @IsString()
  @IsOptional()
  landmark?: string;

  @ApiProperty({ example: true, default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsEnum(AddressType)
  @IsOptional()
  type?: AddressType;

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  addressLine1?: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  landmark?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
