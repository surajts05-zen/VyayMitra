import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../apps/api/src/app.module.js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

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
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'Machine-to-machine developer API credential key',
      },
      'X-API-Key'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  document.openapi = '3.1.0';

  const docPath = resolve(process.cwd(), 'openapi.json');
  writeFileSync(docPath, JSON.stringify(document, null, 2));
  console.log(`OpenAPI specification updated at ${docPath}`);
  await app.close();
  process.exit(0);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
