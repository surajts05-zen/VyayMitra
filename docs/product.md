# VyayMitra — Product Specification

## 1. Product Overview
VyayMitra is an enterprise-grade, multi-tenant expense management SaaS designed as a companion to the KaaryaMitra (HRM) and PravesMitra (attendance) productivity suite, while remaining 100% independently deployable and commercially viable.

### Key Value Propositions
1. **HRM-Independent but Suite-Ready:** Operates completely standalone with its own employee directory and org hierarchy; syncs seamlessly with KaaryaMitra via REST APIs when present without direct DB coupling.
2. **Finance-First Depth:** Full attention given to finance operators and auditors—segregation of duties, approval delegation, tax and chart-of-accounts mapping, partial reimbursements, and immutable audit trails.
3. **Robust Zoho Books Connector:** Native, region-aware OAuth 2.0 integration with dry-run previews, retry-safe posting, idempotency, and reconciliation.
4. **Strict Three-State Lifecycle:** Explicit separation of **Approval**, **Accounting Export**, and **Reimbursement Payment**.

## 2. Personas & Roles
- **Platform Super Admin:** Platform-level tenant provisioning and health. No default access to tenant financial records.
- **Tenant Owner / Company Admin:** Manages organization settings, roles, policies, and integrations.
- **Employee:** Submits expenses and claims, views receipt OCR suggestions, tracks approval and reimbursement status.
- **Manager / Approver:** Reviews pending expense reports; approves, rejects, or requests changes. Never self-approves.
- **Finance Operator:** Reviews approved reports, validates tax and GL account mappings, posts to accounting, records payouts.
- **Finance Admin:** Configures accounting integrations, tax rules, budgets, and payment policies.
- **Auditor / Read-Only:** Read-only access to immutable event history and financial reports.
- **Delegated Approver:** Time-bounded, logged proxy for an approver; cannot self-approve.

## 3. Core Modules & Boundaries
- `auth`: Multi-tenant session and token management, Google OIDC, email verification, MFA.
- `tenants`: Multi-tenant tenancy boundaries, branding, base currency, fiscal calendar.
- `employees`: Internal directory and manager reporting hierarchy with optional HRM sync link.
- `expenses`: Single/split expenses, receipt uploads, OCR suggestion review, duplicate detection.
- `reports`: Aggregation of draft expenses into structured claim reports with state machine guards.
- `policies`: Versioned policy engine evaluating category limits, receipt thresholds, and escalation rules.
- `approvals`: Multi-stage sequential/parallel approval chains, delegation, and immutable decision logs.
- `finance`: Reimbursement register, partial payment tracking, bank transaction logging.
- `integrations`: Accounting connector framework with Zoho Books as the first native adapter.
- `audit`: Append-only audit events tracking all mutating actions with actor, tenant, and timestamp.

## 4. M7 Release Hardening Scope

M7 adds release controls around the existing business workflows; it does not change the meaning of approval, accounting export, or reimbursement.

- **Runtime security:** production configuration fails closed when signing secrets, origins, or observability credentials are missing; request payloads are validated and bounded; server errors never expose stack traces or internal messages.
- **Abuse protection:** per-client request limits apply globally, with a stricter policy for authentication endpoints. Rate-limit responses include a retry window and a request correlation ID.
- **Operational readiness:** liveness is process-only, while readiness reports database availability. A protected Prometheus endpoint exposes bounded, non-PII request metrics.
- **Retention:** tenant administrators can inspect the configured retention policy and preview eligible records. Financial transaction and audit history are never silently deleted by the retention workflow.
- **Recovery:** PostgreSQL backup, restore, and verification commands are provided as explicit scripts. A backup is not considered valid until restored into a separate database and verified.
- **Accessible release UX:** skip navigation, keyboard-operable navigation, visible focus, persistent theme preference, mobile navigation, route-level loading and failure states, and a dismissible onboarding checklist are included in the web shell.

### Release status rule

M7 controls may be complete while the product remains **not approved for production**. Release approval additionally requires durable PostgreSQL-backed domain services, real private object storage and malware scanning, an authorized Zoho sandbox ledger observation, Playwright browser coverage, WCAG 2.2 AA review, and a witnessed backup-restore drill. Simulated connectors or in-memory stores never satisfy those gates.
