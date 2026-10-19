import { Controller, Get, NotFoundException, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { loadRuntimeConfig } from '../../common/config/runtime-config.js';
import { MetricsService } from './metrics.service.js';

@ApiExcludeController()
@Controller('internal')
export class ObservabilityController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  getMetrics(@Req() req: Request, @Res() res: Response): void {
    const expected = loadRuntimeConfig().observabilityToken;
    if (!expected) throw new NotFoundException();

    const authorization = req.headers.authorization;
    const supplied = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    const suppliedBuffer = Buffer.from(supplied);
    const expectedBuffer = Buffer.from(expected);
    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid observability credential');
    }

    res.type('text/plain; version=0.0.4; charset=utf-8').send(this.metrics.renderPrometheus());
  }
}
