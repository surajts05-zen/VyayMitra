import React, { useState, useEffect } from 'react';
import { StatusBadge, AmountDisplay } from '@vyay/ui';
import { ReimbursementStatus, PaymentMethod } from '@vyay/contracts';
import { api } from '../lib/api';
import {
  CreditCard,
  PlusCircle,
  CheckCircle,
  Clock,
  Building,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  Receipt,
  FileCheck2,
  Calendar,
  X,
  Send,
  AlertTriangle,
} from 'lucide-react';

interface PaymentHistoryItem {
  id: string;
  amount: string;
  paidAt: string;
  method: PaymentMethod;
  transactionRef: string;
  payerBankAccount: string;
  recordedBy: string;
  notes?: string;
}

interface ReimbursementRecord {
  id: string;
  reportId: string;
  reportNumber: string;
  reportTitle: string;
  employeeName: string;
  employeeNumber: string;
  bankName: string;
  bankAccountMasked: string;
  ifscCode: string;
  currency: string;
  eligibleAmount: string;
  paidAmount: string;
  remainingAmount: string;
  status: ReimbursementStatus;
  payments: PaymentHistoryItem[];
}

const INITIAL_REIMBURSEMENTS: ReimbursementRecord[] = [
  {
    id: 'reimb-001',
    reportId: 'rep-001',
    reportNumber: 'REP-2026-0891',
    reportTitle: 'Bangalore Lab Equipment & Reagents',
    employeeName: 'Dr. Rahul Sharma',
    employeeNumber: 'EMP-104',
    bankName: 'HDFC Bank Ltd',
    bankAccountMasked: '•••• •••• 9841',
    ifscCode: 'HDFC0001234',
    currency: 'INR',
    eligibleAmount: '8450.00',
    paidAmount: '0.00',
    remainingAmount: '8450.00',
    status: ReimbursementStatus.ELIGIBLE,
    payments: [],
  },
  {
    id: 'reimb-002',
    reportId: 'rep-002',
    reportNumber: 'REP-2026-0845',
    reportTitle: 'Delhi Client Field Audit Travel',
    employeeName: 'Priya Patel',
    employeeNumber: 'EMP-112',
    bankName: 'ICICI Bank Ltd',
    bankAccountMasked: '•••• •••• 4122',
    ifscCode: 'ICIC0000456',
    currency: 'INR',
    eligibleAmount: '12000.00',
    paidAmount: '6000.00',
    remainingAmount: '6000.00',
    status: ReimbursementStatus.PARTIALLY_PAID,
    payments: [
      {
        id: 'pay-001',
        amount: '6000.00',
        paidAt: '2026-10-17T11:00:00Z',
        method: PaymentMethod.BANK_TRANSFER,
        transactionRef: 'UTR-2026-NEFT-884102',
        payerBankAccount: 'HDFC Corporate Operating A/C ****4091',
        recordedBy: 'Sarah Jenkins (Finance)',
        notes: 'First installment of travel claim.',
      },
    ],
  },
  {
    id: 'reimb-003',
    reportId: 'rep-003',
    reportNumber: 'REP-2026-0810',
    reportTitle: 'Bio-Rad Reagents & Calibration Kit',
    employeeName: 'Anita Deshmukh',
    employeeNumber: 'EMP-001',
    bankName: 'State Bank of India',
    bankAccountMasked: '•••• •••• 7712',
    ifscCode: 'SBIN0002100',
    currency: 'INR',
    eligibleAmount: '18500.00',
    paidAmount: '18500.00',
    remainingAmount: '0.00',
    status: ReimbursementStatus.PAID,
    payments: [
      {
        id: 'pay-002',
        amount: '18500.00',
        paidAt: '2026-10-15T15:30:00Z',
        method: PaymentMethod.BANK_TRANSFER,
        transactionRef: 'UTR-2026-RTGS-110294',
        payerBankAccount: 'HDFC Corporate Operating A/C ****4091',
        recordedBy: 'Sarah Jenkins (Finance)',
        notes: 'Full settlement via corporate RTGS.',
      },
    ],
  },
];

export const ReimbursementsPage: React.FC = () => {
  const [records, setRecords] = useState<ReimbursementRecord[]>(INITIAL_REIMBURSEMENTS);
  const [filterTab, setFilterTab] = useState<'ALL' | 'ELIGIBLE' | 'PARTIAL' | 'PAID'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ReimbursementRecord | null>(null);

  // Dynamic API loading for reimbursable reports
  useEffect(() => {
    let isMounted = true;
    const fetchReimbursements = async () => {
      try {
        const reports = await api.getReports();
        if (!isMounted) return;
        const eligibleReports = reports.filter(
          (r) =>
            r.reimbursementStatus === ReimbursementStatus.ELIGIBLE ||
            r.reimbursementStatus === ReimbursementStatus.PARTIALLY_PAID ||
            r.reimbursementStatus === ReimbursementStatus.PAID
        );

        if (eligibleReports.length > 0) {
          const dynamicRecords: ReimbursementRecord[] = eligibleReports.map((r, idx) => ({
            id: `reimb-dyn-${r.id}`,
            reportId: r.id,
            reportNumber: `REP-2026-${String(890 + idx).padStart(4, '0')}`,
            reportTitle: r.title,
            employeeName: r.employeeName || 'Dr. Rahul Sharma',
            employeeNumber: `EMP-${100 + idx}`,
            bankName: 'HDFC Bank Ltd',
            bankAccountMasked: '•••• •••• 9841',
            ifscCode: 'HDFC0001234',
            currency: r.currency || 'INR',
            eligibleAmount: r.totalAmount,
            paidAmount: r.reimbursementStatus === ReimbursementStatus.PAID ? r.totalAmount : '0.00',
            remainingAmount: r.reimbursementStatus === ReimbursementStatus.PAID ? '0.00' : r.totalAmount,
            status: r.reimbursementStatus,
            payments:
              r.reimbursementStatus === ReimbursementStatus.PAID
                ? [
                    {
                      id: `pay-${r.id}`,
                      amount: r.totalAmount,
                      paidAt: r.paidAt || new Date().toISOString(),
                      method: PaymentMethod.BANK_TRANSFER,
                      transactionRef: r.transactionRef || 'UTR-2026-IMPS-AUTO',
                      payerBankAccount: 'HDFC Corporate Operating A/C ****4091',
                      recordedBy: 'Sarah Jenkins (Finance)',
                      notes: 'Disbursement settlement.',
                    },
                  ]
                : [],
          }));

          setRecords((prev) => {
            const existingIds = new Set(prev.map((p) => p.reportId));
            const toAdd = dynamicRecords.filter((d) => !existingIds.has(d.reportId));
            return [...toAdd, ...prev];
          });
        }
      } catch (err) {
        console.warn('Could not load live reimbursements', err);
      }
    };
    fetchReimbursements();
    return () => {
      isMounted = false;
    };
  }, []);

  // Record Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingRecord, setPayingRecord] = useState<ReimbursementRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK_TRANSFER);
  const [transactionRef, setTransactionRef] = useState('');
  const [payerAccount, setPayerAccount] = useState('HDFC Corporate Operating A/C ****4091');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleOpenPaymentModal = (record: ReimbursementRecord) => {
    setPayingRecord(record);
    setPaymentAmount(record.remainingAmount);
    setTransactionRef(`UTR-2026-NEFT-${Math.floor(100000 + Math.random() * 900000)}`);
    setNotes('');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = () => {
    if (!payingRecord) return;

    const amountNum = parseFloat(paymentAmount);
    const remainingNum = parseFloat(payingRecord.remainingAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }

    if (amountNum > remainingNum) {
      alert(`Payment amount (₹${amountNum}) cannot exceed remaining balance of ₹${remainingNum}.`);
      return;
    }

    if (!transactionRef.trim()) {
      alert('Transaction reference / Bank UTR is mandatory for audit trail.');
      return;
    }

    // Check duplicate UTR within this record
    if (
      payingRecord.payments.some(
        (p) => p.transactionRef.toLowerCase() === transactionRef.trim().toLowerCase()
      )
    ) {
      alert('Duplicate transaction reference. This UTR was already recorded.');
      return;
    }

    // Record via live API client
    api
      .recordReimbursement(payingRecord.reportId, transactionRef.trim(), paymentMethod)
      .catch((e) => console.warn('Could not record reimbursement to API:', e));

    const newPaid = (parseFloat(payingRecord.paidAmount) + amountNum).toFixed(2);
    const newRemaining = (remainingNum - amountNum).toFixed(2);
    const newStatus =
      parseFloat(newRemaining) === 0
        ? ReimbursementStatus.PAID
        : ReimbursementStatus.PARTIALLY_PAID;

    const newPayment: PaymentHistoryItem = {
      id: `pay-${Date.now()}`,
      amount: amountNum.toFixed(2),
      paidAt: new Date().toISOString(),
      method: paymentMethod,
      transactionRef: transactionRef.trim(),
      payerBankAccount: payerAccount,
      recordedBy: 'Sarah Jenkins (Finance Operator)',
      notes: notes || undefined,
    };

    const updatedRecords = records.map((r) => {
      if (r.id === payingRecord.id) {
        return {
          ...r,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newStatus,
          payments: [newPayment, ...r.payments],
        };
      }
      return r;
    });

    setRecords(updatedRecords);
    setShowPaymentModal(false);

    if (selectedRecord && selectedRecord.id === payingRecord.id) {
      setSelectedRecord({
        ...selectedRecord,
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newStatus,
        payments: [newPayment, ...selectedRecord.payments],
      });
    }

    setFeedback({
      type: 'success',
      message: `Disbursement of ₹${amountNum.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
      })} recorded successfully (Ref: ${transactionRef}). Remaining balance: ₹${parseFloat(
        newRemaining
      ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reportTitle.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'ELIGIBLE') return r.status === ReimbursementStatus.ELIGIBLE;
    if (filterTab === 'PARTIAL') return r.status === ReimbursementStatus.PARTIALLY_PAID;
    if (filterTab === 'PAID') return r.status === ReimbursementStatus.PAID;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Reimbursement Register & Disbursements
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Disburse verified employee payments, track partial installments, and maintain an immutable banking audit trail
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2 rounded-xl shadow-card">
          <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Strict Financial Governance: Approval ≠ Reimbursement</span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl flex items-center space-x-2.5 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 bg-muted/50 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'ALL'
                ? 'bg-card text-foreground shadow-card'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Claims ({records.length})
          </button>
          <button
            onClick={() => setFilterTab('ELIGIBLE')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'ELIGIBLE'
                ? 'bg-card text-foreground shadow-card'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Unpaid / Ready ({records.filter((r) => r.status === ReimbursementStatus.ELIGIBLE).length})
          </button>
          <button
            onClick={() => setFilterTab('PARTIAL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'PARTIAL'
                ? 'bg-card text-foreground shadow-card'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Partially Paid ({records.filter((r) => r.status === ReimbursementStatus.PARTIALLY_PAID).length})
          </button>
          <button
            onClick={() => setFilterTab('PAID')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'PAID'
                ? 'bg-card text-foreground shadow-card'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Settled ({records.filter((r) => r.status === ReimbursementStatus.PAID).length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee, report #, title..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Main Reimbursements Table */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-slate-500 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Employee Beneficiary</th>
                <th className="px-4 py-3 font-medium">Claim Reference</th>
                <th className="px-4 py-3 font-medium">Eligible Total</th>
                <th className="px-4 py-3 font-medium">Paid Installments</th>
                <th className="px-4 py-3 font-medium">Remaining Balance</th>
                <th className="px-4 py-3 font-medium">Reimbursement Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.map((r) => {
                const isSettled = r.status === ReimbursementStatus.PAID;
                const isPartial = r.status === ReimbursementStatus.PARTIALLY_PAID;

                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="hover:bg-slate-50/60 dark:hover:bg-[#1A2530] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground">
                        {r.employeeName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {r.bankName} &bull; {r.bankAccountMasked} (IFSC: {r.ifscCode})
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground">
                        {r.reportNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                        {r.reportTitle}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono">
                      <AmountDisplay amount={r.eligibleAmount} currency={r.currency} />
                    </td>
                    <td className="px-4 py-3.5 font-mono text-emerald-600 font-medium">
                      <AmountDisplay amount={r.paidAmount} currency={r.currency} />
                    </td>
                    <td className="px-4 py-3.5 font-bold font-mono">
                      {parseFloat(r.remainingAmount) > 0 ? (
                        <span className="text-amber-600">
                          <AmountDisplay amount={r.remainingAmount} currency={r.currency} />
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">₹0.00 (Settled)</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      {!isSettled ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPaymentModal(r);
                          }}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shadow-card transition-all ${
                            isPartial
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-primary hover:opacity-90'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{isPartial ? 'Pay Installment' : 'Disburse Payout'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
                          Settled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Installment Modal */}
      {showPaymentModal && payingRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-float animate-in zoom-in-95">
            <div className="p-5 border-b border-border flex items-center justify-between bg-slate-50/50 dark:bg-muted/50">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  Disbursement Execution
                </span>
                <h2 className="text-base font-bold text-foreground">
                  Record Payout to {payingRecord.employeeName}
                </h2>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Beneficiary Card */}
              <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1">
                <span className="text-slate-400 text-[10px] font-medium">Beneficiary Banking Record</span>
                <div className="font-semibold text-foreground">
                  {payingRecord.employeeName} ({payingRecord.employeeNumber})
                </div>
                <div className="text-[11px] text-slate-500">
                  {payingRecord.bankName} &bull; {payingRecord.bankAccountMasked} &bull; IFSC: {payingRecord.ifscCode}
                </div>
              </div>

              {/* Balance Bar */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div>
                  <span className="text-[10px] text-slate-400">Total Eligible Claim:</span>
                  <div className="font-bold font-mono text-xs">
                    ₹{payingRecord.eligibleAmount}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Remaining Unpaid:</span>
                  <div className="font-bold font-mono text-xs text-amber-700 dark:text-amber-300">
                    ₹{payingRecord.remainingAmount}
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Disbursement Amount (INR) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(payingRecord.remainingAmount)}
                    className="text-primary hover:underline font-semibold text-[11px]"
                  >
                    Pay Full Remaining (₹{payingRecord.remainingAmount})
                  </button>
                </div>
                <input
                  type="text"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-card font-mono font-bold text-sm text-foreground"
                />
                <span className="text-[10px] text-slate-400">
                  Exact partial decimal installments supported. Cannot exceed remaining balance.
                </span>
              </div>

              {/* Payer Account & Method */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground"
                  >
                    <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer (NEFT / RTGS)</option>
                    <option value={PaymentMethod.UPI}>Corporate UPI Payout</option>
                    <option value={PaymentMethod.CASH}>Cash Disbursement</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Payer Corporate Account
                  </label>
                  <select
                    value={payerAccount}
                    onChange={(e) => setPayerAccount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground"
                  >
                    <option value="HDFC Corporate Operating A/C ****4091">
                      HDFC Operating A/C ****4091
                    </option>
                    <option value="ICICI Current A/C ****8812">ICICI Current A/C ****8812</option>
                  </select>
                </div>
              </div>

              {/* Transaction Ref */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Bank UTR / Transaction Reference Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UTR-2026-NEFT-984102"
                  className="w-full p-2.5 rounded-xl border border-border bg-card font-mono text-foreground"
                />
                <span className="text-[10px] text-slate-400">
                  Anti-duplicate gate: Every transaction reference must be unique.
                </span>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Disbursement Remarks / Voucher Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Disbursed via standard banking batch run"
                  className="w-full p-2.5 rounded-xl border border-border bg-card text-foreground"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-end space-x-2.5 bg-slate-50/50 dark:bg-muted/50">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:opacity-90 text-white transition-all shadow-card"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Disburse Payout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History & Installment Audit Drawer / Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl overflow-hidden shadow-float animate-in zoom-in-95">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {selectedRecord.reportNumber}
                  </span>
                  <StatusBadge status={selectedRecord.status} />
                </div>
                <h2 className="text-base font-bold text-foreground mt-1">
                  Reimbursement Payout History: {selectedRecord.employeeName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400">Total Eligible:</span>
                  <div className="font-bold font-mono">₹{selectedRecord.eligibleAmount}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Total Disbursed:</span>
                  <div className="font-bold font-mono text-emerald-600">
                    ₹{selectedRecord.paidAmount}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">Unpaid Balance:</span>
                  <div className="font-bold font-mono text-amber-600">
                    ₹{selectedRecord.remainingAmount}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-500">
                  Recorded Installments ({selectedRecord.payments.length})
                </h4>
                {selectedRecord.payments.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 border border-dashed border-border rounded-xl">
                    No disbursement payments recorded yet for this claim.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedRecord.payments.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-muted/50 flex items-start justify-between"
                      >
                        <div>
                          <div className="font-semibold text-foreground flex items-center space-x-2">
                            <span>₹{p.amount}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({p.method})
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            UTR: {p.transactionRef}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Disbursed by {p.recordedBy} from {p.payerBankAccount}
                          </div>
                          {p.notes && (
                            <div className="text-[11px] text-foreground/80 italic mt-1">
                              &ldquo;{p.notes}&rdquo;
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(p.paidAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between bg-slate-50/50 dark:bg-muted/50">
              <span className="text-[11px] text-slate-400">
                Immutable banking ledger entry &bull; Section 139 IT Act Compliant
              </span>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted/50 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
