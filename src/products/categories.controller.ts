import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('Categories')
@Controller('api/categories')
export class CategoriesController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active categories' })
  async getCategories() {
    return this.productsService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category details by ID' })
  async getCategoryById(@Param('id') id: string) {
    return this.productsService.getCategoryById(id);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Paginated products for a specific category' })
  async getProductsByCategory(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.getProductsByCategory(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
