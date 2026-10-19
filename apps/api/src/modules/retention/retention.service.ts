import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { loadRuntimeConfig } from '../../common/config/runtime-config.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const RETENTION_CONFIRMATION = 'REDACT_EXPIRED_OCR_PAYLOADS';

interface PreviewClaims {
  tenantId: string;
  cutoff: string;
  eligibleOcrPayloads: number;
  expiresAt: number;
}

@Injectable()
export class RetentionService {
  constructor(private readonly prisma: PrismaService) {}

  getPolicy() {
    const config = loadRuntimeConfig();
    return {
      mode: config.retention.executionEnabled ? 'preview_and_execute' : 'preview_only',
      ocrPayloadDays: config.retention.ocrPayloadDays,
      webhookDeliveryDays: config.retention.webhookDeliveryDays,
      outboxPayloadDays: config.retention.outboxPayloadDays,
      automatedDeletionEnabled: false,
      immutableExclusions: [
        'audit_events',
        'approval_steps',
        'approval_actions',
        'expense_reports:finalized',
        'reimbursements',
        'reimbursement_payments',
        'external_mappings',
        'integration_jobs:remote_reference',
      ],
    };
  }

  async preview(tenantId: string) {
    const config = loadRuntimeConfig();
    const cutoff = new Date(Date.now() - config.retention.ocrPayloadDays * 86_400_000);
    const eligibleOcrPayloads = await this.prisma.ocrJob.count({
      where: {
        createdAt: { lt: cutoff },
        reviewedAt: { not: null },
        structuredResult: { not: Prisma.DbNull },
        receipt: { expense: { tenantId } },
      },
    });
    const claims: PreviewClaims = {
      tenantId,
      cutoff: cutoff.toISOString(),
      eligibleOcrPayloads,
      expiresAt: Date.now() + 15 * 60_000,
    };

    return {
      generatedAt: new Date().toISOString(),
      cutoff: claims.cutoff,
      eligible: { reviewedOcrProviderPayloads: eligibleOcrPayloads },
      excluded: this.getPolicy().immutableExclusions,
      previewToken: this.signPreview(claims),
      executionEnabled: config.retention.executionEnabled,
    };
  }

  async execute(
    tenantId: string,
    actorId: string,
    input: { confirmation?: string; previewToken?: string },
  ) {
    const config = loadRuntimeConfig();
    if (!config.retention.executionEnabled) {
      throw new ForbiddenException('Retention execution is disabled; preview remains available');
    }
    if (input.confirmation !== RETENTION_CONFIRMATION || !input.previewToken) {
      throw new BadRequestException(`confirmation must equal ${RETENTION_CONFIRMATION} and include previewToken`);
    }

    const claims = this.verifyPreview(input.previewToken);
    if (claims.tenantId !== tenantId || claims.expiresAt < Date.now()) {
      throw new BadRequestException('Retention preview is expired or belongs to a different tenant');
    }
    const cutoff = new Date(claims.cutoff);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.ocrJob.updateMany({
        where: {
          createdAt: { lt: cutoff },
          reviewedAt: { not: null },
          structuredResult: { not: Prisma.DbNull },
          receipt: { expense: { tenantId } },
        },
        data: { structuredResult: Prisma.DbNull },
      });

      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId,
          action: 'retention.ocr_payloads_redacted',
          resourceType: 'retention_policy',
          resourceId: tenantId,
          reason: 'Tenant-authorized retention execution after preview',
          diff: {
            cutoff: claims.cutoff,
            previewedCount: claims.eligibleOcrPayloads,
            redactedCount: updated.count,
          },
        },
      });
      return updated.count;
    });

    return {
      completedAt: new Date().toISOString(),
      redacted: { reviewedOcrProviderPayloads: result },
      immutableFinancialRecordsDeleted: 0,
      auditRecorded: true,
    };
  }

  private previewSecret(): string {
    return process.env.RETENTION_SIGNING_SECRET || process.env.JWT_SECRET || 'development-retention-preview-secret';
  }

  private signPreview(claims: PreviewClaims): string {
    const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const signature = createHmac('sha256', this.previewSecret()).update(payload).digest('base64url');
    return `${payload}.${signature}`;
  }

  private verifyPreview(token: string): PreviewClaims {
    const [payload, signature, extra] = token.split('.');
    if (!payload || !signature || extra) throw new BadRequestException('Invalid retention preview token');
    const expected = createHmac('sha256', this.previewSecret()).update(payload).digest('base64url');
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
      throw new BadRequestException('Invalid retention preview token');
    }
    try {
      return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as PreviewClaims;
    } catch {
      throw new BadRequestException('Invalid retention preview token');
    }
  }
}

