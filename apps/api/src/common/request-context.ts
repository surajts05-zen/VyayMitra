import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const SAFE_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

export function resolveRequestId(candidate: unknown): string {
  return typeof candidate === 'string' && SAFE_REQUEST_ID.test(candidate)
    ? candidate
    : `req_${randomUUID()}`;
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = resolveRequestId(req.headers['x-request-id']);
  (req as Request & { requestId: string }).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

export function getRequestId(req: Request & { requestId?: string }): string {
  if (req.requestId) return req.requestId;
  const requestId = resolveRequestId(req.headers['x-request-id']);
  req.requestId = requestId;
  return requestId;
}
