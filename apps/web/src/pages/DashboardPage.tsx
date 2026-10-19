import React, { useState } from 'react';
import { StatusBadge, AmountDisplay } from '@vyay/ui';
import { ReportStatus, ReimbursementStatus, PostingStatus } from '@vyay/contracts';
import {
  ArrowUpRight,
  Plus,
  Receipt,
  CheckCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const DashboardPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vyay_onboarding_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissOnboarding = () => {
    setOnboardingDismissed(true);
    try {
      localStorage.setItem('vyay_onboarding_dismissed', 'true');
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome back, Sarah
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Horizon Scientific Ltd &bull; R&D Department
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('/expenses')}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#008C69] hover:bg-[#007456] text-white transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Expense</span>
          </button>
        </div>
      </div>

      {/* Dismissible Commercial Onboarding Checklist (M7) */}
      {!onboardingDismissed && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#008C69] text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Commercial Release Onboarding Checklist</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    5 of 5 Complete (100%)
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  All foundational release gates, accounting mappings, and security policies are active.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismissOnboarding}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
              title="Dismiss checklist"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-[#008C69] rounded-full w-full" />
          </div>

          {/* Checklist Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 text-xs">
            <div
              onClick={() => onNavigate('/settings')}
              className="p-3 rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] hover:border-[#008C69] transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white text-[11px]">1. Tenant Profile</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-[10px] text-slate-400">GSTIN & fiscal defaults set</p>
            </div>

            <div
              onClick={() => onNavigate('/approvals')}
              className="p-3 rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] hover:border-[#008C69] transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white text-[11px]">2. Approval Flow</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-[10px] text-slate-400">Multi-stage & delegation active</p>
            </div>

            <div
              onClick={() => onNavigate('/expenses')}
              className="p-3 rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] hover:border-[#008C69] transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white text-[11px]">3. Receipt Capture</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-[10px] text-slate-400">OCR parsing & verification</p>
            </div>

            <div
              onClick={() => onNavigate('/integrations')}
              className="p-3 rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] hover:border-[#008C69] transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white text-[11px]">4. Zoho Books Sync</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-[10px] text-slate-400">GL accounts mapped (.in region)</p>
            </div>

            <div
              onClick={() => onNavigate('/settings')}
              className="p-3 rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] hover:border-[#008C69] transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white text-[11px]">5. Data Retention</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-[10px] text-slate-400">90-day minimization & safe audit</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Pending Approval</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            <AmountDisplay amount="14850.00" currency="INR" />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">2 expense reports pending review</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Approved & Ready</span>
            <CheckCircle className="w-4 h-4 text-[#008C69]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            <AmountDisplay amount="6200.00" currency="INR" />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">In Finance processing queue</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Reimbursed (MTD)</span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            <AmountDisplay amount="31500.00" currency="INR" />
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">Paid to bank account</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Zoho Sync Health</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
            Connected (.in)
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Horizon Scientific India Org</p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E5EAF0] dark:border-[#2D3942] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Claims & Submissions</h2>
          <button onClick={() => onNavigate('/reports')} className="text-xs text-[#2563EB] font-medium flex items-center space-x-1">
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1C2833] text-slate-500 border-b border-[#E5EAF0] dark:border-[#2D3942]">
              <tr>
                <th className="px-4 py-3 font-medium">Claim Title</th>
                <th className="px-4 py-3 font-medium">Submitted Date</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Approval Status</th>
                <th className="px-4 py-3 font-medium">Reimbursement</th>
                <th className="px-4 py-3 font-medium">Zoho Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0] dark:divide-[#2D3942]">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-[#1A2530]">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                  Bangalore Lab Equipment & Reagents
                </td>
                <td className="px-4 py-3 text-slate-500">18 Oct 2026</td>
                <td className="px-4 py-3">
                  <AmountDisplay amount="8450.00" currency="INR" />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={ReportStatus.FINANCE_REVIEW} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={ReimbursementStatus.ELIGIBLE} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={PostingStatus.QUEUED} />
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-[#1A2530]">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                  Delhi Client Field Audit Travel
                </td>
                <td className="px-4 py-3 text-slate-500">16 Oct 2026</td>
                <td className="px-4 py-3">
                  <AmountDisplay amount="6400.00" currency="INR" />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={ReportStatus.FINALIZED} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={ReimbursementStatus.PAID} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={PostingStatus.SYNCED} />
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-[#1A2530]">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                  Offsite Team Meals & Connectivity
                </td>
                <td className="px-4 py-3 text-slate-500">14 Oct 2026</td>
                <td className="px-4 py-3">
                  <AmountDisplay amount="2150.00" currency="INR" />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={ReportStatus.IN_REVIEW} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={ReimbursementStatus.NOT_READY} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={PostingStatus.NOT_QUEUED} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
