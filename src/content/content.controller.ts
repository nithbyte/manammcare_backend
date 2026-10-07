import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContentService } from './content.service';

@ApiTags('Content')
@Controller('api')
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Get('banners')
  @ApiOperation({ summary: 'List active promotional banners' })
  async getBanners() {
    return this.contentService.getBanners();
  }

  @Get('offers')
  @ApiOperation({ summary: 'List active promotional offers' })
  async getOffers() {
    return this.contentService.getOffers();
  }

  @Get('announcements')
  @ApiOperation({ summary: 'List active announcements' })
  async getAnnouncements() {
    return this.contentService.getAnnouncements();
  }

  @Get('faqs')
  @ApiOperation({ summary: 'List frequently asked questions' })
  async getFaqs() {
    return this.contentService.getFaqs();
  }

  @Get('policies/:slug')
  @ApiOperation({ summary: 'Get policy content by slug' })
  async getPolicy(@Param('slug') slug: string) {
    return this.contentService.getPolicy(slug);
  }
}
