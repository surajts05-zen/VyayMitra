import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@vyay/contracts';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: User does not possess a verified role in this tenant');
    }

    // Platform Super Admin must NOT bypass tenant authorization by default
    if (user.role === Role.PLATFORM_SUPER_ADMIN && !requiredRoles.includes(Role.PLATFORM_SUPER_ADMIN)) {
      throw new ForbiddenException(
        'Platform Super Admin is restricted from accessing tenant expense records without explicit delegated authority'
      );
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Required one of [${requiredRoles.join(', ')}], user possesses [${user.role}]`
      );
    }

    return true;
  }
}
