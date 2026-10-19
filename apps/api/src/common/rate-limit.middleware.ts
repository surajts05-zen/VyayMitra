import { HttpException, Injectable } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { RuntimeConfig } from './config/runtime-config.js';
import { getRequestId } from './request-context.js';

interface Bucket {
  count: number;
  resetAt: number;
}

const AUTH_PATH = /^\/api\/v1\/auth\/(login|register|refresh|invitations\/accept)(?:\/|$)/;

@Injectable()
export class RateLimitMiddleware {
  private readonly buckets = new Map<string, Bucket>();
  private lastSweepAt = 0;

  constructor(
    private readonly config: RuntimeConfig,
    private readonly now: () => number = Date.now,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const now = this.now();
    this.sweep(now);

    const policy = AUTH_PATH.test(req.path) ? this.config.authRateLimit : this.config.rateLimit;
    const client = req.ip || req.socket.remoteAddress || 'unknown';
    const policyName = AUTH_PATH.test(req.path) ? 'auth' : 'global';
    const key = `${policyName}:${client}`;
    let bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + policy.windowMs };
      this.buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, policy.max - bucket.count);
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader('RateLimit-Limit', String(policy.max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > policy.max) {
      res.setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        {
          message: 'Too many requests. Retry after the indicated interval.',
          requestId: getRequestId(req),
        },
        429,
      );
    }

    next();
  }

  private sweep(now: number): void {
    if (now - this.lastSweepAt < 60_000) return;
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
    this.lastSweepAt = now;
  }
}
