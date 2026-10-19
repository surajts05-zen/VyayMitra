# VyayMitra — Company Administrator Complete Operating Guide

**Target Audience:** Tenant Owner (`COMPANY_OWNER`), Company Administrator (`COMPANY_ADMIN`), and Finance Administrator (`FINANCE_ADMIN`).  
**Version:** 1.0 · **Platform Baseline:** M0–M7 Enterprise Edition  

---

## Table of Contents
1. [Overview & Administrator Responsibilities](#1-overview--administrator-responsibilities)
2. [Step 1: Tenant Organization & Legal Profile Setup](#2-step-1-tenant-organization--legal-profile-setup)
3. [Step 2: Department, Cost Center & Org Hierarchy Configuration](#3-step-2-department-cost-center--org-hierarchy-configuration)
4. [Step 3: Employee Directory, Roles & Onboarding](#4-step-3-employee-directory-roles--onboarding)
5. [Step 4: Expense Categories & General Ledger (GL) Coding](#5-step-4-expense-categories--general-ledger-gl-coding)
6. [Step 5: Policy Engine Rules & Multi-Stage Approvals](#6-step-5-policy-engine-rules--multi-stage-approvals)
7. [Step 6: Finance Review, Budgets & Reimbursement Payouts](#7-step-6-finance-review-budgets--reimbursement-payouts)
8. [Step 7: Connecting Zoho Books Accounting Sync](#8-step-7-connecting-zoho-books-accounting-sync)
9. [Step 8: Public Developer API & Outbound Webhooks](#9-step-8-public-developer-api--outbound-webhooks)
10. [Step 9: Security, Compliance & Data Retention Protocol](#10-step-9-security-compliance--data-retention-protocol)
11. [Step 10: Operational Backups & Disaster Recovery Drills](#11-step-10-operational-backups--disaster-recovery-drills)
12. [Troubleshooting & Support Escalation](#12-troubleshooting--support-escalation)

---

## 1. Overview & Administrator Responsibilities

As a Company Administrator in VyayMitra, you hold full authority over your tenant organization's expense lifecycle, corporate policy configuration, chart-of-accounts mapping, user directory, and external accounting integrations.

### Invariant Rules to Remember
- **Strict Separation of Three States:**
  - `APPROVED` $\neq$ `EXPORTED` $\neq$ `REIMBURSED`.
  - An approved report is **not paid**. An exported report to Zoho Books is **not paid**. Reimbursement requires a separate financial payment registration.
- **Segregation of Duties:**
  - No employee or manager may ever approve their own expense report (`CannotSelfApproveException`).
  - Company owners and admins cannot bypass segregation rules unless an explicit out-of-office delegation is active.
- **Multi-Tenant Isolation:**
  - Your organization's expenses, bank accounts, and receipts are strictly isolated by your tenant UUID. Never share API tokens or service credentials across organizations.

---

## 2. Step 1: Tenant Organization & Legal Profile Setup

Navigate to **Settings &rarr; Company & Fiscal Profile** (`/settings`):

1. **Verify Legal Entity Details:**
   - **Company Legal Name:** Registered name of the company (e.g., `Horizon Scientific India Private Limited`).
   - **Base Currency:** System reporting currency (e.g., `INR (₹)`). All line items are converted to this currency for financial posting and budget tracking.
   - **Timezone:** Regional operating timezone (e.g., `Asia/Kolkata (UTC+5:30)`).
   - **Fiscal Year Start Month:** Indian fiscal year begins in month `4` (April 1 to March 31).
2. **Statutory Tax Identification:**
   - Enter your corporate **GSTIN** (Goods and Services Tax Identification Number, e.g. `29AABCH9812K1Z9`).
   - This ensures tax breakdowns (CGST/SGST for intrastate, IGST for interstate) default correctly on extracted receipts.
3. **Tenant Branding:**
   - Provide your corporate logo URL. This logo will display on the top left navigation bar alongside the VyayMitra companion mark.

---

## 3. Step 2: Department, Cost Center & Org Hierarchy Configuration

Navigate to **Settings &rarr; Org Reporting Tree**:

1. **Create Departments:**
   - Establish operational business units: `Research & Development`, `Sales & Marketing`, `Finance & Operations`, `Human Resources`, `Executive Office`.
2. **Assign Department Heads:**
   - Each department should have a designated department head responsible for second-tier approval escalations when expense reports exceed direct manager thresholds.
3. **Cost Centers & Projects:**
   - Assign numeric cost center codes (e.g., `CC-101 (R&D Labs)`, `CC-204 (Field Sales)`).
   - Create project codes (e.g., `PRJ-CLINICAL-01`, `PRJ-INDIA-EXP`) to enable granular expense attribution and budget tracking.

---

## 4. Step 3: Employee Directory, Roles & Onboarding

Navigate to **Settings &rarr; Access & Invitations** and **Employee Directory**:

### Role Hierarchy Matrix

| Role | Intended User | Key Permissions |
|---|---|---|
| `COMPANY_OWNER` | Founder / CEO / Primary Admin | Full tenant configuration, legal profile, accounting sync, user roles, retention overrides. |
| `COMPANY_ADMIN` | Operations Director / VP | Team invitations, category management, policy rules, budget allocations. |
| `FINANCE_ADMIN` | Chief Financial Officer / Head of Accounts | Banking methods, GL mapping, policy thresholds, accounting connection setup. |
| `FINANCE_OPERATOR` | Senior Accountant / AP Executive | Documentation verification, GL coding review, reimbursement payment recording, Zoho batch exports. |
| `MANAGER` | Team Lead / Department Head | Pending approval inbox, request changes, approve or reject subordinate claims. Cannot self-approve. |
| `EMPLOYEE` | Individual Staff Member | Create expenses, receipt scanning, submit expense reports, view reimbursement status. |
| `AUDITOR` | Internal / External Compliance Officer | Read-only access to immutable event ledger, reports, and tax receipts. |
| `DELEGATED_APPROVER` | Temporary Substitute Approver | Acting approver within a time-bounded window. Cannot self-approve. |

### Onboarding New Staff
1. **Direct Invitation:**
   - Enter employee email, legal name, department, and role.
   - Click **Send Invitation**. The employee receives a secure, time-limited join link.
2. **Manager Linkage:**
   - Assign each employee a direct manager in the directory. The multi-stage approval engine automatically routes submitted reports to this manager.
3. **Soft-Deactivation Protocol:**
   - When an employee departs, click **Deactivate Employee**.
   - **Never delete finance history:** Soft deactivation prevents future logins while preserving all past submitted vouchers, approval logs, and tax invoices for statutory compliance.

---

## 5. Step 4: Expense Categories & General Ledger (GL) Coding

Navigate to **Settings &rarr; Categories & GL Mappings**:

Every expense must be coded to a valid Category with an associated General Ledger (GL) account code.

### Recommended Baseline Categories

| Category Name | Code | Suggested GL Account | Default Tax | Receipt Required? | Single Item Limit |
|---|---|---|---|:---:|---|
| Travel & Flights | `TRAVEL_FLIGHT` | `60100 - Domestic Airfare` | 18% IGST | Yes | ₹75,000 |
| Hotel & Lodging | `HOTEL_LODGING` | `60105 - Hotel & Accommodation` | 12% GST | Yes | ₹15,000 |
| Meals & Entertainment | `MEALS` | `60200 - Business Meals & Per Diem` | 5% GST | No (if < ₹500) | ₹3,000 |
| Laboratory Consumables | `LAB_SUPPLIES` | `50300 - R&D Direct Materials` | 18% GST | Yes | ₹100,000 |
| Local Transport & Cabs | `LOCAL_TRANSPORT`| `60110 - Local Taxi & Tolls` | 5% GST | No (if < ₹250) | ₹2,500 |
| Client Entertainment | `ENTERTAINMENT` | `60210 - Client Hospitality` | 18% GST | Yes | ₹10,000 |

- **Receipt Threshold:** Enable "Receipt Required" for categories where physical or digital vouchers are legally required for input tax credit.
- **GL Account Code:** Ensure these codes match your accounting system's chart of accounts (e.g. Zoho Books or Tally).

---

## 6. Step 5: Policy Engine Rules & Multi-Stage Approvals

Navigate to **Approvals** (`/approvals`):

### Deterministic Policy Violations
The policy engine evaluates every expense line item upon submission:
1. **Category Ceiling:** Warns or blocks expenses exceeding category maximums.
2. **Missing Receipt Threshold:** Flags expenses above ₹1,000 lacking attachment.
3. **Weekend / Holiday Spend:** Flags expenses incurred on non-working days for manager review.
4. **Duplicate Detection:**
   - **Exact Duplicate:** Identical SHA-256 file hash on receipts.
   - **Fuzzy Duplicate:** Same merchant, date, amount ($\pm$2%), and currency within 48 hours.

### Approval Routing Flow
```text
DRAFT -> SUBMITTED -> IN_REVIEW (Manager) -> APPROVED -> FINANCE_REVIEW -> FINALIZED
                         |                      |
                 CHANGES_REQUESTED           REJECTED
```
- **Sequential Multi-Stage:** Reports exceeding ₹50,000 automatically escalate from Direct Manager to Department Head before reaching Finance.
- **Delegation Rules:** If an approver goes on leave, configure a temporary delegate with specific start and end dates. Delegated actions are permanently tagged with the acting approver's ID.

---

## 7. Step 6: Finance Review, Budgets & Reimbursement Payouts

Navigate to **Finance Review** (`/finance`) and **Reimbursements** (`/reimbursements`):

### 1. Finance Review Queue
Before any payout, a `FINANCE_OPERATOR` must inspect approved reports:
- Verify invoice tax eligibility (CGST/SGST/IGST breakdown).
- Verify GL account coding and cost center attribution.
- Click **Validate & Approve for Payout**. The report transitions to `FINANCE_REVIEW` &rarr; `FINALIZED`.

### 2. Department & Project Budgets
- Set quarterly or annual budget caps per department or project.
- **Three-Tier Visibility:** Monitor `Actual Spent` vs `Approved Pending Payment` vs `Available Balance`.
- Configurable budget action: Warn manager at 85% utilization; block submission at 100%.

### 3. Recording Reimbursements (Payment Execution)
- Click **Record Reimbursement**.
- **Supported Payment Rails:**
  - `NEFT_RTGS` (Bank Wire Transfer)
  - `UPI` (Instant Corporate VPA Payout)
  - `CORPORATE_CARD` (Direct Company Clearing)
  - `PAYROLL_BATCH` (End-of-Month Payroll Credit)
- **Mandatory Payment Reference:** Record the banking transaction UTR or reference number (e.g., `UTR20261019001928`).
- **Partial Reimbursements:** If an employee submitted ₹12,000, but only ₹10,000 is authorized, enter `₹10,000`. The report marks status as `PARTIALLY_PAID` with remaining balance tracked automatically.

---

## 8. Step 7: Connecting Zoho Books Accounting Sync

Navigate to **Integrations** (`/integrations`):

### Integration Workflow
1. **OAuth Connection:**
   - Select your Zoho Books regional domain:
     - `.in` (India Data Center - Default)
     - `.com` (US / Global)
     - `.eu` (European Union)
     - `.com.au` (Australia)
   - Click **Connect with Zoho Books** and authorize the requested scopes (`ZohoBooks.expenses.CREATE`, `ZohoBooks.settings.READ`).
2. **Select Zoho Organization:**
   - Pick your corporate Zoho Books organization ID from the dropdown list.
3. **Chart of Accounts & Tax Mapping:**
   - Map VyayMitra expense categories to active Zoho expense accounts.
   - Map Indian GST tax rates (5%, 12%, 18%, 28%) to Zoho Tax Authority IDs.
4. **Dry-Run Validation:**
   - Click **Run Dry-Run Export**. The platform validates all account mappings and payload structures without creating real ledger entries in Zoho Books.
5. **Batch Financial Export:**
   - Finalized reports can be exported individually or in monthly batches.
   - **Idempotency Guarantee:** VyayMitra generates unique deterministic idempotency keys (`vyay_rep_{id}_{hash}`) to prevent duplicate ledger postings even after network timeouts.
   - If Zoho Books returns HTTP 429, the system applies exponential backoff with `Retry-After` headers.
   - If a network partition occurs mid-flight, the record flags `NEEDS_RECONCILIATION` for manual review.

---

## 9. Step 8: Public Developer API & Outbound Webhooks

Navigate to **Developer API** (`/developer`):

For automated integrations with your internal ERP, HRM, or custom scripts:

### 1. Machine-to-Machine (M2M) API Credentials
- Click **Create API Credential**.
- Select scopes: `expenses:read`, `expenses:write`, `reports:read`, `reports:write`, `reimbursements:read`.
- **Secret Storage:** The generated `client_secret` is shown **only once**. Save it in your enterprise vault.
- **Authentication:** Exchange credentials via `POST /api/v1/auth/token` with `grant_type: client_credentials`.

### 2. Outbound Webhooks
Subscribe your internal systems to real-time financial lifecycle events:
- `expense.created` / `expense.updated`
- `report.submitted` / `report.approved` / `report.rejected`
- `reimbursement.recorded`
- `accounting.sync_succeeded` / `accounting.sync_failed`

#### Verifying Webhook Signatures
Every webhook delivery includes the `X-VyayMitra-Signature` header computed as:
```text
signature = "v1=" + HMAC-SHA256(webhook_secret, timestamp + "." + payload)
```
Verify this signature on your endpoint to protect against spoofing and replay attacks.

---

## 10. Step 9: Security, Compliance & Data Retention Protocol

Navigate to **Settings &rarr; Data Retention & Compliance (M7)**:

### 1. 90-Day OCR Payload Redaction
To protect privacy and minimize PII exposure, raw OCR payloads from third-party vision providers can be purged 90 days after review:
- Click **Generate Redaction Preview**.
- Inspect candidate OCR records. A short-lived execution token (`retention_preview_...`) is generated.
- **Statutory Exclusions (Immutable Protection):**
  - Section 128 of the Indian Companies Act and Rule 28 of GST statutory compliance mandate preserving financial vouchers, tax invoices, and payment proof for **8 fiscal years**.
  - VyayMitra automatically and permanently excludes all tax-deductible invoices, GL vouchers, and reimbursement proofs from automated deletion.
- Enter the confirmation phrase `PURGE-ELIGIBLE-OCR-PAYLOADS` to execute payload redaction.

### 2. Rate Limiting & Brute Force Defense
- Authentication endpoints enforce strict rate limits (10 attempts per minute). Exceeded limits return `429 Too Many Requests` with a `Retry-After: 60` response header and request correlation ID.

---

## 11. Step 10: Operational Backups & Disaster Recovery Drills

Company Administrators collaborating with platform DevOps should schedule regular disaster recovery validation drills:

### Database Backup & Verification Commands

1. **Take PostgreSQL Snapshot:**
   ```powershell
   ./scripts/backup-postgres.ps1 -OutputDir "./backups"
   ```
2. **Verify Backup Validity (Isolated Staging Restore Drill):**
   ```powershell
   ./scripts/verify-restore.ps1 -BackupFile "./backups/vyaymitra_backup_latest.sql"
   ```
   *Note: A backup is never considered reliable until it has been successfully restored into a scratch database and verified.*

---

## 12. Troubleshooting & Support Escalation

| Issue | Root Cause | Recommended Action |
|---|---|---|
| **Employee reports cannot self-approve error** | System prevents self-approval by design. | Have employee submit report to designated direct manager or assign an independent approver. |
| **Receipt upload rejected** | File type or magic-byte mismatch. | Upload valid PDF, PNG, or JPEG under 10 MB. Avoid password-protected PDFs. |
| **Zoho Books sync returns `NEEDS_RECONCILIATION`** | Network timeout during invoice transmission. | Open **Integrations &rarr; Audit Logs**, check transaction reference, verify in Zoho Books ledger before clicking Re-sync. |
| **Session expired immediately after password reset** | Platform Super Admin reset password. | The employee must log in using their new temporary password; prior JWT sessions are terminated for security. |
| **Negative available budget warning** | Department spend ceiling exceeded. | Review budget utilization under **Finance &rarr; Budgets**; adjust quarterly allocation if approved by management. |

---

*VyayMitra Expense Management Platform · Enterprise Edition · Built for Complete Financial Integrity*
