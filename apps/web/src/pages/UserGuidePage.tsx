import React, { useState } from 'react';
import {
  HelpCircle,
  Receipt,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Search,
  Clock,
  Sparkles,
  ShieldAlert,
  Car,
  CreditCard,
  Send,
  RotateCcw,
  Landmark,
  ChevronRight,
  Info,
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
  tips: string[];
}

export const UserGuidePage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const steps: GuideStep[] = [
    {
      id: 'step-1',
      stepNumber: 'Step 01',
      title: 'Signing In & Accessing Your Personal Dashboard',
      icon: <HelpCircle className="w-5 h-5 text-emerald-600" />,
      category: 'Getting Started',
      summary: 'Sign in with your corporate email, navigate your personal dashboard, and view live claim metrics.',
      actionUrl: '/dashboard',
      actionLabel: 'Go to My Dashboard',
      details: [
        'Open your organization’s VyayMitra portal and log in with your corporate credentials.',
        'Your dashboard provides a high-level view of your draft expenses, submitted reports, and recent reimbursement payouts.',
        'Use the top persona bar in demo environments to switch roles or test organizational routing.',
      ],
      tips: [
        'All actions are tenant-isolated; you can only view expenses created by you or forwarded to you for approval.',
        'Bookmark the dashboard for quick 1-click access to draft creation.',
      ],
    },
    {
      id: 'step-2',
      stepNumber: 'Step 02',
      title: 'Creating an Expense (Manual Entry)',
      icon: <Receipt className="w-5 h-5 text-teal-600" />,
      category: 'Creating Expenses',
      summary: 'Create an expense entry with merchant name, transaction date, category, and business purpose.',
      actionUrl: '/expenses',
      actionLabel: 'Create New Expense',
      details: [
        'Navigate to My Expenses (/expenses) and click "Create Expense".',
        'Enter Merchant Name (e.g., IndiGo Airlines, Uber, Starbucks, Taj Hotels).',
        'Select the exact Spent Date and Amount with 2 decimal precision (e.g., ₹1,450.50).',
        'Choose the appropriate Category (Meals, Transport, Lodging, Software, Office Supplies).',
        'Enter a descriptive Business Purpose explaining why the expense was incurred (e.g., "Client lunch with Horizon Biotech team to finalize Q4 agreement").',
        'Optionally select a Cost Center or Project code if your company tracks project-based budgets.',
      ],
      tips: [
        'Save as Draft at any time and return later to attach receipts.',
        'Clear, specific business purposes prevent your manager from requesting revisions.',
      ],
    },
    {
      id: 'step-3',
      stepNumber: 'Step 03',
      title: 'Uploading Receipts & Instant OCR Scanning',
      icon: <UploadCloud className="w-5 h-5 text-sky-600" />,
      category: 'Receipts & OCR',
      summary: 'Attach receipt files (PDF, JPEG, PNG) and let VyayMitra’s OCR extract merchant, date, amount, and taxes.',
      actionUrl: '/expenses',
      actionLabel: 'Upload Receipt',
      details: [
        'Drag and drop receipt files up to 10 MB or click to upload from your local drive or smartphone.',
        'The platform runs magic-byte file signature verification to ensure document authenticity.',
        'Every uploaded file is hashed with a cryptographic SHA-256 checksum to prevent tampering or accidental duplicate uploads.',
        'Automated OCR analyzes the invoice image and highlights extracted fields for quick review.',
      ],
      tips: [
        'Always ensure vendor name, invoice date, and total amount are sharp and readable.',
        'Password-protected PDFs cannot be scanned; upload unlocked PDF versions.',
      ],
    },
    {
      id: 'step-4',
      stepNumber: 'Step 04',
      title: 'Reviewing & Confirming OCR Suggestions',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      category: 'Receipts & OCR',
      summary: 'Review side-by-side extracted data, tax breakdowns (CGST/SGST/IGST), and confirm values.',
      actionUrl: '/expenses',
      actionLabel: 'Review Pending Expenses',
      details: [
        'Click "Review OCR" on any scanned receipt to view the document side-by-side with extracted values.',
        'Verify that the extracted merchant name matches the actual invoice.',
        'Check tax breakdowns: CGST, SGST, or IGST numbers are extracted for statutory compliance.',
        'If any number was slightly misread (e.g., ₹1,250 read as ₹1,200), adjust the field manually and click "Confirm Suggestions".',
      ],
      tips: [
        'Confirmed OCR entries are marked with a green badge and pass through manager audits faster.',
        'Always verify the currency when traveling internationally.',
      ],
    },
    {
      id: 'step-5',
      stepNumber: 'Step 05',
      title: 'Mileage, Transport & Per-Diem Claims',
      icon: <Car className="w-5 h-5 text-indigo-600" />,
      category: 'Creating Expenses',
      summary: 'Submit taxi receipts, personal vehicle mileage logs, and daily per-diem allowances easily.',
      actionUrl: '/expenses',
      actionLabel: 'Add Travel Claim',
      details: [
        'For taxi services (Uber, Ola, BluSmart, Meru), upload the digital invoice received via email.',
        'Specify the starting and destination addresses in the business purpose.',
        'For daily per-diem allowances where individual meal receipts are not collected, select "Meals & Per Diem".',
        'Ensure daily amounts do not exceed your tenant company’s per-diem policy limit.',
      ],
      tips: [
        'Per-diem claims within the standard policy cap do not require itemized receipts.',
        'Group all transport and food receipts from a single business trip together in one report.',
      ],
    },
    {
      id: 'step-6',
      stepNumber: 'Step 06',
      title: 'Grouping Draft Expenses into an Expense Report',
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      category: 'Reports & Approval',
      summary: 'Group related draft expenses into a formal Expense Report to prepare for submission.',
      actionUrl: '/reports',
      actionLabel: 'Go to My Reports',
      details: [
        'Navigate to My Reports (/reports) and click "New Expense Report".',
        'Enter a clear title (e.g., "October 2026 Mumbai Client Visits & Hotel").',
        'Select the business trip date range and overarching business justification.',
        'Select the draft expenses you want to attach using the interactive checkboxes.',
        'Review the running total amount calculated in real time across all selected items.',
        'Click "Create Report" to establish your report in DRAFT state.',
      ],
      tips: [
        'Individual expenses must belong to a report before they can be submitted for approval.',
        'You can add or remove draft expenses from a report until you hit Submit.',
      ],
    },
    {
      id: 'step-7',
      stepNumber: 'Step 07',
      title: 'Policy Warnings & Compliance Pre-Flight Checks',
      icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
      category: 'Policy & Compliance',
      summary: 'Resolve automated spending warnings before sending your report to your manager.',
      actionUrl: '/reports',
      actionLabel: 'Check Report Policies',
      details: [
        'Before submission, VyayMitra runs real-time rule engine checks on every expense item.',
        'Category Limit Exceeded: If a meal or hotel exceeds daily limits, provide an explanatory justification note.',
        'Missing Receipt Warning: If a mandatory category lacks an uploaded bill, attach the voucher or justification.',
        'Duplicate Spend Warning: If an identical merchant, date, and amount was already submitted, double-check your claims.',
        'Weekend/Holiday Spend: Clarify if emergency client support or Sunday travel was required.',
      ],
      tips: [
        'Warning flags do not block submission, but they are highlighted directly to your manager and finance auditor.',
        'Proactively adding explanatory notes prevents unnecessary back-and-forth.',
      ],
    },
    {
      id: 'step-8',
      stepNumber: 'Step 08',
      title: 'Submitting for Approval & Multi-Level Routing',
      icon: <Send className="w-5 h-5 text-[#008C69]" />,
      category: 'Reports & Approval',
      summary: 'Submit your completed report into automated managerial review and department head workflows.',
      actionUrl: '/reports',
      actionLabel: 'Submit Draft Report',
      details: [
        'Review all line items, tax totals, and attached receipts, then click "Submit Report".',
        'Your report transitions to SUBMITTED and queues for your direct reporting manager (IN_REVIEW).',
        'If the report total exceeds ₹50,000, VyayMitra automatically escalates it to your Department Head for secondary sign-off.',
        'Segregation of Duties: Under strict platform governance, users can never approve their own expense reports.',
      ],
      tips: [
        'You can track live approval stages on the interactive timeline in your report details.',
        'Your manager receives an instant notification when a report enters their queue.',
      ],
    },
    {
      id: 'step-9',
      stepNumber: 'Step 09',
      title: 'Handling Changes Requested by Your Manager',
      icon: <RotateCcw className="w-5 h-5 text-amber-600" />,
      category: 'Reports & Approval',
      summary: 'Review manager revision feedback, upload additional invoices or adjust amounts, and resubmit.',
      actionUrl: '/reports',
      actionLabel: 'View Report Status',
      details: [
        'If your manager or finance requires clarification, the report status updates to CHANGES_REQUESTED.',
        'Open the report to read the reviewer’s comment (e.g., "Please attach the itemized hotel invoice with GST breakdown").',
        'Click Edit to upload the requested attachment or modify the line item amount.',
        'Click "Resubmit Report". The report goes directly back to your reviewer without resetting the entire history.',
      ],
      tips: [
        'The immutable audit trail preserves previous comments and revisions for compliance transparency.',
        'Respond promptly to keep your claim in the current reimbursement cycle.',
      ],
    },
    {
      id: 'step-10',
      stepNumber: 'Step 10',
      title: 'Report Approval vs. Actual Reimbursement Payout',
      icon: <Landmark className="w-5 h-5 text-emerald-600" />,
      category: 'Reimbursement & Payout',
      summary: 'Understand the difference between managerial approval and actual cash disbursement.',
      actionUrl: '/reimbursements',
      actionLabel: 'View Reimbursement Status',
      details: [
        'Approval is not payment: An APPROVED report has passed managerial review, but payout happens in the Finance Reimbursement stage.',
        'ELIGIBLE: Report is approved and verified; waiting for finance batch scheduling.',
        'SCHEDULED: Queued for the upcoming weekly NEFT transfer or monthly payroll run.',
        'PARTIALLY_PAID: A portion of the claim was disbursed; the remaining balance remains tracked until settled.',
        'PAID: Money transferred! Check the report details for your Bank Transaction UTR reference number and payment date.',
      ],
      tips: [
        'Never mark a report as reimbursed yourself; bank disbursements are finalized by the Finance Administrator.',
        'Bank settlement UTRs can be referenced directly with your bank if funds have not arrived.',
      ],
    },
  ];

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'Getting Started', label: 'Getting Started' },
    { id: 'Creating Expenses', label: 'Creating Expenses' },
    { id: 'Receipts & OCR', label: 'Receipts & OCR' },
    { id: 'Reports & Approval', label: 'Reports & Approval' },
    { id: 'Policy & Compliance', label: 'Policy & Compliance' },
    { id: 'Reimbursement & Payout', label: 'Reimbursement & Payout' },
  ];

  const filteredSteps = steps.filter((step) => {
    const matchesCategory = selectedCategory === 'all' || step.category === selectedCategory;
    const matchesSearch =
      step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.details.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const faqs = [
    {
      q: 'Can I approve my own expense report if I am a manager?',
      a: 'No. Platform governance strictly enforces segregation of duties. The system raises a CannotSelfApproveException if an author attempts to approve their own claim. It must be reviewed by your designated manager or department head.',
    },
    {
      q: 'What file formats and sizes are supported for receipts?',
      a: 'You can upload PDF, JPEG, and PNG files up to 10 MB. Each file undergoes cryptographic SHA-256 verification and magic-byte validation. Encrypted or password-protected PDFs should be decrypted before uploading.',
    },
    {
      q: 'What is the difference between Approved and Reimbursed?',
      a: 'Approval confirms that your business justification and amounts adhere to policy. Reimbursement is the physical payment of funds from the corporate bank account to your personal account with a registered UTR voucher number.',
    },
    {
      q: 'What happens if I lose a physical receipt?',
      a: 'Submit the expense under the appropriate category, write "Receipt Missing - lost physical voucher" in the business purpose, attach an email confirmation or card slip if available, and submit for manager discretion.',
    },
    {
      q: 'Can I submit individual expenses without creating a report?',
      a: 'Expenses start as standalone drafts. To submit them for managerial approval and finance reimbursement, they must be grouped into an Expense Report.',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#004B3E] via-[#006C54] to-[#008C69] p-8 text-white shadow-xl dark:from-[#002D25] dark:via-[#004838] dark:to-[#00604A]">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-200" />
            <span>Employee & User Knowledgebase</span>
            <span className="rounded-full bg-emerald-400/30 px-2 py-0.5 text-[10px] text-emerald-100">All Roles</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            VyayMitra User Guide & Handbook
          </h1>
          <p className="text-sm text-emerald-100/90 leading-relaxed sm:text-base">
            Everything you need to know about capturing receipts, verifying OCR data, filing expense reports, tracking multi-level approvals, and receiving timely reimbursements.
          </p>

          <div className="pt-2 flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg bg-black/20 px-3 py-1.5 backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Instant OCR Scanning</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-black/20 px-3 py-1.5 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>Real-Time Policy Alerts</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-black/20 px-3 py-1.5 backdrop-blur-sm">
              <Clock className="w-4 h-4 text-emerald-300" />
              <span>Live UTR Payout Tracking</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute right-32 top-8 h-40 w-40 rounded-full bg-teal-300/10 blur-2xl" />
      </div>

      {/* Golden Rules Callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-sm">
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            1. Clear Invoices
          </div>
          <p className="mt-1.5 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
            Ensure vendor name, date, total amount, and CGST/SGST taxes are legible to speed up OCR and audit checks.
          </p>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 dark:border-teal-900/40 dark:bg-teal-950/20">
          <div className="flex items-center gap-2 font-bold text-teal-900 dark:text-teal-200 text-sm">
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            2. Verify OCR Extractions
          </div>
          <p className="mt-1.5 text-xs text-teal-800 dark:text-teal-300 leading-relaxed">
            OCR automatically scans and suggests fields, but you should review numbers side-by-side before confirming.
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200 text-sm">
            <Landmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            3. Approval != Payment
          </div>
          <p className="mt-1.5 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            Approval means your manager signed off. Reimbursement payout occurs when Finance processes the bank transfer.
          </p>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics (e.g., 'OCR', 'mileage', 'approval', 'tax', 'reimbursement', 'limits')..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm placeholder-slate-400 shadow-sm focus:border-[#008C69] focus:outline-none focus:ring-2 focus:ring-[#008C69]/20 dark:border-slate-800 dark:bg-[#151F27] dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#008C69] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step by Step Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            User Operations Walkthrough ({filteredSteps.length} topics)
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click action links to jump directly to app sections
          </span>
        </div>

        {filteredSteps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-800">
            <HelpCircle className="mx-auto w-8 h-8 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">No matching guide topics found</p>
            <p className="text-xs text-slate-500">Try searching for generic terms like &quot;receipt&quot;, &quot;report&quot;, or &quot;per-diem&quot;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredSteps.map((step) => (
              <div
                key={step.id}
                id={step.id}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-[#151F27]"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                      {step.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#008C69] dark:text-[#34D399]">
                          {step.stepNumber}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {step.category}
                        </span>
                      </div>
                      <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white group-hover:text-[#008C69] dark:group-hover:text-[#34D399] transition-colors">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {step.summary}
                      </p>
                    </div>
                  </div>

                  {step.actionUrl && onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate(step.actionUrl!)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#008C69]/30 bg-[#E6F5F0] px-3 py-1.5 text-xs font-semibold text-[#008C69] hover:bg-[#008C69] hover:text-white transition-all dark:bg-[#082921] dark:text-[#34D399] dark:border-[#34D399]/30 dark:hover:bg-[#34D399] dark:hover:text-[#0D141A]"
                    >
                      <span>{step.actionLabel || 'Open in App'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Step Details & Steps to Follow */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Instructions & Action Steps
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-[#008C69] dark:text-[#34D399] shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-[#1C2833] border border-slate-100 dark:border-slate-800 space-y-2">
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Employee Pro Tips</span>
                    </h4>
                    <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {step.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reimbursement Lifecycle Explained */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151F27] space-y-4">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Approval Flow vs Reimbursement Flow
          </h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          VyayMitra tracks two independent lifecycles for statutory financial accuracy:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#1C2833]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              1. Report Approval Workflow
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="rounded bg-slate-200 px-2 py-0.5 font-medium dark:bg-slate-700">DRAFT</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="rounded bg-sky-100 text-sky-800 px-2 py-0.5 font-medium dark:bg-sky-950 dark:text-sky-300">SUBMITTED</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 font-medium dark:bg-amber-950 dark:text-amber-300">IN_REVIEW</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold dark:bg-emerald-950 dark:text-emerald-300">APPROVED</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Direct manager signs off. Over ₹50,000 claims automatically route to the Department Head.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#1C2833]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              2. Finance Reimbursement Workflow
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 font-medium dark:bg-emerald-950 dark:text-emerald-300">ELIGIBLE</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="rounded bg-indigo-100 text-indigo-800 px-2 py-0.5 font-medium dark:bg-indigo-950 dark:text-indigo-300">SCHEDULED</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="rounded bg-purple-100 text-purple-800 px-2 py-0.5 font-bold dark:bg-purple-950 dark:text-purple-300">PAID (UTR Logged)</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Finance approves the disbursement and logs the bank UTR transaction reference number.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion / Cards */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151F27] space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-[#1C2833]/60 space-y-2"
            >
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-start gap-2">
                <span className="text-[#008C69] dark:text-[#34D399] font-mono">Q:</span>
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-5">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
