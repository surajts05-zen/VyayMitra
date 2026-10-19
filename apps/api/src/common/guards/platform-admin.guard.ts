import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@vyay/contracts';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required to access platform administration');
    }

    if (user.role !== Role.PLATFORM_SUPER_ADMIN) {
      throw new ForbiddenException(
        `Access denied: Platform administration requires ${Role.PLATFORM_SUPER_ADMIN} role, caller has ${user.role}`
      );
    }

    return true;
  }
}
