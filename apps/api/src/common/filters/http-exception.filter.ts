import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { getRequestId } from '../request-context.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = getRequestId(request);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown = null;

    if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Request validation failed';
      errors = exception.errors;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        message = (obj.message as string) || message;
        errors = obj.errors || null;
      }
    } else if (exception instanceof Error) {
      this.logger.error(JSON.stringify({
        event: 'unhandled_http_exception',
        requestId,
        method: request.method,
        path: request.path,
        errorName: exception.name,
      }));
      message = 'Internal server error';
    }

    response.status(status).json({
      error: {
        statusCode: status,
        message,
        errors,
        path: request.url,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
      requestId,
    });
  }
}
