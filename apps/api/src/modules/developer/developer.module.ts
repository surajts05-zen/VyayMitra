import { Global, Module } from '@nestjs/common';
import { DeveloperController } from './developer.controller.js';
import { WebhooksService } from './webhooks.service.js';
import { ApiCredentialsService } from './api-credentials.service.js';

@Global()
@Module({
  controllers: [DeveloperController],
  providers: [WebhooksService, ApiCredentialsService],
  exports: [WebhooksService, ApiCredentialsService],
})
export class DeveloperModule {}
