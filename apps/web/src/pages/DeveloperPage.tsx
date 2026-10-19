import React, { useState } from 'react';
import {
  Code2,
  KeyRound,
  Webhook,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCw,
  Send,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileCode2,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface ApiCredentialItem {
  id: string;
  name: string;
  clientId: string;
  scopes: string[];
  lastUsedAt?: string;
  createdAt: string;
}

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  signingKeyHint: string;
  successCount: number;
  failureCount: number;
  lastTriggeredAt?: string;
}

interface DeliveryLogItem {
  id: string;
  event: string;
  targetUrl: string;
  httpStatus: number;
  durationMs: number;
  timestamp: string;
  success: boolean;
}

export const DeveloperPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'webhooks' | 'docs'>('credentials');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // API Credentials state
  const [credentials, setCredentials] = useState<ApiCredentialItem[]>([
    {
      id: 'cred-001',
      name: 'Nightly ERP Sync Service',
      clientId: 'vyay_9f82ab7c10d3e52109a1',
      scopes: ['expenses:read', 'reports:read', 'analytics:read'],
      lastUsedAt: '12 minutes ago',
      createdAt: '2026-10-15',
    },
    {
      id: 'cred-002',
      name: 'KaaryaMitra HRMS Bridge',
      clientId: 'vyay_3e19dd401a89c256ef89',
      scopes: ['expenses:write', 'reports:read'],
      lastUsedAt: '2 hours ago',
      createdAt: '2026-10-18',
    },
  ]);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([
    {
      id: 'wh-001',
      url: 'https://api.horizonsci.in/webhooks/expenses',
      events: ['report.approved', 'reimbursement.paid'],
      active: true,
      signingKeyHint: '7e2f',
      successCount: 42,
      failureCount: 0,
      lastTriggeredAt: '20 minutes ago',
    },
  ]);

  // Delivery logs state
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLogItem[]>([
    {
      id: 'log-001',
      event: 'reimbursement.paid',
      targetUrl: 'https://api.horizonsci.in/webhooks/expenses',
      httpStatus: 200,
      durationMs: 38,
      timestamp: 'Today, 11:15 AM',
      success: true,
    },
    {
      id: 'log-002',
      event: 'report.approved',
      targetUrl: 'https://api.horizonsci.in/webhooks/expenses',
      httpStatus: 200,
      durationMs: 44,
      timestamp: 'Today, 09:30 AM',
      success: true,
    },
  ]);

  // Modal states
  const [showCreateCredModal, setShowCreateCredModal] = useState(false);
  const [newCredName, setNewCredName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'expenses:read',
    'analytics:read',
  ]);
  const [createdSecretReveal, setCreatedSecretReveal] = useState<{
    clientId: string;
    clientSecret: string;
  } | null>(null);

  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedWebhookEvents, setSelectedWebhookEvents] = useState<string[]>([
    'reimbursement.paid',
    'report.approved',
  ]);

  const [dispatchingTest, setDispatchingTest] = useState(false);

  const availableScopes = [
    { id: 'expenses:read', label: 'expenses:read', desc: 'Read expense items & line items' },
    { id: 'expenses:write', label: 'expenses:write', desc: 'Create & update expense claims' },
    { id: 'reports:read', label: 'reports:read', desc: 'View expense reports & approval flow' },
    { id: 'reports:write', label: 'reports:write', desc: 'Submit and delegate reports' },
    { id: 'finance:read', label: 'finance:read', desc: 'Read reimbursements and GL accounts' },
    { id: 'finance:write', label: 'finance:write', desc: 'Record disbursements and refunds' },
    { id: 'analytics:read', label: 'analytics:read', desc: 'Query aggregate spend and KPIs' },
    { id: 'webhooks:manage', label: 'webhooks:manage', desc: 'Register and rotate webhooks' },
  ];

  const availableEvents = [
    { id: 'expense.created', label: 'expense.created', desc: 'When employee uploads an expense' },
    { id: 'report.submitted', label: 'report.submitted', desc: 'When report enters review cycle' },
    { id: 'report.approved', label: 'report.approved', desc: 'When manager authorizes report' },
    { id: 'reimbursement.paid', label: 'reimbursement.paid', desc: 'When payment disbursed to employee' },
    { id: 'integration.synced', label: 'integration.synced', desc: 'When Zoho Books ledger syncs' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCreateCredential = () => {
    if (!newCredName.trim()) return;
    const randomHex = Math.random().toString(16).substring(2, 12);
    const clientId = `vyay_${randomHex}`;
    const rawSecret = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const fullSecret = `${clientId}.${rawSecret}`;

    const newCred: ApiCredentialItem = {
      id: `cred-${Date.now()}`,
      name: newCredName,
      clientId,
      scopes: selectedScopes,
      createdAt: 'Just now',
    };

    setCredentials([newCred, ...credentials]);
    setShowCreateCredModal(false);
    setCreatedSecretReveal({ clientId, clientSecret: fullSecret });
    setNewCredName('');
  };

  const handleRevokeCredential = (id: string) => {
    if (confirm('Revoke this API Key immediately? External services using it will lose access.')) {
      setCredentials(credentials.filter((c) => c.id !== id));
      setToastMessage('API credential revoked');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleCreateWebhook = () => {
    if (!newWebhookUrl.trim()) return;
    const newWh: WebhookItem = {
      id: `wh-${Date.now()}`,
      url: newWebhookUrl,
      events: selectedWebhookEvents,
      active: true,
      signingKeyHint: Math.random().toString(16).substring(2, 6),
      successCount: 0,
      failureCount: 0,
      lastTriggeredAt: 'Never',
    };
    setWebhooks([...webhooks, newWh]);
    setShowCreateWebhookModal(false);
    setNewWebhookUrl('');
    setToastMessage('Webhook endpoint subscribed with HMAC-SHA256 signing secret');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTestDispatch = () => {
    setDispatchingTest(true);
    setTimeout(() => {
      const newLog: DeliveryLogItem = {
        id: `log-${Date.now()}`,
        event: 'reimbursement.paid',
        targetUrl: webhooks[0]?.url || 'https://api.horizonsci.in/webhooks/expenses',
        httpStatus: 200,
        durationMs: 42,
        timestamp: 'Just now',
        success: true,
      };
      setDeliveryLogs([newLog, ...deliveryLogs]);
      setDispatchingTest(false);
      setToastMessage('Test ping dispatched & signed with HMAC-SHA256 (HTTP 200 OK)');
      setTimeout(() => setToastMessage(null), 4000);
    }, 800);
  };

  const handleRotateWebhookKey = (id: string) => {
    if (confirm('Rotate signing secret for this webhook? Your server will need the updated key.')) {
      setWebhooks(
        webhooks.map((w) =>
          w.id === id ? { ...w, signingKeyHint: Math.random().toString(16).substring(2, 6) } : w
        )
      );
      setToastMessage('Webhook HMAC secret key rotated');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#008C69] text-white px-5 py-3 rounded-xl shadow-xl flex items-center space-x-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Secret Reveal Modal */}
      {createdSecretReveal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Save Your API Secret Key
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  This key is shown only once and cannot be recovered later.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                Machine-to-Machine Secret (X-API-Key)
              </label>
              <div className="flex items-center gap-2 bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs break-all border border-slate-700">
                <span className="flex-1 select-all">{createdSecretReveal.clientSecret}</span>
                <button
                  onClick={() => handleCopy(createdSecretReveal.clientSecret, 'modal-key')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 text-xs font-sans shrink-0 font-semibold"
                >
                  {copiedKey === 'modal-key' ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Key
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">Authentication Usage:</p>
              <p>Pass as header: <code className="text-[#008C69] font-mono">X-API-Key: {createdSecretReveal.clientSecret}</code></p>
              <p>Or as bearer: <code className="text-[#008C69] font-mono">Authorization: Bearer {createdSecretReveal.clientSecret}</code></p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setCreatedSecretReveal(null)}
                className="px-5 py-2.5 bg-[#008C69] hover:bg-[#007456] text-white rounded-xl text-sm font-semibold shadow-sm"
              >
                I have securely saved this key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142333] dark:text-white flex items-center gap-2">
            Developer Platform & Machine API
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Machine-to-machine API credentials, HMAC signed webhooks, and REST documentation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/v1/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-700 dark:text-slate-200 hover:text-[#008C69] rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <FileCode2 className="w-4 h-4 text-[#008C69]" />
            OpenAPI 3.1 Spec
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5EAF0] dark:border-[#2D3942] gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('credentials')}
          className={`pb-3 flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'credentials'
              ? 'border-[#008C69] text-[#008C69] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          API Credentials ({credentials.length})
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`pb-3 flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'webhooks'
              ? 'border-[#008C69] text-[#008C69] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Webhook className="w-4 h-4" />
          Webhooks & Signatures ({webhooks.length})
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`pb-3 flex items-center gap-2 transition-all border-b-2 ${
            activeTab === 'docs'
              ? 'border-[#008C69] text-[#008C69] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Quickstart & Signature Verification
        </button>
      </div>

      {/* Tab 1: API Credentials */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Service Credentials</h2>
              <p className="text-xs text-slate-500">Machine-to-machine keys for automated scripts and external ERP syncs</p>
            </div>
            <button
              onClick={() => setShowCreateCredModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#008C69] hover:bg-[#007456] text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Generate API Key
            </button>
          </div>

          <div className="bg-white dark:bg-[#151F27] rounded-2xl border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
            {credentials.map((cred) => (
              <div key={cred.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-base">{cred.name}</span>
                    <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      Client ID: {cred.clientId}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {cred.scopes.map((scope) => (
                      <span
                        key={scope}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#008C69] dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>Created: {cred.createdAt}</span>
                    <span>Last used: {cred.lastUsedAt || 'Never'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCopy(cred.clientId, cred.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  >
                    {copiedKey === cred.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Client ID
                  </button>

                  <button
                    onClick={() => handleRevokeCredential(cred.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Webhook Endpoints</h2>
              <p className="text-xs text-slate-500">Real-time HTTP push events signed with HMAC-SHA256 signatures</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleTestDispatch}
                disabled={dispatchingTest}
                className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-semibold shadow-sm"
              >
                {dispatchingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-[#008C69]" />}
                Dispatch Test Ping
              </button>

              <button
                onClick={() => setShowCreateWebhookModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#008C69] hover:bg-[#007456] text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Webhook
              </button>
            </div>
          </div>

          {/* Webhook Endpoints List */}
          <div className="bg-white dark:bg-[#151F27] rounded-2xl border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm break-all">
                      {wh.url}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Active
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {wh.events.map((evt) => (
                      <span
                        key={evt}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold"
                      >
                        {evt}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>Secret Key: <code className="font-mono text-slate-600 dark:text-slate-300">••••••••••••{wh.signingKeyHint}</code></span>
                    <span>Delivered: {wh.successCount} OK / {wh.failureCount} failed</span>
                    <span>Last triggered: {wh.lastTriggeredAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRotateWebhookKey(wh.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Rotate Secret
                  </button>

                  <button
                    onClick={() => setWebhooks(webhooks.filter((w) => w.id !== wh.id))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Logs Viewer */}
          <div className="bg-white dark:bg-[#151F27] p-5 rounded-2xl border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#008C69]" />
              Recent Webhook Delivery Logs
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Event</th>
                    <th className="py-2.5 px-3">Destination</th>
                    <th className="py-2.5 px-3">HTTP Status</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Delivered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {deliveryLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-semibold text-purple-600 dark:text-purple-400">
                        {log.event}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 truncate max-w-xs">
                        {log.targetUrl}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {log.httpStatus} OK
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {log.durationMs}ms
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {log.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Quickstart & Signature Verification */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* M2M Authentication Guide */}
          <div className="bg-white dark:bg-[#151F27] p-6 rounded-2xl border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#008C69]" />
              Machine-to-Machine HTTP Requests
            </h3>
            <p className="text-xs text-slate-500">
              Authenticate automated workers or scheduled CRON jobs without user login credentials.
            </p>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Example cURL Request:</span>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-700">
{`curl -X GET "https://api.vyaymitra.in/api/v1/analytics/summary" \\
  -H "X-API-Key: vyay_9f82ab7c10d3.9018cbf..." \\
  -H "Accept: application/json"`}
              </pre>
            </div>
          </div>

          {/* Webhook HMAC Verification */}
          <div className="bg-white dark:bg-[#151F27] p-6 rounded-2xl border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verifying Webhook HMAC-SHA256 Signatures
            </h3>
            <p className="text-xs text-slate-500">
              Every webhook request includes a <code className="text-[#008C69]">X-VyayMitra-Signature</code> header.
            </p>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Node.js Verification Snippet:</span>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-700">
{`import crypto from 'node:crypto';

function verifyWebhook(payloadRawBody, signatureHeader, signingSecret) {
  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', signingSecret)
    .update(payloadRawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(expectedSig)
  );
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Credential */}
      {showCreateCredModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Machine API Credential</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Credential Name / Service</label>
              <input
                type="text"
                placeholder="e.g. ERP Ledger Sync Bot"
                value={newCredName}
                onChange={(e) => setNewCredName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#008C69]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Scopes</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {availableScopes.map((scope) => (
                  <label
                    key={scope.id}
                    className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedScopes([...selectedScopes, scope.id]);
                        } else {
                          setSelectedScopes(selectedScopes.filter((s) => s !== scope.id));
                        }
                      }}
                      className="mt-0.5 rounded text-[#008C69] focus:ring-[#008C69]"
                    />
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{scope.label}</span>
                      <p className="text-[10px] text-slate-400">{scope.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCreateCredModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCredential}
                disabled={!newCredName.trim() || selectedScopes.length === 0}
                className="px-5 py-2 bg-[#008C69] hover:bg-[#007456] disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-sm"
              >
                Generate Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Webhook */}
      {showCreateWebhookModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Subscribe Webhook Endpoint</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Destination HTTPS Endpoint URL</label>
              <input
                type="url"
                placeholder="https://your-company.com/api/webhooks/vyaymitra"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#008C69]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subscribed Events</label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                {availableEvents.map((evt) => (
                  <label
                    key={evt.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedWebhookEvents.includes(evt.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedWebhookEvents([...selectedWebhookEvents, evt.id]);
                        } else {
                          setSelectedWebhookEvents(selectedWebhookEvents.filter((ev) => ev !== evt.id));
                        }
                      }}
                      className="mt-0.5 rounded text-[#008C69] focus:ring-[#008C69]"
                    />
                    <div>
                      <span className="font-mono font-bold text-purple-700 dark:text-purple-300">{evt.label}</span>
                      <p className="text-[11px] text-slate-500">{evt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCreateWebhookModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWebhook}
                disabled={!newWebhookUrl.trim() || selectedWebhookEvents.length === 0}
                className="px-5 py-2 bg-[#008C69] hover:bg-[#007456] disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-sm"
              >
                Subscribe Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DeveloperPage;
