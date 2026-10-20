import React, { useState } from 'react';
import {
  TrendingUp,
  Download,
  AlertOctagon,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles,
  PieChart as PieIcon,
  RefreshCw,
} from 'lucide-react';

interface CategorySpend {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  count: number;
}

interface DeptSpend {
  department: string;
  amount: number;
  budget: number;
  utilization: number;
}

interface SpendTrend {
  period: string;
  amount: number;
  reportCount: number;
  reimbursed: number;
}

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'fiscal'>('90d');
  const [downloading, setDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Financial figures for Horizon Scientific India Ltd
  const totalSpend = 136150;
  const reimbursedSpend = 112450;
  const pendingDisbursement = 23700;
  const policyViolationCount = 3;
  const avgApprovalCycleDays = 1.8;
  const avgReimbursementCycleDays = 2.4;

  const categoryBreakdown: CategorySpend[] = [
    { category: 'Air Travel & Flights', amount: 54200, percentage: 39.8, color: '#008C69', count: 4 },
    { category: 'Hotel & Accommodation', amount: 38400, percentage: 28.2, color: '#2563EB', count: 6 },
    { category: 'Meals & Client Entertainment', amount: 16800, percentage: 12.3, color: '#F59E0B', count: 12 },
    { category: 'Software & Cloud Tools', amount: 14500, percentage: 10.7, color: '#8B5CF6', count: 5 },
    { category: 'Local Conveyance & Cabs', amount: 8250, percentage: 6.1, color: '#06B6D4', count: 18 },
    { category: 'Office Supplies & Misc', amount: 4000, percentage: 2.9, color: '#64748B', count: 8 },
  ];

  const departmentBreakdown: DeptSpend[] = [
    { department: 'Research & Development (R&D)', amount: 62400, budget: 100000, utilization: 62.4 },
    { department: 'Clinical Operations', amount: 38250, budget: 60000, utilization: 63.8 },
    { department: 'Regulatory Affairs', amount: 18500, budget: 30000, utilization: 61.7 },
    { department: 'Quality Assurance & QC', amount: 11000, budget: 25000, utilization: 44.0 },
    { department: 'Executive & Admin', amount: 6000, budget: 20000, utilization: 30.0 },
  ];

  const spendTrendData: SpendTrend[] = [
    { period: 'Aug 2026', amount: 38200, reportCount: 14, reimbursed: 38200 },
    { period: 'Sep 2026', amount: 44950, reportCount: 18, reimbursed: 44950 },
    { period: 'Oct 2026 (MTD)', amount: 53000, reportCount: 21, reimbursed: 29300 },
  ];

  const handleDownloadCsv = () => {
    setDownloading(true);
    setTimeout(() => {
      // Simulate CSV file trigger
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        'Period,Total Amount (INR),Report Count,Reimbursed (INR)\n' +
        spendTrendData.map((d) => `"${d.period}",${d.amount},${d.reportCount},${d.reimbursed}`).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'vyaymitra-spend-analytics-export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloading(false);
      setToastMessage('CSV Export generated and downloaded successfully');
      setTimeout(() => setToastMessage(null), 4000);
    }, 600);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142333] dark:text-white flex items-center gap-2">
            Spend Analytics & Financial Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time multi-dimensional expenditure metrics, department utilization, and compliance health
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-card rounded-lg p-1 border border-border text-xs font-medium">
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timeRange === '30d'
                  ? 'bg-primary text-white shadow-card'
                  : 'text-foreground/80 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timeRange === '90d'
                  ? 'bg-primary text-white shadow-card'
                  : 'text-foreground/80 hover:text-slate-900'
              }`}
            >
              Q4 / Last 90 Days
            </button>
            <button
              onClick={() => setTimeRange('fiscal')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timeRange === 'fiscal'
                  ? 'bg-primary text-white shadow-card'
                  : 'text-foreground/80 hover:text-slate-900'
              }`}
            >
              FY 2026–27
            </button>
          </div>

          <button
            onClick={handleDownloadCsv}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg text-sm font-semibold shadow-card transition-all"
          >
            {downloading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-card">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Total Incurred Spend</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              ₹{totalSpend.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +12.4% MoM
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Across 53 approved expenses</p>
        </div>

        {/* Reimbursed vs Pending */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-card">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Disbursed Reimbursements</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              ₹{reimbursedSpend.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500">
              ({((reimbursedSpend / totalSpend) * 100).toFixed(0)}%)
            </span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            ₹{pendingDisbursement.toLocaleString('en-IN')} in queue for payroll batch
          </p>
        </div>

        {/* Turnaround Cycle Time */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-card">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Average Approval Cycle</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {avgApprovalCycleDays} Days
            </span>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
              SLA Met (Goal: &lt;3d)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Avg disbursement: {avgReimbursementCycleDays} days post-approval
          </p>
        </div>

        {/* Policy Compliance Health */}
        <div className="bg-card p-5 rounded-2xl border border-border shadow-card">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            <span>Policy Flags & Violations</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {policyViolationCount} Flags
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              94.3% Clean
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Top flag: Daily meal per-diem exceeded</p>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-primary" />
              Spend by Category
            </h3>
            <span className="text-xs text-slate-500">{categoryBreakdown.length} Active Categories</span>
          </div>

          <div className="space-y-3.5 pt-2">
            {categoryBreakdown.map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium text-foreground">
                      {cat.category}
                    </span>
                    <span className="text-xs text-slate-400">({cat.count} claims)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">
                      ₹{cat.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-mono text-slate-500 w-12 text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Budget & Spend Utilization */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Department Budget Utilization
            </h3>
            <span className="text-xs text-slate-500">FY 2026–27 Allocation</span>
          </div>

          <div className="space-y-4 pt-2">
            {departmentBreakdown.map((dept) => (
              <div key={dept.department} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {dept.department}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-foreground">
                      ₹{dept.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-slate-400">/ ₹{dept.budget.toLocaleString('en-IN')}</span>
                    <span
                      className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                        dept.utilization > 80
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {dept.utilization}%
                    </span>
                  </div>
                </div>
                {/* Visual Utilization Bar */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dept.utilization > 80 ? 'bg-rose-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${dept.utilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trajectory Table */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              Monthly Trajectory & Settlement Velocity
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Historical period volume and reimbursement execution speed</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-muted-foreground uppercase">
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Report Volume</th>
                <th className="py-3 px-4">Incurred Spend</th>
                <th className="py-3 px-4">Settled & Reimbursed</th>
                <th className="py-3 px-4">Settlement Rate</th>
                <th className="py-3 px-4 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {spendTrendData.map((row) => {
                const rate = ((row.reimbursed / row.amount) * 100).toFixed(1);
                return (
                  <tr key={row.period} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {row.period}
                    </td>
                    <td className="py-3 px-4 text-foreground/80">
                      {row.reportCount} reports
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      ₹{row.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-medium">
                      ₹{row.reimbursed.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{rate}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Ledger Synced
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsPage;
