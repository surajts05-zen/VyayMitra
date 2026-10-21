import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { loadRuntimeConfig } from '../../common/config/runtime-config.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Prisma successfully connected to PostgreSQL database');
    } catch (err) {
      this.isConnected = false;
      const config = loadRuntimeConfig();
      if (!config.allowOfflineDatabase) {
        this.logger.error('PostgreSQL connection failed and offline database mode is disabled');
        throw err;
      }
      this.logger.warn('Prisma connection unavailable; development offline mode is active');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.isConnected = false;
  }
}
