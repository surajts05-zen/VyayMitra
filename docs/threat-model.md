# VyayMitra — Threat Model & Security Controls

## 1. Multi-Tenant Security & Isolation
- **Tenant Context Extraction:** `tenant_id` is exclusively extracted from verified JWT/session claims bound to a validated `memberships` record. Client-supplied `tenant_id` in query parameters or payload bodies is unconditionally ignored.
- **Query Scoping:** Every Prisma query and database operation explicitly includes `WHERE tenant_id = :tenantId`.
- **Negative Testing:** Automated tests verify that Tenant A cannot read, mutate, upload to, or approve Tenant B entities even with valid, known UUIDs.

## 2. Segregation of Duties & Authorization Guardrails
- **Self-Approval Prevention:** The policy engine checks `report.employee_id !== approver.employee_id`. Self-approval attempts throw an immediate `403 Forbidden`.
- **Delegation Guardrails:** Delegations must be explicitly time-bounded (`starts_at`, `expires_at`), scoped, and recorded. Circular delegations and self-delegations are forbidden.
- **Separation of Approval & Reimbursement:** Approval permissions do not grant reimbursement execution rights. Finance operators cannot approve their own expense reports.

## 3. Financial Integrity & Precision
- **Decimal Precision:** All monetary amounts are stored as PostgreSQL `DECIMAL(20, 6)`. Floating-point types (`FLOAT`, `DOUBLE PRECISION`) are prohibited in schemas and DTOs.
- **Round-trip Currency Arithmetic:** Currency calculations use `decimal.js` with explicit rounding modes (`ROUND_HALF_UP`).
- **Immutability of Financial Records:** Reports in `FINALIZED` state and recorded `reimbursement_payments` are immutable. Corrections require formal credit/reversal adjustments.

## 4. Integration & Secret Security
- **OAuth Credentials Vault:** Zoho Books refresh tokens are stored encrypted at rest using AES-256-GCM. Decryption keys are stored in environment secrets or KMS, never in client code.
- **Egress & SSRF Protection:** Outbound webhook and API URLs are validated against private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`).
- **Signature Verification:** Outbound webhooks include `X-VyayMitra-Signature` computed using HMAC-SHA256 with timestamp replay protection.

## 5. File & Object Storage Security
- **Private Buckets:** S3 receipts bucket is private. Direct public access is disabled.
- **Presigned URLs:** Download URLs are generated with short expiration windows (15 minutes).
- **MIME & Magic Byte Verification:** Upload confirmation verifies magic bytes against allowed image and PDF formats (`image/jpeg`, `image/png`, `application/pdf`).

## 6. M7 Runtime Hardening

- **Fail-closed secrets:** Production startup rejects absent, short, or known development JWT secrets. Observability endpoints are disabled unless a separate token is configured.
- **Request smuggling and injection surface:** JSON and URL-encoded bodies are size-limited, unknown DTO properties are rejected where Nest DTO metadata is available, request IDs accept only a conservative character set, and CORS accepts only an explicit origin allowlist.
- **Brute force and denial of service:** A bounded per-client sliding window limits requests, authentication routes use a stricter window, and stale buckets are swept. Reverse-proxy trust is opt-in so spoofed forwarding headers are not accepted accidentally.
- **Information disclosure:** Unexpected exceptions are logged with correlation metadata, while the client receives a generic `500` message. Logs never include authorization headers, API keys, request bodies, receipt contents, or OAuth credentials.
- **Browser protections:** Helmet CSP is enabled in production, frames are denied, MIME sniffing is disabled, referrer data is restricted, and web focus/keyboard behavior is included in automated contract checks.
- **Metrics cardinality and privacy:** Metrics use normalized route templates and status classes only. No tenant/user identity or unbounded raw URL is used as a label.

## 7. Retention, Backup, and Restore Threats

- Retention execution is tenant-scoped, privileged, explicit, and idempotent. Preview is required before execution.
- Audit, approval, reimbursement, payment, finalized report, and accounting-reference records are excluded from automated deletion.
- Backup files contain sensitive tenant finance data and must be encrypted by the deployment platform, access-controlled, and stored outside the primary database host.
- Backup success alone is insufficient. Restore into an isolated database, verify required tables plus tenant/audit counts, and record the drill result.
- Restore tooling refuses a source/target URL match and requires an explicit operator confirmation to reduce accidental overwrite risk.

## 8. Known Pre-Release Risks

The current domain services and developer-platform services contain in-memory stores and the Zoho implementation used by tests is simulated. These are useful local/test boundaries, not durable production controls. Production launch remains blocked until they are replaced with database-backed repositories and an authorized Zoho sandbox call is observed. M7 hardening does not waive that requirement.
