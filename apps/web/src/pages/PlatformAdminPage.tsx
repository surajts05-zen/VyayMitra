import React, { useState } from 'react';
import {
  Building2,
  Users,
  ShieldAlert,
  KeyRound,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Lock,
  Activity,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Role } from '@vyay/contracts';

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  baseCurrency: string;
  country: string;
  timezone: string;
  fiscalYearStartMonth: number;
  plan: 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED';
  userCount: number;
  createdAt: string;
}

interface TenantUserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  active: boolean;
  tenantId: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  actorEmail: string;
  targetTenantName: string;
  targetUserEmail?: string;
  reason: string;
  timestamp: string;
}

export const PlatformAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'provision' | 'audit'>('tenants');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Selected Tenant for User Inspection
  const [expandedTenantId, setExpandedTenantId] = useState<string | null>('11111111-1111-1111-1111-111111111111');

  // Password Reset Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<TenantUserItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [revokeSessions, setRevokeSessions] = useState(true);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // New Tenant Provisioning Form State
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [newTenantCurrency, setNewTenantCurrency] = useState('INR');
  const [newTenantPlan, setNewTenantPlan] = useState<'STARTER' | 'GROWTH' | 'ENTERPRISE'>('GROWTH');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [initialPassword, setInitialPassword] = useState('TempPassword123!');
  const [provisionFeedback, setProvisionFeedback] = useState<string | null>(null);

  // Seeded State
  const [tenants, setTenants] = useState<TenantItem[]>([
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Horizon Scientific India Ltd',
      slug: 'horizon-scientific',
      baseCurrency: 'INR',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      fiscalYearStartMonth: 4,
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      userCount: 4,
      createdAt: '2026-04-01T00:00:00.000Z',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'BlueSky Retail Pvt Ltd',
      slug: 'bluesky-retail',
      baseCurrency: 'INR',
      country: 'IN',
      timezone: 'Asia/Kolkata',
      fiscalYearStartMonth: 4,
      plan: 'GROWTH',
      status: 'ACTIVE',
      userCount: 1,
      createdAt: '2026-05-01T00:00:00.000Z',
    },
  ]);

  const [usersByTenant, setUsersByTenant] = useState<Record<string, TenantUserItem[]>>({
    '11111111-1111-1111-1111-111111111111': [
      {
        id: 'aaaa1111-1111-1111-1111-111111111111',
        email: 'admin@horizonsci.in',
        firstName: 'Vikram',
        lastName: 'Mehta',
        role: Role.COMPANY_OWNER,
        active: true,
        tenantId: '11111111-1111-1111-1111-111111111111',
      },
      {
        id: 'bbbb2222-2222-2222-2222-222222222222',
        email: 'sarah.finance@horizonsci.in',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        role: Role.FINANCE_OPERATOR,
        active: true,
        tenantId: '11111111-1111-1111-1111-111111111111',
      },
      {
        id: 'cccc3333-3333-3333-3333-333333333333',
        email: 'manager.anita@horizonsci.in',
        firstName: 'Anita',
        lastName: 'Deshmukh',
        role: Role.MANAGER,
        active: true,
        tenantId: '11111111-1111-1111-1111-111111111111',
      },
      {
        id: 'dddd4444-4444-4444-4444-444444444444',
        email: 'rahul.sharma@horizonsci.in',
        firstName: 'Rahul',
        lastName: 'Sharma',
        role: Role.EMPLOYEE,
        active: true,
        tenantId: '11111111-1111-1111-1111-111111111111',
      },
    ],
    '22222222-2222-2222-2222-222222222222': [
      {
        id: 'eeee5555-5555-5555-5555-555555555555',
        email: 'priya.bluesky@retail.in',
        firstName: 'Priya',
        lastName: 'Nair',
        role: Role.COMPANY_OWNER,
        active: true,
        tenantId: '22222222-2222-2222-2222-222222222222',
      },
    ],
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([
    {
      id: 'audit-001',
      action: 'TENANT_CREATED',
      actorEmail: 'superadmin@vyaymitra.internal',
      targetTenantName: 'Horizon Scientific India Ltd',
      reason: 'Enterprise tenant provisioning',
      timestamp: '2026-04-01T00:00:00.000Z',
    },
    {
      id: 'audit-002',
      action: 'TENANT_CREATED',
      actorEmail: 'superadmin@vyaymitra.internal',
      targetTenantName: 'BlueSky Retail Pvt Ltd',
      reason: 'Growth tier provisioning',
      timestamp: '2026-05-01T00:00:00.000Z',
    },
  ]);

  // Generate randomized strong password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 14; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(result);
  };

  const handleOpenResetModal = (user: TenantUserItem) => {
    setTargetUser(user);
    setNewPassword('');
    setResetReason('');
    setRevokeSessions(true);
    setResetSuccessMessage(null);
    setResetError(null);
    setCopiedPassword(false);
    setResetModalOpen(true);
  };

  const handleExecutePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters long');
      return;
    }
    if (resetReason.trim().length < 3) {
      setResetError('Audit reason is required (minimum 3 characters)');
      return;
    }

    const tenantName = tenants.find((t) => t.id === targetUser.tenantId)?.name || 'Tenant';

    // Record audit log
    const newLog: AuditLogItem = {
      id: `audit-${Date.now()}`,
      action: 'USER_PASSWORD_RESET',
      actorEmail: 'superadmin@vyaymitra.internal',
      targetTenantName: tenantName,
      targetUserEmail: targetUser.email,
      reason: resetReason,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    setResetSuccessMessage(
      `Password successfully reset for ${targetUser.email}. All outstanding JWT sessions have been immediately revoked.`
    );
    setResetError(null);
  };

  const handleToggleTenantStatus = (tenantId: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== tenantId) return t;
        const newStatus = t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        const newLog: AuditLogItem = {
          id: `audit-${Date.now()}`,
          action: 'TENANT_STATUS_UPDATED',
          actorEmail: 'superadmin@vyaymitra.internal',
          targetTenantName: t.name,
          reason: `Tenant state changed to ${newStatus}`,
          timestamp: new Date().toISOString(),
        };
        setAuditLogs((logs) => [newLog, ...logs]);
        return { ...t, status: newStatus };
      })
    );
  };

  const handleProvisionTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantSlug || !adminEmail) return;

    const newTenantId = `tnt-${Date.now()}`;
    const newTenant: TenantItem = {
      id: newTenantId,
      name: newTenantName,
      slug: newTenantSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      baseCurrency: newTenantCurrency,
      country: 'IN',
      timezone: 'Asia/Kolkata',
      fiscalYearStartMonth: 4,
      plan: newTenantPlan,
      status: 'ACTIVE',
      userCount: 1,
      createdAt: new Date().toISOString(),
    };

    const newOwner: TenantUserItem = {
      id: `usr-${Date.now()}`,
      email: adminEmail,
      firstName: adminFirstName || 'Primary',
      lastName: adminLastName || 'Admin',
      role: Role.COMPANY_OWNER,
      active: true,
      tenantId: newTenantId,
    };

    setTenants((prev) => [...prev, newTenant]);
    setUsersByTenant((prev) => ({
      ...prev,
      [newTenantId]: [newOwner],
    }));

    const newLog: AuditLogItem = {
      id: `audit-${Date.now()}`,
      action: 'TENANT_CREATED',
      actorEmail: 'superadmin@vyaymitra.internal',
      targetTenantName: newTenant.name,
      targetUserEmail: adminEmail,
      reason: `Self-service provisioning via Platform Super Admin console`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((logs) => [newLog, ...logs]);

    setProvisionFeedback(`Organization "${newTenant.name}" provisioned successfully with owner ${adminEmail}!`);
    setNewTenantName('');
    setNewTenantSlug('');
    setAdminEmail('');
    setAdminFirstName('');
    setAdminLastName('');
    setTimeout(() => setProvisionFeedback(null), 5000);
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlanFilter === 'ALL' || t.plan === selectedPlanFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || t.status === selectedStatusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const totalUsersCount = Object.values(usersByTenant).reduce((acc, list) => acc + list.length, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner with Brand Identity */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#151F27] to-slate-900 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 p-2 border border-slate-700/80 flex items-center justify-center shadow-inner">
              <img
                src="/Blue%20Teal%20Gradient%20Wing%20Logo.png"
                alt="VyayMitra"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">Platform Operations Console</h1>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  SUPER_ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Global multi-tenant governance, subscription plan tiers, organization lifecycle, and audited employee password recovery.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center min-w-24">
              <span className="block text-lg font-bold text-emerald-400">{tenants.length}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Tenants</span>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center min-w-24">
              <span className="block text-lg font-bold text-sky-400">{totalUsersCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Total Users</span>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center min-w-24">
              <span className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Engine Health</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-border gap-2 pb-px text-xs font-medium">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'tenants'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Tenant Directory & User Management ({tenants.length})
        </button>
        <button
          onClick={() => setActiveTab('provision')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'provision'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          Provision New Tenant
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-indigo-500" />
          Administrative Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Tenant Directory & Users */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tenant name or slug..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-muted/40 border border-slate-200 dark:border-slate-700 text-foreground"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedPlanFilter}
                onChange={(e) => setSelectedPlanFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-muted/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Plans</option>
                <option value="STARTER">Starter</option>
                <option value="GROWTH">Growth</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-muted/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {/* Tenants List */}
          <div className="space-y-4">
            {filteredTenants.map((tenant) => {
              const isExpanded = expandedTenantId === tenant.id;
              const tenantUsers = usersByTenant[tenant.id] || [];

              return (
                <div
                  key={tenant.id}
                  className="rounded-2xl bg-card border border-border overflow-hidden shadow-card"
                >
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-foreground">{tenant.name}</h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              tenant.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {tenant.status}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {tenant.plan}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          slug: {tenant.slug} &bull; Currency: {tenant.baseCurrency} &bull; Users: {tenantUsers.length}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleTenantStatus(tenant.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          tenant.status === 'ACTIVE'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}
                      >
                        {tenant.status === 'ACTIVE' ? 'Suspend Tenant' : 'Activate Tenant'}
                      </button>

                      <button
                        onClick={() => setExpandedTenantId(isExpanded ? null : tenant.id)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground transition-all"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Hide Users' : 'Manage Users & Passwords'}</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded User Roster with Password Reset */}
                  {isExpanded && (
                    <div className="border-t border-border bg-slate-50/50 dark:bg-[#121B22] p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>Tenant User Directory ({tenantUsers.length})</span>
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Platform Admin can trigger audited password resets with immediate session termination.
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider text-[10px]">
                              <th className="py-2.5 px-3 font-semibold">User</th>
                              <th className="py-2.5 px-3 font-semibold">Email</th>
                              <th className="py-2.5 px-3 font-semibold">Role</th>
                              <th className="py-2.5 px-3 font-semibold">Status</th>
                              <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {tenantUsers.map((u) => (
                              <tr key={u.id} className="hover:bg-white dark:hover:bg-slate-800/40 transition-colors">
                                <td className="py-2.5 px-3 font-medium text-foreground">
                                  {u.firstName} {u.lastName}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                  {u.email}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    {u.role}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Active
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    onClick={() => handleOpenResetModal(u)}
                                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 transition-all shadow-card"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                    <span>Reset Password</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Provision New Tenant */}
      {activeTab === 'provision' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-card border border-border shadow-card">
          <div className="flex items-center space-x-3 mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Provision New Corporate Tenant</h2>
              <p className="text-xs text-slate-500">
                Setup legal organization identity and create initial Company Owner administrator credentials.
              </p>
            </div>
          </div>

          {provisionFeedback && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{provisionFeedback}</span>
            </div>
          )}

          <form onSubmit={handleProvisionTenant} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  value={newTenantName}
                  onChange={(e) => {
                    setNewTenantName(e.target.value);
                    if (!newTenantSlug) {
                      setNewTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  placeholder="e.g. Apex Biotech Solutions Ltd"
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-slate-200 dark:border-slate-700 text-foreground"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Unique Slug *</label>
                <input
                  type="text"
                  required
                  value={newTenantSlug}
                  onChange={(e) => setNewTenantSlug(e.target.value)}
                  placeholder="apex-biotech"
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-slate-200 dark:border-slate-700 text-foreground font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Subscription Plan</label>
                <select
                  value={newTenantPlan}
                  onChange={(e: any) => setNewTenantPlan(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-slate-200 dark:border-slate-700 text-foreground"
                >
                  <option value="STARTER">Starter Tier (10 seats)</option>
                  <option value="GROWTH">Growth Tier (50 seats)</option>
                  <option value="ENTERPRISE">Enterprise Tier (Unlimited)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Base Currency</label>
                <select
                  value={newTenantCurrency}
                  onChange={(e) => setNewTenantCurrency(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-muted/40 border border-slate-200 dark:border-slate-700 text-foreground font-mono"
                >
                  <option value="INR">INR (₹) Indian Rupee</option>
                  <option value="USD">USD ($) US Dollar</option>
                  <option value="EUR">EUR (€) Euro</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
                Initial Owner Account Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={adminFirstName}
                    onChange={(e) => setAdminFirstName(e.target.value)}
                    placeholder="Aditi"
                    className="w-full p-2.5 rounded-xl bg-muted/40 border border-slate-200 dark:border-slate-700 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={adminLastName}
                    onChange={(e) => setAdminLastName(e.target.value)}
                    placeholder="Rao"
                    className="w-full p-2.5 rounded-xl bg-muted/40 border border-slate-200 dark:border-slate-700 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Owner Email *</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="aditi.rao@apexbiotech.in"
                    className="w-full p-2.5 rounded-xl bg-muted/40 border border-slate-200 dark:border-slate-700 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={initialPassword}
                    onChange={(e) => setInitialPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-muted/40 border border-slate-200 dark:border-slate-700 text-foreground font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:opacity-90 text-white transition-all shadow-card flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create & Provision Organization</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Administrative Audit Logs */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-card text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2 font-bold text-sm text-foreground">
              <ShieldAlert className="w-4 h-4 text-indigo-500" />
              <span>Immutable Administrative Action Log</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Preserves chronological tamper-evident record of all tenant modifications & password resets.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-3 font-semibold">Action</th>
                  <th className="py-2.5 px-3 font-semibold">Target Organization</th>
                  <th className="py-2.5 px-3 font-semibold">Target User</th>
                  <th className="py-2.5 px-3 font-semibold">Actor</th>
                  <th className="py-2.5 px-3 font-semibold">Audit Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-mono text-[11px]">
                    <td className="py-2.5 px-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-bold text-foreground">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground font-sans">
                      {log.targetTenantName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                      {log.targetUserEmail || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-indigo-600 dark:text-indigo-400 font-sans">{log.actorEmail}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-sans">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-float space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Reset User Password</h3>
                  <p className="text-[11px] text-slate-500">Audited Platform Administration Action</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Target User Summary Card */}
            <div className="p-3 rounded-xl bg-muted/40 border border-slate-200 dark:border-slate-700">
              <span className="block font-semibold text-foreground text-xs">
                {targetUser.firstName} {targetUser.lastName}
              </span>
              <span className="block text-[11px] font-mono text-slate-500">{targetUser.email}</span>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {targetUser.role}
              </span>
            </div>

            {resetSuccessMessage ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Password Reset Completed</span>
                  </div>
                  <p className="text-[11px]">{resetSuccessMessage}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase mb-1">New Password:</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-foreground select-all">
                      {newPassword}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(newPassword);
                        setCopiedPassword(true);
                        setTimeout(() => setCopiedPassword(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded bg-white dark:bg-slate-700 text-foreground border border-slate-300 dark:border-slate-600 font-medium text-xs flex items-center gap-1"
                    >
                      {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPassword ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecutePasswordReset} className="space-y-3">
                {resetError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 dark:text-slate-400 font-medium">New Password *</label>
                    <button
                      type="button"
                      onClick={generateStrongPassword}
                      className="text-primary hover:underline font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate Strong</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full p-2.5 rounded-xl bg-muted/40 border border-slate-200 dark:border-slate-700 text-foreground font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Mandatory Audit Rationale *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    placeholder="e.g. Employee locked out of authenticator device. Support ticket #8942"
                    className="w-full p-2.5 rounded-xl bg-muted/40 border border-slate-200 dark:border-slate-700 text-foreground text-xs"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center space-x-2.5">
                  <input
                    type="checkbox"
                    id="revoke-sessions"
                    checked={revokeSessions}
                    onChange={(e) => setRevokeSessions(e.target.checked)}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="revoke-sessions" className="text-[11px] text-slate-700 dark:text-slate-300">
                    Immediately revoke all active JWT sessions and refresh tokens for this user.
                  </label>
                </div>

                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-card flex items-center space-x-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Confirm & Reset Password</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
