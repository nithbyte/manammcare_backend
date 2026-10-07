import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductQueryDto } from './dto/product-query.dto';

@ApiTags('Products')
@Controller('api/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Paginated product catalog with category, brand, search filters' })
  async getProducts(@Query() query: ProductQueryDto) {
    return this.productsService.getProducts(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Curated featured products' })
  async getFeaturedProducts() {
    return this.productsService.getFeaturedProducts();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products by keyword' })
  async searchProducts(@Query('q') q: string) {
    return this.productsService.searchProducts(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details by ID or slug' })
  async getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }
}
