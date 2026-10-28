import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { AdminService } from './admin.service';
import { NetworkingService } from '../networking/networking.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
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
    private cloudinaryService: CloudinaryService,
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

  @Post('products')
  @ApiOperation({ summary: 'Admin: Create a new product' })
  async createProduct(
    @CurrentUser() admin: any,
    @Body() productData: any,
  ) {
    return this.adminService.createProduct(admin.id, productData);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update product details, pricing, images, or availability' })
  async updateProduct(
    @CurrentUser() admin: any,
    @Param('id') productId: string,
    @Body() updates: any,
  ) {
    return this.adminService.updateProduct(admin.id, productId, updates);
  }

  @Post('products/upload-image')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Upload product image to Cloudinary with auto compression' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadProductImage(
    @UploadedFile() file: any,
    @Body() body: any,
  ) {
    if (!file && !body?.base64Image) {
      throw new BadRequestException('Image file or base64Image is required.');
    }

    try {
      let buffer: Buffer;
      if (file) {
        buffer = file.buffer;
      } else {
        const base64Data = body.base64Image.replace(/^data:image\/\w+;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
      }

      const result = await this.cloudinaryService.uploadBuffer(buffer, {
        folder: 'manamm/products',
      });

      return {
        success: true,
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
        },
      };
    } catch (err: any) {
      throw new BadRequestException(`Cloudinary upload failed: ${err.message}`);
    }
  }

  @Post('products/sync-catalog')
  @ApiOperation({ summary: 'Admin: Synchronize full product catalog and backend image URLs' })
  async syncCatalog(
    @CurrentUser() admin: any,
    @Body() body: { products?: any[] },
  ) {
    return this.adminService.syncCatalog(admin.id, body?.products);
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
