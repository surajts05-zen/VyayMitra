import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { loadRuntimeConfig } from '../../common/config/runtime-config.js';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('api/health')
  @ApiOperation({ summary: 'API Root Health Check' })
  @ApiResponse({ status: 200, description: 'Application is healthy and accessible' })
  getHealth() {
    return {
      status: 'ok',
      service: 'vyaymitra-api',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('api/v1/health')
  @ApiOperation({ summary: 'API v1 Versioned Health Check' })
  @ApiResponse({ status: 200, description: 'v1 API router is operational' })
  getV1Health() {
    return {
      status: 'ok',
      apiVersion: 'v1',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('api/health/live')
  @ApiOperation({ summary: 'Process liveness probe (no dependency checks)' })
  @ApiResponse({ status: 200, description: 'Process is serving HTTP requests' })
  getLiveness() {
    return {
      status: 'ok',
      service: 'vyaymitra-api',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('api/health/ready')
  @ApiOperation({ summary: 'Dependency-aware readiness probe' })
  @ApiResponse({ status: 200, description: 'Required dependencies are ready' })
  @ApiResponse({ status: 503, description: 'A required dependency is unavailable' })
  async getReadiness(@Res({ passthrough: true }) response: Response) {
    const config = loadRuntimeConfig();
    const startedAt = Date.now();
    let database: 'ready' | 'unavailable' = 'unavailable';
    let detail: string | undefined;

    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('database readiness timeout')), 1_500)),
      ]);
      database = 'ready';
    } catch {
      detail = config.allowOfflineDatabase ? 'offline development mode' : 'required dependency unavailable';
    }

    const ready = database === 'ready' || config.allowOfflineDatabase;
    response.status(ready ? 200 : 503);
    return {
      status: ready ? (database === 'ready' ? 'ready' : 'degraded') : 'not_ready',
      checks: {
        database: {
          status: database,
          ...(detail ? { detail } : {}),
          durationMs: Date.now() - startedAt,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}
