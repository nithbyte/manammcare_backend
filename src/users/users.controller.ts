import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Retrieve authenticated customer profile' })
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update customer personal details' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updates: any,
  ) {
    return this.usersService.updateProfile(user.id, updates);
  }

  @Get('me/addresses')
  @ApiOperation({ summary: 'List customer saved delivery addresses' })
  async getAddresses(@CurrentUser() user: any) {
    return this.usersService.getAddresses(user.id);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Add new delivery address' })
  async addAddress(
    @CurrentUser() user: any,
    @Body() dto: CreateAddressDto,
  ) {
    return this.usersService.addAddress(user.id, dto);
  }

  @Patch('me/addresses/:id')
  @ApiOperation({ summary: 'Update existing delivery address' })
  async updateAddress(
    @CurrentUser() user: any,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user.id, addressId, dto);
  }

  @Delete('me/addresses/:id')
  @ApiOperation({ summary: 'Delete delivery address' })
  async deleteAddress(
    @CurrentUser() user: any,
    @Param('id') addressId: string,
  ) {
    return this.usersService.deleteAddress(user.id, addressId);
  }
}
