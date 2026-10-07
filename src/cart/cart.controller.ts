import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve active shopping cart with calculated totals' })
  async getCart(@CurrentUser() user: any) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add product to cart or increment quantity' })
  async addItem(
    @CurrentUser() user: any,
    @Body() body: { productId: string; quantity: number },
  ) {
    return this.cartService.addItem(user.id, body.productId, body.quantity || 1);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateItemQuantity(
    @CurrentUser() user: any,
    @Param('id') cartItemId: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateItemQuantity(user.id, cartItemId, body.quantity);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(
    @CurrentUser() user: any,
    @Param('id') cartItemId: string,
  ) {
    return this.cartService.removeItem(user.id, cartItemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all items from active cart' })
  async clearCart(@CurrentUser() user: any) {
    return this.cartService.clearCart(user.id);
  }
}
