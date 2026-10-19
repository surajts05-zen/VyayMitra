# VyayMitra — Accounting Provider Mapping Reference (Zoho Books)

## 1. Domain Object Mappings

| VyayMitra Local Object | Zoho Books Target Object | Notes & Strategy |
|---|---|---|
| `categories` (e.g. Travel, Meals) | Chart of Accounts (`account_id`) | Sub-type: Expense account (`account_type = "expense"`) |
| `paid_by` (e.g. Petty Cash, Bank) | Paid Through Account (`paid_through_account_id`) | Sub-type: Cash or Bank account |
| `tax_components` (CGST, SGST, IGST) | Taxes (`tax_id`) | Must match tax rate and name defined in Zoho organization |
| `merchant` | Contacts / Vendors (`vendor_id`) | Optional matching by GSTIN or name; falls back to default vendor |
| `projects` | Projects (`project_id`) | Mapped when project module is enabled on Zoho Books plan |
| `employees` | Employees / Vendors | Reimbursement liability routing account |

## 2. Posting Modes
- **Expense Mode (`/expenses`):** Used when the expense was paid out of company funds directly (petty cash, corporate card).
- **Bill Mode (`/bills`):** Used when employee reimbursable claims create an accounts payable liability to the employee.
- **Journal Mode (`/journalentries`):** Alternative batch posting for multi-line allocations and GST tax credits.

## 3. Rate Limits & Quotas
- **Zoho Books API Quota:** 100 requests / minute per organization.
- **Throttling:** Local token bucket limiter caps requests at 90 req/min per connection to avoid 429 boundaries.
- **Header Inspection:** Monitor `X-Rate-Limit-Remaining` and `Retry-After`.
