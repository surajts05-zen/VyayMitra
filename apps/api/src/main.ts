import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor.js';
import helmet from 'helmet';
import compression from 'compression';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { loadRuntimeConfig } from './common/config/runtime-config.js';
import { requestContextMiddleware } from './common/request-context.js';
import { RateLimitMiddleware } from './common/rate-limit.middleware.js';
import { MetricsService } from './modules/observability/metrics.service.js';
import { RequestTelemetryInterceptor } from './modules/observability/request-telemetry.interceptor.js';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const runtime = loadRuntimeConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.useBodyParser('json', { limit: runtime.bodyLimit });
  app.useBodyParser('urlencoded', { limit: runtime.bodyLimit, extended: false });
  if (runtime.trustProxy !== false) {
    app.set('trust proxy', runtime.trustProxy);
  }

  // Global Middlewares
  app.use(requestContextMiddleware);
  const rateLimiter = new RateLimitMiddleware(runtime);
  app.use(rateLimiter.use.bind(rateLimiter));
  app.use(helmet({
    contentSecurityPolicy: runtime.isProduction ? undefined : false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
  }));
  app.use(compression());
  app.enableCors({
    origin: runtime.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Idempotency-Key'],
  });

  // Global Interceptors & Exception Filters
  app.useGlobalInterceptors(
    new RequestTelemetryInterceptor(app.get(MetricsService)),
    new ResponseTransformInterceptor(),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  // OpenAPI 3.1 Specification Setup
  const config = new DocumentBuilder()
    .setTitle('VyayMitra API')
    .setDescription('VyayMitra Enterprise Multi-Tenant Expense Management SaaS REST API')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT access token with tenant claims',
        in: 'header',
      },
      'JWT-auth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'Idempotency-Key',
        in: 'header',
        description: 'Unique client-supplied key for state-mutating financial operations',
      },
      'Idempotency-Key'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  document.openapi = '3.1.0';
  if (runtime.enableApiDocs) {
    SwaggerModule.setup('api/docs', app, document);
  }

  // Expose raw openapi.json
  app.getHttpAdapter().get('/api/openapi.json', (_req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(document);
  });

  // Persist openapi.json to disk for schema validation and CI
  try {
    if (!runtime.writeOpenApiFile) throw new Error('OpenAPI file output disabled');
    const docPath = resolve(process.cwd(), 'openapi.json');
    writeFileSync(docPath, JSON.stringify(document, null, 2));
    logger.log(`OpenAPI schema written to ${docPath}`);
  } catch {
    // Non-fatal: production filesystems may be read-only and output may be disabled.
  }

  await app.listen(runtime.port);
  logger.log(`VyayMitra API listening on port ${runtime.port} (${runtime.nodeEnv})`);
  if (runtime.enableApiDocs) logger.log('Swagger documentation enabled at /api/docs');
  logger.log('OpenAPI raw schema enabled at /api/openapi.json');
}

bootstrap();
