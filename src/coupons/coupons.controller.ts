import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';

@ApiTags('Coupons')
@Controller('api/coupons')
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate coupon applicability and calculate discount' })
  async validateCoupon(
    @Body() body: { code: string; subtotal?: number; cartTotal?: number },
  ) {
    const subtotal = body.subtotal ?? body.cartTotal ?? 0;
    return this.couponsService.validateCoupon(body.code, subtotal);
  }
}
