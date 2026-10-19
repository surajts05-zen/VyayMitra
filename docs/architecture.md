# VyayMitra — Architecture Specification & Diagrams

## 1. System Architecture
VyayMitra is architected as a modular monolith with strict domain boundaries, transactional outbox eventing, and worker isolation.

```mermaid
graph TD
  subgraph Client Tier
    Web[Web App: React + Vite + Tailwind + shadcn/ui]
    Mobile[Mobile Responsive Web / Camera capture]
  end

  subgraph API Gateway & Core API [NestJS Modular Monolith]
    AuthMod[Auth & Tenancy Guard]
    ExpMod[Expense Engine]
    RepMod[Reports & Policies Engine]
    ApprMod[Approvals Engine]
    FinMod[Finance & Reimbursements]
    IntMod[Integrations Framework]
    AuditMod[Audit & Event Outbox]
  end

  subgraph Worker Tier [BullMQ Workers]
    OcrWorker[OCR Processing Worker]
    SyncWorker[Zoho Books Sync Worker]
    WebhookWorker[Webhook Dispatcher]
    ReconWorker[Reconciliation Worker]
  end

  subgraph Persistence & Infrastructure
    Postgres[(PostgreSQL: Multi-tenant Schemas & RLS)]
    Redis[(Redis: Cache, Rate Limiting, Queues)]
    S3[Private S3 Bucket: Presigned Receipts]
  end

  subgraph External Systems
    ZohoAPI[Zoho Books API v3]
    GoogleAuth[Google OIDC]
    KaaryaMitra[KaaryaMitra HRM API]
  end

  Web -->|HTTPS REST /api/v1| AuthMod
  AuthMod --> ExpMod & RepMod & ApprMod & FinMod & IntMod
  ExpMod & RepMod & ApprMod & FinMod --> AuditMod
  AuditMod -->|Transactional Outbox| Postgres
  SyncWorker -->|Polled/Dispatched| Postgres
  SyncWorker -->|Rate-limited OAuth| ZohoAPI
  OcrWorker --> S3
  IntMod -->|Encrypted Creds| Postgres
```

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    TENANTS ||--o{ USERS_MEMBERSHIPS : contains
    TENANTS ||--o{ EMPLOYEES : employs
    TENANTS ||--o{ DEPARTMENTS : structures
    TENANTS ||--o{ PROJECTS : tracks
    TENANTS ||--o{ CATEGORIES : categorizes
    TENANTS ||--o{ EXPENSES : owns
    TENANTS ||--o{ EXPENSE_REPORTS : compiles
    TENANTS ||--o{ INTEGRATIONS : configures
    TENANTS ||--o{ AUDIT_EVENTS : records

    USERS ||--o{ USERS_MEMBERSHIPS : holds
    USERS_MEMBERSHIPS }o--|| TENANTS : scopes

    EMPLOYEES ||--o{ EXPENSES : incurs
    EMPLOYEES ||--o{ EXPENSE_REPORTS : submits
    EMPLOYEES }o--o| EMPLOYEES : reports_to

    EXPENSES ||--o{ EXPENSE_LINES : splits
    EXPENSES ||--o{ RECEIPTS : attaches
    RECEIPTS ||--o| OCR_JOBS : extracts
    EXPENSES }o--o| EXPENSE_REPORTS : grouped_into

    EXPENSE_REPORTS ||--o{ APPROVAL_STEPS : routes_through
    APPROVAL_STEPS ||--o{ APPROVAL_ACTIONS : records_decisions
    EXPENSE_REPORTS ||--o| REIMBURSEMENTS : generates

    REIMBURSEMENTS ||--o{ REIMBURSEMENT_PAYMENTS : installments

    INTEGRATIONS ||--o| OAUTH_CREDENTIALS : secures
    INTEGRATIONS ||--o{ EXTERNAL_MAPPINGS : maps
    INTEGRATIONS ||--o{ INTEGRATION_JOBS : executes
```

---

## 3. Expense Report Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Employee creates report
    DRAFT --> SUBMITTED : Employee submits report
    
    state Policy_Check <<choice>>
    SUBMITTED --> Policy_Check : Evaluate Policies
    
    Policy_Check --> IN_REVIEW : Policy Passed / Warning
    Policy_Check --> DRAFT : Hard Block (Missing Receipt/Cap)
    
    IN_REVIEW --> CHANGES_REQUESTED : Approver requests edits
    CHANGES_REQUESTED --> SUBMITTED : Employee updates & resubmits
    
    IN_REVIEW --> REJECTED : Approver rejects claim
    REJECTED --> [*] : Expenses unlocked for reuse
    
    IN_REVIEW --> APPROVED : Manager approves
    APPROVED --> FINANCE_REVIEW : Routed to Finance Queue
    
    FINANCE_REVIEW --> CHANGES_REQUESTED : Finance sends back
    FINANCE_REVIEW --> FINALIZED : Finance signs off (Immutable)
    
    FINALIZED --> ARCHIVED : Period Close
```

---

## 4. Reimbursement Payment State Machine
*(Strictly decoupled from Approval status)*

```mermaid
stateDiagram-v2
    [*] --> NOT_READY : Report in Draft/Review
    NOT_READY --> NOT_APPLICABLE : Corporate Card / Non-Reimbursable
    NOT_READY --> ELIGIBLE : Report FINALIZED & Personal Card
    
    ELIGIBLE --> SCHEDULED : Batch selected for payout
    SCHEDULED --> PARTIALLY_PAID : Installment 1 recorded
    PARTIALLY_PAID --> PAID : Remaining balance cleared
    SCHEDULED --> PAID : Full payment recorded
    
    ELIGIBLE --> ON_HOLD : Disputed / Missing Bank Info
    ON_HOLD --> ELIGIBLE : Dispute cleared
```

---

## 5. Accounting Sync & Reconciliation State Machine
*(Zoho Books Transactional Outbox Pattern)*

```mermaid
stateDiagram-v2
    [*] --> NOT_QUEUED : Report not finalized
    NOT_QUEUED --> QUEUED : Finance triggers export
    
    QUEUED --> SYNCING : Worker picks job & throttles (100 req/min)
    
    SYNCING --> SYNCED : 201 Created & Remote ID stored
    SYNCING --> RETRYABLE_FAILURE : 429 Rate Limit (Respect Retry-After)
    RETRYABLE_FAILURE --> SYNCING : Exponential Backoff
    
    SYNCING --> NEEDS_RECONCILIATION : 500 / Network Timeout / Lost ACK
    NEEDS_RECONCILIATION --> SYNCED : Discovered existing record via lookup
    NEEDS_RECONCILIATION --> RETRYABLE_FAILURE : Confirmed not posted, re-queue
    
    SYNCING --> BLOCKED : Unmapped GL Account / Tax Code / Revoked Token
```

---

## 6. M7 Runtime and Observability Boundaries

```mermaid
flowchart LR
    Client -->|request + optional X-Request-ID| RequestContext
    RequestContext --> RateLimit
    RateLimit --> Validation
    Validation --> Domain[Existing /api/v1 domain routes]
    Domain --> ResponseTelemetry
    ResponseTelemetry --> Metrics[Bounded in-process metrics]
    ResponseTelemetry --> StructuredLog[Structured log without body/token/PII]
    Operator -->|Bearer OBSERVABILITY_TOKEN| MetricsEndpoint[/internal/metrics]
    Probe --> Liveness[/api/health/live]
    Probe --> Readiness[/api/health/ready]
    Readiness --> PostgreSQL[(PostgreSQL SELECT 1)]
```

Operational endpoints follow these boundaries:

- Liveness never depends on external providers and answers whether the process event loop is serving requests.
- Readiness returns `503` when PostgreSQL is unavailable in production. Development may report a degraded offline state so the existing local mock workflow remains runnable.
- Metrics labels are restricted to HTTP method, normalized route template, and status class. Tenant IDs, user IDs, URLs with UUIDs, request bodies, tokens, and receipt data are excluded.
- The metrics endpoint is disabled unless `OBSERVABILITY_TOKEN` is configured and uses constant-time token comparison.
- Request IDs are validated before reflection, generated cryptographically when absent, returned in `X-Request-ID`, and shared by errors, logs, and response envelopes.

## 7. Retention and Recovery Boundary

Retention policy is environment-configured and tenant-scoped. The API defaults to preview-only operation. It may identify expired OCR provider payloads, webhook delivery payloads, and dispatched outbox payloads, but it must not delete audit events, approvals, reimbursements, reimbursement payments, finalized reports, integration mappings, or external references.

Database recovery is an operator workflow rather than an HTTP endpoint:

```text
pg_dump (custom format) -> SHA-256 manifest -> separate restore database
    -> pg_restore --clean --if-exists -> schema/tenant/audit verification
    -> signed drill record -> production restore approval
```

Production restore scripts reject a target database matching the source URL and require an explicit confirmation flag.
