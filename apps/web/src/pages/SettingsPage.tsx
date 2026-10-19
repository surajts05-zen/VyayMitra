import React, { useState } from 'react';
import {
  Building2,
  Users,
  Network,
  Tag,
  ShieldCheck,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Archive,
  Database,
  Lock,
  Activity,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import { Role } from '@vyay/contracts';

interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  managerName?: string;
  employeeNumber: string;
  externalHrmId: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface CategoryItem {
  id: string;
  name: string;
  code: string;
  glAccountCode: string;
  defaultTaxRatePercent: number;
  receiptRequired: boolean;
  maxAmountLimit?: number;
}

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'directory' | 'hierarchy' | 'org' | 'categories' | 'invites' | 'retention'>('profile');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Retention (M7) State
  const [retentionPreviewLoading, setRetentionPreviewLoading] = useState(false);
  const [retentionPreviewData, setRetentionPreviewData] = useState<{
    cutoff: string;
    eligiblePayloads: number;
    previewToken: string;
    expiresAt: string;
    excluded: string[];
    executionEnabled: boolean;
  } | null>(null);
  const [retentionConfirmationInput, setRetentionConfirmationInput] = useState('');
  const [redactionExecuting, setRedactionExecuting] = useState(false);
  const [redactionFeedback, setRedactionFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // Invitation Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>(Role.EMPLOYEE);
  const [inviteName, setInviteName] = useState('');
  const [inviteFeedback, setInviteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Demo Employees
  const [employees, setEmployees] = useState<EmployeeItem[]>([
    {
      id: 'emp-1',
      name: 'Vikram Mehta',
      email: 'admin@horizonsci.in',
      role: Role.COMPANY_OWNER,
      department: 'Executive Office',
      employeeNumber: 'HS-0001',
      externalHrmId: 'KM-EXP-001',
      status: 'ACTIVE',
    },
    {
      id: 'emp-2',
      name: 'Anita Deshmukh',
      email: 'manager.anita@horizonsci.in',
      role: Role.MANAGER,
      department: 'Research & Development',
      managerName: 'Vikram Mehta',
      employeeNumber: 'HS-0012',
      externalHrmId: 'KM-EXP-012',
      status: 'ACTIVE',
    },
    {
      id: 'emp-3',
      name: 'Dr. Rahul Sharma',
      email: 'rahul.sharma@horizonsci.in',
      role: Role.EMPLOYEE,
      department: 'Research & Development',
      managerName: 'Anita Deshmukh',
      employeeNumber: 'HS-0045',
      externalHrmId: null,
      status: 'ACTIVE',
    },
    {
      id: 'emp-4',
      name: 'Sarah Jenkins',
      email: 'sarah.finance@horizonsci.in',
      role: Role.FINANCE_OPERATOR,
      department: 'Finance & Treasury',
      managerName: 'Vikram Mehta',
      employeeNumber: 'HS-0008',
      externalHrmId: 'KM-EXP-008',
      status: 'ACTIVE',
    },
    {
      id: 'emp-5',
      name: 'Priya Sundaram',
      email: 'priya.sundaram@horizonsci.in',
      role: Role.EMPLOYEE,
      department: 'Field Operations',
      managerName: 'Anita Deshmukh',
      employeeNumber: 'HS-0052',
      externalHrmId: null,
      status: 'ACTIVE',
    },
  ]);

  // Demo Categories with GL Mapping
  const [categories] = useState<CategoryItem[]>([
    {
      id: 'cat-1',
      name: 'Air Travel & Flights',
      code: 'AIR_TRAVEL',
      glAccountCode: '60100 - Travel & Conveyance',
      defaultTaxRatePercent: 18,
      receiptRequired: true,
      maxAmountLimit: 50000,
    },
    {
      id: 'cat-2',
      name: 'Lodging & Hotels',
      code: 'LODGING',
      glAccountCode: '60105 - Hotel & Accommodation',
      defaultTaxRatePercent: 12,
      receiptRequired: true,
      maxAmountLimit: 15000,
    },
    {
      id: 'cat-3',
      name: 'Meals & Entertainment',
      code: 'MEALS',
      glAccountCode: '60200 - Business Meals & Per Diem',
      defaultTaxRatePercent: 5,
      receiptRequired: false,
      maxAmountLimit: 3000,
    },
    {
      id: 'cat-4',
      name: 'Laboratory Consumables',
      code: 'LAB_SUPPLIES',
      glAccountCode: '50300 - R&D Direct Materials',
      defaultTaxRatePercent: 18,
      receiptRequired: true,
      maxAmountLimit: 100000,
    },
    {
      id: 'cat-5',
      name: 'Local Transport & Cabs',
      code: 'LOCAL_TRANSPORT',
      glAccountCode: '60110 - Local Taxi & Tolls',
      defaultTaxRatePercent: 5,
      receiptRequired: false,
      maxAmountLimit: 2500,
    },
  ]);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    if (inviteRole === Role.PLATFORM_SUPER_ADMIN) {
      setInviteFeedback({
        type: 'error',
        message: 'Security Violation: Platform Super Admin role cannot be provisioned to tenant accounts.',
      });
      return;
    }

    setInviteFeedback({
      type: 'success',
      message: `Invitation generated successfully for ${inviteEmail} as ${inviteRole}. Join link dispatched.`,
    });

    const newEmp: EmployeeItem = {
      id: `emp-inv-${Date.now()}`,
      name: inviteName || inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      department: 'Research & Development',
      employeeNumber: `HS-TEMP-${Math.floor(Math.random() * 900 + 100)}`,
      externalHrmId: null,
      status: 'ACTIVE',
    };

    setEmployees((prev) => [...prev, newEmp]);
    setInviteEmail('');
    setInviteName('');
    setTimeout(() => setInviteFeedback(null), 5000);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(searchEmployee.toLowerCase());
    const matchesDept = selectedDeptFilter === 'ALL' || emp.department === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Tenant Settings & Organization Suite</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              M1 Ready
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise multi-tenant identity, organizational hierarchy, GL chart-of-accounts mappings, and KaaryaMitra suite bridge.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-[#E5EAF0] dark:border-[#2D3942] gap-2 pb-px text-xs font-medium">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-[#008C69] text-[#008C69] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Company & Fiscal Profile
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'directory'
              ? 'border-[#008C69] text-[#008C69] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Employee Directory ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'hierarchy'
              ? 'border-[#008C69] text-[#008C69] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Network className="w-4 h-4" />
          Org Reporting Tree
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-[#008C69] text-[#008C69] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          Categories & GL Mappings
        </button>
        <button
          onClick={() => setActiveTab('invites')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'invites'
              ? 'border-[#008C69] text-[#008C69] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Access & Invitations
        </button>
        <button
          onClick={() => setActiveTab('retention')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'retention'
              ? 'border-[#008C69] text-[#008C69] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Data Retention & Compliance (M7)
        </button>
      </div>

      {/* Tab 1: Company Profile & Fiscal Settings */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E5EAF0] dark:border-[#2D3942] pb-3">
              <div className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-slate-100">
                <Building2 className="w-4 h-4 text-[#008C69]" />
                <span>Legal Entity & Tenant Branding</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                UUID: tnt-horizon-001
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C2833] border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src="/Blue%20Teal%20Gradient%20Wing%20Logo.png"
                  alt="Wing emblem"
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <span className="block text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                    VyayMitra Companion Brand Mark
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Dual-identity enabled for enterprise tenancy
                  </span>
                </div>
              </div>
              <div>
                <img
                  src="/VyayMitra%20Logo%20full.png"
                  alt="VyayMitra Logo"
                  className="h-6 w-auto object-contain block dark:hidden"
                />
                <img
                  src="/VyayMitra%20Logo%20full%20white.png"
                  alt="VyayMitra Logo White"
                  className="h-6 w-auto object-contain hidden dark:block"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Company Legal Name</label>
                <input
                  type="text"
                  disabled
                  value="Horizon Scientific India Private Limited"
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Base Currency</label>
                  <input
                    type="text"
                    disabled
                    value="INR (₹) Indian Rupee"
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Timezone</label>
                  <input
                    type="text"
                    disabled
                    value="Asia/Kolkata (UTC+5:30)"
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Fiscal Year Cycle</label>
                  <input
                    type="text"
                    disabled
                    value="April 1 - March 31 (Indian FY)"
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">GSTIN (Corporate)</label>
                  <input
                    type="text"
                    disabled
                    value="29AABCH9812K1Z9"
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-slate-100 border-b border-[#E5EAF0] dark:border-[#2D3942] pb-3">
              <Users className="w-4 h-4 text-[#008C69]" />
              <span>HRM Independence & Suite Architecture</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Standalone Mode (Primary)</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  INDEPENDENT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                VyayMitra operates 100% standalone with its own internal organizational hierarchy, approval flows, and employee directory. It does NOT require KaaryaMitra or PravesMitra to process claims.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-500 font-medium mb-1">KaaryaMitra Sync Endpoint (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://hrm.horizonsci.in/api/v1/sync/employees"
                    className="flex-1 p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200 font-mono text-xs"
                  />
                  <button className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ping
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Employee IDs are mapped via <code className="font-mono text-slate-600 dark:text-slate-400">external_hrm_id</code> without schema coupling.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Employee Directory */}
      {activeTab === 'directory' && (
        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-[#151F27] p-4 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942]">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, email, or employee #..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-500 font-medium">Department:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Departments</option>
                <option value="Research & Development">Research & Development</option>
                <option value="Finance & Treasury">Finance & Treasury</option>
                <option value="Field Operations">Field Operations</option>
                <option value="Executive Office">Executive Office</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27] shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#1C2833] border-b border-[#E5EAF0] dark:border-[#2D3942] text-slate-500 font-semibold">
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Emp Code</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Direct Manager</th>
                  <th className="p-3.5">KaaryaMitra ID</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0] dark:divide-[#2D3942]">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C2833]/50 transition-colors">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-slate-100">
                      <div>{emp.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{emp.email}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{emp.employeeNumber}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">{emp.department}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{emp.managerName || '— (Top-Level)'}</td>
                    <td className="p-3.5 font-mono text-[11px]">
                      {emp.externalHrmId ? (
                        <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {emp.externalHrmId}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Independent</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Organizational Reporting Tree */}
      {activeTab === 'hierarchy' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] space-y-6 shadow-sm text-xs">
          <div className="flex items-center justify-between border-b border-[#E5EAF0] dark:border-[#2D3942] pb-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Network className="w-4 h-4 text-[#008C69]" />
                <span>Approval Routing & Reporting Hierarchy</span>
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Claims submitted by reportees automatically route to their direct manager according to approval matrix limits.
              </p>
            </div>
            <span className="text-[11px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-medium border border-emerald-200 dark:border-emerald-800">
              Zero Circular Cycles Enforced
            </span>
          </div>

          <div className="space-y-4 max-w-xl mx-auto">
            {/* Level 0: Owner */}
            <div className="p-4 rounded-xl border-2 border-[#008C69] bg-emerald-50/20 dark:bg-[#1C2833] flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-[#008C69] text-white flex items-center justify-center font-bold text-xs">
                  VM
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">Vikram Mehta (Company Owner)</div>
                  <div className="text-[11px] text-slate-500">Executive Office • Final Finance Escalation</div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                Level 0
              </span>
            </div>

            {/* Tree Branch */}
            <div className="pl-6 border-l-2 border-dashed border-[#008C69]/40 space-y-4 ml-4">
              {/* Level 1: Manager */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2D3942] bg-white dark:bg-[#151F27] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    AD
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">Anita Deshmukh (Manager)</div>
                    <div className="text-[11px] text-slate-500">Lead, Research & Development • Approval Limit: ₹50,000</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Level 1</span>
              </div>

              {/* Sub-branch for Anita's Reportees */}
              <div className="pl-6 border-l-2 border-dashed border-blue-400/40 space-y-3 ml-4">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-[#2D3942] bg-slate-50 dark:bg-[#1C2833] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-900 dark:text-slate-100">Dr. Rahul Sharma</span>
                    <span className="text-slate-400 text-[11px]">(Senior Research Fellow)</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Routes to Anita</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-[#2D3942] bg-slate-50 dark:bg-[#1C2833] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-900 dark:text-slate-100">Priya Sundaram</span>
                    <span className="text-slate-400 text-[11px]">(Field Specialist)</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Routes to Anita</span>
                </div>
              </div>

              {/* Level 1: Finance Operator */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2D3942] bg-white dark:bg-[#151F27] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                    SJ
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">Sarah Jenkins (Finance Operator)</div>
                    <div className="text-[11px] text-slate-500">Finance & Treasury • Reimbursement Verification</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Level 1</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Expense Categories & GL Mappings */}
      {activeTab === 'categories' && (
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Chart of Accounts & Expense Codes</h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Every line item submitted in VyayMitra binds directly to a verified General Ledger account and tax rate.
              </p>
            </div>
            <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
              Zoho Books Compatible
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#E5EAF0] dark:border-[#2D3942] bg-white dark:bg-[#151F27] shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#1C2833] border-b border-[#E5EAF0] dark:border-[#2D3942] text-slate-500 font-semibold">
                  <th className="p-3.5">Category Name</th>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">General Ledger (GL) Account</th>
                  <th className="p-3.5">Default Tax Rate</th>
                  <th className="p-3.5">Receipt Required</th>
                  <th className="p-3.5">Auto-Approval Cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0] dark:divide-[#2D3942]">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1C2833]/50 transition-colors">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-slate-100">{cat.name}</td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{cat.code}</td>
                    <td className="p-3.5 font-mono text-slate-800 dark:text-slate-200">{cat.glAccountCode}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded font-mono font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {cat.defaultTaxRatePercent}% GST
                      </span>
                    </td>
                    <td className="p-3.5">
                      {cat.receiptRequired ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mandatory
                        </span>
                      ) : (
                        <span className="text-slate-400">Optional (&lt;₹1,000)</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                      ₹{cat.maxAmountLimit?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Team Access & Invitations */}
      {activeTab === 'invites' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="md:col-span-1 p-6 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] space-y-4 shadow-sm">
            <div className="border-b border-[#E5EAF0] dark:border-[#2D3942] pb-3">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#008C69]" />
                <span>Invite New Teammate</span>
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Generate an onboarding invite token with role-based guard rails.
              </p>
            </div>

            {inviteFeedback && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  inviteFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300'
                }`}
              >
                {inviteFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <span>{inviteFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Colleague Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@horizonsci.in"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Full Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Khanna"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Assigned Tenant Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value={Role.EMPLOYEE}>Employee (Submits Expenses)</option>
                  <option value={Role.MANAGER}>Manager (Level 1 Approver)</option>
                  <option value={Role.FINANCE_OPERATOR}>Finance Operator (Ledger & Payments)</option>
                  <option value={Role.FINANCE_ADMIN}>Finance Admin</option>
                  <option value={Role.AUDITOR}>Auditor (Read-Only Compliance)</option>
                  <option value={Role.COMPANY_ADMIN}>Company Admin</option>
                  <option value={Role.PLATFORM_SUPER_ADMIN} disabled>
                    Platform Super Admin (Restricted)
                  </option>
                </select>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Tenant Boundary Protection
                </div>
                <p>
                  Company Admins cannot invite Company Owners. Platform Super Admins cannot hold tenant memberships.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg bg-[#008C69] hover:bg-[#007355] text-white font-medium transition-colors shadow-sm"
              >
                Send Official Invitation
              </button>
            </form>
          </div>

          <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] space-y-4 shadow-sm">
            <div className="border-b border-[#E5EAF0] dark:border-[#2D3942] pb-3">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#008C69]" />
                <span>Multi-Tenant Role Permissions & Security Matrix</span>
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                VyayMitra enforces least-privilege security per tenant boundary.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2D3942] space-y-1">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  EMPLOYEE
                </div>
                <p className="text-slate-500">
                  Can create, edit draft expenses, upload receipt attachments, and submit claims for approval.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2D3942] space-y-1">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  MANAGER
                </div>
                <p className="text-slate-500">
                  Reviews claims from direct reportees in the organizational hierarchy. Can approve or reject with comments.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2D3942] space-y-1">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  FINANCE OPERATOR
                </div>
                <p className="text-slate-500">
                  Performs audit review, adjusts GL tax accounts, records payment disbursements, and triggers Zoho Books sync.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2D3942] space-y-1">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  COMPANY OWNER
                </div>
                <p className="text-slate-500">
                  Full administrative ownership of tenant settings, accounting credentials, approval rules, and billing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Data Retention & Compliance (M7) */}
      {activeTab === 'retention' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Data Retention, Privacy & Minimization Policy
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    M7 Hardened
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enforces strict data minimization under DPDP/GDPR. Unprocessed or reviewed OCR provider payloads are redacted after retention cutoff, while statutory audit trails and financial ledgers remain immutable.
                </p>
              </div>

              <button
                onClick={() => {
                  setRetentionPreviewLoading(true);
                  setTimeout(() => {
                    setRetentionPreviewData({
                      cutoff: new Date(Date.now() - 90 * 86_400_000).toISOString(),
                      eligiblePayloads: 3,
                      previewToken: `prev_${Math.random().toString(36).substring(2, 14)}`,
                      expiresAt: new Date(Date.now() + 15 * 60_000).toLocaleTimeString(),
                      excluded: [
                        'audit_events',
                        'approval_steps',
                        'approval_actions',
                        'expense_reports:finalized',
                        'reimbursements',
                        'reimbursement_payments',
                        'external_mappings',
                        'integration_jobs:remote_reference',
                      ],
                      executionEnabled: false, // production safe mode
                    });
                    setRetentionPreviewLoading(false);
                  }, 600);
                }}
                disabled={retentionPreviewLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#008C69] hover:bg-[#007456] text-white rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0"
              >
                {retentionPreviewLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Archive className="w-3.5 h-3.5" />
                )}
                Run Retention Preview Drill
              </button>
            </div>
          </div>

          {/* Retention Windows Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                OCR Payload Retention
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                90 Days
              </div>
              <p className="text-[10px] text-slate-400">
                Redacted after employee review and approval
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Outbox Job Payloads
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                30 Days
              </div>
              <p className="text-[10px] text-slate-400">
                Zoho Books queue messages post-settlement
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Webhook Event Logs
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                30 Days
              </div>
              <p className="text-[10px] text-slate-400">
                Delivery attempt headers & duration logs
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Execution Safeguard
              </span>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                Guarded
              </div>
              <p className="text-[10px] text-slate-400">
                Automated unattended deletion disabled
              </p>
            </div>
          </div>

          {/* Immutable Statutory Exclusions */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <FileCheck2 className="w-4 h-4 text-[#008C69]" />
              Immutable Financial & Audit Records (Exclusion Whitelist)
            </div>
            <p className="text-xs text-slate-500">
              In accordance with Indian tax regulations (7-year statutory retention), the following entities are cryptographically and logically protected from retention purge workflows:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 text-xs">
              {[
                { name: 'audit_events', desc: 'Immutable append-only action log' },
                { name: 'approval_steps & actions', desc: 'Manager approvals & timestamps' },
                { name: 'expense_reports:finalized', desc: 'Approved financial claims' },
                { name: 'reimbursements', desc: 'Bank payouts & partial settlement logs' },
                { name: 'reimbursement_payments', desc: 'Transaction reference numbers' },
                { name: 'external_mappings', desc: 'Zoho Books chart-of-accounts' },
                { name: 'integration_jobs:remote_ref', desc: 'External accounting ledger IDs' },
                { name: 'tax_profiles & GSTIN', desc: 'Tax compliance records' },
              ].map((item) => (
                <div
                  key={item.name}
                  className="p-3 rounded-xl border border-slate-200 dark:border-[#2D3942] bg-slate-50/50 dark:bg-slate-900/40 space-y-1"
                >
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-[11px] block truncate">
                    ✓ {item.name}
                  </span>
                  <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Retention Preview Drill Result */}
          {retentionPreviewData && (
            <div className="p-6 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#008C69]" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Retention Drill Preview Generated
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Preview Token Expires: {retentionPreviewData.expiresAt}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-[#151F27] border border-emerald-100 dark:border-emerald-900 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Cutoff Boundary</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-xs truncate">
                    {retentionPreviewData.cutoff}
                  </div>
                  <p className="text-[10px] text-slate-400">Claims submitted before this date</p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#151F27] border border-emerald-100 dark:border-emerald-900 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Eligible OCR Payloads</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                    {retentionPreviewData.eligiblePayloads} payloads
                  </div>
                  <p className="text-[10px] text-slate-400">Reviewed & ready for redaction</p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#151F27] border border-emerald-100 dark:border-emerald-900 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold">Preview Signature</span>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs truncate">
                    {retentionPreviewData.previewToken}
                  </div>
                  <p className="text-[10px] text-slate-400">HMAC-signed 15m session token</p>
                </div>
              </div>

              {/* Execution Safeguard Dialog */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#151F27] border border-slate-200 dark:border-[#2D3942] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Lock className="w-4 h-4 text-amber-500" />
                  Redaction Safeguard Challenge
                </div>
                <p className="text-xs text-slate-500">
                  To prevent unintended data loss, execution requires explicit input of the confirmation passphrase <code className="text-[#008C69] font-mono font-bold">REDACT_EXPIRED_OCR_PAYLOADS</code>.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Type REDACT_EXPIRED_OCR_PAYLOADS"
                    value={retentionConfirmationInput}
                    onChange={(e) => setRetentionConfirmationInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#008C69]"
                  />
                  <button
                    onClick={() => {
                      if (retentionConfirmationInput !== 'REDACT_EXPIRED_OCR_PAYLOADS') {
                        setRedactionFeedback({
                          type: 'error',
                          message: 'Passphrase does not match REDACT_EXPIRED_OCR_PAYLOADS',
                        });
                        return;
                      }
                      setRedactionExecuting(true);
                      setTimeout(() => {
                        setRedactionExecuting(false);
                        setRedactionFeedback({
                          type: 'warning',
                          message:
                            'Safe Mode Active: Retention execution is disabled by default in production configuration. Preview drill verified successfully.',
                        });
                      }, 500);
                    }}
                    disabled={redactionExecuting}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shrink-0 transition-all shadow-sm disabled:opacity-50"
                  >
                    {redactionExecuting ? 'Executing...' : 'Execute Redaction'}
                  </button>
                </div>

                {redactionFeedback && (
                  <div
                    className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                      redactionFeedback.type === 'error'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{redactionFeedback.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observability & Runtime Health Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Activity className="w-4 h-4 text-blue-500" />
              Runtime Hardening & Observability Health
            </div>
            <p className="text-xs text-slate-500">
              M7 health probes and privacy-bounded Prometheus telemetry:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2D3942] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Process Liveness</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <code className="text-[10px] text-[#008C69] font-mono block">GET /api/health/live</code>
                <p className="text-[10px] text-slate-400">Process running, returns 200 OK</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2D3942] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Dependency Readiness</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <code className="text-[10px] text-[#008C69] font-mono block">GET /api/health/ready</code>
                <p className="text-[10px] text-slate-400">PostgreSQL connected, 503 on fault</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#2D3942] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Prometheus Telemetry</span>
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                </div>
                <code className="text-[10px] text-purple-600 dark:text-purple-400 font-mono block">GET /internal/metrics</code>
                <p className="text-[10px] text-slate-400">Bearer token guarded, zero PII</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
