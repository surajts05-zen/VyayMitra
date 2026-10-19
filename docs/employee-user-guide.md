# VyayMitra — Employee & User Guide

**Target Audience:** All Employees, Team Members, and Approvers submitting or tracking expense claims.  
**Platform Version:** 1.0 Enterprise Edition  

---

## Table of Contents
1. [Welcome to VyayMitra](#1-welcome-to-vyaymitra)
2. [Step 1: Signing In & Accessing Your Workspace](#2-step-1-signing-in--accessing-your-workspace)
3. [Step 2: Creating an Expense (Manual Entry)](#3-step-2-creating-an-expense-manual-entry)
4. [Step 3: Uploading Receipts & Verifying OCR Suggestions](#4-step-3-uploading-receipts--verifying-ocr-suggestions)
5. [Step 4: Mileage, Transport & Per-Diem Claims](#5-step-4-mileage-transport--per-diem-claims)
6. [Step 5: Grouping Expenses into an Expense Report](#6-step-5-grouping-expenses-into-an-expense-report)
7. [Step 6: Policy Checks & Resolving Warnings](#7-step-6-policy-checks--resolving-warnings)
8. [Step 7: Submitting for Approval & Tracking Progress](#8-step-7-submitting-for-approval--tracking-progress)
9. [Step 8: Handling Changes Requested by Your Manager](#9-step-8-handling-changes-requested-by-your-manager)
10. [Step 9: Understanding Report Status vs Reimbursement Payout](#10-step-9-understanding-report-status-vs-reimbursement-payout)
11. [Frequently Asked Questions (FAQ)](#11-frequently-asked-questions-faq)

---

## 1. Welcome to VyayMitra

VyayMitra is your organization's digital expense management platform. It allows you to quickly capture receipts, submit business expenses, track managerial approvals, and receive timely reimbursements directly to your bank account.

### Golden Rules for Submitting Expenses
- **Always Attach Clear Receipts:** Make sure vendor name, invoice date, amount, and tax breakdown (CGST/SGST/IGST) are clearly visible.
- **Review Before Submitting:** OCR automatically scans your receipts and fills in data, but you must verify the numbers before submitting.
- **Approval is Not Payment:** An `APPROVED` report has cleared managerial check, but cash payout happens in the separate `REIMBURSED` stage.

---

## 2. Step 1: Signing In & Accessing Your Workspace

1. Open your browser and navigate to your company's VyayMitra portal.
2. Sign in using your corporate email address and password (or your company's Single Sign-On / Google workspace).
3. Upon logging in, you will land on **My Dashboard** (`/dashboard`), where you can see:
   - Quick action to **Create Expense**.
   - Your recent draft expenses.
   - Submitted reports pending approval.
   - Payout reimbursement history.

---

## 3. Step 2: Creating an Expense (Manual Entry)

Navigate to **My Expenses** (`/expenses`) &rarr; click **Create Expense**:

1. **Merchant / Vendor:** Enter the name of the establishment (e.g., `IndiGo Airlines`, `Chilis Bar & Grill`, `Uber India`).
2. **Spent Date:** Select the date the expense was incurred.
3. **Amount & Currency:** Enter the exact transaction amount. VyayMitra calculates exact decimal precision (no rounding errors).
4. **Category:** Choose the appropriate category (e.g., *Meals & Entertainment*, *Local Transport*, *Hotel & Lodging*, *Software*).
5. **Business Purpose:** Provide a clear, brief explanation (e.g., *Client lunch with BioHealth team to review Phase 2 trial contract*).
6. **Cost Center / Project (Optional):** If your company allocates spend to specific projects or departments, select the project code.
7. Click **Save as Draft**.

---

## 4. Step 3: Uploading Receipts & Verifying OCR Suggestions

VyayMitra features automated optical character recognition (OCR) to extract invoice data instantly:

1. **Upload File:** Drag and drop your receipt image (`PNG`, `JPEG`, or `PDF` up to 10 MB) or tap **Upload Receipt** on mobile to take a camera picture.
2. **Instant Scanning:** The platform scans the document and automatically pre-fills:
   - Merchant Name
   - Invoice Date
   - Total Amount & Currency
   - Tax Breakdown (CGST, SGST, IGST)
   - Vendor GSTIN (if detected)
3. **Review Extracted Data:**
   - Look at the receipt preview side-by-side with the pre-filled fields.
   - If the scanner misread any number (e.g. ₹1,250 instead of ₹1,200), adjust the field manually.
   - Click **Confirm Extracted Data**.

> **Note on Security:** All receipts are stored with SHA-256 integrity checksums to prevent file tampering and duplicate submissions.

---

## 5. Step 4: Mileage, Transport & Per-Diem Claims

For local taxi rides, personal vehicle mileage, or daily meal allowances:

1. **Local Transport / Cabs:**
   - Upload your Uber, Ola, or taxi receipt.
   - Select category `Local Transport & Cabs`.
   - Enter pickup and drop-off locations in the business purpose.
2. **Per-Diem Meal Allowances:**
   - For travel days where physical food bills are not collected, select `Meals & Per Diem`.
   - Per-diem claims within company daily caps do not require individual food receipts.

---

## 6. Step 5: Grouping Expenses into an Expense Report

Individual draft expenses must be grouped into an **Expense Report** to be submitted for approval:

1. Navigate to **My Reports** (`/reports`) &rarr; click **New Expense Report**.
2. **Report Title:** Enter a descriptive name (e.g., *Oct 2026 Mumbai Client Meetings & Flight*).
3. **Business Purpose & Trip Period:** Describe the overall purpose and date range.
4. **Attach Draft Expenses:**
   - Check the boxes next to the draft expenses you want to include in this report.
   - You can see the running total amount update in real time.
5. Click **Create Report**. Your report is now in `DRAFT` status.

---

## 7. Step 6: Policy Checks & Resolving Warnings

When drafting or submitting a report, VyayMitra automatically evaluates company spending rules:

| Policy Check | Meaning | What to do |
|---|---|---|
| **Category Limit Exceeded** | Line item amount exceeds standard ceiling. | Add an explanatory note in business purpose for manager review. |
| **Missing Receipt** | Category requires a receipt, but none is attached. | Upload a voucher or attach a written justification. |
| **Weekend / Holiday Spend** | Transaction incurred on non-working day. | Clarify if emergency weekend travel or client hospitality was required. |
| **Duplicate Detected** | Same merchant, date, and amount was already submitted. | Verify if you accidentally submitted the same bill twice. Remove if duplicate. |

---

## 8. Step 7: Submitting for Approval & Tracking Progress

Once your report is complete and all receipts are verified:

1. Click **Submit Report**.
2. **Automatic Manager Routing:**
   - Your report is automatically forwarded to your direct manager's pending queue (`IN_REVIEW`).
   - If your report exceeds ₹50,000, it will automatically escalate to your Department Head after your direct manager approves.
3. **Tracking Progress:**
   - In **My Reports**, you can view the live progress bar:
     `DRAFT` &rarr; `SUBMITTED` &rarr; `IN_REVIEW` &rarr; `APPROVED` &rarr; `FINANCE_REVIEW` &rarr; `FINALIZED`

---

## 9. Step 8: Handling Changes Requested by Your Manager

If your manager needs clarification or adjustments before approval:

1. The report status will change to `CHANGES_REQUESTED`.
2. Open the report to read your manager's specific comments (e.g., *"Please attach the hotel itemized tax invoice instead of the credit card slip"*).
3. Update the line items, upload the requested document, or reply with clarification.
4. Click **Resubmit Report**. It returns directly to your manager for final sign-off.

---

## 10. Step 9: Understanding Report Status vs Reimbursement Payout

A common point of confusion is assuming an approved report is already paid. VyayMitra maintains three separate lifecycles:

```text
[Approval Flow]      SUBMITTED -> IN_REVIEW -> APPROVED -> FINANCE_REVIEW -> FINALIZED
[Reimbursement Flow] NOT_READY -> ELIGIBLE  -> SCHEDULED -> PARTIALLY_PAID -> PAID
```

### Reimbursement Statuses Explained
- **`ELIGIBLE`:** Manager has approved the claim; waiting for finance department validation and bank scheduling.
- **`SCHEDULED`:** Finance has approved the payout and queued it for the next bank transfer or payroll cycle.
- **`PARTIALLY_PAID`:** A partial disbursement was made (e.g., ₹10,000 paid while ₹2,000 is under review). The remaining balance is tracked.
- **`PAID`:** The reimbursement has been executed. Check the report details to see your **Bank Transaction UTR Number** and payment date.

---

## 11. Frequently Asked Questions (FAQ)

### Can I approve my own expense report?
**No.** Under company governance and platform segregation-of-duties rules, self-approval is strictly blocked (`CannotSelfApproveException`). All claims must be approved by an authorized manager.

### What file formats are accepted for receipts?
`PDF`, `JPEG`, and `PNG` files up to **10 MB**. Password-protected PDFs cannot be scanned by OCR; please upload unencrypted documents.

### How soon will I receive my reimbursement after approval?
Reimbursement schedules depend on your company's finance calendar (usually weekly NEFT batches or monthly payroll credit). Check the **Reimbursements** tab to view scheduled payment dates.

### What should I do if I lost my receipt?
Contact your manager or finance team. If permitted by company policy, select the category, note *Receipt Missing - lost physical slip* in the business purpose, and provide vendor proof if available.

---

*VyayMitra Expense Management Platform · Enterprise Edition · Seamless Expense Experience*
