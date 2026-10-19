import React, { lazy, Suspense, useState } from 'react';
import { AppShell } from '@vyay/ui';
import { ShieldAlert, BookOpen } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnboardingChecklist } from './components/OnboardingChecklist';
import { setActivePersona } from './lib/api';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then((module) => ({ default: module.ExpensesPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage').then((module) => ({ default: module.ApprovalsPage })));
const FinancePage = lazy(() => import('./pages/FinancePage').then((module) => ({ default: module.FinancePage })));
const ReimbursementsPage = lazy(() => import('./pages/ReimbursementsPage').then((module) => ({ default: module.ReimbursementsPage })));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage').then((module) => ({ default: module.IntegrationsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })));
const DeveloperPage = lazy(() => import('./pages/DeveloperPage').then((module) => ({ default: module.DeveloperPage })));
const PlatformAdminPage = lazy(() => import('./pages/PlatformAdminPage').then((module) => ({ default: module.PlatformAdminPage })));
const CompanyAdminGuidePage = lazy(() => import('./pages/CompanyAdminGuidePage').then((module) => ({ default: module.CompanyAdminGuidePage })));
const UserGuidePage = lazy(() => import('./pages/UserGuidePage').then((module) => ({ default: module.UserGuidePage })));

function PageLoading() {
  return (
    <div role="status" aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#151F27]">
      <span className="sr-only">Loading page</span>
      <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-4 h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

const DEMO_PERSONAS = [
  {
    role: 'FINANCE_OPERATOR',
    email: 'sarah.finance@horizonsci.in',
    tenant: 'Horizon Scientific India Ltd',
    label: 'Sarah Jenkins (Finance)',
  },
  {
    role: 'PLATFORM_SUPER_ADMIN',
    email: 'superadmin@vyaymitra.internal',
    tenant: 'VyayMitra Platform Operations',
    label: 'Platform Super Admin (Ops)',
  },
  {
    role: 'COMPANY_OWNER',
    email: 'admin@horizonsci.in',
    tenant: 'Horizon Scientific India Ltd',
    label: 'Vikram Mehta (Owner)',
  },
  {
    role: 'EMPLOYEE',
    email: 'rahul.sharma@horizonsci.in',
    tenant: 'Horizon Scientific India Ltd',
    label: 'Rahul Sharma (Employee)',
  },
];

export function App() {
  const [currentPath, setCurrentPath] = useState<string>('/dashboard');
  const [activePersonaIndex, setActivePersonaIndex] = useState(0);

  const activePersona = DEMO_PERSONAS[activePersonaIndex];

  const handleSwitchPersona = (index: number) => {
    setActivePersonaIndex(index);
    setActivePersona(DEMO_PERSONAS[index].email);
    if (DEMO_PERSONAS[index].role === 'PLATFORM_SUPER_ADMIN') {
      setCurrentPath('/platform-admin');
    }
  };

  const renderCurrentView = () => {
    switch (currentPath) {
      case '/expenses':
        return <ExpensesPage />;
      case '/reports':
        return <ReportsPage />;
      case '/approvals':
        return <ApprovalsPage />;
      case '/finance':
        return <FinancePage onNavigate={setCurrentPath} />;
      case '/reimbursements':
        return <ReimbursementsPage />;
      case '/analytics':
        return <AnalyticsPage />;
      case '/integrations':
        return <IntegrationsPage />;
      case '/developer':
        return <DeveloperPage />;
      case '/platform-admin':
        return <PlatformAdminPage />;
      case '/user-guide':
        return <UserGuidePage onNavigate={setCurrentPath} />;
      case '/admin-guide': {
        const isPlatformAdmin = activePersona.role === 'PLATFORM_SUPER_ADMIN';
        const isTenantAdmin = ['COMPANY_OWNER', 'COMPANY_ADMIN', 'FINANCE_ADMIN'].includes(activePersona.role);
        if (!isPlatformAdmin && !isTenantAdmin) {
          return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-8 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Admin Guide Restricted</h2>
              <p className="mx-auto mt-2 max-w-md text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The Company Admin Guide is reserved for Tenant Administrators (Company Owner, Admin, Finance Admin) and Platform Super Admins.
                As an {activePersona.role.toLowerCase().replace('_', ' ')}, please refer to the comprehensive User Guide.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPath('/user-guide')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#008C69] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#007054] transition-all"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Open Employee User Guide</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPath('/dashboard')}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#151F27] dark:text-slate-300"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          );
        }
        return <CompanyAdminGuidePage onNavigate={setCurrentPath} />;
      }
      case '/settings':
        return <SettingsPage />;
      case '/dashboard':
      default:
        return <DashboardPage onNavigate={setCurrentPath} />;
    }
  };

  return (
    <AppShell
      tenantName={activePersona.tenant}
      userEmail={activePersona.email}
      userRole={activePersona.role}
      currentPath={currentPath}
      onNavigate={setCurrentPath}
      onLogout={() => window.location.assign('/?signed_out=1')}
    >
      {/* Persona Bar for Review & Testing */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-slate-800 dark:bg-[#151F27]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600 dark:text-slate-400">Demo Persona:</span>
          <span className="font-bold text-[#008C69] dark:text-[#34D399]">{activePersona.label}</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {activePersona.role}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {DEMO_PERSONAS.map((p, idx) => (
            <button
              key={p.role}
              type="button"
              onClick={() => handleSwitchPersona(idx)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                activePersonaIndex === idx
                  ? 'bg-[#008C69] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {p.role === 'PLATFORM_SUPER_ADMIN' ? '🛡️ Super Admin' : p.role.split('_')[0]}
            </button>
          ))}
        </div>
      </div>

      <ErrorBoundary>
        {currentPath === '/dashboard' && <OnboardingChecklist onNavigate={setCurrentPath} />}
        <Suspense fallback={<PageLoading />}>{renderCurrentView()}</Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}

export default App;
