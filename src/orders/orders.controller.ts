import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order with server-verified prices and inventory decrement' })
  async createOrder(
    @CurrentUser() user: any,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List customer order history with pagination' })
  async getOrders(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getOrders(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by order ID' })
  async getOrderById(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.getOrderById(user.id, orderId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel unfulfilled order and restore inventory' })
  async cancelOrder(
    @CurrentUser() user: any,
    @Param('id') orderId: string,
    @Body() body: { reason?: string },
  ) {
    return this.ordersService.cancelOrder(user.id, orderId, body.reason);
  }
}
