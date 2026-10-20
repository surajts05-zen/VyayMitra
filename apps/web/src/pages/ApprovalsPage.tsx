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
  ShieldCheck,
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
  KeyRound,
  Lock,
  Copy,
  ExternalLink,
  FileText,
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

interface ApprovalsPageProps {
  activeRole?: string;
  activeEmail?: string;
  onNavigate?: (path: string) => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({ activeRole, activeEmail, onNavigate }) => {
  // Sync persona with global active role if provided
  const [currentPersona, setCurrentPersona] = useState<{
    name: string;
    email: string;
    userId: string;
    role: Role;
  }>(() => {
    if (activeRole === 'EMPLOYEE') {
      return {
        name: 'Dr. Rahul Sharma',
        email: activeEmail || 'rahul.sharma@drantigravity.in',
        userId: 'dddd4444-4444-4444-4444-444444444444',
        role: Role.EMPLOYEE,
      };
    }
    if (activeRole === 'COMPANY_OWNER') {
      return {
        name: 'Vikram Mehta',
        email: activeEmail || 'admin@horizonsci.in',
        userId: 'aaaa1111-1111-1111-1111-111111111111',
        role: Role.COMPANY_OWNER,
      };
    }
    if (activeRole === 'FINANCE_OPERATOR') {
      return {
        name: 'Sarah Jenkins',
        email: activeEmail || 'sarah.finance@horizonsci.in',
        userId: 'bbbb2222-2222-2222-2222-222222222222',
        role: Role.FINANCE_ADMIN,
      };
    }
    return {
      name: 'Anita Deshmukh',
      email: 'anita.deshmukh@drantigravity.in',
      userId: 'cccc3333-3333-3333-3333-333333333333',
      role: Role.MANAGER,
    };
  });

  // Re-sync if parent activeRole changes
  useEffect(() => {
    if (!activeRole) return;
    if (activeRole === 'EMPLOYEE') {
      setCurrentPersona({
        name: 'Dr. Rahul Sharma',
        email: activeEmail || 'rahul.sharma@drantigravity.in',
        userId: 'dddd4444-4444-4444-4444-444444444444',
        role: Role.EMPLOYEE,
      });
    } else if (activeRole === 'COMPANY_OWNER') {
      setCurrentPersona({
        name: 'Vikram Mehta',
        email: activeEmail || 'admin@horizonsci.in',
        userId: 'aaaa1111-1111-1111-1111-111111111111',
        role: Role.COMPANY_OWNER,
      });
    } else if (activeRole === 'FINANCE_OPERATOR') {
      setCurrentPersona({
        name: 'Sarah Jenkins',
        email: activeEmail || 'sarah.finance@horizonsci.in',
        userId: 'bbbb2222-2222-2222-2222-222222222222',
        role: Role.FINANCE_ADMIN,
      });
    } else {
      setCurrentPersona({
        name: 'Anita Deshmukh',
        email: 'anita.deshmukh@drantigravity.in',
        userId: 'cccc3333-3333-3333-3333-333333333333',
        role: Role.MANAGER,
      });
    }
  }, [activeRole, activeEmail]);

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
  const [selectedReceiptExpense, setSelectedReceiptExpense] = useState<any | null>(null);

  const selectedItem = queue.find((item) => item.id === selectedItemId);

  // Hard Security Gate: Submitter cannot approve their own report
  const isSelfApprovalForbidden =
    selectedItem && selectedItem.submitterUserId === currentPersona.userId;

  // Role Authority Gate: Enforce that only authorized roles can execute decisions
  const isRoleUnauthorized =
    currentPersona.role === Role.EMPLOYEE ||
    (selectedItem?.stepSequence === 2 &&
      currentPersona.role !== Role.COMPANY_OWNER &&
      currentPersona.role !== Role.FINANCE_ADMIN);

  const canApproveClaim = !isSelfApprovalForbidden && !isRoleUnauthorized;

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
      <div className="p-3 bg-card border border-border text-foreground rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-card">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-muted/60 rounded-xl text-muted-foreground">
            <UserCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Interactive Approver Security Context
            </div>
            <div className="text-xs font-semibold text-foreground">
              Acting as: <span className="text-primary font-bold">{currentPersona.name}</span> ({currentPersona.role})
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">Switch Persona:</span>
          <button
            onClick={() =>
              setCurrentPersona({
                name: 'Anita Deshmukh',
                email: 'anita.deshmukh@drantigravity.in',
                userId: 'cccc3333-3333-3333-3333-333333333333',
                role: Role.MANAGER,
              })
            }
            className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
              currentPersona.name === 'Anita Deshmukh'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 font-semibold shadow-xs'
                : 'bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground'
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
            className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
              currentPersona.name === 'Sarah Jenkins'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 font-semibold shadow-xs'
                : 'bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground'
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
            className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
              currentPersona.name === 'Dr. Rahul Sharma'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 font-semibold shadow-xs'
                : 'bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground'
            }`}
          >
            Submitter (Test Self-Approval Gate)
          </button>
        </div>
      </div>

      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Manager & Executive Approvals
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Enforce corporate expense policies, review itemized receipts, and manage out-of-office delegations
          </p>
        </div>

        <div className="flex items-center space-x-1.5 p-1 bg-muted/50 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('INBOX')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'INBOX'
                ? 'bg-card text-foreground shadow-card'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Inbox Queue ({queue.length})
          </button>
          <button
            onClick={() => setActiveTab('DELEGATIONS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'DELEGATIONS'
                ? 'bg-card text-foreground shadow-card'
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
          <div className="p-12 text-center rounded-2xl bg-card border border-border space-y-3">
            <Check className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-foreground">
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
            <div className="lg:col-span-1 rounded-2xl bg-card border border-border p-4 space-y-3 shadow-card">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pending Decisions ({queue.length})
                </h2>
                <div className="flex items-center space-x-1 text-[11px] text-muted-foreground font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
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
                          ? 'border-emerald-600/40 bg-emerald-950/20 shadow-sm'
                          : 'border-border/60 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-foreground">
                          {item.submitterName}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {item.reportNumber}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium mt-1 truncate">
                        {item.reportTitle}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <AmountDisplay
                          amount={item.totalAmount}
                          currency={item.currency}
                          className="text-xs font-semibold text-foreground"
                        />
                        <div className="flex items-center space-x-1">
                          {isItemSelfApproval && (
                            <span className="text-[10px] font-medium text-rose-300/90 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                              Your Claim
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded font-medium">
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
              <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-6 space-y-6 shadow-card">
                {/* Header Info */}
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        {selectedItem.reportNumber} &bull; Stage {selectedItem.stepSequence} of {selectedItem.totalSteps}
                      </span>
                      <span className="text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300/90 px-2 py-0.5 rounded">
                        {selectedItem.stepName}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-foreground mt-1">
                      {selectedItem.reportTitle}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted by <span className="font-semibold text-foreground">{selectedItem.submitterName}</span> ({selectedItem.department}) on{' '}
                      {new Date(selectedItem.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground">Claim Amount</span>
                    <div className="text-xl font-bold font-mono text-foreground">
                      <AmountDisplay amount={selectedItem.totalAmount} currency={selectedItem.currency} />
                    </div>
                  </div>
                </div>

                {/* Self-Approval Prevention Gate Banner */}
                {isSelfApprovalForbidden && (
                  <div className="p-3.5 bg-card border border-rose-500/25 dark:bg-rose-950/15 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center space-x-2 font-medium text-rose-300/90">
                      <ShieldAlert className="w-4 h-4 text-rose-400/80" />
                      <span>Financial Control Gate: Self-Approval Strictly Prohibited</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Under corporate governance and SOC-2 financial control policies, employees cannot approve or sign off on their own expense reports. Decision actions for this claim are disabled.
                    </p>
                  </div>
                )}

                {/* Role-Based Authority Gate Banner */}
                {isRoleUnauthorized && !isSelfApprovalForbidden && (
                  <div className="p-3.5 bg-card border border-amber-500/25 dark:bg-amber-950/15 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center space-x-2 font-medium text-amber-300/90">
                      <ShieldAlert className="w-4 h-4 text-amber-400/80" />
                      <span>Role Authority Restriction: Signing Privileges Required</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {currentPersona.role === Role.EMPLOYEE
                        ? 'You are viewing as an Employee. Employees do not have authority to approve claims. Please switch to a Manager, Finance, or Owner role to review.'
                        : `This claim requires Executive Escalation (${selectedItem?.stepName}). Claims exceeding ₹50,000 require Company Owner sign-off.`}
                    </p>
                  </div>
                )}

                {/* Automated Policy Warning Callouts */}
                {selectedItem.policyWarnings.length > 0 && (
                  <div className="p-3.5 bg-card border border-amber-500/25 dark:bg-amber-950/15 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center space-x-2 font-medium text-amber-300/90">
                      <AlertCircle className="w-4 h-4 text-amber-400/80" />
                      <span>Policy Evaluation Audit Advisory</span>
                    </div>
                    {selectedItem.policyWarnings.map((warn, i) => (
                      <p key={i} className="text-slate-400 text-[11px] pl-6 leading-relaxed">
                        &bull; {warn}
                      </p>
                    ))}
                  </div>
                )}

                {/* Itemized Line Items & Receipts */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Expense Line Items ({selectedItem.expenses.length})
                  </h3>
                  <div className="space-y-2 text-xs">
                    {selectedItem.expenses.map((exp) => (
                      <div
                        key={exp.id}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          exp.flag
                            ? 'border-amber-500/20 bg-amber-500/5'
                            : 'border-border/60'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-foreground flex items-center space-x-2">
                            <span>{exp.merchant}</span>
                            {exp.flag && (
                              <span className="text-[10px] font-medium text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                {exp.flag}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {exp.category} &bull; {exp.spentAt}
                          </div>
                        </div>
                        <div className="text-right">
                          <AmountDisplay amount={exp.amount} currency={selectedItem.currency} className="font-semibold text-foreground" />
                          {exp.receiptAttached ? (
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptExpense(exp)}
                              className="mt-1 inline-flex items-center space-x-1.5 text-[11px] font-medium text-slate-300 bg-muted/40 hover:bg-muted/70 border border-border/80 px-2 py-0.5 rounded-md transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Inspect HMAC Token</span>
                            </button>
                          ) : (
                            <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                              No Receipt Attached
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Decision Form */}
                <div className="border-t border-border pt-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Approver Comments & Exception Rationale{' '}
                      <span className="text-muted-foreground font-normal">
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
                      className="w-full text-xs p-3 rounded-xl border border-border bg-card text-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <span className="text-[11px] text-muted-foreground">
                      Every decision logs timestamp, IP, and cryptographic actor signature.
                    </span>

                    <div className="flex items-center space-x-2.5">
                      <button
                        disabled={!canApproveClaim}
                        onClick={() => handleDecision(ApprovalDecision.CHANGES_REQUESTED)}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 disabled:opacity-40 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Request Changes</span>
                      </button>

                      <button
                        disabled={!canApproveClaim}
                        onClick={() => handleDecision(ApprovalDecision.REJECTED)}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 disabled:opacity-40 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        disabled={!canApproveClaim}
                        onClick={() => handleDecision(ApprovalDecision.APPROVED)}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:opacity-90 disabled:opacity-40 transition-all shadow-card"
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
              <h2 className="text-base font-bold text-foreground">
                Active Out-of-Office Approval Delegations
              </h2>
              <p className="text-xs text-slate-500">
                Delegate approval authority to qualified peers during planned annual or sick leave with full audit visibility
              </p>
            </div>
            <button
              onClick={() => setShowDelegationModal(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary hover:opacity-90 text-white transition-all shadow-card"
            >
              <Plus className="w-4 h-4" />
              <span>Create Out-of-Office Delegation</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {delegations.map((d) => (
              <div
                key={d.id}
                className="p-5 rounded-2xl bg-card border border-border space-y-4 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-foreground">
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
                    <div className="font-semibold text-foreground mt-0.5">
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

                <div className="p-2.5 rounded-xl bg-muted/40 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
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

                <div className="pt-2 border-t border-border flex justify-end">
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
          <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-float animate-in zoom-in-95">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  Approval Governance
                </span>
                <h2 className="text-base font-bold text-foreground">
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
                  className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground"
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
                  className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground"
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
                    className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground"
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
                    className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground"
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
                  className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end space-x-2 bg-slate-50/50 dark:bg-muted/50">
              <button
                onClick={() => setShowDelegationModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDelegation}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:opacity-90 text-white transition-all shadow-card"
              >
                Activate Delegation
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Receipt & Cryptographic HMAC Token Inspector Modal */}
      {selectedReceiptExpense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-float text-xs animate-fade-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Receipt Security & HMAC Token Verification
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Protected Object &bull; Time-Limited Access
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceiptExpense(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Line Item Context */}
            <div className="p-3 bg-muted/30 rounded-xl border border-border flex justify-between items-center">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Expense Claim Item</span>
                <div className="text-xs font-bold text-foreground">{selectedReceiptExpense.merchant}</div>
                <div className="text-[11px] text-muted-foreground">{selectedReceiptExpense.category} &bull; {selectedReceiptExpense.spentAt}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Amount</span>
                <div className="text-sm font-bold font-mono text-primary">₹{parseFloat(selectedReceiptExpense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            {/* Cryptographic Proof Badges */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-600 font-semibold text-[11px]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>HMAC-SHA256 Signature</span>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground truncate" title="hmac_sha256_v1:9a8b7c6d5e4f3a2b1c0d8e7f6a5b4c3d2e1f0a9b">
                  hmac_sha256_v1:9a8b...2e1f0a9b
                </div>
                <span className="inline-block text-[10px] text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">
                  Verified Authentic
                </span>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                <div className="flex items-center space-x-1.5 text-amber-600 font-semibold text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Signed URL Expiration</span>
                </div>
                <div className="font-mono text-[10px] text-foreground font-semibold">
                  14m 38s remaining
                </div>
                <span className="inline-block text-[10px] text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded font-medium">
                  15-Min Strict TTL
                </span>
              </div>
            </div>

            {/* Presigned Storage URL Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Presigned Gateway URL (Tenant Vault)</span>
                <span className="text-[10px] text-muted-foreground">AWS Signature V4</span>
              </label>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border font-mono text-[10px] text-muted-foreground break-all select-all">
                https://vyaymitra-receipts.s3.ap-south-1.amazonaws.com/tenants/horizon-sci/receipts/2026/10/{selectedReceiptExpense.id}_receipt.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20261020%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20261020T100000Z&X-Amz-Expires=900&X-Amz-Signature=8f4b23a9d701e6c38290f14a0918237462817293a8b7c6d5e4f3a2b1c0d8e7f6
              </div>
              <p className="text-[10px] text-muted-foreground">
                Direct unauthenticated access to this S3 key returns HTTP 403 Forbidden. Only approvers with active session credentials receive timed signed tokens.
              </p>
            </div>

            {/* Receipt Preview Card */}
            <div className="p-3.5 rounded-xl border border-border bg-slate-50 dark:bg-card/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">invoice_{selectedReceiptExpense.merchant.toLowerCase().replace(/[^a-z0-9]/g, '_')}_tax_receipt.pdf</span>
                </div>
                <span className="text-[10px] text-muted-foreground">384 KB &bull; PDF</span>
              </div>
              <div className="h-28 rounded-lg bg-card border border-border flex flex-col items-center justify-center p-3 text-center space-y-1.5">
                <ShieldCheck className="w-8 h-8 text-emerald-500/70" />
                <span className="font-semibold text-xs text-foreground">Secure Inline Document Preview</span>
                <span className="text-[10px] text-muted-foreground">Encrypted with tenant AES-256 GCM envelope key</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-[11px] text-blue-700 dark:text-blue-300">
              <strong>Audit Guarantee:</strong> Accessing this receipt generates an immutable log entry in the compliance ledger recording Approver ID, IP address, and token hash.
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('https://vyaymitra-receipts.s3.ap-south-1.amazonaws.com/...');
                  alert('Presigned HMAC URL copied to clipboard');
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Signed URL</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceiptExpense(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-primary text-white hover:opacity-90 transition-all shadow-card"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
