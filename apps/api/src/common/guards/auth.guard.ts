import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { ApiCredentialScope, Role } from '@vyay/contracts';
import { TokenService } from '../../modules/auth/token.service.js';
import { ApiCredentialsService } from '../../modules/developer/api-credentials.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    @Optional() private readonly apiCredentialsService?: ApiCredentialsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'];
    const authHeader = request.headers.authorization;

    // 1. Check for X-API-Key header or Bearer vyay_...
    const candidateApiKey =
      typeof apiKeyHeader === 'string'
        ? apiKeyHeader
        : authHeader?.startsWith('Bearer vyay_')
        ? authHeader.substring(7)
        : null;

    if (candidateApiKey && this.apiCredentialsService) {
      const auth = this.apiCredentialsService.authenticateApiKey(candidateApiKey);
      this.authorizeApiKeyRequest(request.method, request.path, auth.scopes);
      const clientId = candidateApiKey.split('.')[0];
      request.user = {
        userId: `m2m_${clientId}`,
        tenantId: auth.tenantId,
        membershipId: `m2m_mem_${clientId}`,
        role: Role.COMPANY_ADMIN,
        email: `service-account@${auth.tenantId}.internal`,
        scopes: auth.scopes,
        authType: 'api_key',
      };
      return true;
    }

    // 2. Standard JWT Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7);
    const payload = this.tokenService.verifyAccessToken(token);
    request.user = payload;

    return true;
  }

  private authorizeApiKeyRequest(method: string, path: string, scopes: ApiCredentialScope[]): void {
    if (scopes.includes(ApiCredentialScope.ADMIN)) return;
    const write = !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
    let required: ApiCredentialScope | undefined;

    if (path.startsWith('/api/v1/expenses')) {
      required = write ? ApiCredentialScope.EXPENSES_WRITE : ApiCredentialScope.EXPENSES_READ;
    } else if (path.startsWith('/api/v1/reports')) {
      required = write ? ApiCredentialScope.REPORTS_WRITE : ApiCredentialScope.REPORTS_READ;
    } else if (path.startsWith('/api/v1/finance')) {
      required = write ? ApiCredentialScope.FINANCE_WRITE : ApiCredentialScope.FINANCE_READ;
    } else if (path.startsWith('/api/v1/analytics') && !write) {
      required = ApiCredentialScope.ANALYTICS_READ;
    } else if (path.startsWith('/api/v1/developer/webhooks')) {
      required = ApiCredentialScope.WEBHOOKS_MANAGE;
    }

    if (!required || !scopes.includes(required)) {
      throw new ForbiddenException(
        required ? `API credential requires scope ${required}` : 'API credential is not authorized for this route',
      );
    }
  }
}
