import React, { useState } from 'react';
import { StatusBadge, AmountDisplay } from '@vyay/ui';
import { ReportStatus, PostingStatus, TaxTreatment } from '@vyay/contracts';
import {
  CheckCheck,
  Send,
  Eye,
  ShieldCheck,
  Database,
  BookOpen,
  PieChart,
  Layers,
  ArrowRight,
  FileCheck2,
  AlertCircle,
  Sparkles,
  Edit2,
  Check,
  X,
  Building,
} from 'lucide-react';

interface GLMappingRow {
  categoryId: string;
  categoryName: string;
  glCode: string;
  glAccountName: string;
  taxTreatment: TaxTreatment;
  defaultCostCenter: string;
}

interface BudgetRow {
  id: string;
  name: string;
  targetType: string;
  targetName: string;
  period: string;
  limitAmount: string;
  spentAmount: string;
  remainingAmount: string;
  utilizationPercent: number;
}

const INITIAL_GL_MAPPINGS: GLMappingRow[] = [
  {
    categoryId: 'cat-air-travel',
    categoryName: 'Air Travel',
    glCode: '6010',
    glAccountName: 'Domestic & International Airfare',
    taxTreatment: TaxTreatment.ITC_ELIGIBLE,
    defaultCostCenter: 'CC-OPS-01',
  },
  {
    categoryId: 'cat-ground-commute',
    categoryName: 'Ground Commute & Taxis',
    glCode: '6015',
    glAccountName: 'Local Conveyance & Vehicle Hire',
    taxTreatment: TaxTreatment.ITC_INELIGIBLE, // Section 17(5) blocked
    defaultCostCenter: 'CC-OPS-01',
  },
  {
    categoryId: 'cat-hotel-stay',
    categoryName: 'Accommodation',
    glCode: '6020',
    glAccountName: 'Lodging & Hotel Accommodation',
    taxTreatment: TaxTreatment.ITC_ELIGIBLE,
    defaultCostCenter: 'CC-OPS-01',
  },
  {
    categoryId: 'cat-client-meals',
    categoryName: 'Meals & Client Entertainment',
    glCode: '6030',
    glAccountName: 'Business Meals & Hospitality',
    taxTreatment: TaxTreatment.ITC_INELIGIBLE, // Section 17(5)(b) blocked
    defaultCostCenter: 'CC-OPS-01',
  },
  {
    categoryId: 'cat-lab-supplies',
    categoryName: 'Lab Reagents & Supplies',
    glCode: '5010',
    glAccountName: 'Direct Scientific Consumables',
    taxTreatment: TaxTreatment.ITC_ELIGIBLE,
    defaultCostCenter: 'CC-BIO-04',
  },
  {
    categoryId: 'cat-software-lic',
    categoryName: 'Software & SaaS Licenses',
    glCode: '6055',
    glAccountName: 'Software Subscription & SaaS Tools',
    taxTreatment: TaxTreatment.RCM_APPLICABLE,
    defaultCostCenter: 'CC-IT-01',
  },
];

const INITIAL_BUDGETS: BudgetRow[] = [
  {
    id: 'b-01',
    name: 'Q4 Research & Diagnostics Travel Budget',
    targetType: 'DEPARTMENT',
    targetName: 'Research & Diagnostics',
    period: 'QUARTERLY',
    limitAmount: '250000.00',
    spentAmount: '78450.00',
    remainingAmount: '171550.00',
    utilizationPercent: 31.38,
  },
  {
    id: 'b-02',
    name: 'Annual Lab Equipment & Consumables Allocation',
    targetType: 'CATEGORY',
    targetName: 'Lab Reagents & Supplies',
    period: 'ANNUAL',
    limitAmount: '1500000.00',
    spentAmount: '432500.00',
    remainingAmount: '1067500.00',
    utilizationPercent: 28.83,
  },
  {
    id: 'b-03',
    name: 'Quality Assurance Q4 Field Audit Allocation',
    targetType: 'DEPARTMENT',
    targetName: 'Quality Assurance',
    period: 'QUARTERLY',
    limitAmount: '120000.00',
    spentAmount: '98400.00',
    remainingAmount: '21600.00',
    utilizationPercent: 82.0,
  },
];

export const FinancePage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'GL_MAPPINGS' | 'BUDGETS' | 'LEDGER'>('QUEUE');
  const [dryRunComplete, setDryRunComplete] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Verification state for review queue item
  const [docVerified, setDocVerified] = useState(true);
  const [taxVerified, setTaxVerified] = useState(true);
  const [glVerified, setGlVerified] = useState(true);

  // GL Mappings State
  const [glMappings, setGlMappings] = useState<GLMappingRow[]>(INITIAL_GL_MAPPINGS);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editGlCode, setEditGlCode] = useState('');
  const [editTaxTreatment, setEditTaxTreatment] = useState<TaxTreatment>(TaxTreatment.ITC_ELIGIBLE);

  const handleStartEditGL = (row: GLMappingRow) => {
    setEditingCategory(row.categoryId);
    setEditGlCode(row.glCode);
    setEditTaxTreatment(row.taxTreatment);
  };

  const handleSaveEditGL = (categoryId: string) => {
    setGlMappings((prev) =>
      prev.map((r) =>
        r.categoryId === categoryId
          ? { ...r, glCode: editGlCode, taxTreatment: editTaxTreatment }
          : r
      )
    );
    setEditingCategory(null);
    setSyncStatusMsg('GL Account code and GST tax treatment successfully updated.');
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const handleDryRun = () => {
    setDryRunComplete(true);
    setSyncStatusMsg(
      'Dry-run preview validated: 100% GL Accounts & GST Tax Codes correctly mapped for Zoho Books.'
    );
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleFinalize = () => {
    setSyncStatusMsg('Report finalized and queued for transactional outbox export to Zoho Books.');
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Finance Review & Accounting Engine
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Audit manager-approved submissions, map General Ledger accounts & GST tax rules, monitor budgets, and preview double-entry books
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setActiveTab('LEDGER')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#1C2833] text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Ledger Simulator</span>
          </button>
          <button
            onClick={handleFinalize}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#008C69] hover:bg-[#007456] text-white transition-all shadow-sm"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Finalize & Queue Export</span>
          </button>
        </div>
      </div>

      {/* Dynamic Feedback Banner */}
      {syncStatusMsg && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
          <Database className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Accounting Compliance Overview Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] space-y-1 shadow-sm">
          <span className="text-slate-400 font-medium">Zoho Books Organization</span>
          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            Acme BioTech Pvt Ltd (Org #891240)
          </div>
          <span className="text-[11px] text-emerald-600 font-medium flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Data Center: zohoapis.in &bull; Ready</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] space-y-1 shadow-sm">
          <span className="text-slate-400 font-medium">Posting Strategy & Liability</span>
          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            Vendor Bill Mode (Accounts Payable)
          </div>
          <span className="text-[11px] text-slate-500">
            Credits Employee Clearing &bull; Debits Category GL
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] space-y-1 shadow-sm">
          <span className="text-slate-400 font-medium">Indian GST Input Tax Compliance</span>
          <div className="font-bold text-emerald-600 flex items-center space-x-1.5 text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Section 16 & 17(5) Enforced</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Meals blocked &bull; Airfare & lab supplies ITC eligible
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-[#1A2530] rounded-xl text-xs font-semibold w-fit">
        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'QUEUE'
              ? 'bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Review Queue (1)
        </button>
        <button
          onClick={() => setActiveTab('GL_MAPPINGS')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'GL_MAPPINGS'
              ? 'bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          GL Account & Tax Mapping ({glMappings.length})
        </button>
        <button
          onClick={() => setActiveTab('BUDGETS')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'BUDGETS'
              ? 'bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Budget Ceilings ({INITIAL_BUDGETS.length})
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'LEDGER'
              ? 'bg-white dark:bg-[#151F27] text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Ledger Simulator
        </button>
      </div>

      {/* TAB 1: Review Queue */}
      {activeTab === 'QUEUE' && (
        <div className="rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E5EAF0] dark:border-[#2D3942] flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Manager-Approved Reports Awaiting Finance Clearance
            </span>
            <span className="text-[11px] text-slate-500">Total payable: ₹8,450.00</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#1C2833] text-slate-500 border-b border-[#E5EAF0] dark:border-[#2D3942]">
                <tr>
                  <th className="px-4 py-3 font-medium">Claim Information</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Pre-Payment Audit Checklist</th>
                  <th className="px-4 py-3 font-medium">Tax Components</th>
                  <th className="px-4 py-3 font-medium">Approval</th>
                  <th className="px-4 py-3 font-medium">Zoho Export</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0] dark:divide-[#2D3942]">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-[#1A2530]">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Bangalore Lab Equipment & Reagents
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      REP-2026-0891 &bull; Dr. Rahul Sharma (R&D)
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <AmountDisplay amount="8450.00" currency="INR" className="font-bold" />
                  </td>
                  <td className="px-4 py-3.5 space-y-1">
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <input
                        type="checkbox"
                        checked={docVerified}
                        onChange={(e) => setDocVerified(e.target.checked)}
                        className="rounded text-[#008C69]"
                      />
                      <span className={docVerified ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                        Tax Invoices Verified
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <input
                        type="checkbox"
                        checked={taxVerified}
                        onChange={(e) => setTaxVerified(e.target.checked)}
                        className="rounded text-[#008C69]"
                      />
                      <span className={taxVerified ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                        GST ITC Classified
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <input
                        type="checkbox"
                        checked={glVerified}
                        onChange={(e) => setGlVerified(e.target.checked)}
                        className="rounded text-[#008C69]"
                      />
                      <span className={glVerified ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                        GL 5010 & 6030 Mapped
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[11px] font-mono space-y-0.5">
                    <div>CGST 9%: ₹396.61 (ITC Eligible)</div>
                    <div>SGST 9%: ₹396.61 (ITC Eligible)</div>
                    <div className="text-slate-400 text-[10px]">Meal Tax: Blocked u/s 17(5)</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={ReportStatus.APPROVED} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={dryRunComplete ? PostingStatus.QUEUED : PostingStatus.NOT_QUEUED} />
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => onNavigate('/reimbursements')}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-[#008C69] hover:underline"
                    >
                      <span>Disburse Payout</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GL Account & Tax Treatments Mapping */}
      {activeTab === 'GL_MAPPINGS' && (
        <div className="rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E5EAF0] dark:border-[#2D3942] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                General Ledger (GL) Code & GST Tax Treatment Mapping
              </h3>
              <p className="text-[11px] text-slate-500">
                Determines accounting line item classifications and Input Tax Credit eligibility for Zoho Books
              </p>
            </div>
            <button
              onClick={handleDryRun}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Validate Zoho Mapping</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#1C2833] text-slate-500 border-b border-[#E5EAF0] dark:border-[#2D3942]">
                <tr>
                  <th className="px-4 py-3 font-medium">Expense Category</th>
                  <th className="px-4 py-3 font-medium">GL Account Code</th>
                  <th className="px-4 py-3 font-medium">GL Account Title</th>
                  <th className="px-4 py-3 font-medium">GST Tax Treatment</th>
                  <th className="px-4 py-3 font-medium">Default Cost Center</th>
                  <th className="px-4 py-3 font-medium text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0] dark:divide-[#2D3942]">
                {glMappings.map((row) => {
                  const isEditing = editingCategory === row.categoryId;

                  return (
                    <tr key={row.categoryId} className="hover:bg-slate-50/50 dark:hover:bg-[#1A2530]">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {row.categoryName}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editGlCode}
                            onChange={(e) => setEditGlCode(e.target.value)}
                            className="p-1 rounded border border-[#E5EAF0] dark:border-[#2D3942] w-20 bg-white dark:bg-[#151F27]"
                          />
                        ) : (
                          <span className="bg-slate-100 dark:bg-[#1C2833] px-2 py-0.5 rounded font-bold">
                            {row.glCode}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {row.glAccountName}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editTaxTreatment}
                            onChange={(e) => setEditTaxTreatment(e.target.value as any)}
                            className="p-1 rounded border border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27]"
                          >
                            <option value={TaxTreatment.ITC_ELIGIBLE}>ITC Eligible</option>
                            <option value={TaxTreatment.ITC_INELIGIBLE}>ITC Ineligible (Blocked u/s 17(5))</option>
                            <option value={TaxTreatment.RCM_APPLICABLE}>RCM Applicable</option>
                            <option value={TaxTreatment.EXEMPT}>Exempt / Zero Rated</option>
                          </select>
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              row.taxTreatment === TaxTreatment.ITC_ELIGIBLE
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : row.taxTreatment === TaxTreatment.ITC_INELIGIBLE
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                            }`}
                          >
                            {row.taxTreatment}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {row.defaultCostCenter}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleSaveEditGL(row.categoryId)}
                              className="p-1 rounded bg-[#008C69] text-white hover:bg-[#007456]"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditGL(row)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#1C2833] text-slate-400 hover:text-slate-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Budget Ceilings */}
      {activeTab === 'BUDGETS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {INITIAL_BUDGETS.map((b) => {
            const isHighUtilization = b.utilizationPercent > 80;

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {b.targetType} &bull; {b.period}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5">
                      {b.name}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isHighUtilization
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {b.utilizationPercent}% Used
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-[#1C2833] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isHighUtilization ? 'bg-amber-500' : 'bg-[#008C69]'
                    }`}
                    style={{ width: `${Math.min(b.utilizationPercent, 100)}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400">Spent:</span>{' '}
                    <AmountDisplay amount={b.spentAmount} currency="INR" className="font-bold" />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Ceiling:</span>{' '}
                    <AmountDisplay amount={b.limitAmount} currency="INR" className="font-semibold text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: Double-Entry Ledger Simulator */}
      {activeTab === 'LEDGER' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] space-y-5 shadow-sm text-xs">
          <div className="flex items-center justify-between border-b border-[#E5EAF0] dark:border-[#2D3942] pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#008C69]">
                Double-Entry Accounting Verification
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                Balanced Ledger Posting Simulation (Report: REP-2026-0891)
              </h3>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <Check className="w-4 h-4" />
              <span>Balanced (Debits = Credits: ₹8,450.00)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Debit Side */}
            <div className="p-4 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] bg-slate-50/50 dark:bg-[#1C2833]/50 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5EAF0] dark:border-[#2D3942]">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  Debit Entries (Expenses & Input Tax Assets)
                </span>
                <span className="font-bold text-[#008C69]">Total: ₹8,450.00</span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      5010 &bull; Direct Scientific Consumables
                    </div>
                    <div className="text-[10px] text-slate-400">Expense Asset &bull; Merck Biosciences Reagents</div>
                  </div>
                  <span className="font-mono font-bold">₹7,656.78</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      2110 &bull; Input Tax Credit - CGST (Receivable)
                    </div>
                    <div className="text-[10px] text-emerald-600">Current Asset &bull; 9% Central GST</div>
                  </div>
                  <span className="font-mono font-bold">₹396.61</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      2111 &bull; Input Tax Credit - SGST (Receivable)
                    </div>
                    <div className="text-[10px] text-emerald-600">Current Asset &bull; 9% State GST</div>
                  </div>
                  <span className="font-mono font-bold">₹396.61</span>
                </div>
              </div>
            </div>

            {/* Credit Side */}
            <div className="p-4 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] bg-slate-50/50 dark:bg-[#1C2833]/50 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5EAF0] dark:border-[#2D3942]">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  Credit Entries (Accounts Payable Liability)
                </span>
                <span className="font-bold text-[#008C69]">Total: ₹8,450.00</span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      2010 &bull; Employee Reimbursements Payable
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Current Liability &bull; Dr. Rahul Sharma (Vendor #VEN-104)
                    </div>
                  </div>
                  <span className="font-mono font-bold">₹8,450.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
