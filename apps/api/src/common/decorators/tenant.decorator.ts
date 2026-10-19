import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user?.tenantId) {
      throw new UnauthorizedException('Tenant context missing from verified credentials');
    }
    return request.user.tenantId;
  }
);
