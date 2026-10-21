import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  RegisterUserSchema,
  RegisterUserInput,
  LoginRequestSchema,
  LoginRequest,
  RefreshTokenRequestSchema,
  RefreshTokenRequest,
  InviteMemberSchema,
  InviteMemberInput,
  AcceptInviteSchema,
  AcceptInviteInput,
  Role,
  AuthTokenPayload,
  GoogleSsoRequestSchema,
  GoogleSsoRequest,
  ZohoSsoRequestSchema,
  ZohoSsoRequest,
} from '@vyay/contracts';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { TenantId } from '../../common/decorators/tenant.decorator.js';

@ApiTags('Auth & Identity')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user and company tenant' })
  @ApiResponse({ status: 201, description: 'User and tenant registered successfully' })
  async register(@Body() body: RegisterUserInput) {
    const validated = RegisterUserSchema.parse(body);
    return this.authService.register(validated);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({ status: 200, description: 'Authentication successful with tokens' })
  async login(@Body() body: LoginRequest) {
    const validated = LoginRequestSchema.parse(body);
    return this.authService.login(validated);
  }

  @Post('sso/google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate or provision user via Google SSO' })
  @ApiResponse({ status: 200, description: 'Google SSO authentication successful with tokens' })
  async loginGoogle(@Body() body: GoogleSsoRequest) {
    const validated = GoogleSsoRequestSchema.parse(body);
    return this.authService.loginGoogle(validated);
  }

  @Post('sso/zoho')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate or provision user via Zoho SSO' })
  @ApiResponse({ status: 200, description: 'Zoho SSO authentication successful with tokens' })
  async loginZoho(@Body() body: ZohoSsoRequest) {
    const validated = ZohoSsoRequestSchema.parse(body);
    return this.authService.loginZoho(validated);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh expired access token with valid refresh token' })
  @ApiResponse({ status: 200, description: 'Access token refreshed successfully' })
  async refreshToken(@Body() body: RefreshTokenRequest) {
    const validated = RefreshTokenRequestSchema.parse(body);
    return this.authService.refreshToken(validated.refreshToken);
  }

  @Post('invitations')
  @UseGuards(AuthGuard, TenantGuard, RolesGuard)
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Invite a new team member to the organization' })
  @ApiResponse({ status: 201, description: 'Invitation created' })
  async invite(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthTokenPayload,
    @Body() body: InviteMemberInput
  ) {
    const validated = InviteMemberSchema.parse(body);
    return this.authService.inviteMember(tenantId, user.role, validated);
  }

  @Post('accept-invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept invitation token to join organization' })
  @ApiResponse({ status: 200, description: 'Invitation accepted and account provisioned' })
  async acceptInvite(@Body() body: AcceptInviteInput) {
    const validated = AcceptInviteSchema.parse(body);
    return this.authService.acceptInvite(validated);
  }

  @Delete('memberships/:id')
  @UseGuards(AuthGuard, TenantGuard, RolesGuard)
  @Roles(Role.COMPANY_OWNER, Role.COMPANY_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revoke organization membership and revoke user session' })
  @ApiResponse({ status: 200, description: 'Membership and session revoked' })
  async removeMembership(
    @TenantId() tenantId: string,
    @Param('id') membershipId: string,
    @CurrentUser() user: AuthTokenPayload
  ) {
    return this.authService.removeMembership(tenantId, membershipId, user.role);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile and session identity' })
  @ApiResponse({ status: 200, description: 'Current authenticated identity' })
  async getMe(@CurrentUser() user: AuthTokenPayload) {
    const dbUser = this.authService.getUser(user.userId);
    const tenant = this.authService.getTenant(user.tenantId);
    return {
      userId: user.userId,
      email: user.email,
      firstName: dbUser?.firstName || 'User',
      lastName: dbUser?.lastName || '',
      role: user.role,
      tenant: {
        id: tenant?.id || user.tenantId,
        name: tenant?.name || 'Organization',
        slug: tenant?.slug || '',
      },
    };
  }

  @Post('purge-sample-data')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Purge tenant sample expenses and reports to start clean' })
  @ApiResponse({ status: 200, description: 'Sample data purged' })
  async purgeSampleData(@CurrentUser() user: AuthTokenPayload) {
    return this.authService.purgeSampleData(user.tenantId);
  }
}
