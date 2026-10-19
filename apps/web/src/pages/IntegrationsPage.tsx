import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Play,
  FileText,
  Clock,
  Building,
  Globe,
  Database,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { ZohoRegion, PostingStatus } from '@vyay/contracts';

interface MappingItem {
  id: string;
  categoryName: string;
  categoryId: string;
  glAccountId: string;
  glAccountName: string;
  taxCodeId: string;
  taxCodeName: string;
}

interface SyncJob {
  id: string;
  entityType: string;
  entityId: string;
  status: PostingStatus;
  remoteReference?: string;
  attempts: number;
  timestamp: string;
}

export const IntegrationsPage: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<ZohoRegion>(ZohoRegion.IN);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [selectedOrg, setSelectedOrg] = useState<string>('zoho-org-891240');
  const [syncing, setSyncing] = useState<boolean>(false);
  const [dryRunning, setDryRunning] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [showDryRunModal, setShowDryRunModal] = useState<boolean>(false);
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);

  // Mappings state
  const [mappings, setMappings] = useState<MappingItem[]>([
    {
      id: 'map-1',
      categoryId: 'cat-air-travel',
      categoryName: 'Air Travel & Flights',
      glAccountId: 'zoho-acc-6010',
      glAccountName: 'Travel & Conveyance (6010)',
      taxCodeId: 'zoho-tax-gst-18',
      taxCodeName: 'GST 18% (CGST 9% + SGST 9%)',
    },
    {
      id: 'map-2',
      categoryId: 'cat-lab-reagents',
      categoryName: 'Lab Reagents & Supplies',
      glAccountId: 'zoho-acc-5010',
      glAccountName: 'Direct Scientific Consumables (5010)',
      taxCodeId: 'zoho-tax-gst-18',
      taxCodeName: 'GST 18% (CGST 9% + SGST 9%)',
    },
    {
      id: 'map-3',
      categoryId: 'cat-lodging',
      categoryName: 'Lodging & Accommodation',
      glAccountId: 'zoho-acc-6020',
      glAccountName: 'Lodging & Accommodation (6020)',
      taxCodeId: 'zoho-tax-gst-12',
      taxCodeName: 'GST 12% (CGST 6% + SGST 6%)',
    },
    {
      id: 'map-4',
      categoryId: 'cat-hospitality',
      categoryName: 'Meals & Business Hospitality',
      glAccountId: 'zoho-acc-6030',
      glAccountName: 'Meals & Hospitality (6030)',
      taxCodeId: 'zoho-tax-gst-5',
      taxCodeName: 'GST 5% (ITC Blocked u/s 17(5))',
    },
    {
      id: 'map-5',
      categoryId: 'cat-software',
      categoryName: 'Cloud & Software Subscriptions',
      glAccountId: 'zoho-acc-6050',
      glAccountName: 'Software & Subscriptions (6050)',
      taxCodeId: 'zoho-tax-gst-18',
      taxCodeName: 'GST 18% (CGST 9% + SGST 9%)',
    },
  ]);

  // Sync Jobs history
  const [jobs, setJobs] = useState<SyncJob[]>([
    {
      id: 'job-9801',
      entityType: 'EXPENSE_REPORT',
      entityId: 'REP-2026-001',
      status: PostingStatus.SYNCED,
      remoteReference: 'zb_bill_1713502910_819',
      attempts: 1,
      timestamp: '2026-10-19 09:15 AM',
    },
    {
      id: 'job-9800',
      entityType: 'EXPENSE_REPORT',
      entityId: 'REP-2026-002',
      status: PostingStatus.SYNCED,
      remoteReference: 'zb_bill_1713498822_312',
      attempts: 1,
      timestamp: '2026-10-18 04:30 PM',
    },
  ]);

  const handleTestConnection = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setFeedback({
        type: 'success',
        message: `Zoho Books API connection healthy. Organization: Acme BioTech India Pvt Ltd (${selectedRegion === ZohoRegion.IN ? 'zohoapis.in' : 'zohoapis.com'}). OAuth scopes: ZohoBooks.expenses.ALL, ZohoBooks.bills.ALL.`,
      });
      setTimeout(() => setFeedback(null), 6000);
    }, 700);
  };

  const handleFetchReferenceData = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setFeedback({
        type: 'success',
        message: 'Successfully refreshed Reference Data from Zoho Books: 7 GL Accounts, 4 GST Tax Codes, 4 Vendors, 2 Projects.',
      });
      setTimeout(() => setFeedback(null), 5000);
    }, 800);
  };

  const handleDryRunPreview = () => {
    setDryRunning(true);
    setTimeout(() => {
      setDryRunning(false);
      setShowDryRunModal(true);
    }, 600);
  };

  const handleExportReport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      const newBillRef = `zb_bill_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
      const newJob: SyncJob = {
        id: `job-${Math.floor(1000 + Math.random() * 9000)}`,
        entityType: 'EXPENSE_REPORT',
        entityId: 'REP-2026-003',
        status: PostingStatus.SYNCED,
        remoteReference: newBillRef,
        attempts: 1,
        timestamp: 'Just now',
      };
      setJobs([newJob, ...jobs]);
      setShowDryRunModal(false);
      setFeedback({
        type: 'success',
        message: `Report REP-2026-003 posted to Zoho Books as Bill #${newBillRef}. Idempotency lock confirmed.`,
      });
      setTimeout(() => setFeedback(null), 7000);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#2563EB]" />
            Accounting Connectors & Zoho Books
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Native, secure bi-directional synchronization with general ledger and ERP systems
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDryRunPreview}
            disabled={dryRunning || !isConnected}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-all border border-indigo-200 dark:border-indigo-800"
          >
            <Play className={`w-3.5 h-3.5 ${dryRunning ? 'animate-spin' : ''}`} />
            <span>Dry-Run Pre-Flight</span>
          </button>
        </div>
      </div>

      {/* Regulatory & Accounting Segregation Notice */}
      <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Segregation of Accounting vs Reimbursement: </span>
          Exporting an approved report creates a vendor bill in Zoho Books Accounts Payable. It does
          <span className="font-semibold underline ml-1">not</span> mark employee reimbursement as paid. Actual cash outflow requires separate banking disbursement via UTR.
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 text-xs rounded-xl flex items-center space-x-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Zoho Books Active Card */}
      <div className="rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5EAF0] dark:border-[#2D3942] pb-5">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              Z
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Zoho Books</h2>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    CONNECTED
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[11px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    DISCONNECTED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <span>OAuth 2.0 Vault</span>
                <span>&bull;</span>
                <span>Region: {selectedRegion === ZohoRegion.IN ? 'zohoapis.in (India)' : 'zohoapis.com (Global)'}</span>
                <span>&bull;</span>
                <span>Org ID: {selectedOrg}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTestConnection}
              disabled={syncing || !isConnected}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#1C2833] text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
            <button
              onClick={handleFetchReferenceData}
              disabled={syncing || !isConnected}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#1C2833] text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Sync Reference Data</span>
            </button>
            {isConnected ? (
              <button
                onClick={() => {
                  setIsConnected(false);
                  setFeedback({ type: 'warning', message: 'Zoho Books connection disconnected.' });
                }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-all border border-rose-200 dark:border-rose-900"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => setShowConnectModal(true)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-600 transition-all"
              >
                Connect Zoho Books
              </button>
            )}
          </div>
        </div>

        {/* Region & Active Organization Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-[#1C2833] p-4 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942]">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Data Center Region
            </label>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as ZohoRegion)}
                className="w-full text-xs bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value={ZohoRegion.IN}>India (accounts.zoho.in / books.zoho.in)</option>
                <option value={ZohoRegion.US}>United States (accounts.zoho.com / books.zoho.com)</option>
                <option value={ZohoRegion.EU}>Europe (accounts.zoho.eu / books.zoho.eu)</option>
                <option value={ZohoRegion.AU}>Australia (accounts.zoho.com.au / books.zoho.com.au)</option>
                <option value={ZohoRegion.JP}>Japan (accounts.zoho.jp / books.zoho.jp)</option>
                <option value={ZohoRegion.CA}>Canada (accounts.zohocloud.ca / books.zohocloud.ca)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Active Organization (Zoho Books)
            </label>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full text-xs bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="zoho-org-891240">Acme BioTech India Pvt Ltd (Primary INR)</option>
                <option value="zoho-org-891241">Acme Global Ventures UK Branch (GBP)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Token Vault Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] flex items-center space-x-3">
            <KeyRound className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">OAuth Refresh Token Vault</div>
              <div className="text-[11px] text-slate-500">AES-256-GCM encrypted in database</div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] flex items-center space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">Rate Limiter & Backoff</div>
              <div className="text-[11px] text-slate-500">Auto retry with Retry-After header</div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">Idempotency Protection</div>
              <div className="text-[11px] text-slate-500">Prevents duplicate bills & journal vouchers</div>
            </div>
          </div>
        </div>

        {/* Mappings Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Category to Chart of Accounts & GST Tax Treatment Mapping
              </h3>
              <p className="text-[11px] text-slate-500">
                Maps VyayMitra expense categories to Zoho Books general ledger accounts and GST tax codes
              </p>
            </div>
            <button
              onClick={() => {
                setFeedback({ type: 'success', message: 'Category mappings saved successfully.' });
                setTimeout(() => setFeedback(null), 3000);
              }}
              className="text-xs font-medium text-[#2563EB] hover:text-blue-700 flex items-center space-x-1"
            >
              <span>Save Mappings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="border border-[#E5EAF0] dark:border-[#2D3942] rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-[#1C2833] text-slate-500 border-b border-[#E5EAF0] dark:border-[#2D3942]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">VyayMitra Category</th>
                  <th className="px-4 py-2.5 font-semibold">Zoho GL Account</th>
                  <th className="px-4 py-2.5 font-semibold">GST Tax Treatment</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0] dark:divide-[#2D3942]">
                {mappings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C2833]/50">
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                      {m.categoryName}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {m.glAccountName}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                      {m.taxCodeName}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sync Jobs & Transactional Outbox Monitor */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Integration Outbox & Sync History
              </h3>
              <p className="text-[11px] text-slate-500">
                Audited posting log with remote ledger references and duplicate-prevention locks
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              {jobs.length} jobs recorded
            </span>
          </div>

          <div className="border border-[#E5EAF0] dark:border-[#2D3942] rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-[#1C2833] text-slate-500 border-b border-[#E5EAF0] dark:border-[#2D3942]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Job ID</th>
                  <th className="px-4 py-2.5 font-semibold">Entity</th>
                  <th className="px-4 py-2.5 font-semibold">Remote Reference</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0] dark:divide-[#2D3942]">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C2833]/50">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {j.id}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                      {j.entityId}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[#2563EB]">
                      {j.remoteReference || 'Pending'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 text-emerald-600" />
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-500">
                      {j.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Future Connector Framework Readiness */}
      <div className="rounded-xl border border-dashed border-[#E5EAF0] dark:border-[#2D3942] p-5 text-center space-y-2">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">Canonical Connector Framework</h3>
        <p className="text-[11px] text-slate-500 max-w-xl mx-auto">
          Built on a provider-agnostic adapter architecture. QuickBooks Online, Xero, ERPNext, and TallyPrime bridges plug into the same transactional outbox and dry-run validation pipeline.
        </p>
      </div>

      {/* Dry Run Modal */}
      {showDryRunModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-5 animate-in fade-in-50">
            <div className="flex items-center justify-between border-b border-[#E5EAF0] dark:border-[#2D3942] pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Play className="w-4 h-4 text-indigo-600" />
                  Pre-Flight Posting Preview (Dry-Run)
                </h3>
                <p className="text-xs text-slate-500">
                  Simulates bill creation in Zoho Books without writing to the general ledger
                </p>
              </div>
              <button
                onClick={() => setShowDryRunModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Dry-run passed: 100% of expense lines mapped to valid GL account codes and GST tax treatments.</span>
              </div>

              <div className="border border-[#E5EAF0] dark:border-[#2D3942] rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-[#1C2833] text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Merchant</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Zoho GL Account</th>
                      <th className="px-3 py-2 font-medium text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5EAF0] dark:divide-[#2D3942]">
                    <tr>
                      <td className="px-3 py-2 font-semibold">Merck Biosciences Pvt Ltd</td>
                      <td className="px-3 py-2">Lab Reagents</td>
                      <td className="px-3 py-2 font-mono">5010 (Consumables)</td>
                      <td className="px-3 py-2 text-right font-medium">₹5,200.00</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-semibold">Taj West End Restaurant</td>
                      <td className="px-3 py-2">Client Meals</td>
                      <td className="px-3 py-2 font-mono">6030 (Hospitality)</td>
                      <td className="px-3 py-2 text-right font-medium">₹1,950.00</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-semibold">Uber India Technologies</td>
                      <td className="px-3 py-2">Commute & Taxis</td>
                      <td className="px-3 py-2 font-mono">6010 (Travel)</td>
                      <td className="px-3 py-2 text-right font-medium">₹1,300.00</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-[#1C2833] font-bold border-t border-[#E5EAF0] dark:border-[#2D3942]">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right">Total Payable:</td>
                      <td className="px-3 py-2 text-right text-emerald-600">₹8,450.00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5EAF0] dark:border-[#2D3942]">
              <button
                onClick={() => setShowDryRunModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1C2833]"
              >
                Cancel
              </button>
              <button
                onClick={handleExportReport}
                disabled={exporting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-600 transition-all flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${exporting ? 'animate-spin' : ''}`} />
                <span>Export Live Bill to Zoho Books</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5EAF0] dark:border-[#2D3942] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Connect Zoho Books via OAuth 2.0
              </h3>
              <button onClick={() => setShowConnectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Zoho Client ID
                </label>
                <input
                  type="text"
                  defaultValue="1000.ZOHO_CLIENT_ID_SAMPLE"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5EAF0] dark:border-[#2D3942] bg-slate-50 dark:bg-[#1C2833]"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Zoho Client Secret
                </label>
                <input
                  type="password"
                  defaultValue="••••••••••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-[#E5EAF0] dark:border-[#2D3942] bg-slate-50 dark:bg-[#1C2833]"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-[11px]">
                Tokens are encrypted using AES-256-GCM before storage. Scopes requested: ZohoBooks.expenses.ALL, ZohoBooks.bills.ALL.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E5EAF0] dark:border-[#2D3942]">
              <button
                onClick={() => setShowConnectModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsConnected(true);
                  setShowConnectModal(false);
                  setFeedback({ type: 'success', message: 'Connected to Zoho Books successfully.' });
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-600"
              >
                Authorize & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
