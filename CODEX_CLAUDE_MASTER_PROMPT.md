# MASTER IMPLEMENTATION PROMPT — Expense Management SaaS

You are the **Principal Product Engineer, Solution Architect, FinTech Domain Engineer, UX Designer, QA Lead and DevSecOps Engineer** implementing a production-grade, multi-tenant expense management SaaS. Read `EXPENSE_PLATFORM_BLUEPRINT.md` in full and treat it as the primary product requirements document.

## Product context

Create a standalone and commercially viable expense-management app with functionality similar in coverage to Zoho Expense, **but original design and implementation**. It belongs to the same software product family as **KaaryaMitra** (HRM/workplace productivity) and **PravesMitra** (attendance), so the UI should share a clean modern, professional Gen-Z SaaS visual language, not copy their logos. Keep the product name and tenant branding configurable. Support a product logo AND tenant/company logo; responsive dark/light design.

The application must integrate with **Zoho Books first**, and support a reusable vendor-neutral integration layer for QuickBooks Online, Xero, ERPNext, TallyPrime through verified bridges, and approved custom REST/OpenAPI integrations later. Expose the application's own **versioned OpenAPI 3.1 REST interface**. Do not confuse an OpenAPI definition with a working data/business mapping.

**Implementation stack:** React + TypeScript + Vite + Tailwind + shadcn/ui + Lucide + TanStack Query; NestJS/Node.js backend with typed validation; PostgreSQL + Prisma; Redis + BullMQ background workers; private S3-compatible receipts storage; Google OIDC and email login; OpenAPI docs; Vitest/Jest + Playwright. Modular monolith, strict domain boundaries; no Docker requirement for local development.

## Quality and integrity requirements

1. Tenant scoping and membership authorization at EVERY API, job, data query, attachment and webhook. No cross-tenant data leakage. Roles: platform super admin, company owner/admin, employee, manager/approver, finance operator/admin, auditor, delegated approver. Never grant platform admins unrestricted tenant record access by default.
2. Preserve three distinct concepts: **report approval**, **accounting export**, and **reimbursement payment**. An approved report is not a paid claim; exporting to Zoho Books is not equivalent to paying the employee.
3. Deterministic expense policy engine, versioned rules, appropriate manager/finance routing, multi-stage approval, logged delegation and self-approval prevention. Every state change must pass server-side transition guards; finalized records are immutable except authorized corrections/reversals.
4. Expenses: manual entry, merchant/date/amount/currency/category/project/cost center/purpose/payment source, receipt attachments, OCR suggestions needing human confirmation, exact+fuzzy duplicate detection, tax components, multi-currency with precise decimal arithmetic.
5. Reports: draft, submit, return for changes, reject, approve, finance review and finalize; history, comments, notifications, granular permissions. Budgets, finance queues, manual payout and partial reimbursement tracking, audits and exports.
6. India-first defaults without hard-coding India-only architecture: INR, Indian GST and fiscal-year metadata, CGST/SGST/IGST, GSTIN, HSN/SAC where appropriate; country-specific tax treatment configurable and accountant-reviewed. No automatic assertion of legal tax eligibility.
7. Zoho: encrypted server-side OAuth 2.0 refresh tokens, regional data centers from token `api_domain`, per-tenant organization selection, mapping for accounts, payment source, tax, vendor and projects, **dry-run before posting**, expense/bill mapping by accounting type, upload receipt, asynchronous sync and reconciliation. Never treat all employee claims as immediately paid cash expenses. Honor per-org rate/day/concurrency limits, 429, 401, refresh, revocation, idempotency, partial failures, lost-response duplicate risk, audit.
8. Own REST API v1 with OpenAPI docs, scoped clients, HMAC-signed outbound webhooks, retries, delivery IDs and developer docs. Custom OpenAPI connectors come later through an approved mapping/security framework, not raw arbitrary-user URLs.
9. Security: tenant authorization, MFA for privileged users, private files/signed URLs, malware and MIME checks, encryption/secrets vault, CSRF/OIDC state, audit, data retention, backup/restore, structured logs without secrets, rate limits, integration tests and OWASP protections.
10. UX: excellent employee camera/manual capture and responsive manager approval/finance reconciliation experiences; accessible and fast, not a generic Bootstrap dashboard or excessive colored cards. No placeholder actions or fake success screens. Use light/dark mode and branding separation.

## Required milestones and work order

**M0 — Foundation:** Inspect repository (if any), write architecture/product/ERD/approval diagrams, initialize monorepo, install dependencies, build shared UI design tokens and responsive shell, environment template, migrations/test harness, actual running app and API health route.

**M1 — Identity and organizations:** Google OIDC/email authentication, invite flows, tenants, memberships, users, roles, company branding, employee directory, departments/projects/cost centers/categories. Provide cross-tenant and object-authorization negative tests.

**M2 — Expense capture:** Expense CRUD, financial types and validations, receipt private upload/preview, async OCR adapter with stub + real provider interface, duplicate checks, employee workflow and tests.

**M3 — Approvals:** Expense reports, immutable snapshots, policy engine, approval builder with sequential stages, manager inbox, delegation, changes requested/rejected, comments/audit, notification events.

**M4 — Finance and budgets:** Reimbursement eligibility, finance validation, partial/manual payments, budget policy, proper FX/tax calculations and ledger preview, exports and reconciliation summaries.

**M5 — Zoho Books live integration:** OAuth, region-aware connection, organizations, reference-data mapping, preview/dry run, robust asynchronous expense/bill posting and receipt upload, structured logs and reconciliation, mock adapter for tests plus real sandbox execution guide.

**M6 — Public platform & analytics:** Documented OpenAPI 3.1 REST APIs, developer credential/scopes, HMAC outbound webhooks, dashboards, filters and CSV/XLSX exports.

**M7 — Release:** Security, performance, accessibility, mobile UX checks, data retention, backup restore and observability. Additional accounting connectors, advanced travel/cards and generic connector builder are later milestones.

## Deliverable conventions

- For EACH milestone implement backend routes/services, Prisma migrations and seed data, working frontend screens, loading/empty/error/success states, tests and documentation. Do not merely create mockups or write theoretical pseudocode.
- Work in vertical slices, keeping the app runnable, and report which milestone was completed with actual commands and test output. Do not proceed to new milestone if the core tests for the previous stage are broken.
- Use clean domain services and repository boundaries, shared typed DTO contracts, runtime schema validation, graceful errors, paginated list endpoints and accessible UI components. Configure lint/typecheck/test scripts and CI.
- Create `README.md` with local setup (without Docker), migration/seed commands, test commands and env variable descriptions. Provide `.env.example` with placeholders, never secrets.
- Include seeded synthetic companies, employees, managers, finance users, receipts and expense reports for real end-to-end tests.
- With no Zoho sandbox credentials, implement and test a faithful mock adapter and `connection not configured` UI; do **not** assert that live Zoho OAuth or financial posting passed. When credentials are provided, add actual sandbox verification.
- Use explicit unidirectional accounting export in MVP with selective reconciliation reads; never two-way overwrite local approval events.
- For provider posting ensure ledger line mapping completeness, unique local/external reference, transactional outbox, per-org throttling, retry backoff, unknown-result reconciliation and human exception handling.
- Confirm a release only if an employee can create an expense with receipt, submit a report, get a separate manager approval, reach finance, record partial/full reimbursement, export to mock/sandbox Zoho with visible mapping and recover from a simulated 429/lost response without duplicate record.

## First action — start with M0

1. Read the full blueprint, identify any material missing dependencies, and make sound documented defaults without stopping for trivial clarifications.
2. Inspect the repository if available, then provide the architecture/ERD, risk register, exact monorepo tree and M0 task list.
3. Implement M0 fully in actual files, install what is available, start/test locally, show executed commands and real results.
4. State the acceptance criteria actually met and what remains; continue to M1 only once M0 passes.

**Priority order:** financial correctness and tenant security > working backend end-to-end behavior > usability > extra features. Do not sacrifice security or accounting integrity to give a visually complete but nonfunctional demo.
