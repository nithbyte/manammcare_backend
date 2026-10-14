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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NetworkingService } from './networking.service';
import { ValidateReferralDto, QueryReferralsDto } from './dto/networking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Networking')
@Controller('api/networking')
export class NetworkingController {
  constructor(private networkingService: NetworkingService) {}

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
}
