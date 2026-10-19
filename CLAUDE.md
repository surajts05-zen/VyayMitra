# Project instructions for Claude Code

Follow `EXPENSE_PLATFORM_BLUEPRINT.md` as the product and architecture specification, and `CODEX_CLAUDE_MASTER_PROMPT.md` as the implementation order and delivery contract.

Begin with M0 (repo inspection, modular monolith foundation, tenancy/security architecture, shared KaaryaMitra/PravesMitra-family design tokens, migrations, runnable frontend/backend and tests) unless it is already demonstrably complete. At the end of each milestone include real test output and a concise status report. Build full vertical slices; protect financial integrity, approvals/reimbursements separation, tenant isolation, encrypted Zoho OAuth credentials and retry-safe accounting sync. Do not fake production integrations.

Local setup must not require Docker. Use only synthetic fixture data and placeholder secrets.
