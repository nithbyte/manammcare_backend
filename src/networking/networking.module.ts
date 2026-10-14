import { Module } from '@nestjs/common';
import { NetworkingService } from './networking.service';
import { NetworkingController } from './networking.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NetworkingController],
  providers: [NetworkingService],
  exports: [NetworkingService],
})
export class NetworkingModule {}
