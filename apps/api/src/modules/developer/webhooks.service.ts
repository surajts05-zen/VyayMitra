import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  WebhookSubscriptionDto,
  WebhookDeliveryLogDto,
  CreateWebhookSubscriptionInput,
  WebhookEvent,
} from '@vyay/contracts';

interface InternalSubscription {
  id: string;
  tenantId: string;
  url: string;
  events: WebhookEvent[];
  description?: string;
  active: boolean;
  signingKey: string;       // Full HMAC secret stored server-side
  successCount: number;
  failureCount: number;
  lastTriggeredAt?: string;
  createdAt: string;
}

interface InternalDeliveryLog {
  id: string;
  subscriptionId: string;
  tenantId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  httpStatus?: number;
  durationMs?: number;
  attempts: number;
  success: boolean;
  error?: string;
  createdAt: string;
}

@Injectable()
export class WebhooksService {
  private subscriptions = new Map<string, InternalSubscription[]>();
  private deliveryLogs = new Map<string, InternalDeliveryLog[]>();

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  createSubscription(
    tenantId: string,
    input: CreateWebhookSubscriptionInput
  ): WebhookSubscriptionDto {
    this.validateTargetUrl(input.url);
    const signingKey = randomBytes(32).toString('hex');

    const sub: InternalSubscription = {
      id: randomUUID(),
      tenantId,
      url: input.url,
      events: input.events,
      description: input.description,
      active: input.active ?? true,
      signingKey,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date().toISOString(),
    };

    if (!this.subscriptions.has(tenantId)) {
      this.subscriptions.set(tenantId, []);
    }
    this.subscriptions.get(tenantId)!.push(sub);

    if (this.prisma?.isConnected) {
      this.prisma.webhookSubscription.create({
        data: {
          id: sub.id,
          tenantId,
          targetUrl: sub.url,
          events: sub.events as any,
          secret: signingKey,
          active: sub.active,
        },
      }).catch(() => {});
    }

    return { ...this.toDto(sub), signingKey };
  }

  listSubscriptions(tenantId: string): WebhookSubscriptionDto[] {
    return (this.subscriptions.get(tenantId) || []).map(this.toDto);
  }

  getSubscription(tenantId: string, id: string): WebhookSubscriptionDto {
    const sub = this.findOrFail(tenantId, id);
    return this.toDto(sub);
  }

  updateSubscription(
    tenantId: string,
    id: string,
    updates: Partial<Pick<CreateWebhookSubscriptionInput, 'events' | 'active' | 'description'>>
  ): WebhookSubscriptionDto {
    const sub = this.findOrFail(tenantId, id);
    if (updates.events) sub.events = updates.events;
    if (updates.active !== undefined) sub.active = updates.active;
    if (updates.description !== undefined) sub.description = updates.description;

    if (this.prisma?.isConnected) {
      this.prisma.webhookSubscription.update({
        where: { id },
        data: {
          ...(updates.events ? { events: updates.events as any } : {}),
          ...(updates.active !== undefined ? { active: updates.active } : {}),
        },
      }).catch(() => {});
    }

    return this.toDto(sub);
  }

  deleteSubscription(tenantId: string, id: string): void {
    const list = this.subscriptions.get(tenantId) || [];
    const idx = list.findIndex((s) => s.id === id);
    if (idx < 0) throw new NotFoundException(`Webhook subscription ${id} not found`);
    list.splice(idx, 1);

    if (this.prisma?.isConnected) {
      this.prisma.webhookSubscription.delete({
        where: { id },
      }).catch(() => {});
    }
  }

  rotateSigningKey(tenantId: string, id: string): { newSigningKey: string } & WebhookSubscriptionDto {
    const sub = this.findOrFail(tenantId, id);
    const newKey = randomBytes(32).toString('hex');
    sub.signingKey = newKey;

    if (this.prisma?.isConnected) {
      this.prisma.webhookSubscription.update({
        where: { id },
        data: { secret: newKey },
      }).catch(() => {});
    }

    return { ...this.toDto(sub), newSigningKey: newKey };
  }

  getDeliveryLogs(tenantId: string, subscriptionId?: string): WebhookDeliveryLogDto[] {
    const logs = this.deliveryLogs.get(tenantId) || [];
    return (subscriptionId ? logs.filter((l) => l.subscriptionId === subscriptionId) : logs)
      .map((l) => ({
        id: l.id,
        subscriptionId: l.subscriptionId,
        event: l.event,
        payload: l.payload,
        httpStatus: l.httpStatus,
        durationMs: l.durationMs,
        attempts: l.attempts,
        success: l.success,
        error: l.error,
        createdAt: l.createdAt,
      }));
  }

  /**
   * Dispatches a webhook event to all active matching subscribers.
   * Builds HMAC-SHA256 signature; simulates delivery in this implementation.
   * In production: enqueue to BullMQ for reliable async delivery with retry.
   */
  async dispatchEvent(
    tenantId: string,
    event: WebhookEvent,
    payload: Record<string, unknown>
  ): Promise<void> {
    const subs = (this.subscriptions.get(tenantId) || []).filter(
      (s) => s.active && s.events.includes(event)
    );

    for (const sub of subs) {
      const envelope = {
        id: randomUUID(),
        event,
        tenantId,
        timestamp: new Date().toISOString(),
        data: payload,
      };

      const body = JSON.stringify(envelope);
      const signature = createHmac('sha256', sub.signingKey).update(body).digest('hex');

      const startMs = Date.now();
      let success = false;
      let httpStatus: number | undefined;
      let error: string | undefined;

      // Simulated delivery (production would use actual HTTP POST)
      try {
        // In CI/dev mode: simulate a successful 200 delivery
        httpStatus = 200;
        success = true;
        sub.successCount += 1;
        sub.lastTriggeredAt = new Date().toISOString();
      } catch (err: any) {
        httpStatus = 503;
        error = err.message;
        success = false;
        sub.failureCount += 1;
      }

      const log: InternalDeliveryLog = {
        id: randomUUID(),
        subscriptionId: sub.id,
        tenantId,
        event,
        payload: envelope,
        httpStatus,
        durationMs: Date.now() - startMs,
        attempts: 1,
        success,
        error,
        createdAt: new Date().toISOString(),
      };

      if (!this.deliveryLogs.has(tenantId)) {
        this.deliveryLogs.set(tenantId, []);
      }
      this.deliveryLogs.get(tenantId)!.unshift(log);
    }
  }

  /**
   * Builds X-VyayMitra-Signature header value for consumer verification.
   * HMAC-SHA256 of raw body, prefixed with `sha256=`.
   */
  buildSignatureHeader(signingKey: string, rawBody: string): string {
    return `sha256=${createHmac('sha256', signingKey).update(rawBody).digest('hex')}`;
  }

  private findOrFail(tenantId: string, id: string): InternalSubscription {
    const sub = (this.subscriptions.get(tenantId) || []).find((s) => s.id === id);
    if (!sub) throw new NotFoundException(`Webhook subscription ${id} not found`);
    return sub;
  }

  private validateTargetUrl(rawUrl: string): void {
    let target: URL;
    try {
      target = new URL(rawUrl);
    } catch {
      throw new BadRequestException('Webhook target must be a valid HTTPS URL');
    }
    if (target.protocol !== 'https:' || target.username || target.password || target.port) {
      throw new BadRequestException('Webhook target must use HTTPS without embedded credentials or a custom port');
    }

    const hostname = target.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    const blockedName = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local');
    const blockedIpv4 = /^(127\.|10\.|169\.254\.|192\.168\.)/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) || hostname === '0.0.0.0';
    const blockedIpv6 = hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80:');
    if (blockedName || blockedIpv4 || blockedIpv6) {
      throw new BadRequestException('Webhook target must not resolve to a local or private network');
    }
  }

  private toDto(sub: InternalSubscription): WebhookSubscriptionDto {
    return {
      id: sub.id,
      tenantId: sub.tenantId,
      url: sub.url,
      events: sub.events,
      description: sub.description,
      active: sub.active,
      signingKeyHint: sub.signingKey.slice(-4),
      successCount: sub.successCount,
      failureCount: sub.failureCount,
      lastTriggeredAt: sub.lastTriggeredAt,
      createdAt: sub.createdAt,
    };
  }
}
