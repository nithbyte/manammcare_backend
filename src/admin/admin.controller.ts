import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { NetworkingService } from '../networking/networking.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('api/admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private networkingService: NetworkingService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Aggregated metrics and key operational KPIs' })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Query all system orders with fulfillment filters' })
  async getAllOrders(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAllOrders(
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order fulfillment status' })
  async updateOrderStatus(
    @CurrentUser() admin: any,
    @Param('id') orderId: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.updateOrderStatus(admin.id, orderId, body.status);
  }

  @Get('products')
  @ApiOperation({ summary: 'Query all products with inventory levels' })
  async getAdminProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAdminProducts(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update product stock, price, or availability' })
  async updateProduct(
    @CurrentUser() admin: any,
    @Param('id') productId: string,
    @Body() updates: { stock?: number; price?: number; isAvailable?: boolean },
  ) {
    return this.adminService.updateProduct(admin.id, productId, updates);
  }

  @Get('users')
  @ApiOperation({ summary: 'Query customer accounts' })
  async getAdminUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAdminUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('activity-logs')
  @ApiOperation({ summary: 'List recent administrative audit logs' })
  async getActivityLogs() {
    return this.adminService.getActivityLogs();
  }

  // --- NETWORKING BENEFIT FULFILLMENT ---

  @Get('networking/benefits')
  @ApiOperation({ summary: 'Admin: List member benefits and payment due dates' })
  async getNetworkingBenefits(@Query() query: any) {
    return this.networkingService.getAdminBenefits(query);
  }

  @Get('networking/alerts')
  @ApiOperation({ summary: 'Admin: Get real-time benefit fulfillment alerts' })
  async getNetworkingAlerts() {
    return this.networkingService.getAdminAlerts();
  }

  @Post('networking/benefits/:id/pay')
  @ApiOperation({ summary: 'Admin: Confirm manual GPay payment with proof and date' })
  async markBenefitAsPaid(
    @CurrentUser() admin: any,
    @Param('id') benefitId: string,
    @Body() dto: any,
  ) {
    return this.networkingService.recordAndConfirmPayment(admin.id, benefitId, dto);
  }
}
