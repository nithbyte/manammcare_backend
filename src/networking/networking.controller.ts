import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { NetworkingService } from './networking.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  ValidateReferralDto,
  QueryReferralsDto,
  QueryBenefitsDto,
  RecordBenefitPaymentDto,
} from './dto/networking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const uploadDir = path.resolve(__dirname, '../../../uploads/proofs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@ApiTags('Networking')
@Controller('api/networking')
export class NetworkingController {
  constructor(
    private networkingService: NetworkingService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user networking and membership dashboard' })
  async getDashboard(@CurrentUser() user: any) {
    return this.networkingService.getDashboard(user.id);
  }

  @Get('referrals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated list of referred customers' })
  async getReferrals(
    @CurrentUser() user: any,
    @Query() query: QueryReferralsDto,
  ) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    return this.networkingService.getReferrals(user.id, page, limit);
  }

  @Get('benefits/:id/proof')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get access-controlled payment proof screenshot for a benefit' })
  async getBenefitProof(
    @CurrentUser() user: any,
    @Param('id') benefitId: string,
  ) {
    const isAdmin = user.role === 'ADMIN' || user.role === 'admin';
    return this.networkingService.getBenefitProof(user.id, benefitId, isAdmin);
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate a referral code' })
  async validateCodeParam(@Param('code') code: string) {
    return this.networkingService.validateReferralCode(code);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a referral code via request body' })
  async validateCodeBody(@Body() dto: ValidateReferralDto) {
    return this.networkingService.validateReferralCode(dto.code);
  }

  // --- ADMIN NETWORKING BENEFIT FULFILLMENT ENDPOINTS ---

  @Get('admin/benefits')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Query all member benefits and payment statuses' })
  async getAdminBenefits(@Query() query: QueryBenefitsDto) {
    return this.networkingService.getAdminBenefits(query);
  }

  @Get('admin/alerts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get real-time benefit fulfillment alerts' })
  async getAdminAlerts() {
    return this.networkingService.getAdminAlerts();
  }

  @Post('admin/benefits/:id/pay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Mark benefit as PAID with manual GPay proof and date' })
  async recordPayment(
    @CurrentUser() admin: any,
    @Param('id') benefitId: string,
    @Body() dto: RecordBenefitPaymentDto,
  ) {
    return this.networkingService.recordAndConfirmPayment(admin.id, benefitId, dto);
  }

  @Post('admin/upload-proof')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin: Upload GPay payment proof screenshot to Cloudinary' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          return cb(new BadRequestException('Only JPG, PNG, WEBP, or PDF proof files are permitted.'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadProof(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    if (!file && !body.base64Image) {
      throw new BadRequestException('Screenshot file or base64 data is required.');
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
        folder: 'manamm/proofs',
      });

      return {
        success: true,
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          filename: result.public_id,
          size: result.bytes,
        },
      };
    } catch (err: any) {
      throw new BadRequestException(`Cloudinary proof upload failed: ${err.message}`);
    }
  }
}
