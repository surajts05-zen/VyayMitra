import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller.js';
import { AccountingIntegrationsController } from './accounting-integrations.controller.js';
import { IntegrationsService } from './integrations.service.js';

@Module({
  controllers: [IntegrationsController, AccountingIntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
