import React, { useState, useEffect } from 'react';
import { StatusBadge, AmountDisplay } from '@vyay/ui';
import { ReportStatus, ReimbursementStatus, PostingStatus } from '@vyay/contracts';
import { api, ReportRecord } from '../lib/api';
import {
  ArrowUpRight,
  Plus,
  Receipt,
  CheckCircle,
  Clock,
  ArrowRight,
  FileText,
  ShieldCheck,
  TrendingUp,
  Layers,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC<{ onNavigate: (path: string) => void; tenantName?: string }> = ({
  onNavigate,
  tenantName,
}) => {
  const [reports, setReports] = useState<ReportRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        const fetched = await api.getReports();
        if (isMounted && Array.isArray(fetched)) {
          setReports(fetched);
        }
      } catch (err) {
        console.warn('Could not load dashboard reports', err);
      }
    };
    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live KPI figures
  const pendingReports = reports.filter(
    (r) =>
      r.status === ReportStatus.SUBMITTED ||
      r.status === ReportStatus.IN_REVIEW ||
      r.status === ReportStatus.FINANCE_REVIEW
  );
  const pendingAmount = pendingReports
    .reduce((sum, r) => sum + parseFloat(r.totalAmount || '0'), 0)
    .toFixed(2);

  const approvedReports = reports.filter(
    (r) => r.status === ReportStatus.APPROVED || r.status === ReportStatus.FINALIZED
  );
  const approvedAmount = approvedReports
    .reduce((sum, r) => sum + parseFloat(r.totalAmount || '0'), 0)
    .toFixed(2);

  const reimbursedReports = reports.filter(
    (r) => r.reimbursementStatus === ReimbursementStatus.PAID
  );
  const reimbursedAmount = reimbursedReports
    .reduce((sum, r) => sum + parseFloat(r.totalAmount || '0'), 0)
    .toFixed(2);

  return (
    <div className="space-y-6">
      {/* ── Executive Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Dashboard Overview
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tenantName || 'Organization Workspace'} &bull; Operations & Finance Desk
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onNavigate('/reports')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card hover:bg-muted text-foreground transition-smooth"
          >
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span>View Reports</span>
          </button>
          <button
            onClick={() => onNavigate('/expenses')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:opacity-90 text-primary-foreground transition-smooth shadow-card"
          >
            <Plus className="w-3.5 h-3.5 text-km-lime" />
            <span>New Expense</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Approvals */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-smooth">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Pending Approvals</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-foreground">
            <AmountDisplay amount={pendingAmount} currency="INR" />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-border/60">
            <span className="text-muted-foreground">
              {pendingReports.length} {pendingReports.length === 1 ? 'claim' : 'claims'} awaiting review
            </span>
            <span className={pendingReports.length > 0 ? "text-amber-600 dark:text-amber-400 font-medium" : "text-emerald-600 dark:text-emerald-400 font-medium"}>
              {pendingReports.length > 0 ? "Needs Action" : "Up to date"}
            </span>
          </div>
        </div>

        {/* Card 2: Approved / In Review */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-smooth">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Approved & Ready</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-foreground">
            <AmountDisplay amount={approvedAmount} currency="INR" />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-border/60">
            <span className="text-muted-foreground">
              {approvedReports.length} finance queue items
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Verified</span>
          </div>
        </div>

        {/* Card 3: Reimbursed MTD */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-smooth">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Reimbursed (MTD)</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-foreground">
            <AmountDisplay amount={reimbursedAmount} currency="INR" />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-border/60">
            <span className="text-muted-foreground">
              {reimbursedReports.length} processed bank payouts
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">Settled</span>
          </div>
        </div>

        {/* Card 4: Accounting & Suite Status */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-smooth">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>ERP & Suite Bridge</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-km-lime animate-pulse" />
            <span className="text-base font-bold text-foreground">Zoho Books &bull; Xero</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-border/60">
            <span className="text-muted-foreground">General Ledger Sync</span>
            <span className="text-primary font-semibold">100% Active</span>
          </div>
        </div>
      </div>

      {/* ── PraveshMitra-Inspired Clean Workflow Rhythm ── */}
      <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">Financial Integrity Guard:</span>
          <span>Approval, accounting export, and bank reimbursement are strictly decoupled.</span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] font-medium text-muted-foreground">
          <span className="px-2 py-0.5 rounded bg-card border border-border text-foreground">1. Capture</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground/60" />
          <span className="px-2 py-0.5 rounded bg-card border border-border text-foreground">2. Approve</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground/60" />
          <span className="px-2 py-0.5 rounded bg-card border border-border text-foreground">3. GL Export</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground/60" />
          <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground font-semibold">4. Payout</span>
        </div>
      </div>

      {/* ── High-Density Recent Activity Data Grid ── */}
      <div className="rounded-xl bg-card border border-border overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card/80">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recent Expense Claims & Submissions
            </h2>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">
              {reports.length} entries
            </span>
          </div>
          <button
            onClick={() => onNavigate('/reports')}
            className="text-xs text-primary hover:underline font-semibold flex items-center space-x-1"
          >
            <span>View Full Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border font-semibold">
              <tr>
                <th className="px-4 py-2.5 text-[11px] uppercase tracking-wider">Claim / Report Title</th>
                <th className="px-4 py-2.5 text-[11px] uppercase tracking-wider">Submitted</th>
                <th className="px-4 py-2.5 text-[11px] uppercase tracking-wider text-right">Amount</th>
                <th className="px-4 py-2.5 text-[11px] uppercase tracking-wider">Approval Stage</th>
                <th className="px-4 py-2.5 text-[11px] uppercase tracking-wider">Reimbursement</th>
                <th className="px-4 py-2.5 text-[11px] uppercase tracking-wider">Accounting Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.length > 0 ? (
                reports.slice(0, 6).map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-xs">{r.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('en-IN') : 'Recent'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      <AmountDisplay amount={r.totalAmount || '0.00'} currency={r.currency || 'INR'} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.reimbursementStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={
                          r.reimbursementStatus === ReimbursementStatus.PAID
                            ? PostingStatus.SYNCED
                            : r.status === ReportStatus.APPROVED
                            ? PostingStatus.QUEUED
                            : PostingStatus.NOT_QUEUED
                        }
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/60">
                        <FileText className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No expense claims or reports found</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        This organization currently has no submitted reports. Submit your first expense report to view real-time tracking here.
                      </p>
                      <button
                        onClick={() => onNavigate('/expenses')}
                        className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-smooth shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 text-km-lime" />
                        <span>Create First Expense</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
