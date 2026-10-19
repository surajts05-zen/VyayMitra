import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { getRequestId } from '../../common/request-context.js';
import { MetricsService, normalizeMetricRoute } from './metrics.service.js';

@Injectable()
export class RequestTelemetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HttpRequest');

  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const requestId = getRequestId(req);
    const started = process.hrtime.bigint();
    const finishInFlight = this.metrics.startRequest();

    return next.handle().pipe(
      finalize(() => {
        const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
        const route = normalizeMetricRoute(req.originalUrl || req.url);
        this.metrics.observe(req.method, route, res.statusCode, durationMs);
        finishInFlight();
        res.setHeader('Server-Timing', `app;dur=${durationMs.toFixed(1)}`);
        this.logger.log(JSON.stringify({
          event: 'http_request_completed',
          requestId,
          method: req.method,
          route,
          statusCode: res.statusCode,
          durationMs: Number(durationMs.toFixed(1)),
        }));
      }),
    );
  }
}
