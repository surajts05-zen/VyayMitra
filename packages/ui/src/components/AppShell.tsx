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
  Sparkles,
  Search,
  Bell,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeVariant?: 'lime' | 'amber' | 'slate';
  category?: 'core' | 'finance' | 'admin' | 'docs';
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
  const [suiteMenuOpen, setSuiteMenuOpen] = useState(false);
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
    // Core Workflow
    { id: 'expenses', label: 'My Expenses', icon: <Receipt className="w-4 h-4" />, category: 'core', href: '/expenses' },
    { id: 'reports', label: 'My Reports', icon: <FileText className="w-4 h-4" />, category: 'core', href: '/reports' },
    { id: 'approvals', label: 'Approvals', icon: <CheckSquare className="w-4 h-4" />, category: 'core', badge: 'Review', badgeVariant: 'lime', href: '/approvals' },
    
    // Finance & Operations
    { id: 'finance', label: 'Finance Review', icon: <Landmark className="w-4 h-4" />, category: 'finance', href: '/finance' },
    { id: 'reimbursements', label: 'Reimbursements', icon: <Landmark className="w-4 h-4" />, category: 'finance', href: '/reimbursements' },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" />, category: 'finance', href: '/analytics' },

    // Configuration
    { id: 'integrations', label: 'Integrations', icon: <Layers className="w-4 h-4" />, category: 'admin', href: '/integrations' },
    { id: 'developer', label: 'Developer API', icon: <Code2 className="w-4 h-4" />, category: 'admin', href: '/developer' },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, category: 'admin', href: '/settings' },
    ...(isPlatformAdmin
      ? [{ id: 'platform', label: 'Platform Admin', icon: <ShieldAlert className="w-4 h-4 text-amber-400" />, badge: 'Ops', badgeVariant: 'amber' as const, category: 'admin' as const, href: '/platform-admin' }]
      : []),

    // Documentation & Guides
    { id: 'user-guide', label: 'User Guide', icon: <HelpCircle className="w-4 h-4" />, category: 'docs', href: '/user-guide' },
    ...(canViewAdminGuide
      ? [{ id: 'guide', label: 'Admin Guide', icon: <BookOpen className="w-4 h-4 text-[#A8E600]" />, badge: 'Admin', badgeVariant: 'lime' as const, category: 'docs' as const, href: '/admin-guide' }]
      : []),
  ];

  // Helper to extract user initials for avatar
  const userInitials = (userEmail || 'U')
    .split('@')[0]
    .split('.')
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  // Page title resolution from path
  const currentTitle = navItems.find((n) => currentPath.startsWith(n.href))?.label || 'Dashboard';

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-background text-foreground flex flex-col md:flex-row font-sans antialiased">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-50 -translate-y-20 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>

      {/* ── DESKTOP SIDEBAR (KaaryaMitra Signature Dark Forest) ── */}
      <aside
        aria-label="Application sidebar"
        className="hidden md:flex flex-col w-64 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border select-none min-h-screen sticky top-0"
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-sidebar-border flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center space-x-2.5 text-left group focus-ring rounded-lg p-1"
          >
            <img
              src="/VyayMitra%20Logo%20full%20white.png"
              alt="VyayMitra"
              className="h-8 max-w-[160px] object-contain group-hover:opacity-90 transition-opacity"
            />
          </button>
        </div>

        {/* Product Suite Switcher Pill */}
        <div className="px-3 pt-3 pb-2 border-b border-sidebar-border/60">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSuiteMenuOpen(!suiteMenuOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent border border-sidebar-border/80 text-left transition-colors text-xs"
            >
              <div className="flex items-center space-x-2 truncate">
                <span className="w-2 h-2 rounded-full bg-km-lime animate-pulse shrink-0" />
                <span className="text-[11px] font-medium text-sidebar-foreground/90 truncate">
                  Mitra Product Suite
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground/60 shrink-0" />
            </button>

            {suiteMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-full rounded-xl bg-[#0D261E] border border-sidebar-border shadow-float z-30 p-1.5 text-xs space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-muted">
                  Companion Suite
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>VyayMitra</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-km-lime text-km-dark">
                        Active
                      </span>
                    </div>
                    <p className="text-[10px] text-sidebar-muted">Expense & Reimbursements</p>
                  </div>
                </div>

                <div className="p-2 rounded-lg hover:bg-white/5 text-sidebar-foreground/80 flex items-center justify-between opacity-80 cursor-default">
                  <div>
                    <div className="font-medium text-white">KaaryaMitra</div>
                    <p className="text-[10px] text-sidebar-muted">HRM & People Operations</p>
                  </div>
                  <span className="text-[10px] text-km-lime">Suite Partner</span>
                </div>

                <div className="p-2 rounded-lg hover:bg-white/5 text-sidebar-foreground/80 flex items-center justify-between opacity-80 cursor-default">
                  <div>
                    <div className="font-medium text-white">PraveshMitra</div>
                    <p className="text-[10px] text-sidebar-muted">Attendance & Access</p>
                  </div>
                  <span className="text-[10px] text-km-lime">Suite Partner</span>
                </div>
              </div>
            )}
          </div>

          {/* Tenant Identity context */}
          <div className="mt-2 flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-black/20 text-xs">
            {tenantLogoUrl ? (
              <img src={tenantLogoUrl} alt={tenantName} className="w-4 h-4 rounded object-cover" />
            ) : (
              <Building2 className="w-3.5 h-3.5 text-km-lime shrink-0" />
            )}
            <span className="font-medium truncate text-sidebar-foreground/90 text-[11px]">{tenantName}</span>
          </div>
        </div>

        {/* Navigation Links with Category Headers */}
        <nav aria-label="Primary navigation" className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {/* Section: Overview */}
          <div>
            <button
              type="button"
              onClick={() => onNavigate('/dashboard')}
              aria-current={currentPath === '/dashboard' || currentPath === '/' ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-smooth ${
                currentPath === '/dashboard' || currentPath === '/'
                  ? 'bg-sidebar-accent text-white font-semibold shadow-sm ring-1 ring-km-lime/30'
                  : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BarChart3 className="w-4 h-4 text-km-lime" />
                <span>Dashboard Overview</span>
              </div>
              {(currentPath === '/dashboard' || currentPath === '/') && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          </div>

          {/* Section: Expenses & Approvals */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-muted/70">
              Expense Operations
            </div>
            {navItems
              .filter((item) => item.category === 'core')
              .map((item) => {
                const active = currentPath.startsWith(item.href);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => onNavigate(item.href)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-smooth ${
                      active
                        ? 'bg-sidebar-accent text-white font-semibold shadow-sm ring-1 ring-emerald-500/20'
                        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={active ? 'text-emerald-400' : 'text-sidebar-muted'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                          item.badgeVariant === 'lime'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Section: Finance & Reimbursements */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-muted/70">
              Finance & Settlements
            </div>
            {navItems
              .filter((item) => item.category === 'finance')
              .map((item) => {
                const active = currentPath.startsWith(item.href);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => onNavigate(item.href)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-smooth ${
                      active
                        ? 'bg-sidebar-accent text-white font-semibold shadow-sm ring-1 ring-km-lime/30'
                        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={active ? 'text-km-lime' : 'text-sidebar-muted'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Section: Administration & Integrations */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-muted/70">
              Settings & Platform
            </div>
            {navItems
              .filter((item) => item.category === 'admin')
              .map((item) => {
                const active = currentPath.startsWith(item.href);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => onNavigate(item.href)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-smooth ${
                      active
                        ? 'bg-sidebar-accent text-white font-semibold shadow-sm ring-1 ring-km-lime/30'
                        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={active ? 'text-km-lime' : 'text-sidebar-muted'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-amber-950">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Section: Documentation & Help */}
          <div className="space-y-1 pt-2 border-t border-sidebar-border/40">
            {navItems
              .filter((item) => item.category === 'docs')
              .map((item) => {
                const active = currentPath.startsWith(item.href);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => onNavigate(item.href)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-smooth ${
                      active
                        ? 'bg-sidebar-accent text-white font-semibold shadow-sm ring-1 ring-km-lime/30'
                        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={active ? 'text-km-lime' : 'text-sidebar-muted'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-km-lime text-km-dark">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </nav>

        {/* Sidebar Footer: User Profile & Quick Actions */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center justify-between p-2 rounded-xl bg-sidebar-accent/40 border border-sidebar-border/50">
            <div className="flex items-center space-x-2.5 truncate mr-2">
              <div className="w-8 h-8 rounded-lg bg-km-forest text-km-lime ring-1 ring-km-lime/40 flex items-center justify-center font-bold text-xs shrink-0">
                {userInitials}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{userEmail.split('@')[0]}</p>
                <p className="text-[10px] text-sidebar-muted uppercase tracking-wider truncate">
                  {userRole.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 shrink-0">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-1.5 rounded-lg text-sidebar-muted hover:text-white hover:bg-white/10 transition-colors"
                title="Toggle Theme"
                aria-label={`Switch to ${darkMode ? 'light' : 'dark'} theme`}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                title="Log Out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MOBILE HEADER (Dark Forest) ── */}
      <header className="md:hidden flex items-center justify-between min-h-14 px-4 bg-sidebar text-sidebar-foreground border-b border-sidebar-border sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <img
            src="/VyayMitra%20Logo%20full%20white.png"
            alt="VyayMitra"
            className="h-7 object-contain"
          />
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent"
          aria-label="Open menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="md:hidden bg-sidebar text-sidebar-foreground border-b border-sidebar-border px-4 py-3 space-y-1.5 z-40 fixed inset-x-0 top-14 max-h-[85vh] overflow-y-auto"
        >
          <div className="pb-2 mb-2 border-b border-sidebar-border/60">
            <span className="text-xs text-km-lime font-semibold">{tenantName}</span>
          </div>
          {navItems.map((item, index) => (
            <button
              type="button"
              key={item.id}
              ref={index === 0 ? firstMobileLink : undefined}
              onClick={() => {
                onNavigate(item.href);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-sidebar-foreground/90 hover:bg-sidebar-accent"
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-km-lime text-km-dark">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <div className="pt-3 mt-3 border-t border-sidebar-border/60 flex items-center justify-between text-xs text-sidebar-muted">
            <span>{userEmail}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="px-2 py-1 rounded bg-sidebar-accent text-white"
              >
                {darkMode ? 'Light' : 'Dark'}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="px-2 py-1 rounded bg-rose-950/60 text-rose-300"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <div className="min-w-0 flex-1 flex flex-col min-h-screen">
        {/* Top Context Navigation Bar */}
        <header className="hidden md:flex items-center justify-between h-14 px-8 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-medium text-muted-foreground">VyayMitra</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-xs font-semibold text-foreground">{currentTitle}</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Production Sync Active</span>
            </div>

            <div className="h-4 w-px bg-border" />

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => onNavigate('/user-guide')}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Product Guide"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mx-auto min-w-0 max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
};
