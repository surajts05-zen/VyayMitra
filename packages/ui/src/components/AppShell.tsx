import React, { useEffect, useRef, useState } from 'react';
import {
  Receipt,
  FileText,
  CheckSquare,
  Landmark,
  Layers,
  Settings,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Building2,
  BarChart3,
  Code2,
  ShieldAlert,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  href: string;
}

interface AppShellProps {
  tenantName: string;
  tenantLogoUrl?: string;
  userEmail: string;
  userRole: string;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  tenantName,
  tenantLogoUrl,
  userEmail,
  userRole,
  currentPath,
  onNavigate,
  onLogout,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const firstMobileLink = useRef<HTMLButtonElement>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = window.localStorage.getItem('vyaymitra:theme');
    return stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleDarkMode = () => {
    setDarkMode((current) => !current);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    window.localStorage.setItem('vyaymitra:theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    firstMobileLink.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

  const isPlatformAdmin = userRole === 'PLATFORM_SUPER_ADMIN';
  const isTenantAdmin = ['COMPANY_OWNER', 'COMPANY_ADMIN', 'FINANCE_ADMIN'].includes(userRole);
  const canViewAdminGuide = isPlatformAdmin || isTenantAdmin;

  const navItems: NavItem[] = [
    { id: 'expenses', label: 'My Expenses', icon: <Receipt className="w-5 h-5" />, href: '/expenses' },
    { id: 'reports', label: 'My Reports', icon: <FileText className="w-5 h-5" />, href: '/reports' },
    { id: 'approvals', label: 'Approvals', icon: <CheckSquare className="w-5 h-5" />, href: '/approvals' },
    { id: 'finance', label: 'Finance Review', icon: <Landmark className="w-5 h-5" />, href: '/finance' },
    { id: 'reimbursements', label: 'Reimbursements', icon: <Landmark className="w-5 h-5" />, href: '/reimbursements' },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, href: '/analytics' },
    { id: 'integrations', label: 'Integrations', icon: <Layers className="w-5 h-5" />, href: '/integrations' },
    { id: 'developer', label: 'Developer API', icon: <Code2 className="w-5 h-5" />, href: '/developer' },
    ...(isPlatformAdmin
      ? [{ id: 'platform', label: 'Platform Admin', icon: <ShieldAlert className="w-5 h-5 text-indigo-500" />, badge: 'Ops', href: '/platform-admin' }]
      : []),
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, href: '/settings' },
    { id: 'user-guide', label: 'User Guide', icon: <HelpCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />, badge: 'Help', href: '/user-guide' },
    ...(canViewAdminGuide
      ? [{ id: 'guide', label: 'Admin Guide', icon: <BookOpen className="w-5 h-5 text-[#008C69] dark:text-[#34D399]" />, badge: 'Admin', href: '/admin-guide' }]
      : []),
  ];

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[#F7F9FB] dark:bg-[#0D141A] text-[#142333] dark:text-[#EDF4F7] flex flex-col md:flex-row font-sans antialiased">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-50 -translate-y-20 rounded-lg bg-[#142333] px-4 py-3 text-sm font-semibold text-white transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>
      {/* Desktop Sidebar */}
      <aside aria-label="Application sidebar" className="hidden md:flex flex-col w-64 border-r border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27] select-none">
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#E5EAF0] dark:border-[#2D3942] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <img
              src="/VyayMitra%20Logo%20full.png"
              alt="VyayMitra"
              className="h-8 max-w-[170px] object-contain block dark:hidden"
            />
            <img
              src="/VyayMitra%20Logo%20full%20white.png"
              alt="VyayMitra"
              className="h-8 max-w-[170px] object-contain hidden dark:block"
            />
          </div>
        </div>

        {/* Tenant Switcher Context */}
        <div className="px-3 py-3 border-b border-[#E5EAF0] dark:border-[#2D3942]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-xs">
            <div className="flex items-center space-x-2 truncate">
              {tenantLogoUrl ? (
                <img src={tenantLogoUrl} alt={tenantName} className="w-5 h-5 rounded object-cover" />
              ) : (
                <Building2 className="w-4 h-4 text-slate-500" />
              )}
              <span className="font-medium truncate text-slate-800 dark:text-slate-200">{tenantName}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Primary navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = currentPath.startsWith(item.href);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onNavigate(item.href)}
                aria-current={active ? 'page' : undefined}
                className={`min-h-11 w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-[#E6F5F0] text-[#008C69] dark:bg-[#082921] dark:text-[#34D399] font-semibold'
                    : 'text-[#607184] hover:bg-slate-100 dark:hover:bg-[#1C2833] dark:text-[#94A3B8]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Theme Toggle */}
        <div className="p-3 border-t border-[#E5EAF0] dark:border-[#2D3942]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#1C2833]">
            <div className="truncate mr-2">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{userEmail}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{userRole}</p>
            </div>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="min-h-11 min-w-11 p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                title="Toggle Theme"
                aria-label={`Switch to ${darkMode ? 'light' : 'dark'} theme`}
                aria-pressed={darkMode}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="min-h-11 min-w-11 p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                title="Log Out"
                aria-label="Log out and revoke this session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between min-h-14 px-4 bg-white dark:bg-[#151F27] border-b border-[#E5EAF0] dark:border-[#2D3942]">
        <div className="flex items-center space-x-2.5">
          <img
            src="/Blue%20Teal%20Gradient%20Wing%20Logo.png"
            alt="VyayMitra"
            className="w-7 h-7 object-contain"
          />
          <span className="font-bold text-sm tracking-tight text-[#142333] dark:text-[#EDF4F7]">VyayMitra</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="min-h-11 min-w-11 p-2 rounded-lg text-slate-600 dark:text-slate-300"
          aria-label={`${mobileMenuOpen ? 'Close' : 'Open'} navigation menu`}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="md:hidden bg-white dark:bg-[#151F27] border-b border-[#E5EAF0] dark:border-[#2D3942] px-4 py-3 space-y-1">
          {navItems.map((item, index) => (
            <button
              type="button"
              key={item.id}
              ref={index === 0 ? firstMobileLink : undefined}
              onClick={() => {
                onNavigate(item.href);
                setMobileMenuOpen(false);
              }}
              aria-current={currentPath.startsWith(item.href) ? 'page' : undefined}
              className="min-h-11 w-full flex items-center space-x-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-500">{userEmail}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={toggleDarkMode} className="min-h-11 rounded-lg px-3 text-xs font-medium" aria-pressed={darkMode}>
                {darkMode ? 'Light theme' : 'Dark theme'}
              </button>
              <button type="button" onClick={onLogout} className="min-h-11 rounded-lg px-3 text-xs text-rose-600 font-medium">Logout</button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto min-w-0 max-w-7xl">{children}</div>
      </main>
    </div>
  );
};
