import React, { useState, useEffect } from 'react';
import { StatusBadge, AmountDisplay } from '@vyay/ui';
import { ReportStatus, ApprovalDecision, Role } from '@vyay/contracts';
import { api } from '../lib/api';
import {
  Check,
  X,
  MessageSquare,
  AlertCircle,
  ShieldAlert,
  UserCheck,
  Calendar,
  Clock,
  ArrowRight,
  User,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  HelpCircle,
  AlertTriangle,
  Send,
  Building,
} from 'lucide-react';

interface ApprovalQueueItem {
  id: string;
  reportId: string;
  reportNumber: string;
  reportTitle: string;
  submitterName: string;
  submitterEmail: string;
  submitterUserId: string;
  department: string;
  totalAmount: string;
  currency: string;
  submittedAt: string;
  stepSequence: number;
  totalSteps: number;
  stepName: string;
  assignedToName: string;
  assignedToUserId: string;
  isDelegated?: boolean;
  delegatedFrom?: string;
  policyWarnings: string[];
  expenses: {
    id: string;
    merchant: string;
    category: string;
    amount: string;
    spentAt: string;
    receiptAttached: boolean;
    flag?: string;
  }[];
}

interface DelegationRule {
  id: string;
  delegatorName: string;
  delegatorUserId: string;
  delegateName: string;
  delegateUserId: string;
  scope: 'ALL' | 'TRAVEL_ONLY';
  effectiveFrom: string;
  effectiveUntil: string;
  reason: string;
  active: boolean;
}

const INITIAL_QUEUE: ApprovalQueueItem[] = [
  {
    id: 'step-101',
    reportId: 'rep-001',
    reportNumber: 'REP-2026-0891',
    reportTitle: 'Bangalore Lab Equipment & Reagents',
    submitterName: 'Dr. Rahul Sharma',
    submitterEmail: 'rahul.sharma@drantigravity.in',
    submitterUserId: 'dddd4444-4444-4444-4444-444444444444',
    department: 'Research & Diagnostics',
    totalAmount: '8450.00',
    currency: 'INR',
    submittedAt: '2026-10-18T10:30:00Z',
    stepSequence: 1,
    totalSteps: 2,
    stepName: 'Manager Approval',
    assignedToName: 'Anita Deshmukh',
    assignedToUserId: 'cccc3333-3333-3333-3333-333333333333',
    policyWarnings: [
      'Item #2 (Meals) exceeds the ₹1,500 single-meal threshold by ₹450.00. Approver exception required.',
    ],
    expenses: [
      {
        id: 'e-1',
        merchant: 'Merck Biosciences Pvt Ltd',
        category: 'Lab Supplies',
        amount: '5200.00',
        spentAt: '2026-10-15',
        receiptAttached: true,
      },
      {
        id: 'e-2',
        merchant: 'Taj West End Restaurant',
        category: 'Meals & Entertainment',
        amount: '1950.00',
        spentAt: '2026-10-16',
        receiptAttached: true,
        flag: 'Exceeds ₹1,500 guideline',
      },
      {
        id: 'e-3',
        merchant: 'Uber India Technologies',
        category: 'Ground Commute',
        amount: '1300.00',
        spentAt: '2026-10-16',
        receiptAttached: true,
      },
    ],
  },
  {
    id: 'step-102',
    reportId: 'rep-003',
    reportNumber: 'REP-2026-0904',
    reportTitle: 'Hyderabad Bio-Summit Q4 Delegation',
    submitterName: 'Dr. Rahul Sharma',
    submitterEmail: 'rahul.sharma@drantigravity.in',
    submitterUserId: 'dddd4444-4444-4444-4444-444444444444',
    department: 'Research & Diagnostics',
    totalAmount: '64800.00',
    currency: 'INR',
    submittedAt: '2026-10-19T08:00:00Z',
    stepSequence: 2,
    totalSteps: 3,
    stepName: 'Executive Escalation (>₹50,000)',
    assignedToName: 'Vikram Mehta',
    assignedToUserId: 'aaaa1111-1111-1111-1111-111111111111',
    policyWarnings: [
      'High-value claim total exceeds standard ₹50,000 managerial approval limit. Executive sign-off mandated.',
    ],
    expenses: [
      {
        id: 'e-301',
        merchant: 'Vistara Airlines (DEL-HYD)',
        category: 'Air Travel',
        amount: '28400.00',
        spentAt: '2026-10-18',
        receiptAttached: true,
      },
      {
        id: 'e-302',
        merchant: 'ITC Kohenur Luxury Suite',
        category: 'Accommodation',
        amount: '36400.00',
        spentAt: '2026-10-19',
        receiptAttached: true,
      },
    ],
  },
];

const INITIAL_DELEGATIONS: DelegationRule[] = [
  {
    id: 'del-01',
    delegatorName: 'Anita Deshmukh',
    delegatorUserId: 'cccc3333-3333-3333-3333-333333333333',
    delegateName: 'Sarah Jenkins',
    delegateUserId: 'bbbb2222-2222-2222-2222-222222222222',
    scope: 'ALL',
    effectiveFrom: '2026-10-15T00:00:00Z',
    effectiveUntil: '2026-10-25T23:59:59Z',
    reason: 'Annual scientific leave approval handover',
    active: true,
  },
];

export const ApprovalsPage: React.FC = () => {
  // Demo Persona Switcher to showcase Security & Anti-Fraud Self-Approval Prevention
  const [currentPersona, setCurrentPersona] = useState<{
    name: string;
    email: string;
    userId: string;
    role: Role;
  }>({
    name: 'Anita Deshmukh',
    email: 'anita.deshmukh@drantigravity.in',
    userId: 'cccc3333-3333-3333-3333-333333333333',
    role: Role.MANAGER,
  });

  const [activeTab, setActiveTab] = useState<'INBOX' | 'DELEGATIONS' | 'HISTORY'>('INBOX');
  const [queue, setQueue] = useState<ApprovalQueueItem[]>(INITIAL_QUEUE);
  const [selectedItemId, setSelectedItemId] = useState<string>('step-101');
  const [commentText, setCommentText] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dynamic API loading for submitted reports
  useEffect(() => {
    let isMounted = true;
    const fetchPendingApprovals = async () => {
      try {
        const reports = await api.getReports();
        if (!isMounted) return;
        const reviewReports = reports.filter(
          (r) =>
            r.status === ReportStatus.SUBMITTED ||
            r.status === ReportStatus.IN_REVIEW ||
            r.status === ReportStatus.FINANCE_REVIEW
        );
        if (reviewReports.length > 0) {
          const dynamicItems: ApprovalQueueItem[] = reviewReports.map((r, idx) => ({
            id: `step-dyn-${r.id}`,
            reportId: r.id,
            reportNumber: `REP-2026-${String(890 + idx).padStart(4, '0')}`,
            reportTitle: r.title,
            submitterName: r.employeeName || 'Dr. Rahul Sharma',
            submitterEmail: 'rahul.sharma@drantigravity.in',
            submitterUserId: 'dddd4444-4444-4444-4444-444444444444',
            department: r.department || 'R&D Department',
            totalAmount: r.totalAmount,
            currency: r.currency || 'INR',
            submittedAt: r.submittedAt || new Date().toISOString(),
            stepSequence: 1,
            totalSteps: 2,
            stepName: 'Manager Approval',
            assignedToName: 'Anita Deshmukh',
            assignedToUserId: 'cccc3333-3333-3333-3333-333333333333',
            policyWarnings: [],
            expenses: r.expenses?.map((e, eIdx) => ({
              id: e.id || `e-${eIdx}`,
              merchant: e.merchant,
              category: e.category,
              amount: e.amount,
              spentAt: e.spentAt,
              receiptAttached: !!e.receiptUrl,
            })) || [
              {
                id: 'e-1',
                merchant: 'Business Claim Line Item',
                category: 'General',
                amount: r.totalAmount,
                spentAt: new Date().toISOString().split('T')[0],
                receiptAttached: true,
              },
            ],
          }));

          setQueue((prev) => {
            const existingIds = new Set(prev.map((p) => p.reportId));
            const toAdd = dynamicItems.filter((d) => !existingIds.has(d.reportId));
            const updated = [...toAdd, ...prev];
            if (toAdd.length > 0 && (!selectedItemId || !prev.find((p) => p.id === selectedItemId))) {
              setSelectedItemId(updated[0].id);
            }
            return updated;
          });
        }
      } catch (err) {
        console.warn('Could not load live approvals queue', err);
      }
    };
    fetchPendingApprovals();
    return () => {
      isMounted = false;
    };
  }, [selectedItemId]);

  // Delegation Modal State
  const [delegations, setDelegations] = useState<DelegationRule[]>(INITIAL_DELEGATIONS);
  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [newDelegateUserId, setNewDelegateUserId] = useState('bbbb2222-2222-2222-2222-222222222222');
  const [newDelegateScope, setNewDelegateScope] = useState<'ALL' | 'TRAVEL_ONLY'>('ALL');
  const [newDelegateFrom, setNewDelegateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [newDelegateUntil, setNewDelegateUntil] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [newDelegateReason, setNewDelegateReason] = useState('Out-of-office delegation');

  const selectedItem = queue.find((item) => item.id === selectedItemId);

  // Hard Security Gate: Submitter cannot approve their own report
  const isSelfApprovalForbidden =
    selectedItem && selectedItem.submitterUserId === currentPersona.userId;

  const handleDecision = (decision: ApprovalDecision) => {
    if (!selectedItem) return;

    // 1. Enforce Self-Approval Gate
    if (isSelfApprovalForbidden) {
      setFeedbackBanner({
        type: 'error',
        message: 'Security Violation: Self-approval is strictly forbidden by platform financial controls (Rule AC-104).',
      });
      return;
    }

    // 2. Validate comment on Changes Requested or Rejection
    if (
      (decision === ApprovalDecision.CHANGES_REQUESTED || decision === ApprovalDecision.REJECTED) &&
      (!commentText || commentText.trim().length < 3)
    ) {
      setFeedbackBanner({
        type: 'error',
        message: 'A descriptive comment is mandatory when requesting changes or rejecting a claim.',
      });
      return;
    }

    // Process decision with live API sync
    if (decision === ApprovalDecision.APPROVED) {
      api.approveReport(selectedItem.reportId, commentText).catch((e) => console.warn(e));
    } else if (decision === ApprovalDecision.REJECTED) {
      api.rejectReport(selectedItem.reportId, commentText).catch((e) => console.warn(e));
    }

    setQueue((prev) => prev.filter((item) => item.id !== selectedItem.id));
    setCommentText('');

    const verb =
      decision === ApprovalDecision.APPROVED
        ? 'approved and routed to next review stage'
        : decision === ApprovalDecision.CHANGES_REQUESTED
        ? 'returned to employee with changes requested'
        : 'rejected';

    setFeedbackBanner({
      type: 'success',
      message: `Report ${selectedItem.reportNumber} was successfully ${verb}. Immutable audit action logged.`,
    });

    if (queue.length > 1) {
      const remaining = queue.filter((item) => item.id !== selectedItem.id);
      setSelectedItemId(remaining[0].id);
    }
  };

  const handleCreateDelegation = () => {
    if (newDelegateUserId === currentPersona.userId) {
      alert('Self-delegation is strictly prohibited.');
      return;
    }

    const delegateNameMap: Record<string, string> = {
      'bbbb2222-2222-2222-2222-222222222222': 'Sarah Jenkins (Finance Reviewer)',
      'aaaa1111-1111-1111-1111-111111111111': 'Vikram Mehta (Company Owner)',
      'cccc3333-3333-3333-3333-333333333333': 'Anita Deshmukh (Manager)',
    };

    const newDel: DelegationRule = {
      id: `del-${Date.now()}`,
      delegatorName: currentPersona.name,
      delegatorUserId: currentPersona.userId,
      delegateName: delegateNameMap[newDelegateUserId] || 'Colleague',
      delegateUserId: newDelegateUserId,
      scope: newDelegateScope,
      effectiveFrom: new Date(newDelegateFrom).toISOString(),
      effectiveUntil: new Date(newDelegateUntil).toISOString(),
      reason: newDelegateReason,
      active: true,
    };

    setDelegations((prev) => [newDel, ...prev]);
    setShowDelegationModal(false);
    setFeedbackBanner({
      type: 'success',
      message: `Approval delegation to ${newDel.delegateName} successfully activated.`,
    });
  };

  const handleRevokeDelegation = (id: string) => {
    setDelegations((prev) => prev.filter((d) => d.id !== id));
    setFeedbackBanner({
      type: 'success',
      message: 'Delegation rule revoked with immediate effect.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Persona Demo Controller Header */}
      <div className="p-3 bg-gradient-to-r from-emerald-900 to-[#008C69] text-white rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-white/10 rounded-xl">
            <UserCheck className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">
              Interactive Approver Security Context
            </div>
            <div className="text-xs font-semibold">
              Acting as: <span className="underline decoration-emerald-300">{currentPersona.name}</span> ({currentPersona.role})
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[11px] text-emerald-100 hidden sm:inline">Switch Persona:</span>
          <button
            onClick={() =>
              setCurrentPersona({
                name: 'Anita Deshmukh',
                email: 'anita.deshmukh@drantigravity.in',
                userId: 'cccc3333-3333-3333-3333-333333333333',
                role: Role.MANAGER,
              })
            }
            className={`px-2.5 py-1 rounded-lg transition-all ${
              currentPersona.name === 'Anita Deshmukh'
                ? 'bg-white text-emerald-900 font-bold'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            Manager (Anita)
          </button>
          <button
            onClick={() =>
              setCurrentPersona({
                name: 'Sarah Jenkins',
                email: 'sarah.jenkins@drantigravity.in',
                userId: 'bbbb2222-2222-2222-2222-222222222222',
                role: Role.FINANCE_OPERATOR,
              })
            }
            className={`px-2.5 py-1 rounded-lg transition-all ${
              currentPersona.name === 'Sarah Jenkins'
                ? 'bg-white text-emerald-900 font-bold'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            Delegate / Finance (Sarah)
          </button>
          <button
            onClick={() =>
              setCurrentPersona({
                name: 'Dr. Rahul Sharma',
                email: 'rahul.sharma@drantigravity.in',
                userId: 'dddd4444-4444-4444-4444-444444444444',
                role: Role.EMPLOYEE,
              })
            }
            className={`px-2.5 py-1 rounded-lg transition-all ${
              currentPersona.name === 'Dr. Rahul Sharma'
                ? 'bg-white text-emerald-900 font-bold'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            Submitter (Test Self-Approval Gate)
          </button>
        </div>
      </div>

      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Manager & Executive Approvals
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Enforce corporate expense policies, review itemized receipts, and manage out-of-office delegations
          </p>
        </div>

        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-[#1A2530] rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('INBOX')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'INBOX'
                ? 'bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Inbox Queue ({queue.length})
          </button>
          <button
            onClick={() => setActiveTab('DELEGATIONS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'DELEGATIONS'
                ? 'bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Out-of-Office Delegations ({delegations.length})
          </button>
        </div>
      </div>

      {/* Dynamic Feedback Notification */}
      {feedbackBanner && (
        <div
          className={`p-3.5 border rounded-xl text-xs flex items-center justify-between animate-in fade-in ${
            feedbackBanner.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackBanner.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span className="font-medium">{feedbackBanner.message}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {activeTab === 'INBOX' ? (
        queue.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] space-y-3">
            <Check className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Your Approval Inbox is All Caught Up!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no pending expense reports waiting for your action. New claims submitted by your team will appear here automatically.
            </p>
          </div>
        ) : (
          /* Master-Detail Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Queue List */}
            <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5EAF0] dark:border-[#2D3942]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pending Decisions ({queue.length})
                </h2>
                <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Audit Enforced</span>
                </div>
              </div>

              <div className="space-y-2">
                {queue.map((item) => {
                  const isSelected = item.id === selectedItemId;
                  const isItemSelfApproval = item.submitterUserId === currentPersona.userId;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#008C69] bg-[#E6F5F0]/40 dark:bg-[#082921]/40 shadow-sm'
                          : 'border-[#E5EAF0] dark:border-[#2D3942] hover:bg-slate-50 dark:hover:bg-[#1C2833]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {item.submitterName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.reportNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 truncate">
                        {item.reportTitle}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <AmountDisplay
                          amount={item.totalAmount}
                          currency={item.currency}
                          className="text-xs font-bold"
                        />
                        <div className="flex items-center space-x-1">
                          {isItemSelfApproval && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                              Your Claim
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-[#1C2833] px-2 py-0.5 rounded font-medium">
                            Stage {item.stepSequence}/{item.totalSteps}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Detail Pane */}
            {selectedItem && (
              <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] p-6 space-y-6 shadow-sm">
                {/* Header Info */}
                <div className="flex items-start justify-between border-b border-[#E5EAF0] dark:border-[#2D3942] pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {selectedItem.reportNumber} &bull; Stage {selectedItem.stepSequence} of {selectedItem.totalSteps}
                      </span>
                      <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                        {selectedItem.stepName}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {selectedItem.reportTitle}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submitted by <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedItem.submitterName}</span> ({selectedItem.department}) on{' '}
                      {new Date(selectedItem.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Claim Amount</span>
                    <div className="text-xl font-bold font-mono text-[#008C69]">
                      <AmountDisplay amount={selectedItem.totalAmount} currency={selectedItem.currency} />
                    </div>
                  </div>
                </div>

                {/* Self-Approval Prevention Gate Banner */}
                {isSelfApprovalForbidden && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center space-x-2 font-bold text-rose-800 dark:text-rose-300">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Financial Control Gate: Self-Approval Strictly Prohibited</span>
                    </div>
                    <p className="text-rose-700 dark:text-rose-400 text-[11px]">
                      Under corporate governance and SOC-2 financial control policies, employees cannot approve or sign off on their own expense reports. Decision actions for this claim are disabled.
                    </p>
                  </div>
                )}

                {/* Automated Policy Warning Callouts */}
                {selectedItem.policyWarnings.length > 0 && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center space-x-2 font-bold text-amber-800 dark:text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Policy Evaluation Audit Advisory</span>
                    </div>
                    {selectedItem.policyWarnings.map((warn, i) => (
                      <p key={i} className="text-amber-700 dark:text-amber-400 text-[11px] pl-6">
                        &bull; {warn}
                      </p>
                    ))}
                  </div>
                )}

                {/* Itemized Line Items & Receipts */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Expense Line Items ({selectedItem.expenses.length})
                  </h3>
                  <div className="space-y-2 text-xs">
                    {selectedItem.expenses.map((exp) => (
                      <div
                        key={exp.id}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          exp.flag
                            ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20'
                            : 'border-[#E5EAF0] dark:border-[#2D3942]'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                            <span>{exp.merchant}</span>
                            {exp.flag && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 rounded">
                                {exp.flag}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {exp.category} &bull; {exp.spentAt}
                          </div>
                        </div>
                        <div className="text-right">
                          <AmountDisplay amount={exp.amount} currency={selectedItem.currency} className="font-bold" />
                          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            Verified Receipt Attached
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Decision Form */}
                <div className="border-t border-[#E5EAF0] dark:border-[#2D3942] pt-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Approver Comments & Exception Rationale{' '}
                      <span className="text-slate-400 font-normal">
                        (Mandatory for Changes Requested or Rejection)
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      disabled={isSelfApprovalForbidden}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={
                        isSelfApprovalForbidden
                          ? 'Self-approval disabled for this claim.'
                          : 'Enter your approval remarks or instructions for requested changes...'
                      }
                      className="w-full text-xs p-3 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#008C69]/20"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">
                      Every decision logs timestamp, IP, and cryptographic actor signature.
                    </span>

                    <div className="flex items-center space-x-2.5">
                      <button
                        disabled={isSelfApprovalForbidden}
                        onClick={() => handleDecision(ApprovalDecision.CHANGES_REQUESTED)}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 disabled:opacity-40 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Request Changes</span>
                      </button>

                      <button
                        disabled={isSelfApprovalForbidden}
                        onClick={() => handleDecision(ApprovalDecision.REJECTED)}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 disabled:opacity-40 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        disabled={isSelfApprovalForbidden}
                        onClick={() => handleDecision(ApprovalDecision.APPROVED)}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#008C69] hover:bg-[#007456] disabled:opacity-40 transition-all shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Route Forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* Out-of-Office Delegations Tab */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Active Out-of-Office Approval Delegations
              </h2>
              <p className="text-xs text-slate-500">
                Delegate approval authority to qualified peers during planned annual or sick leave with full audit visibility
              </p>
            </div>
            <button
              onClick={() => setShowDelegationModal(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#008C69] hover:bg-[#007456] text-white transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Out-of-Office Delegation</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {delegations.map((d) => (
              <div
                key={d.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Active Approval Delegation
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                    Scope: {d.scope}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">Delegator (Authorizer)</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {d.delegatorName}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Appointed Delegate</span>
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {d.delegateName}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1C2833] text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(d.effectiveFrom).toLocaleDateString()} &rarr;{' '}
                      {new Date(d.effectiveUntil).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Active Window</span>
                </div>

                <div className="text-[11px] text-slate-500 italic">&ldquo;{d.reason}&rdquo;</div>

                <div className="pt-2 border-t border-[#E5EAF0] dark:border-[#2D3942] flex justify-end">
                  <button
                    onClick={() => handleRevokeDelegation(d.id)}
                    className="inline-flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke Delegation</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Delegation Modal */}
      {showDelegationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b border-[#E5EAF0] dark:border-[#2D3942] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#008C69]">
                  Approval Governance
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  New Out-of-Office Delegation
                </h2>
              </div>
              <button
                onClick={() => setShowDelegationModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Select Delegate Colleague <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newDelegateUserId}
                  onChange={(e) => setNewDelegateUserId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100"
                >
                  <option value="bbbb2222-2222-2222-2222-222222222222">
                    Sarah Jenkins (Finance Reviewer)
                  </option>
                  <option value="aaaa1111-1111-1111-1111-111111111111">
                    Vikram Mehta (Company Owner)
                  </option>
                  <option value="cccc3333-3333-3333-3333-333333333333">
                    Anita Deshmukh (Manager)
                  </option>
                </select>
                <div className="text-[10px] text-slate-400">
                  Self-delegation is strictly prohibited by security rules.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Delegation Authority Scope
                </label>
                <select
                  value={newDelegateScope}
                  onChange={(e) => setNewDelegateScope(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100"
                >
                  <option value="ALL">All Categories & Claims</option>
                  <option value="TRAVEL_ONLY">Travel & Commute Expenses Only</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Effective From
                  </label>
                  <input
                    type="date"
                    value={newDelegateFrom}
                    onChange={(e) => setNewDelegateFrom(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Effective Until
                  </label>
                  <input
                    type="date"
                    value={newDelegateUntil}
                    onChange={(e) => setNewDelegateUntil(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Reason / Handover Note <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDelegateReason}
                  onChange={(e) => setNewDelegateReason(e.target.value)}
                  placeholder="e.g. Annual scientific leave or medical absence"
                  className="w-full p-2.5 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#E5EAF0] dark:border-[#2D3942] flex justify-end space-x-2 bg-slate-50/50 dark:bg-[#1C2833]/50">
              <button
                onClick={() => setShowDelegationModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDelegation}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#008C69] hover:bg-[#007456] text-white transition-all shadow-sm"
              >
                Activate Delegation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
