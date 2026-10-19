import { Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '@vyay/contracts';
import { randomUUID } from 'node:crypto';

const TOKEN_ISSUER = 'vyaymitra-api';
const TOKEN_AUDIENCE = 'vyaymitra-web';

@Injectable()
export class TokenService {
  private readonly jwtSecret: string =
    process.env.JWT_SECRET || 'vyaymitra-super-secret-jwt-key-minimum-32-chars-long';
  private readonly jwtRefreshSecret: string =
    process.env.JWT_REFRESH_SECRET || 'vyaymitra-super-secret-refresh-key-minimum-32-chars';

  // Revocation map: revoked session/membership IDs and user password reset times
  private revokedSessionIds = new Set<string>();
  private userPasswordResetTimes = new Map<string, number>();

  generateTokens(payload: AuthTokenPayload): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: '15m',
      algorithm: 'HS256',
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      jwtid: randomUUID(),
    });
    const refreshToken = jwt.sign(
      { userId: payload.userId, tenantId: payload.tenantId, membershipId: payload.membershipId },
      this.jwtRefreshSecret,
      {
        expiresIn: '7d',
        algorithm: 'HS256',
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
        jwtid: randomUUID(),
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  verifyAccessToken(token: string): AuthTokenPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
      }) as AuthTokenPayload & { iat?: number };
      if (this.revokedSessionIds.has(decoded.membershipId)) {
        throw new UnauthorizedException('Membership or session has been revoked');
      }
      const resetTime = this.userPasswordResetTimes.get(decoded.userId);
      if (resetTime && decoded.iat && decoded.iat * 1000 <= resetTime) {
        throw new UnauthorizedException('Session invalidated due to password reset. Please log in again.');
      }
      return decoded;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string): { userId: string; tenantId: string; membershipId: string } {
    try {
      const decoded = jwt.verify(token, this.jwtRefreshSecret, {
        algorithms: ['HS256'],
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
      }) as any;
      if (this.revokedSessionIds.has(decoded.membershipId)) {
        throw new UnauthorizedException('Membership or session has been revoked');
      }
      return {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        membershipId: decoded.membershipId,
      };
    } catch (err: any) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  revokeMembership(membershipId: string): void {
    this.revokedSessionIds.add(membershipId);
  }

  revokeUserSessions(userId: string): void {
    this.userPasswordResetTimes.set(userId, Date.now());
  }

  isMembershipRevoked(membershipId: string): boolean {
    return this.revokedSessionIds.has(membershipId);
  }
}
