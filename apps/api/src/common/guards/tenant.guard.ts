import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenantId) {
      throw new UnauthorizedException('Unauthenticated or missing tenant context in credentials');
    }

    // Security invariant: Client cannot spoof another tenant by passing tenantId in headers or query
    const headerTenantId = request.headers['x-tenant-id'];
    if (headerTenantId && headerTenantId !== user.tenantId) {
      throw new ForbiddenException(
        'Cross-tenant violation: Client X-Tenant-ID header does not match authenticated membership'
      );
    }

    const queryTenantId = request.query?.tenantId;
    if (queryTenantId && queryTenantId !== user.tenantId) {
      throw new ForbiddenException(
        'Cross-tenant violation: Query parameter tenantId does not match authenticated membership'
      );
    }

    // Overwrite any tenantId on body to guarantee controller receives verified tenantId
    if (request.body && typeof request.body === 'object') {
      request.body.tenantId = user.tenantId;
    }

    return true;
  }
}
