import React, { useState } from 'react';
import {
  BookOpen,
  Building2,
  Users,
  Tag,
  CheckSquare,
  Landmark,
  Layers,
  Code2,
  ShieldCheck,
  Database,
  ArrowRight,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface GuideStep {
  id: string;
  stepNumber: string;
  title: string;
  icon: React.ReactNode;
  category: string;
  summary: string;
  actionUrl?: string;
  actionLabel?: string;
  details: string[];
  keyRules: string[];
}

export const CompanyAdminGuidePage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  const steps: GuideStep[] = [
    {
      id: 'step-1',
      stepNumber: 'Step 01',
      title: 'Tenant Organization & Statutory Legal Profile',
      icon: <Building2 className="w-5 h-5 text-emerald-600" />,
      category: 'Setup & Entity',
      summary: 'Establish legal entity name, corporate base currency, Indian fiscal year calendar, and GSTIN registration.',
      actionUrl: '/settings',
      actionLabel: 'Go to Company Profile',
      details: [
        'Navigate to Settings -> Company & Fiscal Profile.',
        'Enter registered legal entity name (e.g., Horizon Scientific India Pvt Ltd).',
        'Set Base Currency to INR (₹) and Fiscal Year start month to 4 (April 1 to March 31).',
        'Input your 15-digit GSTIN (e.g., 29AABCH9812K1Z9) to default CGST/SGST and IGST rules correctly on OCR extractions.',
        'Upload your tenant company logo to display alongside the VyayMitra companion product mark.',
      ],
      keyRules: [
        'Base currency conversion snapshots are taken at the moment an expense is incurred.',
        'Company legal details appear on all generated reimbursement payment vouchers.',
      ],
    },
    {
      id: 'step-2',
      stepNumber: 'Step 02',
      title: 'Departments, Cost Centers & Reporting Tree',
      icon: <Users className="w-5 h-5 text-sky-600" />,
      category: 'Org Structure',
      summary: 'Set up business departments, allocate cost center codes, and designate department heads for escalation.',
      actionUrl: '/settings',
      actionLabel: 'Configure Org Hierarchy',
      details: [
        'Create core departments: R&D, Sales, Finance, Operations, Executive Office.',
        'Assign a Department Head for each unit to handle second-tier approvals when claims exceed direct manager limits.',
        'Define Cost Center numbers (e.g., CC-101) and Project Codes (e.g., PRJ-CLINICAL-01) for granular spend attribution.',
      ],
      keyRules: [
        'Every employee must belong to exactly one primary department for budget aggregation.',
        'Org hierarchy functions 100% standalone and does not require KaaryaMitra HRM coupling.',
      ],
    },
    {
      id: 'step-3',
      stepNumber: 'Step 03',
      title: 'Employee Directory, Roles & Onboarding',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-600" />,
      category: 'User Directory',
      summary: 'Invite staff, assign role permissions, map manager reporting relationships, and handle soft deactivations.',
      actionUrl: '/settings',
      actionLabel: 'Manage Directory & Invites',
      details: [
        'Invite new employees with role, department, employee number, and direct manager.',
        'Employees receive secure, time-limited join tokens via email.',
        'Assign appropriate RBAC roles: EMPLOYEE, MANAGER, FINANCE_OPERATOR, FINANCE_ADMIN, COMPANY_ADMIN, or AUDITOR.',
        'When an employee departs, use Soft Deactivation: logins are revoked immediately while preserving all statutory audit and finance records.',
      ],
      keyRules: [
        'Never permanently delete financial history of departed staff (Companies Act Section 128 compliance).',
        'Managers are assigned individually to establish automatic submission routing.',
      ],
    },
    {
      id: 'step-4',
      stepNumber: 'Step 04',
      title: 'Expense Categories & General Ledger (GL) Mappings',
      icon: <Tag className="w-5 h-5 text-amber-600" />,
      category: 'Accounting Codes',
      summary: 'Define expense categories, link them to General Ledger accounts, and configure receipt threshold ceilings.',
      actionUrl: '/settings',
      actionLabel: 'Manage Categories & GL',
      details: [
        'Configure categories: Domestic Flights, Hotel Lodging, Meals & Per Diem, Lab Supplies, Local Transport.',
        'Map each category to its exact Chart of Accounts code (e.g. 60100 - Domestic Airfare, 50300 - Direct Materials).',
        'Set receipt requirement policy: enforce attachments for high-value purchases (e.g. mandatory if > ₹1,000).',
        'Configure default GST tax rates (5%, 12%, 18%, 28%) for automated invoice line-item extraction.',
      ],
      keyRules: [
        'Financial decimal arithmetic (Decimal.js) is enforced on all categories—zero floating point drift.',
        'Expenses without receipts in receipt-mandatory categories are flagged by the policy engine.',
      ],
    },
    {
      id: 'step-5',
      stepNumber: 'Step 05',
      title: 'Policy Engine Rules & Multi-Stage Approvals',
      icon: <CheckSquare className="w-5 h-5 text-purple-600" />,
      category: 'Approval Workflow',
      summary: 'Enforce category limits, holiday spending alerts, duplicate detection, and sequential manager approvals.',
      actionUrl: '/approvals',
      actionLabel: 'View Approval Workflow',
      details: [
        'Configure deterministic policy rules: Daily ceilings, missing receipt warnings, weekend spend flags.',
        'Exact duplicate detection flags identical SHA-256 file hashes; fuzzy detection flags same merchant/date/amount within 48h.',
        'Sequential Approval Routing: Direct Manager review -> Department Head escalation (> ₹50,000) -> Finance Review.',
        'Delegated Approvals: Assign time-bounded proxy approvers for out-of-office periods with logged acting actor audit.',
      ],
      keyRules: [
        'Strict Segregation of Duties: No employee can approve their own report (CannotSelfApproveException).',
        'Approval steps are immutable—record actor, rule version, decision, rationale, and timestamp.',
      ],
    },
    {
      id: 'step-6',
      stepNumber: 'Step 06',
      title: 'Finance Review, Budgets & Reimbursement Payouts',
      icon: <Landmark className="w-5 h-5 text-emerald-600" />,
      category: 'Finance & Payments',
      summary: 'Audit tax invoices, check quarterly budgets, record partial payouts, and register banking payment references.',
      actionUrl: '/finance',
      actionLabel: 'Open Finance Review Queue',
      details: [
        'Finance Review: Verify tax invoice eligibility, GL account coding, and cost center attribution.',
        'Quarterly Budgets: Track reserved vs approved vs actual cash spent; warn at 85% and block at 100%.',
        'Record Payouts: Choose payment method (NEFT/RTGS, UPI, Corporate Card, Payroll Batch) and capture UTR reference.',
        'Partial Reimbursements: Record partial disbursements (e.g. ₹10,000 paid out of ₹12,000 eligible); remainder is tracked.',
      ],
      keyRules: [
        'APPROVED != EXPORTED != REIMBURSED. Approval is not proof of bank payout.',
        'Financial exports to accounting systems are strictly separate from banking money movement.',
      ],
    },
    {
      id: 'step-7',
      stepNumber: 'Step 07',
      title: 'Connecting Zoho Books Accounting Synchronization',
      icon: <Layers className="w-5 h-5 text-blue-600" />,
      category: 'Accounting Sync',
      summary: 'Connect regional Zoho OAuth (.in, .com, .eu), map Chart of Accounts, validate dry-runs, and export batches safely.',
      actionUrl: '/integrations',
      actionLabel: 'Configure Zoho Books Sync',
      details: [
        'OAuth 2.0 Connection: Select regional Zoho domain (.in for India, .com for US, .eu for Europe).',
        'Select Zoho Organization ID from authorized organizations dropdown.',
        'Map VyayMitra expense categories to Zoho Chart of Accounts and GST tax templates.',
        'Run Dry-Run Export: Verify complete payload validation without posting live records.',
        'Batch Export: Push finalized reports with deterministic idempotency keys and exponential backoff retry handling.',
      ],
      keyRules: [
        'Idempotency keys prevent duplicate bill creation in Zoho Books after network drops.',
        'Network partitions mid-flight transition record to NEEDS_RECONCILIATION for manual ledger review.',
      ],
    },
    {
      id: 'step-8',
      stepNumber: 'Step 08',
      title: 'Public Developer API & Outbound Webhooks',
      icon: <Code2 className="w-5 h-5 text-teal-600" />,
      category: 'API & Developer',
      summary: 'Generate machine-to-machine (M2M) API keys, configure signed webhook endpoints, and inspect delivery logs.',
      actionUrl: '/developer',
      actionLabel: 'Open Developer Platform',
      details: [
        'Create M2M API credentials (client_id + client_secret) with scoped permissions (expenses:read, reports:write).',
        'Store client_secret immediately in your enterprise vault—it is only displayed once.',
        'Subscribe to real-time events: expense.created, report.submitted, report.approved, reimbursement.recorded.',
        'Verify HMAC-SHA256 signature in X-VyayMitra-Signature header on inbound webhook deliveries.',
        'Use the Delivery Logs table to view payloads, response codes, and test dispatch simulations.',
      ],
      keyRules: [
        'Never expose client_secret or JWT tokens in client-side applications or public repositories.',
        'All developer endpoints are scoped strictly to your authenticated tenant ID.',
      ],
    },
    {
      id: 'step-9',
      stepNumber: 'Step 09',
      title: 'Security, Compliance & Data Retention Protocol',
      icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
      category: 'Security & Legal',
      summary: 'Inspect rate limiting, execute 90-day OCR payload redaction, and preserve 8-year statutory tax records.',
      actionUrl: '/settings',
      actionLabel: 'Inspect Data Retention',
      details: [
        'Brute-force protection: Rate limiter enforces 10 auth requests/min with Retry-After: 60 headers.',
        '90-Day OCR Retention: Review third-party vision provider payloads eligible for redaction after review.',
        'Generate preview to inspect candidate records and receive a short-lived execution token.',
        'Statutory Exclusion Protection: Section 128 of the Companies Act permanently preserves tax invoices and vouchers for 8 years.',
        'Two-person rule: Enter explicit confirmation phrase PURGE-ELIGIBLE-OCR-PAYLOADS to execute redaction.',
      ],
      keyRules: [
        'Financial transaction amounts, GL mappings, and reimbursement payment proofs are NEVER deleted by retention.',
        'Production errors are masked behind request correlation IDs to prevent internal stack leakage.',
      ],
    },
    {
      id: 'step-10',
      stepNumber: 'Step 10',
      title: 'Operational Backups & Disaster Recovery Drills',
      icon: <Database className="w-5 h-5 text-amber-700" />,
      category: 'DevOps & Reliability',
      summary: 'Execute automated PostgreSQL snapshot scripts and verify disaster recovery through witnessed restore drills.',
      details: [
        'Collaborate with your platform DevOps to schedule automated daily PostgreSQL snapshots using scripts/backup-postgres.ps1.',
        'Execute isolated staging restore drills using scripts/verify-restore.ps1.',
        'Confirm table count, expense record integrity, and sequence continuity in a scratch database.',
      ],
      keyRules: [
        'A database backup is never considered reliable until it has been successfully restored and verified.',
        'Retain offsite encrypted backup copies in accordance with your organization disaster recovery SLA.',
      ],
    },
  ];

  const categories = ['all', 'Setup & Entity', 'Org Structure', 'User Directory', 'Accounting Codes', 'Approval Workflow', 'Finance & Payments', 'Accounting Sync', 'API & Developer', 'Security & Legal', 'DevOps & Reliability'];

  const filteredSteps = steps.filter((step) => {
    const matchesCategory = selectedSection === 'all' || step.category === selectedSection;
    const matchesQuery =
      step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.details.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase())) ||
      step.keyRules.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Hero Banner with Official Branding */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-[#142333] to-[#008C69]/40 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/90 p-2 border border-slate-700/80 flex items-center justify-center shadow-inner flex-shrink-0">
              <img
                src="/Blue%20Teal%20Gradient%20Wing%20Logo.png"
                alt="VyayMitra"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">Company Administrator Complete Guide</h1>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  TENANT OPS
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Step-by-step operational handbook for Tenant Owners, Company Admins, and Finance Heads. Configure organizations, legal profiles, approval routing, GL codes, and accounting synchronization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <a
              href="/docs/company-admin-guide.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>View Markdown Doc</span>
            </a>
          </div>
        </div>
      </div>

      {/* Core Rules Callout Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start sm:items-center space-x-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="font-bold">Core Financial Rule:</span>{' '}
            <span>
              <strong>APPROVED != EXPORTED != REIMBURSED.</strong> Approving an expense or exporting to Zoho Books is NOT actual reimbursement. Payouts require recorded transaction references.
            </span>
          </div>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-200/50 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 whitespace-nowrap self-start sm:self-auto">
          CannotSelfApproveException Active
        </span>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942]">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search setup steps, GL codes, rules..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-[#1C2833] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="flex overflow-x-auto gap-1 w-full md:w-auto pb-1 md:pb-0 text-xs">
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedSection(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                selectedSection === cat
                  ? 'bg-[#008C69] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {cat === 'all' ? 'All Steps' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Step by Step Cards Grid */}
      <div className="space-y-4">
        {filteredSteps.map((step) => (
          <div
            key={step.id}
            id={step.id}
            className="rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] p-5 sm:p-6 shadow-sm space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-600"
          >
            {/* Step Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-start sm:items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  {step.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {step.stepNumber}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {step.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 mt-0.5">
                    {step.title}
                  </h3>
                </div>
              </div>

              {step.actionUrl && onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate(step.actionUrl!)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 transition-all self-start sm:self-auto"
                >
                  <span>{step.actionLabel || 'Configure in App'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {step.summary}
            </p>

            {/* Checklist & Implementation Details */}
            <div className="space-y-2 pt-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Action Checklist & Configuration Steps:
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {step.details.map((detail, idx) => (
                  <li
                    key={idx}
                    className="flex items-start space-x-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1C2833] border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#008C69] flex-shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Invariants & Golden Rules */}
            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Golden Rules & Statutory Compliance:</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                {step.keyRules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
