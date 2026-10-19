import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service.js';
import { ObservabilityController } from './observability.controller.js';

@Module({
  controllers: [ObservabilityController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class ObservabilityModule {}

