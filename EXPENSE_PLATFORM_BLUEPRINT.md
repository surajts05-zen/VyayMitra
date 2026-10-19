# Expense Management Platform — Product and Engineering Blueprint

**Status:** Implementation-ready baseline specification · **Version:** 1.0 · **Prepared:** 18 October 2026  
**Working product title:** Expense Management (do not hard-code a new commercial brand; keep product name/logo configurable).  
**Family:** Companion product to KaaryaMitra and PravesMitra, independently deployable and sellable.  
**Reference:** Comparable workflow coverage to Zoho Expense, **not** a pixel or brand copy.

## 0. Product boundaries and non-negotiables

Build a multi-tenant, API-first SaaS for expense capture, reports, approvals, budgets, reimbursements, accounting synchronization, and audit. The product should work standalone. Integration with the KaaryaMitra/PravesMitra suite is optional, through APIs/SSO/employee sync rather than direct database coupling. India-first defaults (INR, Indian fiscal year, GST-relevant metadata), but localization-ready.

**Do not:** implement all modules as UI-only mockups; assume Zoho Books' `/expenses` endpoint equals a complete reimbursement workflow; equate approved with paid; automatically execute bank payments; allow cross-tenant access; treat OCR output as verified; store OAuth refresh tokens in browsers; import a generic OpenAPI specification and assume business mappings work automatically; create duplicate accounting entries after retries.

**MVP scope:** multi-tenant identity, employees, master data, manual expenses, receipt upload, receipt extraction with verification, reports and rules, multi-stage approval, finance review, reimbursement register, budget tracking, analytics, CSV/XLSX exports, live Zoho Books connector, outbound versioned REST APIs/OpenAPI docs/webhooks, audit.

**Later scope:** corporate card feeds, bank payment initiation, travel booking, advanced corporate travel, mileage GPS, expense-email parsing, tax reclaim automation, additional native accounting connectors, subscription billing, native mobile apps, sophisticated ML/fraud detection.

## 1. Personas and roles

| Persona | Expected workflow / permissions |
|---|---|
| Platform Super Admin | Tenant plans, usage, account health and support-access workflow (no unrestricted access to tenant expense data) |
| Tenant Owner / Company Admin | Organization settings, memberships, employee directory, policies, integrations, branding, roles |
| Employee | Own receipts, expenses, expense reports, reimbursements, advances, own status |
| Manager / Approver | Own pending approval queue; approve, reject or request changes as dictated by the workflow |
| Finance Operator | Audit approved submissions, account/tax mappings, posting queue, partial/full reimbursement tracking, reconciliation |
| Finance Admin | Finance policies, bank payout authorization if enabled later, external accounting settings |
| Auditor / Read Only | Scoped finance records and append-only event history; no edit |
| Delegated Approver | Temporarily approves a specific scope within an effective date range; cannot self-approve |

Implement per-tenant RBAC *and* resource/ownership checks. Delegations are time-bounded, logged, and never override segregation-of-duties rules.

## 2. Principal user journeys

### Employee journey
1. Sign in, select tenant, see My Dashboard with draft expenses, submitted reports, reimbursements and actions.
2. Create expense by receipt upload/camera capture or manual entry. Allow multiple receipt images/PDF pages per expense.
3. OCR suggests vendor, invoice number/date, currency, amount, tax, GSTIN when detected, category. Every suggestion has provenance and confidence, and **user reviews before submission**.
4. Choose category, project, cost center, location, business purpose, reimbursable/non-reimbursable, personal/company card, billable flag, allocations, optional attendees and tax fields.
5. Add expenses to an expense report, submit; show violated policies and route for approvals.
6. Respond to changes-requested, follow approval progress; view reimbursement state separately from approval.

### Manager journey
1. See Pending Approvals queue with expense report, employee, amount, number of attachments, risk and policy flags.
2. Open complete receipt and side-by-side extracted expense data; comment, request changes, approve, reject, delegate if policy permits.
3. Escalations and substitutes are rule-driven; never approve own report unless explicit owner override (disabled by default, logged and separately authorized).

### Finance journey
1. See Approved for Review queue and compliance flags.
2. Validate documentation, cost centers, taxes, account mapping and payment source; assign external export method.
3. Post only an explicitly finalized accounting batch, show per-item posted/failed/pending states.
4. Schedule and register reimbursements (manual payout first), capture transaction reference and timestamp; support partial payments and reconciliation.
5. Audit sync errors and retry safely; review reports and end-of-month export.

### Tenant onboarding
1. Create company with name, logo, base currency, country, timezone, financial year, departments and invite employees.
2. Configure categories, policies, custom fields, reporting hierarchy, finance admins and spending budgets.
3. Optionally connect Zoho Books via OAuth, select appropriate Zoho organization, map accounts/taxes/projects/vendors.
4. Run one non-posting connection validation, one dry-run mapping preview, then an explicitly confirmed test export.

## 3. Functional modules — detailed scope and release priority

### A. Identity, tenants and suite-ready SSO [P0]
- Multi-tenant tenant registry, domains, users, memberships, role assignments, invitations, Google OIDC and secure email login/verification.
- Optional SAML/OIDC enterprise SSO later. Build stable external_identity mappings for suite users; do not share databases.
- Owner/company branding: product mark alongside tenant/company mark; separate internal product identity from tenant brand. Light and dark modes; responsive.
- Session revocation, 2FA for finance/admin, recovery, optional IP-based admin guardrails, tenant isolation.

### B. Master data and org hierarchy [P0]
- Employees, managers, departments, branches, cost centers, projects, tags, expenses categories, tax templates, currencies and account mappings.
- Bulk CSV import with preview, duplicate and validation checks. Soft deactivate employees; preserve finance history.
- HRM/KaaryaMitra employee directory sync via future adapter; event-based upsert and inactive state, never silently overwrite finance data.

### C. Expense capture [P0]
- Receipt uploads: PNG/JPEG/PDF; file type/MIME validation, size limits, antivirus scanning, object storage, signed expiring download URLs, thumbnails, SHA-256.
- Manual expense fields: spent date, merchant, amount, currency, category, tax info, reimbursable flag, paid by, description/purpose, cost center, project, attendees, employee, metadata.
- Multiple line items, multiple tax components, receipt versions, explicit amendments.
- Mileage/per-diem input as basic configurable entry types (advanced calculators later). Explicit source and calculation records.
- Duplicates: exact file hash and fuzzy merchant-date-currency-amount-invoice reference score. Warn plus manual review, do not blindly delete.
- OCR via provider interface; asynchronous queue, extraction confidence, review screen, page count, provider response metadata. Preserve original receipt.
- Expense email inbox and credit-card ingestion later.

### D. Reports / submissions [P0]
- Individual expenses may be drafted first then grouped into an expense report for submission; permit simplified one-expense instant report.
- Report fields: title, business purpose, reporting period, location/trip, employee, items, total and currency snapshot, status, submitted/reviewed timestamps.
- Maintain separate status machines:
  - Report: `DRAFT → SUBMITTED → IN_REVIEW → CHANGES_REQUESTED / REJECTED / APPROVED → FINANCE_REVIEW → FINALIZED → ARCHIVED`.
  - Reimbursement: `NOT_APPLICABLE / NOT_READY / ELIGIBLE → SCHEDULED → PARTIALLY_PAID → PAID` plus `ON_HOLD/CANCELLED` with authorization.
  - External posting: `NOT_QUEUED → QUEUED → SYNCING → SYNCED / RETRYABLE_FAILURE / BLOCKED / NEEDS_RECONCILIATION`.
- Use transactional service methods and explicit transition guards, not arbitrary status edits from the browser.
- Corrections to approved/finalized reports via correction or reversal entry; no destructive silent changes.

### E. Policies and approvals [P0]
- Deterministic, versioned policy evaluation: category ceiling, daily/monthly ceiling, max cash spend, missing receipt threshold, weekend/holiday warning, duplicate receipt, merchant blacklist, spend outside employee grade or project budget, late submission, per-diem allowance, mandatory field.
- Policy scope (global/company/department/location/grade/category) with rule priority, effective dates and allow exceptions only with logged rationale/authority.
- Approval routing: direct manager, department head, threshold escalation, finance review, optional parallel/sequential steps, acting approvers, delegation, out-of-office and timeout escalation.
- No self-approval, and do not allow one user to approve and finalize/reimburse the same record by default.
- Approval steps immutable with actor, rule version, decision, reason, timestamp.

### F. Budgets and spending controls [P1]
- Budget periods, category/project/department/cost center allocations; reserved/submitted/approved/actual vs available spend with clear definitions.
- Policy enforcement: warn/block/escalate configurable; never conflate approved with cash spent.
- Forecast from historical expenses, basic analytics. Spend requests/pre-approvals after core budgets work.

### G. Finance, reimbursements and reconciliation [P0]
- Reimbursement payable allocation per expense; non-reimbursable corporate-card lines excluded.
- Review queue, record manual payments with reference, account, date, partial payment, approval, reconciliation notes.
- Keep local history for bank transfer; don't perform money movement in MVP. Financial exports are not proofs of bank payout.
- Track advance balances and advance settlement in P1/P2; do not mark as paid via Zoho simply because exported.
- Implement financial decimal arithmetic (`Decimal`/NUMERIC), money stored at currency precision, tested round-tripping; never float.
- FX rate source, effective date, base amount, transaction amount and snapshot. Distinguish expense date from posting date.
- Tax metadata for Indian GST (GSTIN, CGST/SGST/IGST, intra/interstate, place/supply, HSN/SAC where relevant); keep GST/TDS calculations configurable and have accountants validate their rules rather than making universal statutory claims.

### H. Analytics / reporting [P1]
- Expense totals by merchant, category, employee, business unit, project, date, compliance flag, reimbursement ageing, paid vs unpaid, approver latency, unposted entries, budget utilization.
- Search, date range, financial year, multi-filtering, paginated API, CSV/XLSX exports, optional PDF after core.
- All reports scoped to tenant and authorized role; finance totals reconcile to transactions.

### I. Notifications and reminders [P1]
- In-app notifications, email, preference matrix; approval requests, changes-requested, ageing, reimbursement recorded, sync failure and expiring connections.
- Use event/outbox + background jobs; retry safely and dedupe notifications.

### J. Public developer platform [P1]
- Documented, versioned `/api/v1` REST API with OAuth client credentials for server-to-server integrations or tenant-scoped API tokens as applicable.
- OpenAPI 3.1 JSON/YAML, Swagger UI, typed generated SDKs, resource pagination, filters, idempotency keys on dangerous POST endpoints, webhooks and consumer docs.
- Webhook events: `expense.created`, `expense.updated`, `report.submitted`, `report.approved`, `report.rejected`, `reimbursement.recorded`, `accounting.sync_succeeded`, `accounting.sync_failed`.
- HMAC-SHA256 signed webhooks, timestamp freshness, delivery IDs, retries and replay UI.
- Expose least-privilege read/write scopes for external consumers.

### K. Subscription and tenant lifecycle [P2]
- Entitlements, seats, usage metering, plans, trials, billing lifecycle, support delegation with approval, tenant archival/data export/deletion requests.

## 4. Design system — KaaryaMitra/PravesMitra companion

Maintain **one family feeling without identical logos**. Shared direction: professional Gen-Z SaaS, uncluttered, trustworthy, responsive, precise typography, restrained motion; blend polished HRM functionality with PravesMitra's approachable gesture of forward progress.

**Design system (proposed adjustable tokens, not claimed to be existing product tokens):**
- Fonts: Inter or Geist UI, slightly more expressive display type where appropriate.
- Light backgrounds `#F7F9FB`, surface `#FFFFFF`, primary ink `#142333`, muted ink `#607184`, border `#E5EAF0`.
- Family accents: emerald `#008C69`, lively lime `#B7F500`, supporting blue `#2563EB`; blue for links/info, green for primary approval/action, lime only for restrained highlights. Do not let every card use saturated accents.
- Dark theme: background `#0D141A`, surface `#151F27`, ink `#EDF4F7`, subtle borders `#2D3942`.
- Status colors semantic only (approved, pending, declined, failed); meaningful labels with shape/text, never color alone.
- 12–14px control rounding, 12/16/24px grid rhythm, high-density finance tables with generous scanability; keyboard shortcuts, accessible focus and 44px mobile targets.
- Side navigation desktop, adaptive bottom actions/compact navigation mobile, persistent search/filter context, dense finance data only where necessary.
- Dual identity: tenant logo, product logo, and a configurable future suite switcher.
- Use subtle PravesMitra-inspired directional movement for submission/progress, **do not recreate the PravesMitra logo or KaaryaMitra's KM symbol**.

**Screen map:** Login/Signup; Tenant chooser and onboarding; Employee dashboard; My expenses; New expense; Receipt review; My reports; Report detail and submission; Approver inbox/detail; Finance review; Reimbursements; Finance batch export; Budget overview; Reports/analytics; Departments/People; Policies; Approval builder; Accounting integrations and mapping; Integration logs; Public API credentials/webhooks; Branding/settings; Platform super-admin console.

**Priority UI flows to perfect:**
1. Employee: scan receipt → review OCR → add missing fields → add to report → submit, within a small number of steps.
2. Manager: approval queue → see reason, receipt, policy → act with a comment.
3. Finance: finalized queue → map to Zoho → preview ledger effects → export → view success/exception → record reimbursement.

**Accessibility:** WCAG 2.2 AA target, valid heading structure, keyboard-only use, field errors inline, mobile camera flow optional and gracefully handled, screen reader labels and dark/light contrast tested.

## 5. Architecture

### Repository layout
```text
expense-platform/
  apps/
    web/                   # React + Vite + TS + Tailwind + shadcn
    api/                   # NestJS modular monolith
    worker/                # BullMQ processors; shares domain packages
  packages/
    ui/                    # family component tokens, storybook optional
    contracts/             # Zod schemas, DTOs, enums, OpenAPI types
    integrations/          # connector interfaces and adapters
    config/
    eslint-config/
  prisma/
    schema.prisma
    migrations/
    seed.ts
  docs/
    product.md
    architecture.md
    api.md
    threat-model.md
    provider-mapping.md
    runbooks.md
    acceptance-tests.md
  .env.example
  README.md
```

### Modules
`auth`, `tenants`, `memberships`, `users`, `employees`, `org-structure`, `categories`, `expenses`, `documents`, `ocr`, `expense-reports`, `policies`, `approval-workflows`, `budgets`, `finance`, `reimbursements`, `integrations`, `webhooks`, `notifications`, `analytics`, `audit`, `plans`.

**Boundary rule:** domain modules own data and expose services/events; the Zoho connector consumes finalized export events and does not change approval logic. Attachments and OCR are isolated services. No tenant data in the Super Admin API without audited, approved delegated access.

**Processing sequence:** Web/API → DB transaction → outbox event → BullMQ worker → external provider; response and reconciliation recorded in DB → UI refresh/notification. Consider PostgreSQL transactional outbox with an idempotent dispatcher rather than publishing to Redis inside an uncommitted DB transaction.

## 6. Proposed database design

All tenant-owned tables have `tenant_id`, UUID primary keys, `created_at`, `updated_at`; financial records have audit authors and appropriate status/version. Add composite foreign keys or DB-enforced tenant relationships where practical. Do not rely on frontend filters to scope data.

| Table | Key fields and constraints |
|---|---|
| `tenants` | id, slug unique, name, locale, timezone, country, base_currency, fiscal_year_start, status |
| `users` | id, email verified, identity details |
| `memberships` | id, tenant_id, user_id, role, active; unique tenant+user |
| `employees` | id, tenant_id, user_id nullable, employee_number, manager_id, department, active, external_hrm_id |
| `categories` | id, tenant_id, code unique within tenant, name, default_policy, account_mapping |
| `departments/projects/cost_centers` | tenant-specific hierarchy, active, code |
| `expenses` | id, tenant_id, employee_id, merchant, invoice_number, spent_at, currency, subtotal, tax, amount, base_amount, FX snapshot, category_id, paid_by, reimbursement_eligible, status, report_id nullable, version |
| `expense_lines` | expense_id, amount, description, tax components, cost center/project, split/allocation info |
| `receipts` | id, expense_id, storage_key, size, hash, MIME, scan_result, uploaded_by, attachment_version |
| `ocr_jobs` | id, receipt_id, status, provider, structured_result, confidence, reviewed_at/by |
| `expense_reports` | id, tenant_id, employee_id, title, period, status, totals_snapshot, submitted_at, finalized_at, version |
| `policy_versions` | tenant_id, scope, effective_range, priority, JSON rules validated against schema, version |
| `policy_evaluations` | expense/report, policy_version, decisions, violations, exceptions |
| `approval_flows/steps/actions` | rule snapshot, sequence, approver, delegated actor, result, reason, timestamp |
| `budgets` | tenant, dimension, period, currency, limit, approved/reserved/actual totals computed rather than writable drift |
| `reimbursements` | id, report/expense, employee, eligible_amount, paid_amount, status, beneficiary metadata reference |
| `reimbursement_payments` | reimbursement_id, amount, date, method, transaction_ref unique within tenant+source, recorded_by, evidence |
| `integrations` | tenant, provider, region, external_org_id, config, status, selected export mode |
| `oauth_credentials` | integration_id, encrypted refresh token, key_version, scopes, status; access token short lived |
| `external_mappings` | provider, tenant_id, integration_id, local_type/id, external_type/id, posting_version, unique local identity |
| `integration_jobs/attempts` | payload hash, idempotency key, status, attempts, remote correlation, next_retry_at, errors and resolution |
| `webhook_subscriptions/deliveries` | tenant scoped consumer config, secret encrypted, event, attempts, response, replay |
| `outbox_events` | tenant, aggregate, type, payload, committed_at, dispatched_at, attempt count |
| `audit_events` | tenant, actor, action, resource, old/new summary, reason, IP/UA where appropriate, immutable timestamp |

**Money and relational constraints:** NUMERIC(20,6) internal max precision and currency-specific quantization at posting; store ISO 4217 code, FX rate precision and rounding policy. Constraints: receipts tenant match expense tenant, sum of allocations equals expense eligible base amount, reimbursements cannot exceed eligible amount (except explicit authorized reversal/refund logic), duplicate accounting mappings blocked.

## 7. Canonical accounting connector framework

Define an adapter interface (conceptual; not tied to one provider):
```ts
interface AccountingConnector {
  connectOAuth?(tenantId: string, authCode: string, verifier?: string): Promise<Connection>;
  listOrganizations(connectionId: string): Promise<ExternalOrganization[]>;
  testConnection(connectionId: string): Promise<ConnectionHealth>;
  fetchReferenceData(connectionId: string): Promise<AccountsTaxesVendorsProjects>;
  validateMapping(batchId: string): Promise<ValidationIssue[]>;
  previewPosting(batchId: string): Promise<PostingPreview[]>;
  postExpense(postingId: string): Promise<RemoteReference>;
  postBill?(postingId: string): Promise<RemoteReference>;
  uploadAttachment?(externalId: string, receiptId: string): Promise<void>;
  retrieveStatus(externalId: string): Promise<RemotePostingStatus>;
  reconcile(cursor?: string): Promise<ReconciliationResult>;
  disconnect(connectionId: string): Promise<void>;
}
```

Capabilities differ per provider: discovery endpoint, scopes, webhooks, taxes, documents and bills. Use capability flags per adapter and display explicit unsupported/not-configured states. No generic promises of universal compatibility.

### 7.1 Zoho Books — first native connector

**Official API:** https://www.zoho.com/books/api/v3/  
**OAuth:** https://www.zoho.com/books/api/v3/oauth/  
**Expenses:** https://www.zoho.com/books/api/v3/expenses/  
**Bills:** https://www.zoho.com/books/api/v3/bills/  
**Chart of Accounts:** https://www.zoho.com/books/api/v3/chart-of-accounts/  
**Webhooks:** https://www.zoho.com/books/api/v3/webhooks/

**Connect flow:**
1. Create registered **server-based** OAuth app in Zoho developer console, allowed redirect URL(s), secrets stored only server-side.
2. Obtain authorization via region-specific Zoho Accounts endpoint; validate CSRF `state`; use appropriate delegated scopes, preferably read permissions first, write permissions when export enabled, and `access_type=offline` if refresh token required.
3. Exchange code server-side and encrypt refresh token at rest; use token response's `api_domain`, not a universal `.com` URL; India-hosted organizations commonly use `www.zohoapis.in` and accounts region-specific URLs.
4. `GET /books/v3/organizations`, let tenant admin select Zoho Books organization. Persist `organization_id` scoped to tenant and connection, store base currency and region.
5. Pull reference data: accounts `GET /chartofaccounts`, contacts `GET /contacts`, taxes `GET /settings/taxes`, categories and projects as supported. Requires the correct scopes, including `ZohoBooks.accountants.READ` for chart of accounts. Request and map only what is actually used.
6. Map expense categories → Zoho Books `account_id`; payment source → `paid_through_account_id`; tax → `tax_id`, vendor → `vendor_id`, project → `project_id`, employee mapping where supported. Let finance preview all mappings, unmapped entries block exports.
7. Finance chooses posting strategy PER tenant/type: **Expense** for an actual paid expense, **Bill** for outstanding vendor payable when accounting approves that route. **Employee reimbursement liability:** choose a chart-of-accounts/vendor/employee posting strategy validated with accountant and provider sandbox; do not simply post all employee claims as paid cash expenses.
8. Post finalized report entries one by one (not falsely assume report-to-ledger 1:1), `POST /books/v3/expenses?organization_id=...` or `POST /books/v3/bills?organization_id=...` after mapping validation. For expenses, optionally attach receipt via `/expenses/{expense_id}/receipt` or `/attachment` as provider supports; for bills via the bill attachment endpoint.
9. Persist successful response external ID, local posting version, timestamps, source totals. Give user a link to ledger entry where safe.
10. Poll/reconcile records and optionally configure provider webhooks supported by the tenant plan; do not assume every Books event emits webhooks. Verify authenticity using available signed/secret mechanisms and configured workflow. Never let inbound updates overwrite local approvals.
11. On timeout/5xx, mark `NEEDS_RECONCILIATION` and look up prior result before re-posting; local dedup alone is insufficient if remote accepted request but response was lost. Use unique custom reference where supported/validated.
12. On disconnect, revoke tokens where supported, stop jobs, keep existing history, expose audit trail.

**Important limits:** Zoho's current docs describe **100 requests per minute per organization**, with **daily limits by plan**; implement per-connection throttling, circuit-breaker, 429 retry-after/backoff and pagination. OAuth refresh tokens must never go to frontend. Access token lifetime is documented as one hour. Retrieve plan limit dynamically where possible; don't hard-code a global daily quota.

**Definition of complete Zoho integration:** one tenant can authorize, select correct org, map accounts, preview, export one receipt-bearing test item, observe the external record, and reconcile it. Another tenant can't read or reuse connection or record IDs. Test token expiry, invalid scopes, mapping errors, duplicate submit, lost HTTP responses, revoked access and provider 429.

### 7.2 Expansion adapters

| Provider | Path | Release decision |
|---|---|---|
| Zoho Books | OAuth + accounting REST v3, expenses/bills/receipt operations | P0; full first connector |
| QuickBooks Online | OAuth 2 + relevant accounting purchase/bill objects | P2 after verified mapping |
| Xero | OAuth 2 + tenant-specific Accounting API mapping | P2 |
| ERPNext/Frappe | Token/API-key or verified auth + Frappe REST DocType endpoints | P2; fast follow-up candidate |
| TallyPrime | Verify edition/access mode and supported bridge; may require local network/bridge/partner interface rather than public REST | P2 exploratory; no false claim of native public cloud REST |
| Custom REST/OpenAPI | Import specification, provision credential, explicitly configure direction/resource/auth/field transformation, validated preview and sandbox | P2 |
| Suite HRM/KaaryaMitra | Staff and projects sync; future claim-to-payroll reimbursement | P1/P2 |

A generic **OpenAPI file describes HTTP operations; it does not provide accounting semantics or authorization**. Build a secure no-code/low-code connector mapping editor only after Zoho is mature, with allowlisted endpoint configuration, network egress/SSRF protection, secrets vault, signed callbacks, schema validation and human approval for posting.

## 8. Own REST API and example contracts

All endpoints are authenticated, tenant scoped from token membership (never trust tenant IDs in payload), versioned, return consistent `data`, `error`, `meta`, `request_id` and use cursor pagination for lists. Sensitive POST operations require an idempotency key.

```text
POST   /api/v1/auth/invitations
GET    /api/v1/me
GET    /api/v1/tenants/current
GET    /api/v1/employees
POST   /api/v1/expenses
GET    /api/v1/expenses?status=&category=&from=&to=&cursor=
GET    /api/v1/expenses/:id
PATCH  /api/v1/expenses/:id
POST   /api/v1/expenses/:id/receipts/presign
POST   /api/v1/expenses/:id/receipts/confirm
POST   /api/v1/expenses/:id/ocr/queue
POST   /api/v1/reports
GET    /api/v1/reports
POST   /api/v1/reports/:id/submit
POST   /api/v1/reports/:id/request-changes
GET    /api/v1/approvals/inbox
POST   /api/v1/approvals/:stepId/decision
GET    /api/v1/finance/reimbursements
POST   /api/v1/finance/reimbursements/:id/payments
POST   /api/v1/finance/posting-batches/:id/preview
POST   /api/v1/finance/posting-batches/:id/finalize
GET    /api/v1/finance/posting-batches/:id/status
GET    /api/v1/integrations
GET    /api/v1/integrations/zoho-books/connect
GET    /api/v1/integrations/zoho-books/callback
GET    /api/v1/integrations/zoho-books/organizations
POST   /api/v1/integrations/zoho-books/select-organization
GET    /api/v1/integrations/zoho-books/mappings
PUT    /api/v1/integrations/zoho-books/mappings
POST   /api/v1/integrations/zoho-books/test
GET    /api/v1/audit/events
GET    /api/v1/reports/analytics
GET    /api/openapi.json
```

**Sample creation request:**
```json
{
  "merchant": "ABC Scientific Supplies",
  "date": "2026-10-16",
  "currency": "INR",
  "amount": "2250.00",
  "category_id": "<tenant-scoped-category-uuid>",
  "paid_by": "EMPLOYEE_PERSONAL",
  "reimbursable": true,
  "business_purpose": "Lab consumables for field experiment",
  "project_id": "<project-uuid>",
  "tax_metadata": {"gstin": null, "tax_inclusive": true},
  "receipt_ids": ["<uploaded-receipt-uuid>"]
}
```

Headers: Authorization via session/OAuth; `Idempotency-Key` on financial side-effects; `X-Request-ID` for troubleshooting. Use actual tenant derived from verified membership rather than client-provided `tenant_id`.

## 9. Security, privacy and operations

**Minimum controls:**
- Strong tenant isolation at service AND database level where practical; PostgreSQL RLS as defense in depth, with tenant context carefully set/reset for pooled connections. Automated cross-tenant negative tests for every read/write path.
- RBAC + object ownership; audit of every approval, policy override, submission, export, sync and reimbursement recording.
- HTTPS, encryption at rest, KMS/managed secrets for tokens, narrow OAuth scopes, CSRF/OIDC state checks, OAuth token rotation and revocation handling.
- Password hashing using Argon2id if maintaining email/password; MFA for privileged roles; enforce session expiry/revocation.
- File malware checks, content-type/magic-byte validation, no public buckets, per-tenant private keys/prefixes and presigned expiration; image/PDF preview sanitized.
- Rate limits, pagination max, upload quotas, background job capacity, 429 backoff, retry+dead-letter/replay, circuit breakers and connection health.
- Separate sandbox/dev/staging/prod environments, secrets out of Git, structured logs without PII/tokens, error monitoring/alerts, migrations, encrypted backups and restoration drills.
- Privacy and retention configurable per tenant; signed DPA/terms and country-specific legal review before commercialization. Never insert made-up GST/TDS rules or payroll data.
- SSRF protection for connector/webhook URLs, host allowlists or network egress policy, IP/private-network blocking, HTTPS only; signed event delivery and replay protection.

## 10. Delivery sequence: independently deployable milestones

Each stage ends with running code, tests, migrations, fixtures, API docs and a demo, not just screens.

| Stage | Implementation deliverable | Acceptance gate |
|---|---|---|
| **M0 — Architecture & UX foundation** | Repo, README, environment template, ERD, design tokens, sitemap, component system, app shell, API conventions, OpenAPI stub, test harness | App starts locally without Docker, responsive shell/screens, migrations work |
| **M1 — Tenancy and org setup** | Auth, Google OIDC, memberships, roles, invites, company branding, org master data | Tenant A cannot access Tenant B even with swapped IDs; role matrix tests |
| **M2 — Expense engine** | Manual expense CRUD, receipt upload/private preview, categories, cost center/project, duplicates, OCR adapter and confirmation | Employee can create/submit expense and see original receipt; OCR never auto-finalizes |
| **M3 — Reports and approvals** | Report assembly, state machine, policies, manager queue, delegation, comments, audit | Real multi-step approval including violations and changes-requested; self-approval denied |
| **M4 — Finance and reimbursement** | Finance review, tax metadata, budget checks, manual reimbursements, partial payout and reconciliation, exports | Approval != paid; ledger amount/rounding tests pass; no over-reimbursement |
| **M5 — Zoho Books production connector** | OAuth/connect/disconnect, org selection, mapping, dry-run, export, receipts, sync logs, reconciliation/429/expired-token handling | Sandbox end-to-end success, failure replay without duplicates; two-tenant test |
| **M6 — Reporting and public API** | Dashboards, analytics, CSV/XLSX, API v1 docs, webhook subscriptions and replay | Totals reconcile to transactions; webhook HMAC tests; API consumers work |
| **M7 — Launch hardening** | Performance, security audit, backup restore, observability, accessibility/mobile UX, user onboarding, docs | All P0 acceptance tests and launch checks pass |
| **M8 — Expansion** | Expense email parsing, cards, advances, travel, additional accounting providers, generic OpenAPI connector builder, optional mobile wrapper | Each feature scoped by business need and separate acceptance gate |

P0/P1/P2 are release priorities, not calendar commitments. Do not have code agents implement M5 while M1–M4 lack stable domain contracts. Maintain a runnable deployment at every milestone.

## 11. Test matrix / definition of done

### Core security and correctness
1. Tenant A employee cannot query, update, download a receipt or approve any Tenant B record even if UUID is known.
2. User losing membership or approver delegation loses ability immediately; existing audit remains.
3. An approver cannot approve own report; two simultaneous approval requests cannot create contradictory states.
4. Rejected and changes-requested reports follow explicit correction paths; finalized totals are immutable except through reversals.
5. Receipt upload spoofed extension, malware, oversize, old signed URL and unauthenticated download fail correctly.
6. OCR wrong amount is a suggestion; manually corrected value is source of truth.
7. Duplicate merchant/date/amount flags suspicious claim; exact hash match warns; legitimate duplicates can be overridden with reason.
8. A personal-card expense is reimbursable; a corporate-card expense is non-reimbursable by default; manual override is logged.
9. Two reimbursement partial payments cannot exceed due eligible amount; approval is never itself payment.
10. FX and GST precision tests, inclusive/exclusive tax, refund/credit/reversal test; conversions do not silently alter submitted amounts.

### Integration reliability
11. Zoho `.in` organization uses India data center domain, not hard-coded `.com` API.
12. OAuth wrong state, revoked refresh token, insufficient scopes and wrong organization are handled cleanly.
13. A mapper shows missing account/tax and prevents posting.
14. A 429 respects rate/backoff; day-limit is not treated as immediate retry.
15. An accepted provider request with lost response becomes reconciliation pending; no blind double-write on retry.
16. Tenant A's Zoho token, organization and ledger ID cannot be used by Tenant B.
17. Receipts upload only after authoritative ledger posting succeeds; attachment failures are independently recoverable.
18. Inbound provider record updates cannot bypass internal approval rules.
19. Custom webhook HMAC invalid signature/replay/timestamp fails; authorized callbacks are deduped.
20. Backups restore a full test tenant and audit correctly.

### Product quality
21. Desktop/tablet/mobile responsive, keyboard navigable, dark/light switch; no bright/low-contrast financial tables.
22. All important forms include empty/loading/error/success/permission/duplicate states.
23. No placeholder buttons, fake successful payments, or hard-coded demo financial totals.
24. Unit, integration and end-to-end tests run in CI. OpenAPI generated from or tested against actual server routes.
25. Financial reconciliation and expense approval workflows are documented sufficiently for accountant review.

## 12. Agent implementation protocol (Codex/Claude)

1. Inspect repo first. If new, initialize monorepo; if existing, do not overwrite other KaaryaMitra/PravesMitra projects.
2. Write or update `docs/product.md`, `docs/architecture.md`, `docs/threat-model.md`, `docs/acceptance-tests.md` before modifying domain logic.
3. Produce an ERD, approval state transition diagram, integration state diagram, module boundaries and an ordered task board (with dependencies and effort only as internal planning).
4. Implement **one milestone at a time**, creating migration + backend + frontend + tests + docs as a vertical slice. No mock-only final deliverables.
5. At each milestone run formatting, lint, typecheck, unit tests, integration tests and selected Playwright flows; report actual commands/result; describe missing external credentials and mocked boundaries.
6. Add realistic seed/demo tenant using synthetic data **without secrets**, with managers and finance roles. Provide local setup + environment variable instructions. No need for Docker.
7. Maintain a compatibility contract at `/api/v1`; add automated schema drift tests.
8. Keep sensitive provider keys in `.env`/secret store only and never log tokens/receipt content.
9. Never claim Zoho live success without sandbox credentials and observed ledger record. Support a fully testable mocked connector for CI.
10. End each milestone with summary of changed files, migration/rollback notes, demo commands, tests passing/failing, and next milestone dependency. If a requirement conflicts, preserve financial integrity/tenant isolation and document the decision.

## 13. Official integration references

- Zoho Books API Overview / regions / limits: https://www.zoho.com/books/api/v3/introduction/
- Zoho Books OAuth 2.0: https://www.zoho.com/books/api/v3/oauth/
- Zoho Books Expense endpoints: https://www.zoho.com/books/api/v3/expenses/
- Zoho Books Bills: https://www.zoho.com/books/api/v3/bills/
- Zoho Books Chart of Accounts: https://www.zoho.com/books/api/v3/chart-of-accounts/
- Zoho Books Taxes: https://www.zoho.com/books/api/v3/taxes/
- Zoho Books Contacts: https://www.zoho.com/books/api/v3/contacts/
- Zoho Books Webhooks: https://www.zoho.com/books/api/v3/webhooks/
- Xero OAuth 2.0: https://developer.xero.com/documentation/guides/oauth2/overview
- Frappe/ERPNext REST API: https://docs.frappe.io/framework/user/en/api/rest

**Provider caveat:** Documentation and API commercial policies may change. Code must refer to versioned schemas, automated contract tests, provider sandbox behavior, and connector capability flags rather than interpreting this blueprint as a guarantee that every platform supports every transaction type.
