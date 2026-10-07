import { IsNotEmpty, IsArray, IsString, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemInputDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  unitPrice?: number;
}

export class ShippingAddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  landmark?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  postalCode: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ example: 'razorpay' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  razorpayOrderId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  razorpayPaymentId?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  shippingFee?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  grandTotal?: number;
}
