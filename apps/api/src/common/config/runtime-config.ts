const DEVELOPMENT_JWT_SECRETS = new Set([
  'vyaymitra-super-secret-jwt-key-minimum-32-chars-long',
  'vyaymitra-super-secret-refresh-key-minimum-32-chars',
  'change-me',
]);

export interface RuntimeConfig {
  nodeEnv: string;
  isProduction: boolean;
  port: number;
  allowedOrigins: string[];
  bodyLimit: string;
  trustProxy: number | false;
  rateLimit: { windowMs: number; max: number };
  authRateLimit: { windowMs: number; max: number };
  observabilityToken?: string;
  enableApiDocs: boolean;
  writeOpenApiFile: boolean;
  allowOfflineDatabase: boolean;
  retention: {
    ocrPayloadDays: number;
    webhookDeliveryDays: number;
    outboxPayloadDays: number;
    executionEnabled: boolean;
  };
}

function positiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function booleanValue(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Expected boolean value, received "${value}"`);
}

function parseOrigins(value: string | undefined): string[] {
  return (value || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function validateSecret(name: string, secret: string | undefined, production: boolean): void {
  if (!production) return;
  if (!secret || secret.length < 32 || DEVELOPMENT_JWT_SECRETS.has(secret)) {
    throw new Error(`${name} must be a unique production secret of at least 32 characters`);
  }
}

export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const allowedOrigins = parseOrigins(env.APP_URL);

  validateSecret('JWT_SECRET', env.JWT_SECRET, isProduction);
  validateSecret('JWT_REFRESH_SECRET', env.JWT_REFRESH_SECRET, isProduction);
  validateSecret('API_CREDENTIAL_PEPPER', env.API_CREDENTIAL_PEPPER, isProduction);

  if (isProduction && env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different in production');
  }
  if (isProduction && allowedOrigins.some((origin) => origin === '*' || !origin.startsWith('https://'))) {
    throw new Error('APP_URL must contain explicit HTTPS origins in production');
  }

  const observabilityToken = env.OBSERVABILITY_TOKEN?.trim() || undefined;
  if (isProduction && (!observabilityToken || observabilityToken.length < 32)) {
    throw new Error('OBSERVABILITY_TOKEN must be configured with at least 32 characters in production');
  }
  if (isProduction && !env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production');
  }

  const trustProxyValue = env.TRUST_PROXY?.trim();
  const trustProxy = trustProxyValue
    ? positiveInteger(trustProxyValue, 1, 'TRUST_PROXY')
    : false;

  return {
    nodeEnv,
    isProduction,
    port: positiveInteger(env.PORT, 3000, 'PORT'),
    allowedOrigins,
    bodyLimit: env.REQUEST_BODY_LIMIT || '1mb',
    trustProxy,
    rateLimit: {
      windowMs: positiveInteger(env.RATE_LIMIT_WINDOW_MS, 60_000, 'RATE_LIMIT_WINDOW_MS'),
      max: positiveInteger(env.RATE_LIMIT_MAX, 300, 'RATE_LIMIT_MAX'),
    },
    authRateLimit: {
      windowMs: positiveInteger(env.AUTH_RATE_LIMIT_WINDOW_MS, 60_000, 'AUTH_RATE_LIMIT_WINDOW_MS'),
      max: positiveInteger(env.AUTH_RATE_LIMIT_MAX, 20, 'AUTH_RATE_LIMIT_MAX'),
    },
    observabilityToken,
    enableApiDocs: booleanValue(env.ENABLE_API_DOCS, !isProduction),
    writeOpenApiFile: booleanValue(env.WRITE_OPENAPI_FILE, !isProduction),
    allowOfflineDatabase: booleanValue(env.ALLOW_OFFLINE_DATABASE, !isProduction),
    retention: {
      ocrPayloadDays: positiveInteger(env.RETENTION_OCR_PAYLOAD_DAYS, 30, 'RETENTION_OCR_PAYLOAD_DAYS'),
      webhookDeliveryDays: positiveInteger(env.RETENTION_WEBHOOK_DELIVERY_DAYS, 90, 'RETENTION_WEBHOOK_DELIVERY_DAYS'),
      outboxPayloadDays: positiveInteger(env.RETENTION_OUTBOX_PAYLOAD_DAYS, 30, 'RETENTION_OUTBOX_PAYLOAD_DAYS'),
      executionEnabled: booleanValue(env.ENABLE_RETENTION_EXECUTION, false),
    },
  };
}
