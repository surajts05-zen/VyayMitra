import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { getRequestId } from '../request-context.js';

export interface Response<T> {
  data: T;
  meta: {
    timestamp: string;
    version: string;
  };
  requestId: string;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const req = context.switchToHttp().getRequest<Request>();
    const requestId = getRequestId(req);

    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
        requestId,
      }))
    );
  }
}
