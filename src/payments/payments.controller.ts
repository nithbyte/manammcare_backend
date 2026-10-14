import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentOrderDto,
  VerifyPaymentDto,
  StandardCreateOrderDto,
  StandardVerifyPaymentDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('api/payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate authoritative Razorpay Order ID on server' })
  async createRazorpayOrder(@Body() dto: CreatePaymentOrderDto) {
    return this.paymentsService.createRazorpayOrder(dto);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cryptographically verify Razorpay HMAC signature and confirm order' })
  async verifyPayment(
    @CurrentUser() user: any,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(user.id, dto);
  }

  // Standard Web Checkout public endpoints
  @Post('standard/create-order')
  @ApiOperation({ summary: 'Standard Web Checkout - Create Razorpay order (public)' })
  async createStandardOrder(@Body() dto: StandardCreateOrderDto) {
    return this.paymentsService.createStandardOrder(dto);
  }

  @Post('standard/verify')
  @ApiOperation({ summary: 'Standard Web Checkout - Verify Razorpay payment signature (public)' })
  async verifyStandardPayment(@Body() dto: StandardVerifyPaymentDto) {
    return this.paymentsService.verifyStandardPayment(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve payment transaction receipt' })
  async getPaymentStatus(@Param('id') paymentId: string) {
    return this.paymentsService.getPaymentStatus(paymentId);
  }
}
