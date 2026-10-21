import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Building2,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Trash2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { api, UserSession, isSampleDataPurged, setSampleDataPurged } from '../lib/api';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('superadmin@vyaymitra.internal');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [cleanWorkspace, setCleanWorkspace] = useState(isSampleDataPurged());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registration fields
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCompany, setRegCompany] = useState('');

  // SSO Modals
  const [ssoModal, setSsoModal] = useState<'GOOGLE' | 'ZOHO' | null>(null);
  const [ssoEmail, setSsoEmail] = useState('');
  const [ssoOrgName, setSsoOrgName] = useState('Acme Technologies');
  const [ssoRegion, setSsoRegion] = useState('IN');

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      setSampleDataPurged(cleanWorkspace);
      const session = await api.login(email.trim(), password);
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      setSampleDataPurged(cleanWorkspace);
      const session = await api.register({
        email: regEmail.trim(),
        password: regPassword,
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        companyName: regCompany.trim() || undefined,
      });
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSso = async () => {
    setError(null);
    setLoading(true);
    try {
      setSampleDataPurged(cleanWorkspace);
      const googleEmail = ssoEmail.trim() || 'operator@google.com';
      const session = await api.loginGoogle(googleEmail, 'Google User');
      setSsoModal(null);
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Google SSO login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleZohoSso = async () => {
    setError(null);
    setLoading(true);
    try {
      setSampleDataPurged(cleanWorkspace);
      const zohoEmail = ssoEmail.trim() || 'finance@zoho-workspace.in';
      const session = await api.loginZoho(zohoEmail, ssoOrgName);
      setSsoModal(null);
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Zoho SSO login failed.');
    } finally {
      setLoading(false);
    }
  };

  const autofillAccount = (accountEmail: string, roleLabel: string) => {
    setEmail(accountEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-emerald-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-foreground selection:bg-emerald-500/30">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon & Heading */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-xl shadow-emerald-900/30">
          <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
            <Shield className="h-7 w-7 text-emerald-400" />
          </div>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white font-display">
          Vyay<span className="text-emerald-400">Mitra</span>
        </h1>
        <p className="mt-1 text-xs text-zinc-400 tracking-wide uppercase font-semibold">
          AI-Governed Enterprise Expense Management
        </p>
      </div>

      <div className="relative mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-lg bg-zinc-900/90 p-1 border border-zinc-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('LOGIN');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'LOGIN'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In to Account
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('REGISTER');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'REGISTER'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Register New Organization
            </button>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'LOGIN' ? (
            <form onSubmit={handleLocalLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Corporate Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="block w-full rounded-lg border border-zinc-700 bg-zinc-900/90 pl-10 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-medium text-zinc-300">
                    Password
                  </label>
                  <span className="text-[11px] text-zinc-500">Min 8 characters</span>
                </div>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="block w-full rounded-lg border border-zinc-700 bg-zinc-900/90 pl-10 pr-10 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Clean workspace toggle */}
              <div className="pt-1 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cleanWorkspace}
                    onChange={(e) => setCleanWorkspace(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                  />
                  <span className="text-xs text-zinc-300">
                    Start with <strong className="text-emerald-400">clean workspace</strong> (hide sample data)
                  </span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3 w-3 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                  />
                  <span className="text-[11px] text-zinc-400">Remember me</span>
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In with Local Credentials</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="Suresh"
                    className="block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="Iyer"
                    className="block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Company / Organization Name</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    placeholder="e.g. Zen BioPharma Ltd"
                    className="block w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-10 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="admin@zenbiopharma.in"
                  className="block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="block w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Create Empty Organization Workspace</span>}
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-950 px-3 text-zinc-500 font-semibold tracking-wider">
                Or Continue With Enterprise SSO
              </span>
            </div>
          </div>

          {/* SSO Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Google SSO Button */}
            <button
              type="button"
              onClick={() => {
                setSsoEmail('user@google.com');
                setSsoModal('GOOGLE');
              }}
              className="flex items-center justify-center gap-2.5 rounded-xl border border-zinc-700/80 bg-zinc-900/90 py-2.5 px-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600 transition-all shadow-sm group"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google SSO</span>
            </button>

            {/* Zoho SSO Button */}
            <button
              type="button"
              onClick={() => {
                setSsoEmail('finance@zoho-books.in');
                setSsoModal('ZOHO');
              }}
              className="flex items-center justify-center gap-2.5 rounded-xl border border-zinc-700/80 bg-zinc-900/90 py-2.5 px-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600 transition-all shadow-sm group"
            >
              {/* Zoho 4-color square emblem */}
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                <div className="bg-[#E42528] rounded-[2px]" />
                <div className="bg-[#26A65B] rounded-[2px]" />
                <div className="bg-[#2A7BB7] rounded-[2px]" />
                <div className="bg-[#F6AA00] rounded-[2px]" />
              </div>
              <span>Zoho SSO</span>
            </button>
          </div>

          {/* Quick-Autofill Credentials Pill Bar */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span>Quick-Fill Platform Credentials</span>
              </span>
              <button
                type="button"
                onClick={async () => {
                  await api.purgeSampleData();
                  setCleanWorkspace(true);
                  alert('Sample expenses and reports have been purged from your local workspace.');
                }}
                className="text-[11px] text-zinc-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                title="Purge mock sample expenses and reports"
              >
                <Trash2 className="h-3 w-3" />
                <span>Purge Sample Data</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* Platform Super Admin Pill */}
              <button
                type="button"
                onClick={() => autofillAccount('superadmin@vyaymitra.internal', 'PLATFORM_SUPER_ADMIN')}
                className="text-left p-2 rounded-lg bg-zinc-900 border border-emerald-900/40 hover:border-emerald-500/60 hover:bg-zinc-800/80 transition-all"
              >
                <div className="font-semibold text-emerald-300 flex items-center gap-1">
                  <span>🛡️ Platform Super Admin</span>
                </div>
                <div className="text-zinc-400 truncate">superadmin@vyaymitra.internal</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Password123!</div>
              </button>

              {/* Company Owner Pill */}
              <button
                type="button"
                onClick={() => autofillAccount('admin@horizonsci.in', 'COMPANY_OWNER')}
                className="text-left p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 transition-all"
              >
                <div className="font-semibold text-zinc-200">🏢 Company Owner</div>
                <div className="text-zinc-400 truncate">admin@horizonsci.in</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Password123!</div>
              </button>

              {/* Finance Operator Pill */}
              <button
                type="button"
                onClick={() => autofillAccount('sarah.finance@horizonsci.in', 'FINANCE_OPERATOR')}
                className="text-left p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 transition-all"
              >
                <div className="font-semibold text-zinc-200">💳 Finance Operator</div>
                <div className="text-zinc-400 truncate">sarah.finance@horizonsci.in</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Password123!</div>
              </button>

              {/* Employee Pill */}
              <button
                type="button"
                onClick={() => autofillAccount('rahul.sharma@horizonsci.in', 'EMPLOYEE')}
                className="text-left p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 transition-all"
              >
                <div className="font-semibold text-zinc-200">💼 Employee Claimer</div>
                <div className="text-zinc-400 truncate">rahul.sharma@horizonsci.in</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Password123!</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> AES-256 GCM Encrypted
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-emerald-500" /> Multi-Tenant Row-Level Isolation
          </span>
          <span>•</span>
          <span>SOC 2 & GST Compliant</span>
        </div>
      </div>

      {/* Google SSO Modal */}
      {ssoModal === 'GOOGLE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100 text-sm">Sign in with Google Workspace</h3>
                <p className="text-[11px] text-zinc-400">Google OAuth 2.0 Identity Provider</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Google Account Email</label>
                <input
                  type="email"
                  value={ssoEmail}
                  onChange={(e) => setSsoEmail(e.target.value)}
                  placeholder="name@company.com or name@gmail.com"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSsoModal(null)}
                  className="flex-1 rounded-lg border border-zinc-700 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGoogleSso}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  {loading ? 'Authenticating...' : 'Authorize & Sign In'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoho SSO Modal */}
      {ssoModal === 'ZOHO' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
              <div className="grid grid-cols-2 gap-1 w-8 h-8 p-1 rounded-lg bg-zinc-800 border border-zinc-700">
                <div className="bg-[#E42528] rounded-[2px]" />
                <div className="bg-[#26A65B] rounded-[2px]" />
                <div className="bg-[#2A7BB7] rounded-[2px]" />
                <div className="bg-[#F6AA00] rounded-[2px]" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100 text-sm">Sign in with Zoho One / Directory</h3>
                <p className="text-[11px] text-zinc-400">Zoho Accounts OAuth Provider</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Zoho User Email</label>
                <input
                  type="email"
                  value={ssoEmail}
                  onChange={(e) => setSsoEmail(e.target.value)}
                  placeholder="finance@zoho-books.in"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Zoho Data Center Region</label>
                <select
                  value={ssoRegion}
                  onChange={(e) => setSsoRegion(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="IN">India (accounts.zoho.in)</option>
                  <option value="US">United States (accounts.zoho.com)</option>
                  <option value="EU">European Union (accounts.zoho.eu)</option>
                  <option value="AU">Australia (accounts.zoho.com.au)</option>
                  <option value="JP">Japan (accounts.zoho.jp)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSsoModal(null)}
                  className="flex-1 rounded-lg border border-zinc-700 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleZohoSso}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  {loading ? 'Authenticating...' : 'Authorize & Sign In'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
