import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  Matches,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class SubmitCustomerVerificationDto {
  @ApiProperty({ description: 'Full legal name matching government ID', example: 'Nithish Sai' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiProperty({ description: 'Age of the customer (minimum 18)', example: 25 })
  @IsNumber()
  @Min(18, { message: 'Customer age must be at least 18 years' })
  @Max(120, { message: 'Please enter a valid age' })
  age: number;

  @ApiProperty({ description: 'Gender', enum: Gender, example: Gender.MALE })
  @IsString()
  @IsNotEmpty({ message: 'Gender is required' })
  gender: string;

  @ApiProperty({ description: "Father's or Spouse's full name", example: 'Ramesh Kumar' })
  @IsString()
  @IsNotEmpty({ message: "Father's or Spouse's name is required" })
  fatherOrSpouseName: string;

  @ApiProperty({ description: 'Primary 10-digit mobile number', example: '9080012528' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Primary mobile number must be a valid 10-digit Indian mobile number',
  })
  mobileNumber: string;

  @ApiProperty({
    description: 'Complete residential address',
    example: '12-A, Green Meadows, Anna Nagar, Chennai, Tamil Nadu - 600040',
  })
  @IsString()
  @IsNotEmpty({ message: 'Complete address is required' })
  address: string;

  @ApiProperty({ description: 'Permanent Account Number (PAN)', example: 'ABCDE1234F' })
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'PAN number must be 10 characters in valid format (e.g. ABCDE1234F)',
  })
  panNumber: string;

  @ApiProperty({ description: '12-digit Aadhaar number', example: '123456789012' })
  @IsString()
  @Matches(/^\d{12}$/, {
    message: 'Aadhaar number must be exactly 12 digits',
  })
  aadhaarNumber: string;

  @ApiProperty({ description: 'Alternate 10-digit contact number', example: '9876543210' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Alternate contact number must be a valid 10-digit Indian mobile number',
  })
  alternatePhone: string;

  @ApiProperty({ description: 'Full legal name of the nominee', example: 'Priya Ramesh' })
  @IsString()
  @IsNotEmpty({ message: 'Nominee name is required' })
  nomineeName: string;

  @ApiProperty({
    description: 'Relationship with the nominee',
    example: 'Spouse',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nominee relationship is required' })
  nomineeRelationship: string;

  @ApiProperty({ description: 'Age of the nominee', example: 24 })
  @IsNumber()
  @Min(1, { message: 'Nominee age must be at least 1' })
  @Max(120, { message: 'Please enter a valid nominee age' })
  nomineeAge: number;
}
