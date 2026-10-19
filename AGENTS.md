# Repository instructions for Codex and compatible coding agents

Read `EXPENSE_PLATFORM_BLUEPRINT.md` and `CODEX_CLAUDE_MASTER_PROMPT.md` before modifying this application. They are authoritative for functional scope, delivery order, multi-tenant security, accounting/reimbursement semantics, design language and test gates.

Start at milestone M0 unless a prior milestone is verifiably implemented with passing tests. Work in complete runnable vertical slices (migrations, API, UI, tests, docs). Do not replace actual domain logic with mock-only success paths, do not expose OAuth credentials, never bypass tenant/role checks, and do not mark approval or accounting export as actual reimbursement.

Before each milestone, state implementation steps. After each milestone report changed files, executed test commands and their actual outcomes, remaining issues and next dependencies. Never claim live Zoho Books integration passed without an authorized sandbox call and observed ledger record.

Keep the app locally runnable without Docker. Preserve backward compatibility of `/api/v1` endpoints and maintain OpenAPI documentation and negative security tests.
