import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Lazy connect or connect on startup
    try {
      await this.$connect();
    } catch (err) {
      console.warn('Prisma initial connection deferred:', err.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
