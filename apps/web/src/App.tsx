import React, { lazy, Suspense, useState, useEffect } from 'react';
import { AppShell } from '@vyay/ui';
import { ShieldAlert, BookOpen, UserCheck, ChevronUp, ChevronDown } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnboardingChecklist } from './components/OnboardingChecklist';
import { getStoredSession, saveSession, UserSession, setActivePersona } from './lib/api';

const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
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
    <div role="status" aria-live="polite" className="rounded-xl border border-border bg-card p-6 shadow-card">
      <span className="sr-only">Loading page</span>
      <div className="h-5 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-32 animate-pulse rounded-xl bg-muted/60" />
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
  const [session, setSession] = useState<UserSession | null>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('signed_out=1')) {
      saveSession(null);
      window.history.replaceState({}, document.title, window.location.pathname);
      return null;
    }
    return getStoredSession();
  });
  const [activePersonaIndex, setActivePersonaIndex] = useState(0);
  const [personaDrawerOpen, setPersonaDrawerOpen] = useState(false);

  useEffect(() => {
    if (session) {
      setActivePersona(session.user.email);
    }
  }, [session]);

  const handleLogout = () => {
    saveSession(null);
    setSession(null);
  };

  const handleSwitchPersona = (index: number) => {
    setActivePersonaIndex(index);
    const p = DEMO_PERSONAS[index];
    setActivePersona(p.email);
    if (session) {
      const updated: UserSession = {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: {
          id: session.user.id,
          email: p.email,
          firstName: p.label.split(' ')[0],
          lastName: p.label.split(' ').slice(1).join(' '),
        },
        tenant: {
          id: session.tenant.id,
          name: p.tenant,
          slug: p.tenant.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          role: p.role,
        },
      };
      saveSession(updated);
      setSession(updated);
    }
    if (p.role === 'PLATFORM_SUPER_ADMIN') {
      setCurrentPath('/platform-admin');
    }
    setPersonaDrawerOpen(false);
  };

  if (!session) {
    return (
      <Suspense fallback={<PageLoading />}>
        <LoginPage
          onLoginSuccess={(newSession) => {
            setSession(newSession);
            setActivePersona(newSession.user.email);
            if (newSession.tenant.role === 'PLATFORM_SUPER_ADMIN') {
              setCurrentPath('/platform-admin');
            } else {
              setCurrentPath('/dashboard');
            }
          }}
        />
      </Suspense>
    );
  }

  const activePersona = {
    role: session.tenant.role,
    email: session.user.email,
    tenant: session.tenant.name,
    label: `${session.user.firstName} ${session.user.lastName}`.trim() || session.user.email,
  };

  const renderCurrentView = () => {
    switch (currentPath) {
      case '/expenses':
        return <ExpensesPage />;
      case '/reports':
        return <ReportsPage />;
      case '/approvals':
        return <ApprovalsPage activeRole={activePersona.role} activeEmail={activePersona.email} onNavigate={setCurrentPath} />;
      case '/finance':
        return <FinancePage onNavigate={setCurrentPath} tenantName={activePersona.tenant} />;
      case '/reimbursements':
        return <ReimbursementsPage />;
      case '/analytics':
        return <AnalyticsPage tenantName={activePersona.tenant} />;
      case '/integrations':
        return <IntegrationsPage tenantName={activePersona.tenant} />;
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
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-8 text-center dark:border-amber-900/40 dark:bg-amber-950/20 shadow-card">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-foreground">Admin Guide Restricted</h2>
              <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground leading-relaxed">
                The Company Admin Guide is reserved for Tenant Administrators (Company Owner, Admin, Finance Admin) and Platform Super Admins.
                As an {activePersona.role.toLowerCase().replace('_', ' ')}, please refer to the comprehensive User Guide.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPath('/user-guide')}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-all"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Open Employee User Guide</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPath('/dashboard')}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
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
        return (
          <SettingsPage
            tenantName={activePersona.tenant}
            tenantId={session?.tenant?.id}
            currentUser={
              session?.user
                ? {
                    id: session.user.id,
                    email: session.user.email,
                    name: `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim(),
                    role: activePersona.role,
                  }
                : null
            }
          />
        );
      case '/dashboard':
      default:
        return <DashboardPage onNavigate={setCurrentPath} tenantName={activePersona.tenant} />;
    }
  };

  return (
    <AppShell
      tenantName={activePersona.tenant}
      userEmail={activePersona.email}
      userRole={activePersona.role}
      currentPath={currentPath}
      onNavigate={setCurrentPath}
      onLogout={handleLogout}
    >
      <ErrorBoundary>
        <Suspense fallback={<PageLoading />}>{renderCurrentView()}</Suspense>
      </ErrorBoundary>

      {/* ── Discreet Floating Persona Switcher (For Pair Testing & Evaluation) ── */}
      <div className="fixed bottom-4 right-4 z-50 select-none">
        {personaDrawerOpen ? (
          <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md p-3 shadow-float w-72 space-y-2 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-border">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-km-forest dark:text-km-lime" />
                <span>Switch Review Persona</span>
              </span>
              <button
                type="button"
                onClick={() => setPersonaDrawerOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              {DEMO_PERSONAS.map((p, idx) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleSwitchPersona(idx)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-smooth ${
                    activePersonaIndex === idx
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <div>
                    <div className="font-medium">{p.label}</div>
                    <div className={`text-[10px] ${activePersonaIndex === idx ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {p.role}
                    </div>
                  </div>
                  {activePersonaIndex === idx && (
                    <span className="w-1.5 h-1.5 rounded-full bg-km-lime" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPersonaDrawerOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sidebar text-sidebar-foreground border border-sidebar-border shadow-float hover:border-km-lime/50 transition-smooth text-xs group"
          >
            <span className="w-2 h-2 rounded-full bg-km-lime animate-pulse" />
            <span className="text-[11px] font-medium text-sidebar-foreground/90">
              Role: <strong className="text-white">{activePersona.role.split('_')[0]}</strong>
            </span>
            <ChevronUp className="w-3 h-3 text-sidebar-foreground/60 group-hover:text-white" />
          </button>
        )}
      </div>
    </AppShell>
  );
}

export default App;
