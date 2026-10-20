# VyayMitra — Comprehensive Manual Test Suite & Acceptance Runbook
## Version: 1.0 (Commercial Production Standard)
## Coverage: All Roles, Functional Workflows, Security Invariants & Design System

---

## 1. Test Environment Setup & Pre-requisites

### 1.1 Local Application URLs
* **Web Frontend**: `http://localhost:5173`
* **API Backend**: `http://localhost:3000`
* **OpenAPI 3.1 Documentation**: `http://localhost:3000/api/docs`
* **Health Endpoint (Liveness)**: `http://localhost:3000/api/health/live`
* **Health Endpoint (Readiness)**: `http://localhost:3000/api/health/ready`

### 1.2 Test Personas & Role Switcher
In the bottom-right corner of the web application, a floating pill badge (`Role: ... ▾`) allows on-the-fly persona switching:

| Persona Name | Email | System Role | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Rahul Sharma** | `rahul.sharma@horizonsci.in` | `EMPLOYEE` | Create expenses, upload receipts, assemble & submit claims. |
| **Anita Deshmukh / Sarah** | `sarah.finance@horizonsci.in` | `FINANCE_OPERATOR` / Approver | Stage-1 manager signoff, policy audit, GL export, bank payout. |
| **Vikram Mehta** | `admin@horizonsci.in` | `COMPANY_OWNER` | Tenant setup, GSTIN, fiscal year, org hierarchy, policies, admin guide. |
| **Platform Ops Admin** | `superadmin@vyaymitra.internal` | `PLATFORM_SUPER_ADMIN` | Cross-tenant directory, worker queue health, platform audit logs. |

---

## 2. Test Execution Matrix by Role

### TRACK 1: Employee Role (`EMPLOYEE` — Rahul Sharma)

#### TC-EMP-01: Invoice Receipt Upload & Asynchronous OCR Extraction
* **Pre-condition**: Logged in as **Rahul Sharma**. Navigate to **My Expenses** (`/expenses`).
* **Steps**:
  1. Click **`+ Create Expense`**.
  2. In the dashed dropzone, drag-and-drop or select an image (`.png`, `.jpg`) or PDF invoice.
  3. Observe the asynchronous OCR processing status spinner.
* **Expected Result**:
  * An **"OCR Extracted Suggestions"** card appears displaying Merchant, Amount, Invoice Date, Supplier GSTIN, and confidence percentage (e.g. 96%).
  * A mandatory confirmation checkbox is displayed: *"I confirm I have personally verified these extracted fields against the invoice"*.

#### TC-EMP-02: Human Review Gate on OCR Suggestions
* **Pre-condition**: OCR suggestions populated in `+ Create Expense` modal.
* **Steps**:
  1. Modify the suggested merchant name and invoice amount manually.
  2. Check the confirmation checkbox.
  3. Fill in Category (`Air Travel`) and Purpose.
  4. Click **Save Expense Draft**.
* **Expected Result**:
  * Manual edits override OCR suggestions without blocking submission.
  * The expense appears in the table with a badge `OCR 96%` and status `DRAFT`.

#### TC-EMP-03: Multi-Line Split Expense with Decimal Arithmetic Validation
* **Pre-condition**: In `+ Create Expense` modal.
* **Steps**:
  1. Set total invoice amount to `₹5,000.00`.
  2. Check **"Split Expense Across Multiple Line Items"**.
  3. Enter `Line 1: Hotel Room` for `₹3,500.00`.
  4. Enter `Line 2: Breakfast Buffet` for `₹1,200.00` (intentional discrepancy of ₹300).
  5. Check whether the **Save Expense Draft** button is enabled.
  6. Update Line 2 to `₹1,500.00` (exact sum match).
* **Expected Result**:
  * While the split sum differs from the total, a red warning *⚠️ Sum must exactly match total amount* displays, and saving is strictly disabled.
  * When sum matches `₹5,000.00`, the error clears and the split expense saves successfully.

#### TC-EMP-04: Duplicate Claim Detection (Fuzzy & 48-Hour Window)
* **Pre-condition**: In `+ Create Expense` modal.
* **Steps**:
  1. Enter Merchant `ITC Gardenia Bengaluru` and Amount `₹4,500.00` with the same date as an existing expense.
* **Expected Result**:
  * A warning appears: *Duplicate alert: Similar merchant ITC Gardenia within 48 hours*.
  * When saved, the expense table displays a bold amber tag: `⚠️ Duplicate`.

#### TC-EMP-05: Multi-Currency Expense Conversion
* **Pre-condition**: In `+ Create Expense` modal.
* **Steps**:
  1. Enter an expense for `USD $250.00` (e.g., US lab reagent purchase).
  2. Set currency to `USD`. Save expense.
* **Expected Result**:
  * Expense record stores `USD 250.00` with currency code and converts to base INR equivalent for budget calculations without decimal truncation.

#### TC-EMP-06: Expense Report Assembly
* **Pre-condition**: Navigate to **My Reports** (`/reports`).
* **Steps**:
  1. Click **`Assemble New Claim Report`**.
  2. Enter Report Title: *"National Bio-Tech Summit Claim"*.
  3. Select 2 or more unclaimed expenses from the selection roster.
* **Expected Result**:
  * Total amount dynamically computes as the exact sum of selected line items.
  * Expenses show receipt attachment verification status.

#### TC-EMP-07: Policy Engine Threshold Escalation (>₹50,000)
* **Pre-condition**: In the Assemble Report wizard.
* **Steps**:
  1. Select expenses totaling greater than `₹50,000.00`.
  2. Observe the generated Approval Flow timeline preview.
* **Expected Result**:
  * The policy engine detects that the total exceeds the standard manager limit and automatically inserts an **"Executive Escalation (>₹50,000)"** stage assigned to Company Owner (`Vikram Mehta`).

#### TC-EMP-08: Report Submission & Immutability Lock
* **Pre-condition**: Report assembled with valid expenses.
* **Steps**:
  1. Click **Submit Report for Approval**.
* **Expected Result**:
  * Report state moves to `SUBMITTED`.
  * Included expenses transition to `LOCKED` so they cannot be edited, re-claimed, or deleted while in review.

#### TC-EMP-09: Audit History Tracking
* **Pre-condition**: Report submitted.
* **Steps**:
  1. Click on the submitted report to view details.
* **Expected Result**:
  * An immutable **Audit Trail** record is logged: *"REPORT_SUBMITTED by Dr. Rahul Sharma"* with timestamp and SHA-256 receipt signature.

---

### TRACK 2: Approver / Manager Role (`MANAGER` / Anita Deshmukh / Sarah)

#### TC-APP-01: Approver Inbox & Policy Warning Badges
* **Pre-condition**: Switch persona to **Sarah Jenkins (Finance)**. Navigate to **Approvals** (`/approvals`).
* **Steps**:
  1. Inspect the incoming approval queue.
  2. Check report *REP-2026-0891 (Bangalore Lab Equipment & Reagents)*.
* **Expected Result**:
  * Review badge shows in the sidebar.
  * Policy violations appear in bold: *"Item #2 exceeds the ₹1,500 single-meal threshold by ₹450.00"*.

#### TC-APP-02: Signed Receipt Verification & Expiry
* **Pre-condition**: Inspecting an expense report in `/approvals`.
* **Steps**:
  1. Inspect the receipt attachment link for each line item.
* **Expected Result**:
  * Receipts display *Encrypted SHA-256*.
  * Direct file URLs use timed signed tokens (15-minute expiration) preventing unauthenticated access.

#### TC-APP-03: Request Changes Workflow
* **Pre-condition**: In `/approvals` inspecting a claim.
* **Steps**:
  1. In the reviewer comments box, enter: *"Please attach itemized GST bill for lodging"*.
  2. Click **Request Changes**.
* **Expected Result**:
  * Status transitions to `CHANGES_REQUESTED`.
  * Claim is sent back to the employee's "Needs Rework" tab with the manager's comment visible.

#### TC-APP-04: Rejection Workflow with Mandatory Justification
* **Pre-condition**: Inspecting a non-compliant claim in `/approvals`.
* **Steps**:
  1. Click **Reject Claim** without entering a reason.
  2. Verify that submission is blocked until a justification comment is typed.
  3. Enter reason *"Personal non-business expense"* and confirm.
* **Expected Result**:
  * Status transitions to `REJECTED`.
  * All associated expense items are released or marked rejected.

#### TC-APP-05: Multi-Stage Approval Progression
* **Pre-condition**: Report pending Manager approval.
* **Steps**:
  1. Click **Approve Claim**.
* **Expected Result**:
  * Stage 1 is marked `APPROVED`.
  * Claim moves to Stage 2 (`FINANCE_REVIEW`).
  * Invariant: The claim is **NOT** marked as paid/reimbursed.

#### TC-APP-06: Invariant Check — Self-Approval Block
* **Pre-condition**: Attempt to approve a report submitted by the logged-in user.
* **Steps**:
  1. Switch to Rahul Sharma. Submit an expense report.
  2. Attempt to approve Rahul's own report.
* **Expected Result**:
  * The approval action is completely disabled or rejected with an HTTP 403: *"Self-approval is strictly prohibited by security policy"*.

#### TC-APP-07: Out-of-Office Approval Delegation
* **Pre-condition**: Navigate to **Approvals** (`/approvals`).
* **Steps**:
  1. Scroll to the **Delegation Rules** section.
  2. Set up a delegation rule: Delegate to `Sarah Jenkins`, Scope: `All Reports`, Effective: Next 7 days, Reason: *"Annual Leave"*.
  3. Save delegation rule.
* **Expected Result**:
  * Delegation rule is active.
  * Incoming approval items during that window are routeable by the delegated approver with an audit flag: *"Delegated from Anita Deshmukh"*.

---

### TRACK 3: Finance Operator Role (`FINANCE_OPERATOR` — Sarah Jenkins)

#### TC-FIN-01: Finance Review Queue & Finalization
* **Pre-condition**: Logged in as **Sarah Jenkins**. Navigate to **Finance Review** (`/finance`).
* **Steps**:
  1. Review reports with status `FINANCE_REVIEW`.
  2. Verify that tax metadata, cost center mappings, and policy exceptions are satisfied.
  3. Click **Finalize Report for Accounting**.
* **Expected Result**:
  * Report transitions to `FINALIZED`.

#### TC-FIN-02: Indian GST & Tax Classification
* **Pre-condition**: In `/finance`, review the **GL Chart-of-Accounts** table.
* **Steps**:
  1. Verify tax treatment categories:
     * *Air Travel*: `ITC_ELIGIBLE`
     * *Local Conveyance & Meals*: `ITC_INELIGIBLE` (Blocked under GST Section 17(5))
     * *Software & International SaaS*: `RCM_APPLICABLE` (Reverse Charge Mechanism)
* **Expected Result**:
  * Indian GST tax classifications are explicitly distinguished and reflected in ledger journal entries.

#### TC-FIN-03: Departmental Budget Spend Cap & Overdraft Monitoring
* **Pre-condition**: In `/finance`, check the **Budget Utilization** cards.
* **Steps**:
  1. Inspect the budget for *Research & Diagnostics Travel*.
  2. Observe the progress bar and percentage utilization.
* **Expected Result**:
  * Visual progress bar displays current spend vs. limit amount with remaining balance. Over-budget departments trigger an amber/red warning pill.

#### TC-FIN-04: General Ledger Double-Entry Preview
* **Pre-condition**: Select a finalized report in `/finance`.
* **Steps**:
  1. Click **Preview GL Journal Voucher**.
* **Expected Result**:
  * A balanced double-entry preview appears:
    * **Debit**: Expense accounts (Airfare, Lodging) with tax components.
    * **Credit**: Accounts Payable / Employee Reimbursement Clearing Account.
    * Debit total exactly equals Credit total with zero floating-point drift.

#### TC-FIN-05: Accounting Export to Zoho Books / Xero / Tally
* **Pre-condition**: Finalized reports in `/finance`.
* **Steps**:
  1. Click **Export to Zoho Books / ERP**.
* **Expected Result**:
  * Transactional outbox entry is created.
  * Status changes to `QUEUED` → `SYNCED`.
  * Provider reference ID and sync timestamp are recorded.

#### TC-FIN-06: Outbox Worker Error Recovery & Reconciliation
* **Pre-condition**: Simulated network failure or 429 rate limit from provider.
* **Steps**:
  1. Trigger an export under rate-limited conditions.
* **Expected Result**:
  * Outbox worker applies exponential backoff based on `Retry-After`.
  * If response is lost, status is marked `NEEDS_RECONCILIATION` to prevent duplicate ledger inserts.

#### TC-FIN-07: Decoupled Bank Reimbursement Settlement
* **Pre-condition**: Navigate to **Reimbursements** (`/reimbursements`).
* **Steps**:
  1. Locate an approved/finalized report in the settlement queue.
  2. Click **Record Bank Payout**:
     * Select Payment Method: `NEFT / RTGS` or `IMPS`.
     * Enter Bank Reference / UTR Number: `HDFC000192849201`.
     * Enter Settlement Date and confirm.
* **Expected Result**:
  * Reimbursement status moves to `PAID`.
  * Invariant: Approval and accounting export never automatically mark a claim as paid; only an explicit financial settlement action does.

#### TC-FIN-08: Partial Reimbursement Recording
* **Pre-condition**: A claim of `₹10,000.00` in `/reimbursements`.
* **Steps**:
  1. Record an initial payment installment of `₹6,000.00`.
  2. Check report status.
  3. Try to record a second installment of `₹5,000.00` (exceeding remaining balance by ₹1,000).
* **Expected Result**:
  * First payment moves status to `PARTIALLY_PAID` with remaining balance `₹4,000.00`.
  * Excess payment is rejected by server-side validation: *Total payouts cannot exceed eligible reimbursement amount*.

---

### TRACK 4: Company Owner / Tenant Admin (`COMPANY_OWNER` — Vikram Mehta)

#### TC-ADM-01: Tenant Profile & Indian Fiscal Year Setup
* **Pre-condition**: Switch persona to **Vikram Mehta (Owner)**. Navigate to **Settings** (`/settings`).
* **Steps**:
  1. Inspect the **Company Profile** card.
* **Expected Result**:
  * Legal Name: `Horizon Scientific India Ltd`.
  * GSTIN: `29AABCI1234F1Z5`.
  * Fiscal Year: `April 1 - March 31` (Standard Indian Fiscal Year).
  * Base Currency: `INR (₹)`.

#### TC-ADM-02: Organizational Hierarchy Management
* **Pre-condition**: In `/settings`, navigate to **Org Hierarchy** tab.
* **Steps**:
  1. Review Departments (`R&D`, `Diagnostics`, `Field Operations`) and Cost Centers (`CC-BIO-04`, `CC-OPS-01`).
* **Expected Result**:
  * Hierarchy displays correctly; works 100% standalone and is suite-ready for future KaaryaMitra HRMS sync.

#### TC-ADM-03: Expense Policy Engine Configuration
* **Pre-condition**: In `/settings`, navigate to **Expense Policies**.
* **Steps**:
  1. Review configured spending rules:
     * Daily Lodging Cap: `₹6,000/day`
     * Single Meal Cap: `₹1,500`
     * Receipt Mandatory Threshold: `₹1,000`
* **Expected Result**:
  * Rules are active and enforce warning/blocker flags during employee submission.

#### TC-ADM-04: Role-Based Admin Guide Gating
* **Pre-condition**: Compare access between Vikram Mehta (Owner) and Rahul Sharma (Employee).
* **Steps**:
  1. As Vikram Mehta, navigate to `/admin-guide`.
  2. As Rahul Sharma, navigate to `/admin-guide`.
* **Expected Result**:
  * Vikram Mehta views the full Tenant Admin Guide.
  * Rahul Sharma receives an **"Admin Guide Restricted"** security screen with a redirect to the User Guide.

#### TC-ADM-05: Accounting Integration Credentials Vault
* **Pre-condition**: Navigate to **Integrations** (`/integrations`).
* **Steps**:
  1. View connector configurations for Zoho Books, Xero, and Tally.
* **Expected Result**:
  * Client secrets and OAuth refresh tokens are masked and stored encrypted.
  * No credentials leaked in frontend console or network responses.

#### TC-ADM-06: Data Retention & Audit Minimization
* **Pre-condition**: In `/settings`, check the **Data Retention Policy** section.
* **Steps**:
  1. Inspect the 90-day minimization rule for unsubmitted draft receipts.
* **Expected Result**:
  * Immutable financial records (paid claims, journal vouchers) are exempt from deletion.
  * Draft minimization preview shows count of candidate records before purge.

---

### TRACK 5: Platform Super Admin (`PLATFORM_SUPER_ADMIN` — Ops Console)

#### TC-OPS-01: Platform Super Admin Console Navigation
* **Pre-condition**: Switch persona to **Platform Super Admin (Ops)**.
* **Steps**:
  1. Check the left sidebar for the **Platform Admin** navigation item (`/platform-admin`).
* **Expected Result**:
  * Platform Admin item is visible with an `Ops` badge. (Invisible to all other roles).

#### TC-OPS-02: Cross-Tenant Multi-Organization Directory
* **Pre-condition**: In `/platform-admin`.
* **Steps**:
  1. View the tenant directory table.
* **Expected Result**:
  * Displays all provisioned tenants (*Horizon Scientific India Ltd*, *Zenith Bio-Pharma*).
  * Shows tenant status, active seat counts, and monthly volume.

#### TC-OPS-03: System Infrastructure & Queue Health
* **Pre-condition**: In `/platform-admin`.
* **Steps**:
  1. Inspect the Platform Metrics cards.
* **Expected Result**:
  * Real-time indicators for Database Connection Pool (`Healthy`), Redis Outbox Queue (`0 backlog`), and Rate Limiting (`Nominal`).

#### TC-OPS-04: Cross-Tenant Data Isolation Invariant
* **Pre-condition**: Test API or tenant context isolation.
* **Steps**:
  1. Verify that tenant data queries strictly filter by `tenant_id` from the authenticated session token.
* **Expected Result**:
  * Tenant A cannot view, modify, or export Tenant B records even if UUIDs are known.

---

### TRACK 6: Developer API & Webhooks Platform (`/developer`)

#### TC-DEV-01: API Key Provisioning & Scopes
* **Pre-condition**: Navigate to **Developer API** (`/developer`).
* **Steps**:
  1. Inspect active API keys.
  2. Verify assigned scopes (e.g. `expenses:read`, `reports:write`, `accounting:export`).
* **Expected Result**:
  * API tokens are hashed. Secret is displayed only once upon generation.

#### TC-DEV-02: HMAC Outbound Webhook Verification
* **Pre-condition**: In `/developer`, check the Webhook Subscriptions section.
* **Steps**:
  1. Inspect an endpoint subscribed to `report.approved` and `reimbursement.paid`.
* **Expected Result**:
  * Webhook payload includes an `X-Vyay-Signature` header calculated using HMAC SHA-256.
  * Replay protection timestamp is included in header.

#### TC-DEV-03: OpenAPI 3.1 Specification Drift
* **Pre-condition**: Open `http://localhost:3000/api/docs` or view `openapi.json`.
* **Steps**:
  1. Verify that all endpoints in `/api/v1` are documented with typed request/response schemas.
* **Expected Result**:
  * OpenAPI 3.1 schema matches all live API routes without schema drift.

---

### TRACK 7: KaaryaMitra Design System, Theme & Accessibility

#### TC-UI-01: KaaryaMitra Dark Forest Sidebar
* **Steps**: Inspect the desktop sidebar layout.
* **Expected Result**:
  * Sidebar uses authentic dark forest background (`hsl(160, 35%, 12%)`) with crisp white text.
  * Navigation is structured into sections (*Expense Operations*, *Finance & Settlements*, *Settings & Platform*).
  * Active navigation item displays a vibrant KaaryaMitra lime indicator (`#A8E600`).

#### TC-UI-02: Mitra Product Suite Switcher
* **Steps**:
  1. In the sidebar, click **"Mitra Product Suite"**.
* **Expected Result**:
  * A dropdown opens listing the companion suite products (*VyayMitra [Active]*, *KaaryaMitra HRM*, *PraveshMitra Attendance*).

#### TC-UI-03: Theme Switching (Dark Mode & Light Mode)
* **Steps**:
  1. Click the **Sun / Moon** icon in the sidebar footer.
* **Expected Result**:
  * Smooth theme transition occurs.
  * In Light Mode: Background is crisp `0 0% 99%`, cards are pure white with subtle forest borders (`160 15% 88%`).
  * In Dark Mode: Background is deep forest `160 20% 6%`, primary elements highlight with vibrant lime (`#A8E600`).
  * Theme preference persists across page reloads in `localStorage`.

#### TC-UI-04: Keyboard Focus & Accessibility Skip Link
* **Steps**:
  1. Refresh the browser page and press the `Tab` key once.
* **Expected Result**:
  * A high-contrast **"Skip to main content"** button slides into view at the top-left.
  * Pressing `Enter` skips sidebar navigation and focuses the main page header.
  * All interactive buttons, inputs, and selects have visible focus rings (`focus-ring`).

#### TC-UI-05: Responsive Mobile Navigation
* **Steps**:
  1. Resize browser window to mobile width (< 768px).
* **Expected Result**:
  * Desktop sidebar hides cleanly.
  * Mobile header appears with brand icon and hamburger menu toggle.
  * Clicking hamburger opens the dark forest slide-over drawer with full navigation links.

---

## 3. Automated Invariant Test Execution Commands

Run these terminal commands within `d:\Antigravity\VyayMitra` to execute the automated test gates:

```powershell
# 1. Vitest Unit Tests (Contracts, Integrations & Money Math)
pnpm test:unit

# 2. Package Typechecks
pnpm --filter @vyay/ui typecheck
pnpm --filter @vyay/web typecheck

# 3. Production Bundle Build
pnpm --filter @vyay/ui build
pnpm --filter @vyay/web build

# 4. API Backend Tests (Security, Tenancy, Approvals & Zoho)
pnpm --filter @vyay/api test

# 5. Security & Multi-Tenant Negative Tests
pnpm --filter @vyay/api test:security
```
