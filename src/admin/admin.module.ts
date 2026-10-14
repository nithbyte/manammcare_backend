import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { NetworkingModule } from '../networking/networking.module';

@Module({
  imports: [ProductsModule, OrdersModule, NetworkingModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
