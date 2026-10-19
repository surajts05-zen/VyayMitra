import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthTokenPayload } from '@vyay/contracts';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthTokenPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
