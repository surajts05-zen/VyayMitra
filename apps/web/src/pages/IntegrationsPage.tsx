import React, { useState, useEffect } from 'react';
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
  Download,
  Server,
  Zap,
} from 'lucide-react';
import { ZohoRegion, PostingStatus } from '@vyay/contracts';
import { api } from '../lib/api';

interface MappingItem {
  id: string;
  categoryName: string;
  categoryId: string;
  glAccountId: string;
  glAccountName: string;
  taxCodeId: string;
  taxCodeName: string;
  provider: string;
}

interface SyncJob {
  id: string;
  provider: string;
  entityType: string;
  entityId: string;
  status: PostingStatus;
  remoteReference?: string;
  attempts: number;
  timestamp: string;
}

type ProviderType = 'zoho_books' | 'xero' | 'tally_prime';

export const IntegrationsPage: React.FC = () => {
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('zoho_books');
  const [selectedRegion, setSelectedRegion] = useState<ZohoRegion>(ZohoRegion.IN);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [dryRunning, setDryRunning] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [showDryRunModal, setShowDryRunModal] = useState<boolean>(false);
  const [tallyXmlPreview, setTallyXmlPreview] = useState<string | null>(null);

  // Mappings state across all providers
  const [mappings, setMappings] = useState<MappingItem[]>([
    // Zoho Books
    {
      id: 'map-zoho-1',
      provider: 'zoho_books',
      categoryId: 'cat-air-travel',
      categoryName: 'Air Travel & Flights',
      glAccountId: 'zoho-acc-6010',
      glAccountName: 'Travel & Conveyance (6010)',
      taxCodeId: 'zoho-tax-gst-18',
      taxCodeName: 'GST 18% (CGST 9% + SGST 9%)',
    },
    {
      id: 'map-zoho-2',
      provider: 'zoho_books',
      categoryId: 'cat-lodging',
      categoryName: 'Lodging & Accommodation',
      glAccountId: 'zoho-acc-6020',
      glAccountName: 'Lodging & Accommodation (6020)',
      taxCodeId: 'zoho-tax-gst-12',
      taxCodeName: 'GST 12% (CGST 6% + SGST 6%)',
    },
    {
      id: 'map-zoho-3',
      provider: 'zoho_books',
      categoryId: 'cat-hospitality',
      categoryName: 'Meals & Business Hospitality',
      glAccountId: 'zoho-acc-6030',
      glAccountName: 'Meals & Hospitality (6030)',
      taxCodeId: 'zoho-tax-gst-5',
      taxCodeName: 'GST 5% (ITC Blocked u/s 17(5))',
    },
    // Xero
    {
      id: 'map-xero-1',
      provider: 'xero',
      categoryId: 'cat-air-travel',
      categoryName: 'Air Travel & Flights',
      glAccountId: 'xero-acc-420',
      glAccountName: 'Travel - National & International (420)',
      taxCodeId: 'xero-tax-gst-18',
      taxCodeName: 'Indian GST 18%',
    },
    {
      id: 'map-xero-2',
      provider: 'xero',
      categoryId: 'cat-lodging',
      categoryName: 'Lodging & Accommodation',
      glAccountId: 'xero-acc-429',
      glAccountName: 'General Travel & Lodging (429)',
      taxCodeId: 'xero-tax-gst-12',
      taxCodeName: 'Indian GST 12%',
    },
    // Tally Prime
    {
      id: 'map-tally-1',
      provider: 'tally_prime',
      categoryId: 'cat-air-travel',
      categoryName: 'Air Travel & Flights',
      glAccountId: 'tally-led-travelling',
      glAccountName: 'Travelling Expenses (Tally Ledger)',
      taxCodeId: 'tally-led-cgst',
      taxCodeName: 'Input CGST @ 9% & SGST @ 9%',
    },
    {
      id: 'map-tally-2',
      provider: 'tally_prime',
      categoryId: 'cat-lodging',
      categoryName: 'Lodging & Accommodation',
      glAccountId: 'tally-led-lodging',
      glAccountName: 'Hotel & Lodging Expenses (Tally Ledger)',
      taxCodeId: 'tally-led-cgst',
      taxCodeName: 'Input CGST @ 6% & SGST @ 6%',
    },
  ]);

  // Sync Jobs history
  const [jobs, setJobs] = useState<SyncJob[]>([
    {
      id: 'job-9801',
      provider: 'zoho_books',
      entityType: 'EXPENSE_REPORT',
      entityId: 'REP-2026-001',
      status: PostingStatus.SYNCED,
      remoteReference: 'zb_bill_1713502910_819',
      attempts: 1,
      timestamp: '2026-10-19 09:15 AM',
    },
    {
      id: 'job-9800',
      provider: 'xero',
      entityType: 'EXPENSE_REPORT',
      entityId: 'REP-2026-002',
      status: PostingStatus.SYNCED,
      remoteReference: 'INV-XERO-4412',
      attempts: 1,
      timestamp: '2026-10-18 04:30 PM',
    },
    {
      id: 'job-9799',
      provider: 'tally_prime',
      entityType: 'EXPENSE_REPORT',
      entityId: 'REP-2026-003',
      status: PostingStatus.SYNCED,
      remoteReference: 'VM-TALLY-88192',
      attempts: 1,
      timestamp: '2026-10-17 11:20 AM',
    },
  ]);

  const activeMappings = mappings.filter((m) => m.provider === selectedProvider);

  const handleTestConnection = async () => {
    setSyncing(true);
    try {
      const health = await api.getAccountingHealth(selectedProvider);
      setFeedback({
        type: 'success',
        message: `${getProviderTitle(selectedProvider)} connection verified healthy! Connected Org: ${health.externalOrgName || 'Primary Org'}. Gateway operational.`,
      });
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: `Connection test failed: ${e.message}`,
      });
    } finally {
      setSyncing(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const handleDryRunPreview = async () => {
    setDryRunning(true);
    try {
      await api.dryRunAccounting(selectedProvider, 'REP-2026-001');
      setShowDryRunModal(true);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    } finally {
      setDryRunning(false);
    }
  };

  const handleExportReport = async () => {
    setExporting(true);
    try {
      const result = await api.exportToAccounting(selectedProvider, 'REP-2026-003', 'BILL');
      const newJob: SyncJob = {
        id: `job-${Math.floor(1000 + Math.random() * 9000)}`,
        provider: selectedProvider,
        entityType: 'EXPENSE_REPORT',
        entityId: 'REP-2026-003',
        status: PostingStatus.SYNCED,
        remoteReference: result.remoteReference || 'ACCEPTED',
        attempts: 1,
        timestamp: 'Just now',
      };
      setJobs([newJob, ...jobs]);
      setShowDryRunModal(false);
      setFeedback({
        type: 'success',
        message: `Report successfully exported to ${getProviderTitle(selectedProvider)}! Reference: ${result.remoteReference}.`,
      });
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    } finally {
      setExporting(false);
      setTimeout(() => setFeedback(null), 7000);
    }
  };

  const handleDownloadTallyXml = async () => {
    try {
      const res = await api.exportTallyXml('REP-2026-001', 'Horizon Scientific India Pvt Ltd', false);
      setTallyXmlPreview(res.xmlContent);

      // Trigger browser file download
      const blob = new Blob([res.xmlContent], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VyayMitra_Tally_Voucher_${res.voucherNumber || 'REP-2026-001'}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedback({
        type: 'success',
        message: `Tally XML Voucher ${res.voucherNumber} downloaded successfully. You can import this directly in Tally Prime -> Import Data -> Vouchers.`,
      });
      setTimeout(() => setFeedback(null), 8000);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    }
  };

  const handleSyncTallyHttp = async () => {
    setSyncing(true);
    try {
      const res = await api.exportTallyXml('REP-2026-001', 'Horizon Scientific India Pvt Ltd', true);
      const newJob: SyncJob = {
        id: `job-${Math.floor(1000 + Math.random() * 9000)}`,
        provider: 'tally_prime',
        entityType: 'EXPENSE_REPORT',
        entityId: 'REP-2026-001',
        status: PostingStatus.SYNCED,
        remoteReference: res.voucherNumber,
        attempts: 1,
        timestamp: 'Just now',
      };
      setJobs([newJob, ...jobs]);
      setFeedback({
        type: 'success',
        message: `HTTP XML transaction committed to Tally Prime Server on http://localhost:9000. Voucher Ref: ${res.voucherNumber}.`,
      });
      setTimeout(() => setFeedback(null), 8000);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    } finally {
      setSyncing(false);
    }
  };

  function getProviderTitle(p: ProviderType): string {
    switch (p) {
      case 'zoho_books':
        return 'Zoho Books';
      case 'xero':
        return 'Xero Accounting';
      case 'tally_prime':
        return 'Tally Prime';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#2563EB]" />
            Enterprise Accounting Integrations
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Automated GL posting, Chart of Accounts mapping, and XML vouchers for Zoho Books, Xero, and Tally Prime
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedProvider === 'tally_prime' ? (
            <button
              onClick={handleDownloadTallyXml}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Tally XML</span>
            </button>
          ) : (
            <button
              onClick={handleDryRunPreview}
              disabled={dryRunning || !isConnected}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-all border border-indigo-200 dark:border-indigo-800"
            >
              <Play className={`w-3.5 h-3.5 ${dryRunning ? 'animate-spin' : ''}`} />
              <span>Dry-Run Posting Preview</span>
            </button>
          )}

          <button
            onClick={handleTestConnection}
            disabled={syncing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>
      </div>

      {/* Provider Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setSelectedProvider('zoho_books')}
          className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
            selectedProvider === 'zoho_books'
              ? 'border-[#008C69] bg-emerald-50/50 dark:border-[#34D399] dark:bg-emerald-950/20 ring-2 ring-[#008C69]/20 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#151F27]'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Zoho Books</span>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Connected
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Multi-region cloud ERP (IN, US, EU, AU). Bills, expenses & GST input codes.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedProvider('xero')}
          className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
            selectedProvider === 'xero'
              ? 'border-sky-600 bg-sky-50/50 dark:border-sky-400 dark:bg-sky-950/20 ring-2 ring-sky-600/20 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#151F27]'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Xero Accounting</span>
              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                Connected
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Global cloud accounting. ACCPAY bills, expense claims & tracking categories.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedProvider('tally_prime')}
          className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
            selectedProvider === 'tally_prime'
              ? 'border-amber-600 bg-amber-50/50 dark:border-amber-400 dark:bg-amber-950/20 ring-2 ring-amber-600/20 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#151F27]'
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Tally Prime</span>
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                XML & HTTP Gateway
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              India&apos;s leading ERP. Balanced Dr/Cr vouchers, direct Port 9000 sync & XML files.
            </p>
          </div>
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Provider Details Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#151F27] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              {selectedProvider === 'zoho_books' && <Building className="w-5 h-5 text-emerald-600" />}
              {selectedProvider === 'xero' && <Globe className="w-5 h-5 text-sky-600" />}
              {selectedProvider === 'tally_prime' && <Database className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {getProviderTitle(selectedProvider)} Connection Profile
              </h2>
              <p className="text-xs text-slate-500">
                {selectedProvider === 'zoho_books' && 'Connected Organization: Acme BioTech India Pvt Ltd (books.zoho.in)'}
                {selectedProvider === 'xero' && 'Connected Tenant: Horizon Scientific Global (UK & Global Ops)'}
                {selectedProvider === 'tally_prime' && 'Tally Company: Horizon Scientific India Pvt Ltd · HTTP Port 9000'}
              </p>
            </div>
          </div>

          {selectedProvider === 'zoho_books' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Datacenter:</span>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as ZohoRegion)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value={ZohoRegion.IN}>India (.in)</option>
                <option value={ZohoRegion.US}>United States (.com)</option>
                <option value={ZohoRegion.EU}>Europe (.eu)</option>
                <option value={ZohoRegion.AU}>Australia (.com.au)</option>
                <option value={ZohoRegion.JP}>Japan (.jp)</option>
                <option value={ZohoRegion.CA}>Canada (.ca)</option>
              </select>
            </div>
          )}

          {selectedProvider === 'tally_prime' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncTallyHttp}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              >
                <Server className="w-3.5 h-3.5" />
                <span>Sync to Local Port 9000</span>
              </button>
            </div>
          )}
        </div>

        {/* Tally Prime XML Quick Guide Box */}
        {selectedProvider === 'tally_prime' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs dark:border-amber-900/40 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>How Tally Prime Integration Works:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-amber-800 dark:text-amber-300">
              <li><strong>Option A (Direct XML Import):</strong> Click &quot;Download Tally XML&quot; above, open Tally Prime &rarr; press Alt+O (Import) &rarr; Select &quot;Transactions&quot; and choose the downloaded file.</li>
              <li><strong>Option B (Direct HTTP Sync):</strong> In Tally Prime press F12 &rarr; Advanced Configuration &rarr; Set &quot;Enable ODBC / HTTP Server&quot; to Yes (Port 9000). Click &quot;Sync to Local Port 9000&quot; to push vouchers over the local loopback network.</li>
              <li>Debit ledgers (Expenses, CGST, SGST) and Credit ledger (Bank A/c) are verified for exact balanced rupee totals.</li>
            </ul>
          </div>
        )}
      </div>

      {/* GL Mappings Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#151F27] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Category &amp; Tax Mappings ({getProviderTitle(selectedProvider)})
            </h2>
            <p className="text-xs text-slate-500">
              Mapped to Chart of Accounts and GST Input Tax Credits
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {activeMappings.length} Active Mappings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1C2833] text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Expense Category</th>
                <th className="px-6 py-3">General Ledger Account</th>
                <th className="px-6 py-3">Statutory Tax Treatment</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeMappings.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-200">
                    {m.categoryName}
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-700 dark:text-slate-300">
                    {m.glAccountName}
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-600 dark:text-slate-400">
                    {m.taxCodeName}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <Check className="w-3 h-3" />
                      Mapped
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Jobs Audit History */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#151F27] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Accounting Synchronization Log &amp; Audit Trail
            </h2>
            <p className="text-xs text-slate-500">
              Idempotent ledger posting records and external voucher confirmations
            </p>
          </div>
          <Clock className="w-4 h-4 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1C2833] text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3">Report ID</th>
                <th className="px-6 py-3">External Reference</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-200 uppercase">
                    {job.provider.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-600 dark:text-slate-400">
                    {job.entityId}
                  </td>
                  <td className="px-6 py-3 font-mono font-bold text-[#008C69] dark:text-[#34D399]">
                    {job.remoteReference || 'N/A'}
                  </td>
                  <td className="px-6 py-3">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-slate-500">
                    {job.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dry Run Modal */}
      {showDryRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-w-xl w-full rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#151F27] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Posting Dry-Run Preview ({getProviderTitle(selectedProvider)})
                </h3>
              </div>
              <button onClick={() => setShowDryRunModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Dry-run validated report <strong>REP-2026-003</strong> against general ledger rules. No financial records were altered.
              </p>

              <div className="rounded-xl bg-slate-50 p-4 dark:bg-[#1C2833] space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between font-semibold">
                  <span>Report Total:</span>
                  <span className="font-mono text-emerald-600">₹4,500.00</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GL Account Code:</span>
                  <span className="font-mono">Travel &amp; Conveyance</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax Code:</span>
                  <span className="font-mono">GST 18% Input Credit</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Status:</span>
                  <span className="text-emerald-600 font-bold">100% Mapped &amp; Ready for Export</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDryRunModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportReport}
                disabled={exporting}
                className="rounded-xl px-4 py-2 text-xs font-semibold bg-[#008C69] hover:bg-[#007054] text-white shadow-sm flex items-center gap-1.5"
              >
                {exporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>Execute Actual Export</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
