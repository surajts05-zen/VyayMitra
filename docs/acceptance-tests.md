# VyayMitra — Acceptance Test Matrix & Gates

## Milestone Acceptance Gates

| Milestone | Gate Description | Verification Command / Method |
|---|---|---|
| **M0** | Architecture, shared tokens, runnable monorepo, API health 200, test harness | `pnpm test` & `pnpm --filter @vyay/api test` |
| **M1** | Multi-tenant auth, role matrix, employee directory, negative cross-tenant tests | `pnpm test:security` & `pnpm test:tenancy` |
| **M2** | Expense CRUD, receipt presign/upload, OCR adapter, duplicate detection, decimal math | `pnpm test:expenses` |
| **M3** | Report state machine, policy evaluation, multi-stage approval, delegation, self-approval block | `pnpm test:approvals` |
| **M4** | Finance review queue, partial reimbursement tracking, tax metadata, budget check | `pnpm test:finance` |
| **M5** | Zoho Books OAuth, reference mapping, dry-run preview, outbox worker, 429/timeout handling | `pnpm test:zoho` |
| **M6** | OpenAPI 3.1 documentation drift test, HMAC outbound webhooks, CSV/XLSX export | `pnpm test:api` & `pnpm test:webhooks` |
| **M7** | Runtime hardening, production config validation, rate limiting, safe errors, dependency readiness, protected metrics, retention preview, responsive/keyboard UX, backup/restore tooling | `npm test`, package typechecks, `npm run build`, `npm run test:m7`; Playwright, Lighthouse, and a witnessed restore remain release gates |

## Invariant Test Checklist
- [ ] Tenant A cannot fetch or mutate Tenant B records even if UUID is leaked.
- [ ] Swapping `tenant_id` in request body or headers does not override token tenant context.
- [ ] Approver cannot approve their own expense report.
- [ ] Finalized report total matches sum of expense lines with zero floating point inaccuracy.
- [ ] Sum of partial reimbursement payments cannot exceed total eligible amount.
- [ ] Marking report as `FINALIZED` or `APPROVED` does NOT mark reimbursement as `PAID`.
- [ ] Zoho Books 429 rate limit triggers exponential backoff adhering to `Retry-After`.
- [ ] Zoho Books network timeout marks entry `NEEDS_RECONCILIATION` and prevents duplicate ledger insert.

## M7 Automated Checks

- [ ] Production configuration rejects default/missing JWT secrets and wildcard/missing CORS origins.
- [ ] Request IDs are sanitized, stable across headers/envelopes/log metadata, and never generated from predictable timestamps.
- [ ] Unexpected exceptions return a generic message without stack trace, SQL details, token data, or internal exception text.
- [ ] Authentication requests are rate limited more strictly than ordinary API requests and return `429` with `Retry-After`.
- [ ] `/api/health/live` remains process-only; `/api/health/ready` reports database failure and returns `503` in production.
- [ ] `/internal/metrics` is unavailable without a configured token and rejects an invalid token in constant time.
- [ ] Metrics do not label tenant IDs, user IDs, receipt IDs, request bodies, authorization values, or raw query strings.
- [ ] Retention is preview-first and excludes immutable financial and audit records.
- [ ] Web shell has a skip link, labelled navigation controls, visible focus, persistent theme preference, and a usable mobile navigation surface.
- [ ] Production web build emits route-level chunks; the initial application chunk stays within the documented budget.
- [ ] Backup creates a checksum manifest; restore refuses the source database and requires explicit confirmation.

## Manual Launch Gates

- [ ] Playwright covers employee capture/submit, independent manager approval, finance finalization, partial/full reimbursement, and mock/sandbox export recovery at desktop and mobile widths.
- [ ] Axe/keyboard/screen-reader checks and Lighthouse meet the agreed WCAG 2.2 AA/performance budgets on production builds.
- [ ] A backup is restored into an isolated PostgreSQL database and tenant, audit, approval, reimbursement, and external-reference counts are verified.
- [ ] The application is tested with durable PostgreSQL/object storage/queue infrastructure; no in-memory domain repository is used in production.
- [ ] Authorized Zoho sandbox posting is observed and reconciled. CI mock success is not accepted as live-provider evidence.
