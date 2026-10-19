import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  ApiCredentialDto,
  ApiCredentialCreatedDto,
  CreateApiCredentialInput,
  ApiCredentialScope,
} from '@vyay/contracts';

interface InternalApiCredential {
  id: string;
  tenantId: string;
  name: string;
  clientId: string;
  clientSecretHash: string;  // bcrypt or SHA-256 of secret (stored, never returned)
  scopes: ApiCredentialScope[];
  description?: string;
  lastUsedAt?: string;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

@Injectable()
export class ApiCredentialsService {
  private store = new Map<string, InternalApiCredential[]>();

  private hashSecret(rawSecret: string): string {
    const pepper = process.env.API_CREDENTIAL_PEPPER || process.env.JWT_SECRET || 'development-api-key-pepper';
    return createHmac('sha256', pepper).update(rawSecret).digest('hex');
  }

  createCredential(
    tenantId: string,
    input: CreateApiCredentialInput
  ): ApiCredentialCreatedDto {
    const clientId = `vyay_${randomBytes(10).toString('hex')}`;
    const rawSecret = randomBytes(32).toString('hex');
    const secretHash = this.hashSecret(rawSecret);

    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString()
      : undefined;

    const credential: InternalApiCredential = {
      id: randomUUID(),
      tenantId,
      name: input.name,
      clientId,
      clientSecretHash: secretHash,
      scopes: input.scopes,
      description: input.description,
      expiresAt,
      active: true,
      createdAt: new Date().toISOString(),
    };

    if (!this.store.has(tenantId)) {
      this.store.set(tenantId, []);
    }
    this.store.get(tenantId)!.push(credential);

    return {
      id: credential.id,
      tenantId,
      name: credential.name,
      clientId: credential.clientId,
      clientSecret: `${clientId}.${rawSecret}`,  // shown only once
      scopes: credential.scopes,
      description: credential.description,
      expiresAt: credential.expiresAt,
      createdAt: credential.createdAt,
    };
  }

  listCredentials(tenantId: string): ApiCredentialDto[] {
    return (this.store.get(tenantId) || []).map((c) => ({
      id: c.id,
      tenantId: c.tenantId,
      name: c.name,
      clientId: c.clientId,
      scopes: c.scopes,
      description: c.description,
      lastUsedAt: c.lastUsedAt,
      expiresAt: c.expiresAt,
      createdAt: c.createdAt,
    }));
  }

  revokeCredential(tenantId: string, credentialId: string): void {
    const list = this.store.get(tenantId) || [];
    const idx = list.findIndex((c) => c.id === credentialId);
    if (idx < 0) {
      throw new NotFoundException(`API credential ${credentialId} not found`);
    }
    list.splice(idx, 1);
    this.store.set(tenantId, list);
  }

  /**
   * Authenticates a machine-to-machine API key in format: `clientId.rawSecret`
   * Returns the credential's tenantId and scopes on success.
   */
  authenticateApiKey(
    apiKey: string
  ): { tenantId: string; scopes: ApiCredentialScope[] } {
    const dotIdx = apiKey.lastIndexOf('.');
    if (dotIdx < 0) {
      throw new UnauthorizedException('Invalid API key format');
    }
    const clientId = apiKey.substring(0, dotIdx);
    const rawSecret = apiKey.substring(dotIdx + 1);
    const computedHash = this.hashSecret(rawSecret);

    for (const [tenantId, list] of this.store.entries()) {
      const cred = list.find((c) => c.clientId === clientId && c.active);
      if (!cred) continue;

      if (cred.expiresAt && new Date(cred.expiresAt) < new Date()) {
        throw new UnauthorizedException('API key has expired');
      }
      const storedBuffer = Buffer.from(cred.clientSecretHash);
      const computedBuffer = Buffer.from(computedHash);
      if (
        storedBuffer.length !== computedBuffer.length ||
        !timingSafeEqual(storedBuffer, computedBuffer)
      ) {
        throw new UnauthorizedException('Invalid API key');
      }

      // Mark last used
      cred.lastUsedAt = new Date().toISOString();
      return { tenantId, scopes: cred.scopes };
    }

    throw new UnauthorizedException('API key not found or revoked');
  }
}
