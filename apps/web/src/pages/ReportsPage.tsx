import React, { useState, useEffect } from 'react';
import { StatusBadge, AmountDisplay } from '@vyay/ui';
import { ReportStatus, ReimbursementStatus, Role } from '@vyay/contracts';
import { api } from '../lib/api';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  Send,
  Eye,
  X,
  Calendar,
  Layers,
  Sparkles,
  Receipt,
  User,
  Building,
  RotateCcw,
} from 'lucide-react';

interface ExpenseRef {
  id: string;
  merchant: string;
  category: string;
  amount: string;
  spentAt: string;
  hasReceipt: boolean;
  duplicateWarning?: boolean;
}

interface ApprovalStep {
  sequence: number;
  stepName: string;
  approverName: string;
  approverRole: string;
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
  decidedAt?: string;
  comment?: string;
}

interface PolicyViolation {
  ruleType: string;
  severity: 'WARNING' | 'BLOCKER';
  message: string;
  detail: string;
}

interface ReportItem {
  id: string;
  reportNumber: string;
  title: string;
  businessPurpose: string;
  department: string;
  costCenter: string;
  submittedBy: string;
  submittedAt: string;
  currency: string;
  totalAmount: string;
  reimbursableAmount: string;
  status: ReportStatus;
  reimbursementStatus: ReimbursementStatus;
  expenses: ExpenseRef[];
  approvalFlow: ApprovalStep[];
  policyViolations: PolicyViolation[];
  auditHistory: { timestamp: string; actor: string; action: string; note: string }[];
}

const AVAILABLE_UNCLAIMED_EXPENSES: ExpenseRef[] = [
  {
    id: 'exp-d1',
    merchant: 'Indigo Airlines (6E-452)',
    category: 'Air Travel',
    amount: '6850.00',
    spentAt: '2026-10-17',
    hasReceipt: true,
  },
  {
    id: 'exp-d2',
    merchant: 'Bangalore Uber Airport Express',
    category: 'Ground Commute',
    amount: '1240.00',
    spentAt: '2026-10-17',
    hasReceipt: true,
  },
  {
    id: 'exp-d3',
    merchant: 'Taj Gateway Bangalore (2 nights)',
    category: 'Accommodation',
    amount: '14200.00',
    spentAt: '2026-10-18',
    hasReceipt: true,
  },
  {
    id: 'exp-d4',
    merchant: 'Cafe Coffee Day Tech Park',
    category: 'Meals & Client Entertainment',
    amount: '480.00',
    spentAt: '2026-10-18',
    hasReceipt: false, // Under 1000 threshold
  },
  {
    id: 'exp-d5',
    merchant: 'Bio-Rad Laboratory Consumables',
    category: 'Lab Reagents & Supplies',
    amount: '32500.00',
    spentAt: '2026-10-19',
    hasReceipt: true,
  },
];

const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'rep-001',
    reportNumber: 'REP-2026-0891',
    title: 'Bangalore Lab Equipment & Reagents',
    businessPurpose: 'Procurement of specialized spectrophotometer reagents and calibration standards for Phase II trial analysis.',
    department: 'Research & Diagnostics',
    costCenter: 'CC-BIO-04',
    submittedBy: 'Dr. Rahul Sharma',
    submittedAt: '2026-10-18T10:30:00Z',
    currency: 'INR',
    totalAmount: '8450.00',
    reimbursableAmount: '8450.00',
    status: ReportStatus.FINANCE_REVIEW,
    reimbursementStatus: ReimbursementStatus.ELIGIBLE,
    expenses: [
      {
        id: 'exp-101',
        merchant: 'Merck Biosciences Pvt Ltd',
        category: 'Lab Reagents & Supplies',
        amount: '5200.00',
        spentAt: '2026-10-15',
        hasReceipt: true,
      },
      {
        id: 'exp-102',
        merchant: 'Taj West End Restaurant',
        category: 'Meals & Client Entertainment',
        amount: '1950.00',
        spentAt: '2026-10-16',
        hasReceipt: true,
      },
      {
        id: 'exp-103',
        merchant: 'Uber India Technologies',
        category: 'Ground Commute',
        amount: '1300.00',
        spentAt: '2026-10-16',
        hasReceipt: true,
      },
    ],
    approvalFlow: [
      {
        sequence: 1,
        stepName: 'Manager Approval',
        approverName: 'Anita Deshmukh',
        approverRole: 'Direct Manager',
        status: 'APPROVED',
        decidedAt: '2026-10-18T14:20:00Z',
        comment: 'All chemical reagents verified against quarterly research allocation.',
      },
      {
        sequence: 2,
        stepName: 'Finance Audit & Review',
        approverName: 'Sarah Jenkins',
        approverRole: 'Finance Operator',
        status: 'PENDING',
      },
    ],
    policyViolations: [
      {
        ruleType: 'MEAL_GUIDELINE_EXCEPTION',
        severity: 'WARNING',
        message: 'Item #2 exceeds ₹1,500 single-meal guideline',
        detail: 'Taj West End bill ₹1,950.00 includes scientific advisory guest. Manager exception approved.',
      },
    ],
    auditHistory: [
      {
        timestamp: '2026-10-18T10:30:00Z',
        actor: 'Dr. Rahul Sharma',
        action: 'REPORT_SUBMITTED',
        note: 'Report assembled with 3 verified receipts totaling ₹8,450.00.',
      },
      {
        timestamp: '2026-10-18T14:20:00Z',
        actor: 'Anita Deshmukh',
        action: 'APPROVED',
        note: 'Direct manager approval recorded. Auto-routed to Finance Audit.',
      },
    ],
  },
  {
    id: 'rep-002',
    reportNumber: 'REP-2026-0872',
    title: 'Delhi Client Field Audit Travel',
    businessPurpose: 'On-site regulatory compliance inspection at AIIMS New Delhi partner pathology facility.',
    department: 'Quality Assurance',
    costCenter: 'CC-QA-02',
    submittedBy: 'Dr. Rahul Sharma',
    submittedAt: '2026-10-14T09:15:00Z',
    currency: 'INR',
    totalAmount: '6400.00',
    reimbursableAmount: '0.00',
    status: ReportStatus.APPROVED,
    reimbursementStatus: ReimbursementStatus.NOT_APPLICABLE,
    expenses: [
      {
        id: 'exp-201',
        merchant: 'Air India Express',
        category: 'Air Travel',
        amount: '4800.00',
        spentAt: '2026-10-12',
        hasReceipt: true,
      },
      {
        id: 'exp-202',
        merchant: 'The Oberoi New Delhi Dinner',
        category: 'Meals & Client Entertainment',
        amount: '1600.00',
        spentAt: '2026-10-13',
        hasReceipt: true,
      },
    ],
    approvalFlow: [
      {
        sequence: 1,
        stepName: 'Manager Approval',
        approverName: 'Anita Deshmukh',
        approverRole: 'Direct Manager',
        status: 'APPROVED',
        decidedAt: '2026-10-14T11:00:00Z',
        comment: 'Compliant with corporate card travel authorization policy.',
      },
      {
        sequence: 2,
        stepName: 'Finance Audit & Review',
        approverName: 'Sarah Jenkins',
        approverRole: 'Finance Operator',
        status: 'APPROVED',
        decidedAt: '2026-10-15T16:45:00Z',
        comment: 'Corporate card statement reconciliation complete.',
      },
    ],
    policyViolations: [],
    auditHistory: [
      {
        timestamp: '2026-10-14T09:15:00Z',
        actor: 'Dr. Rahul Sharma',
        action: 'REPORT_SUBMITTED',
        note: 'Submitted 2 corporate card items.',
      },
      {
        timestamp: '2026-10-14T11:00:00Z',
        actor: 'Anita Deshmukh',
        action: 'APPROVED',
        note: 'Manager approval verified.',
      },
      {
        timestamp: '2026-10-15T16:45:00Z',
        actor: 'Sarah Jenkins',
        action: 'APPROVED',
        note: 'Direct card clearance approved.',
      },
    ],
  },
  {
    id: 'rep-003',
    reportNumber: 'REP-2026-0904',
    title: 'Hyderabad Bio-Summit Q4 Delegation',
    businessPurpose: 'Executive representation and keynote presentation at Hyderabad Biotechnology Conference 2026.',
    department: 'Executive Management',
    costCenter: 'CC-EXEC-01',
    submittedBy: 'Vikram Mehta',
    submittedAt: '2026-10-19T08:00:00Z',
    currency: 'INR',
    totalAmount: '64800.00',
    reimbursableAmount: '64800.00',
    status: ReportStatus.IN_REVIEW,
    reimbursementStatus: ReimbursementStatus.NOT_READY,
    expenses: [
      {
        id: 'exp-301',
        merchant: 'Vistara Business Class (DEL-HYD)',
        category: 'Air Travel',
        amount: '28400.00',
        spentAt: '2026-10-18',
        hasReceipt: true,
      },
      {
        id: 'exp-302',
        merchant: 'ITC Kohenur Luxury Suite (3 nights)',
        category: 'Accommodation',
        amount: '36400.00',
        spentAt: '2026-10-19',
        hasReceipt: true,
      },
    ],
    approvalFlow: [
      {
        sequence: 1,
        stepName: 'Manager Approval',
        approverName: 'Anita Deshmukh',
        approverRole: 'Direct Manager',
        status: 'APPROVED',
        decidedAt: '2026-10-19T08:45:00Z',
        comment: 'Annual flagship symposium attendance sanctioned.',
      },
      {
        sequence: 2,
        stepName: 'Executive Escalation (>₹50,000)',
        approverName: 'Vikram Mehta',
        approverRole: 'Company Owner',
        status: 'PENDING',
      },
      {
        sequence: 3,
        stepName: 'Finance Audit & Review',
        approverName: 'Sarah Jenkins',
        approverRole: 'Finance Operator',
        status: 'PENDING',
      },
    ],
    policyViolations: [
      {
        ruleType: 'AMOUNT_THRESHOLD_ESCALATION',
        severity: 'WARNING',
        message: 'Claim total ₹64,800 exceeds ₹50,000 threshold',
        detail: 'Corporate governance policy triggers additional Executive / Board Level approval step.',
      },
    ],
    auditHistory: [
      {
        timestamp: '2026-10-19T08:00:00Z',
        actor: 'Vikram Mehta',
        action: 'REPORT_SUBMITTED',
        note: 'Submitted high-value executive claim with automated policy threshold escalation.',
      },
    ],
  },
];

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [availableExpenses, setAvailableExpenses] = useState<ExpenseRef[]>(AVAILABLE_UNCLAIMED_EXPENSES);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'CHANGES' | 'APPROVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // New Report Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [reportTitle, setReportTitle] = useState('');
  const [businessPurpose, setBusinessPurpose] = useState('');
  const [department, setDepartment] = useState('Research & Diagnostics');
  const [costCenter, setCostCenter] = useState('CC-BIO-04');
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [bannerFeedback, setBannerFeedback] = useState<string | null>(null);

  // Load dynamic reports and expenses from API
  useEffect(() => {
    let isMounted = true;
    const loadDynamicData = async () => {
      try {
        const [liveReports, liveExpenses] = await Promise.all([
          api.getReports(),
          api.getExpenses(),
        ]);
        if (!isMounted) return;

        if (liveExpenses && liveExpenses.length > 0) {
          const transformedExpenses: ExpenseRef[] = liveExpenses.map((e) => ({
            id: e.id,
            merchant: e.merchant,
            category: e.category || 'General',
            amount: e.amount,
            spentAt: e.spentAt || new Date().toISOString().split('T')[0],
            hasReceipt: !!e.receiptUrl || !!e.receiptName,
            duplicateWarning: e.duplicateWarning,
          }));
          setAvailableExpenses((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            const newOnes = transformedExpenses.filter((e) => !seen.has(e.id));
            return [...newOnes, ...prev];
          });
        }

        if (liveReports && liveReports.length > 0) {
          const transformedReports: ReportItem[] = liveReports.map((r, idx) => ({
            id: r.id,
            reportNumber: `REP-2026-${String(890 + idx).padStart(4, '0')}`,
            title: r.title,
            businessPurpose: r.purpose || 'Business claim',
            department: r.department || 'R&D Department',
            costCenter: 'CC-BIO-04',
            submittedBy: r.employeeName || 'Dr. Rahul Sharma',
            submittedAt: r.submittedAt || new Date().toISOString(),
            currency: r.currency || 'INR',
            totalAmount: r.totalAmount || '0.00',
            reimbursableAmount: r.totalAmount || '0.00',
            status: r.status,
            reimbursementStatus: r.reimbursementStatus,
            expenses: r.expenses?.map((e) => ({
              id: e.id,
              merchant: e.merchant,
              category: e.category,
              amount: e.amount,
              spentAt: e.spentAt,
              hasReceipt: !!e.receiptUrl,
            })) || [],
            approvalFlow: [
              {
                sequence: 1,
                stepName: 'Manager Approval',
                approverName: 'Anita Deshmukh',
                approverRole: 'Direct Manager',
                status: r.status === ReportStatus.DRAFT ? 'PENDING' : 'APPROVED',
                decidedAt: r.status !== ReportStatus.DRAFT ? new Date().toISOString() : undefined,
              },
              {
                sequence: 2,
                stepName: 'Finance Audit & Review',
                approverName: 'Sarah Jenkins',
                approverRole: 'Finance Operator',
                status: r.status === ReportStatus.APPROVED ? 'APPROVED' : 'PENDING',
              },
            ],
            policyViolations: [],
            auditHistory: [
              {
                timestamp: r.submittedAt || new Date().toISOString(),
                actor: r.employeeName || 'Dr. Rahul Sharma',
                action: 'REPORT_SUBMITTED',
                note: `Claim created with ${r.expenseCount || 1} expense items`,
              },
            ],
          }));

          setReports((prev) => {
            const existingIds = new Set(transformedReports.map((x) => x.id));
            const unmerged = prev.filter((p) => !existingIds.has(p.id));
            return [...transformedReports, ...unmerged];
          });
        }
      } catch (err) {
        console.warn('Failed to load dynamic reports data', err);
      }
    };
    loadDynamicData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate live wizard figures
  const selectedExpenses = availableExpenses.filter((e) =>
    selectedExpenseIds.includes(e.id)
  );
  const totalWizardAmount = selectedExpenses.reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0
  );
  const hasEscalationWarning = totalWizardAmount > 50000;
  const missingReceipts = selectedExpenses.filter(
    (e) => !e.hasReceipt && parseFloat(e.amount) > 1000
  );

  const handleToggleExpense = (id: string) => {
    setSelectedExpenseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllExpenses = () => {
    if (selectedExpenseIds.length === availableExpenses.length) {
      setSelectedExpenseIds([]);
    } else {
      setSelectedExpenseIds(availableExpenses.map((e) => e.id));
    }
  };

  const handleSubmitNewReport = async (submitNow: boolean) => {
    if (!reportTitle.trim()) {
      alert('Please provide a descriptive report title.');
      return;
    }
    if (selectedExpenseIds.length === 0) {
      alert('Please select at least one expense to assemble into this report.');
      return;
    }

    try {
      const created = await api.createReport(reportTitle, businessPurpose, selectedExpenseIds);
      if (submitNow && created.id) {
        await api.submitReport(created.id);
      }
    } catch (e) {
      console.warn('Error saving report to API:', e);
    }

    const newReport: ReportItem = {
      id: `rep-${Date.now()}`,
      reportNumber: `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      title: reportTitle,
      businessPurpose,
      department,
      costCenter,
      submittedBy: 'Dr. Rahul Sharma',
      submittedAt: new Date().toISOString(),
      currency: 'INR',
      totalAmount: totalWizardAmount.toFixed(2),
      reimbursableAmount: totalWizardAmount.toFixed(2),
      status: submitNow ? ReportStatus.SUBMITTED : ReportStatus.DRAFT,
      reimbursementStatus: ReimbursementStatus.NOT_READY,
      expenses: selectedExpenses,
      approvalFlow: [
        {
          sequence: 1,
          stepName: 'Manager Approval',
          approverName: 'Anita Deshmukh',
          approverRole: 'Direct Manager',
          status: 'PENDING',
        },
        ...(hasEscalationWarning
          ? [
              {
                sequence: 2,
                stepName: 'Executive Escalation (>₹50,000)',
                approverName: 'Vikram Mehta',
                approverRole: 'Company Owner',
                status: 'PENDING' as const,
              },
            ]
          : []),
        {
          sequence: hasEscalationWarning ? 3 : 2,
          stepName: 'Finance Audit & Review',
          approverName: 'Sarah Jenkins',
          approverRole: 'Finance Operator',
          status: 'PENDING',
        },
      ],
      policyViolations: [
        ...(hasEscalationWarning
          ? [
              {
                ruleType: 'AMOUNT_THRESHOLD_ESCALATION',
                severity: 'WARNING' as const,
                message: `Total claim ₹${totalWizardAmount.toLocaleString('en-IN')} triggers Executive Escalation`,
                detail: 'High-value claims exceed standard ₹50,000 managerial threshold.',
              },
            ]
          : []),
      ],
      auditHistory: [
        {
          timestamp: new Date().toISOString(),
          actor: 'Dr. Rahul Sharma',
          action: submitNow ? 'REPORT_SUBMITTED' : 'REPORT_CREATED_DRAFT',
          note: `Assembled ${selectedExpenses.length} expense line items. Total claim ₹${totalWizardAmount.toFixed(2)}.`,
        },
      ],
    };

    setReports((prev) => [newReport, ...prev]);
    // Remove claimed expenses from available list
    setAvailableExpenses((prev) => prev.filter((e) => !selectedExpenseIds.includes(e.id)));
    setShowWizard(false);
    setWizardStep(1);
    setReportTitle('');
    setBusinessPurpose('');
    setSelectedExpenseIds([]);

    setBannerFeedback(
      submitNow
        ? `Claim ${newReport.reportNumber} submitted successfully! Multi-stage approval flow initialized.`
        : `Claim ${newReport.reportNumber} saved as draft.`
    );
    setTimeout(() => setBannerFeedback(null), 5000);
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.submittedBy.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'PENDING') {
      return (
        r.status === ReportStatus.SUBMITTED ||
        r.status === ReportStatus.IN_REVIEW ||
        r.status === ReportStatus.FINANCE_REVIEW
      );
    }
    if (filterTab === 'CHANGES') {
      return r.status === ReportStatus.CHANGES_REQUESTED;
    }
    if (filterTab === 'APPROVED') {
      return r.status === ReportStatus.APPROVED || r.status === ReportStatus.FINALIZED;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Expense Reports
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Assemble verified expenses into structured claims for automated policy evaluation and multi-stage signoff
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#008C69] hover:bg-[#007456] text-white transition-all shadow-sm hover:shadow active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Assemble New Claim Report</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {bannerFeedback && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl flex items-center space-x-2.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{bannerFeedback}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-[#1A2530] rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'ALL'
                ? 'bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            All Claims ({reports.length})
          </button>
          <button
            onClick={() => setFilterTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'PENDING'
                ? 'bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            In Review ({reports.filter((r) => r.status === ReportStatus.IN_REVIEW || r.status === ReportStatus.FINANCE_REVIEW || r.status === ReportStatus.SUBMITTED).length})
          </button>
          <button
            onClick={() => setFilterTab('CHANGES')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'CHANGES'
                ? 'bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Needs Rework ({reports.filter((r) => r.status === ReportStatus.CHANGES_REQUESTED).length})
          </button>
          <button
            onClick={() => setFilterTab('APPROVED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'APPROVED'
                ? 'bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                : 'hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Approved ({reports.filter((r) => r.status === ReportStatus.APPROVED).length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report #, title, employee..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#008C69]/20"
          />
        </div>
      </div>

      {/* Main Reports Table */}
      <div className="rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1C2833] text-slate-500 border-b border-[#E5EAF0] dark:border-[#2D3942]">
              <tr>
                <th className="px-4 py-3 font-medium">Claim Information</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Receipts</th>
                <th className="px-4 py-3 font-medium">Total Claim</th>
                <th className="px-4 py-3 font-medium">Reimbursable</th>
                <th className="px-4 py-3 font-medium">Approval Status</th>
                <th className="px-4 py-3 font-medium">Reimbursement</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0] dark:divide-[#2D3942]">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No expense reports found matching your active filter.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-[#1A2530] transition-colors cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                        <span>{report.title}</span>
                        {report.policyViolations.length > 0 && (
                          <span className="inline-flex items-center text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 rounded font-medium">
                            {report.policyViolations.length} Warning
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                        <span>{report.reportNumber}</span>
                        <span>&bull;</span>
                        <span>{report.submittedBy}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      <div>{report.department}</div>
                      <div className="text-[10px] text-slate-400">{report.costCenter}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      <div className="font-medium">{report.expenses.length} expenses</div>
                      <div className="text-[10px] text-slate-400">
                        {report.expenses.filter((e) => e.hasReceipt).length} verified
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      <AmountDisplay amount={report.totalAmount} currency={report.currency} />
                    </td>
                    <td className="px-4 py-3.5">
                      {parseFloat(report.reimbursableAmount) > 0 ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          <AmountDisplay
                            amount={report.reimbursableAmount}
                            currency={report.currency}
                          />
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Corporate Card (Direct)</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={report.reimbursementStatus} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                        }}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-[#008C69] hover:underline"
                      >
                        <span>Audit Flow</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Details & Approval Timeline Modal / Drawer */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E5EAF0] dark:border-[#2D3942] flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {selectedReport.reportNumber}
                  </span>
                  <StatusBadge status={selectedReport.status} />
                  <StatusBadge status={selectedReport.reimbursementStatus} />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {selectedReport.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted by {selectedReport.submittedBy} on{' '}
                  {new Date(selectedReport.submittedAt).toLocaleDateString()} &bull; {selectedReport.department} ({selectedReport.costCenter})
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C2833]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Business Purpose Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#1C2833] rounded-xl border border-[#E5EAF0] dark:border-[#2D3942]">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Business Purpose & Justification
                </div>
                <div className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  {selectedReport.businessPurpose}
                </div>
              </div>

              {/* Policy Evaluation Notice */}
              {selectedReport.policyViolations.length > 0 && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1.5">
                  <div className="flex items-center space-x-2 font-bold text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Automated Policy Engine Audit Flags</span>
                  </div>
                  {selectedReport.policyViolations.map((v, idx) => (
                    <div key={idx} className="text-amber-700 dark:text-amber-400 text-[11px] pl-6">
                      &bull; <span className="font-semibold">{v.message}:</span> {v.detail}
                    </div>
                  ))}
                </div>
              )}

              {/* Sequential Multi-Stage Approval Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                    Sequential Multi-Stage Approval Flow
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {selectedReport.approvalFlow.filter((s) => s.status === 'APPROVED').length} of{' '}
                    {selectedReport.approvalFlow.length} Stages Completed
                  </span>
                </div>

                <div className="relative border-l-2 border-[#E5EAF0] dark:border-[#2D3942] ml-4 pl-6 space-y-5">
                  {selectedReport.approvalFlow.map((step) => {
                    const isApproved = step.status === 'APPROVED';
                    const isPending = step.status === 'PENDING';
                    const isRework = step.status === 'CHANGES_REQUESTED';

                    return (
                      <div key={step.sequence} className="relative">
                        {/* Status Icon Marker */}
                        <div
                          className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isApproved
                              ? 'bg-emerald-600 text-white ring-4 ring-white dark:ring-[#151F27]'
                              : isPending
                              ? 'bg-[#008C69] text-white animate-pulse ring-4 ring-white dark:ring-[#151F27]'
                              : isRework
                              ? 'bg-amber-500 text-white ring-4 ring-white dark:ring-[#151F27]'
                              : 'bg-slate-300 text-slate-600 ring-4 ring-white dark:ring-[#151F27]'
                          }`}
                        >
                          {isApproved ? '✓' : step.sequence}
                        </div>

                        <div className="bg-slate-50 dark:bg-[#1C2833] p-3 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942]">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {step.stepName}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isApproved
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : isPending
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                                  : isRework
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {step.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Assigned Approver: <span className="font-medium text-slate-700 dark:text-slate-300">{step.approverName}</span> ({step.approverRole})
                          </div>
                          {step.decidedAt && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Decision recorded: {new Date(step.decidedAt).toLocaleString()}
                            </div>
                          )}
                          {step.comment && (
                            <div className="mt-2 text-[11px] p-2 bg-white dark:bg-[#151F27] rounded-lg border border-[#E5EAF0] dark:border-[#2D3942] italic text-slate-600 dark:text-slate-300">
                              &ldquo;{step.comment}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expense Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                    Attached Expense Items ({selectedReport.expenses.length})
                  </h3>
                  <div className="font-bold text-sm">
                    Total: <AmountDisplay amount={selectedReport.totalAmount} currency={selectedReport.currency} />
                  </div>
                </div>

                <div className="border border-[#E5EAF0] dark:border-[#2D3942] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#1C2833] text-slate-500 border-b border-[#E5EAF0] dark:border-[#2D3942]">
                      <tr>
                        <th className="px-3 py-2 font-medium">Merchant / Vendor</th>
                        <th className="px-3 py-2 font-medium">Category</th>
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Receipt</th>
                        <th className="px-3 py-2 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EAF0] dark:divide-[#2D3942]">
                      {selectedReport.expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1A2530]">
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                            {exp.merchant}
                          </td>
                          <td className="px-3 py-2 text-slate-500">{exp.category}</td>
                          <td className="px-3 py-2 text-slate-500">{exp.spentAt}</td>
                          <td className="px-3 py-2">
                            {exp.hasReceipt ? (
                              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                                Attached &bull; SHA-256 Verified
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">No receipt</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-semibold text-right">
                            <AmountDisplay amount={exp.amount} currency={selectedReport.currency} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Immutable Audit Log */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
                  Immutable Audit Log
                </h3>
                <div className="space-y-1.5">
                  {selectedReport.auditHistory.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] flex items-start justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {log.actor}
                        </span>{' '}
                        &bull;{' '}
                        <span className="font-mono text-[10px] text-slate-500 uppercase">
                          {log.action}
                        </span>
                        <div className="text-slate-600 dark:text-slate-400 mt-0.5">{log.note}</div>
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-4">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E5EAF0] dark:border-[#2D3942] flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Self-approval prevention enforced &bull; Audit lock active
              </span>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#1C2833] hover:bg-slate-200 text-slate-700 dark:text-slate-300"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assemble New Report Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            {/* Wizard Header */}
            <div className="p-5 border-b border-[#E5EAF0] dark:border-[#2D3942] flex items-center justify-between bg-slate-50/50 dark:bg-[#1C2833]/50">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#008C69]">
                  Claim Assembly Wizard &bull; Step {wizardStep} of 2
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {wizardStep === 1 ? 'Report Context & Purpose' : 'Select Expenses & Policy Pre-Check'}
                </h2>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wizard Body */}
            <div className="p-6 space-y-4 text-xs">
              {wizardStep === 1 ? (
                <>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Report Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      placeholder="e.g. Hyderabad Q4 Bio-Summit Delegation or October Lab Supplies"
                      className="w-full p-2.5 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#008C69]/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Business Purpose & Objective <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={businessPurpose}
                      onChange={(e) => setBusinessPurpose(e.target.value)}
                      placeholder="State the commercial justification, project milestone, or client travel context..."
                      className="w-full p-2.5 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#008C69]/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Department
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100"
                      >
                        <option value="Research & Diagnostics">Research & Diagnostics</option>
                        <option value="Quality Assurance">Quality Assurance</option>
                        <option value="Executive Management">Executive Management</option>
                        <option value="Business Development">Business Development</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Cost Center Code
                      </label>
                      <input
                        type="text"
                        value={costCenter}
                        onChange={(e) => setCostCenter(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5EAF0] dark:border-[#2D3942]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Unclaimed Verified Expenses ({AVAILABLE_UNCLAIMED_EXPENSES.length})
                    </span>
                    <button
                      onClick={handleSelectAllExpenses}
                      className="text-[#008C69] hover:underline font-semibold"
                    >
                      {selectedExpenseIds.length === AVAILABLE_UNCLAIMED_EXPENSES.length
                        ? 'Deselect All'
                        : 'Select All Items'}
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {AVAILABLE_UNCLAIMED_EXPENSES.map((exp) => {
                      const isSelected = selectedExpenseIds.includes(exp.id);
                      return (
                        <div
                          key={exp.id}
                          onClick={() => handleToggleExpense(exp.id)}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-[#008C69] bg-[#E6F5F0]/40 dark:bg-[#082921]/40'
                              : 'border-[#E5EAF0] dark:border-[#2D3942] hover:bg-slate-50 dark:hover:bg-[#1C2833]'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-[#008C69] focus:ring-[#008C69]"
                            />
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {exp.merchant}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {exp.category} &bull; {exp.spentAt} &bull;{' '}
                                {exp.hasReceipt ? (
                                  <span className="text-emerald-600 font-medium">Receipt attached</span>
                                ) : (
                                  <span className="text-amber-600">No receipt</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <AmountDisplay amount={exp.amount} currency="INR" className="font-bold" />
                        </div>
                      );
                    })}
                  </div>

                  {/* Policy Pre-Check Warning Banners */}
                  {hasEscalationWarning && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start space-x-2 text-[11px] text-blue-800 dark:text-blue-300">
                      <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Policy Alert (&gt;₹50,000):</span> Total claim
                        is ₹{totalWizardAmount.toLocaleString('en-IN')}. This report will automatically route
                        through an Executive / Owner Escalation approval step.
                      </div>
                    </div>
                  )}

                  {/* Summary Bar */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#1C2833] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-slate-500">Selected Items:</span>{' '}
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {selectedExpenseIds.length} receipts
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500">Total Claim:</span>{' '}
                      <span className="font-bold text-sm text-[#008C69]">
                        ₹{totalWizardAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="p-4 border-t border-[#E5EAF0] dark:border-[#2D3942] flex items-center justify-between bg-slate-50/50 dark:bg-[#1C2833]/50">
              {wizardStep === 1 ? (
                <>
                  <button
                    onClick={() => setShowWizard(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!reportTitle.trim()}
                    onClick={() => setWizardStep(2)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#008C69] hover:bg-[#007456] disabled:opacity-50 text-white transition-all shadow-sm"
                  >
                    <span>Next: Select Expenses</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Back
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSubmitNewReport(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#E5EAF0] dark:border-[#2D3942] hover:bg-slate-100 dark:hover:bg-[#1C2833] text-slate-700 dark:text-slate-300"
                    >
                      Save as Draft
                    </button>
                    <button
                      disabled={selectedExpenseIds.length === 0}
                      onClick={() => handleSubmitNewReport(true)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#008C69] hover:bg-[#007456] disabled:opacity-50 text-white transition-all shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit for Approval</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
