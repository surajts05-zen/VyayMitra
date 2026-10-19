# VyayMitra — Operations & Incident Runbooks

## 1. Local Development Setup (No Docker Required)

### Prerequisites
- Node.js 20+ (v24.x supported)
- pnpm 10+ (`npm install -g pnpm`)
- PostgreSQL 15+ (Local service or SQLite for offline testing)
- Redis 6+ (Optional in-memory queue fallback for local dev)

### Getting Started
```bash
# 1. Install dependencies across workspace
pnpm install

# 2. Configure environment
cp .env.example .env

# 3. Run database migrations
pnpm prisma migrate dev --name init

# 4. Seed database with synthetic demo data
pnpm db:seed

# 5. Start development servers
pnpm dev
```

## 2. Zoho Books Disconnect or Token Revocation Runbook
1. If Zoho Books returns `401 Unauthorized` repeatedly and token refresh fails with `invalid_grant`:
   - System marks `integrations.status = 'NEEDS_REAUTH'`.
   - All active posting jobs for that tenant transition from `SYNCING` to `BLOCKED`.
   - Alert is emitted to Tenant Finance Admin.
2. Resolution:
   - Finance Admin navigates to `/integrations/zoho-books`.
   - Clicks "Reconnect Zoho Books".
   - Re-completes OAuth consent.
   - Upon valid token exchange, pending `BLOCKED` jobs are re-queued to `QUEUED`.

## 3. Reconciliation for Lost Response (500 / Network Timeout)
1. When worker encounters timeout or 504 Gateway Timeout from Zoho Books:
   - Job is moved to `NEEDS_RECONCILIATION`.
   - Automated reconciliation worker executes `GET /expenses?custom_field=<idempotency_key>` or date range scan.
   - If record exists in Zoho Books: local record marked `SYNCED` with retrieved `external_id`.
   - If record does not exist: job transitioned back to `QUEUED` with fresh idempotency key.

## 4. Production Readiness and Observability

Required production settings:

- `NODE_ENV=production`
- `APP_URL` as a comma-separated HTTPS origin allowlist
- unique `JWT_SECRET` and `JWT_REFRESH_SECRET`, each at least 32 characters and not equal
- `DATABASE_URL` using TLS as required by the hosting provider
- `OBSERVABILITY_TOKEN` with at least 32 random characters
- `TRUST_PROXY` set only to the known proxy hop count

Probe endpoints:

- `GET /api/health/live` for process liveness.
- `GET /api/health/ready` for dependency readiness. Do not route traffic to an instance returning `503`.
- `GET /internal/metrics` with `Authorization: Bearer <OBSERVABILITY_TOKEN>` for Prometheus scraping.

Every response returns `X-Request-ID`. Use that identifier to correlate the structured request completion/error log. Never paste access tokens, API keys, receipt content, or full financial payloads into incident tickets.

## 5. Rate-Limit Incident

1. Confirm `429` volume and affected normalized routes in metrics; do not inspect or log tokens/body data.
2. Validate `TRUST_PROXY` before using forwarded client addresses. A wrong setting can collapse all clients into one bucket or permit spoofing.
3. For legitimate bursts, adjust `RATE_LIMIT_MAX` or `AUTH_RATE_LIMIT_MAX` through configuration and redeploy; do not disable the limiter.
4. If attack traffic persists, add an upstream WAF rule and preserve request IDs/timestamps for investigation.

## 6. PostgreSQL Backup and Restore Drill

The scripts require PostgreSQL client tools (`pg_dump`, `pg_restore`, and `psql`) on `PATH`.

```powershell
# Create a custom-format backup and SHA-256 manifest in a protected directory
./scripts/backup-postgres.ps1 -OutputDirectory D:\secure-backups\vyaymitra

# Restore only into a separate drill database; source and target URLs must differ
./scripts/restore-postgres.ps1 -BackupFile D:\secure-backups\vyaymitra\<file>.dump `
  -TargetDatabaseUrl $env:DATABASE_URL_RESTORE_TEST -ConfirmRestore

# Verify required schema and record counts after restore
./scripts/verify-restore.ps1 -TargetDatabaseUrl $env:DATABASE_URL_RESTORE_TEST
```

A drill passes only when checksum validation, restore, schema checks, tenant count, audit count, and financial-reference checks are recorded. Delete or archive drill databases according to the organization security policy after evidence is captured.

## 7. Retention Procedure

1. Retrieve the effective retention policy and run a tenant-scoped preview.
2. Review counts with a tenant owner and finance/audit owner.
3. Confirm that audit, approvals, finalized reports, reimbursements/payments, and accounting mappings/references are excluded.
4. Execute only with the documented confirmation and idempotency key.
5. Preserve the resulting audit event and monitor storage/object deletion failures separately.

## 8. Current Launch Blockers

Do not approve production launch while domain data is stored in process memory, receipt storage/malware scanning is simulated, browser E2E/a11y gates are absent, the restore drill is unobserved, or Zoho has not been verified against an authorized sandbox ledger.
