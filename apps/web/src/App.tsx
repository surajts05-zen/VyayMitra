import React, { lazy, Suspense, useState } from 'react';
import { AppShell } from '@vyay/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnboardingChecklist } from './components/OnboardingChecklist';

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

function PageLoading() {
  return (
    <div role="status" aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-[#151F27]">
      <span className="sr-only">Loading page</span>
      <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-4 h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

export function App() {
  const [currentPath, setCurrentPath] = useState<string>('/dashboard');

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
      case '/settings':
        return <SettingsPage />;
      case '/dashboard':
      default:
        return <DashboardPage onNavigate={setCurrentPath} />;
    }
  };

  return (
    <AppShell
      tenantName="Horizon Scientific India Ltd"
      userEmail="sarah.finance@horizonsci.in"
      userRole="FINANCE_OPERATOR"
      currentPath={currentPath}
      onNavigate={setCurrentPath}
      onLogout={() => window.location.assign('/?signed_out=1')}
    >
      <ErrorBoundary>
        {currentPath === '/dashboard' && <OnboardingChecklist onNavigate={setCurrentPath} />}
        <Suspense fallback={<PageLoading />}>{renderCurrentView()}</Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}

export default App;
