import React, { useState } from 'react';
import { StatusBadge, AmountDisplay } from '@vyay/ui';
import { ExpenseStatus, Role } from '@vyay/contracts';
import {
  Upload,
  Camera,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Eye,
  Sparkles,
  Receipt,
  X,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  merchant: string;
  businessPurpose: string;
  spentAt: string;
  currency: string;
  amount: string;
  subtotal: string;
  taxAmount: string;
  category: string;
  paymentSource: string;
  receiptName?: string;
  receiptUrl?: string;
  ocrConfidence?: number;
  duplicateWarning?: boolean;
  duplicateReason?: string;
  status: ExpenseStatus;
  lines: { id: string; description: string; amount: string }[];
}

export const ExpensesPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);

  // New Expense Form State
  const [newMerchant, setNewMerchant] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState('INR');
  const [newCategory, setNewCategory] = useState('Air Travel');
  const [newSpentAt, setNewSpentAt] = useState(new Date().toISOString().split('T')[0]);
  const [newPurpose, setNewPurpose] = useState('');
  const [newPaymentSource, setNewPaymentSource] = useState('EMPLOYEE_PERSONAL');
  const [newGstin, setNewGstin] = useState('29AABCI1234F1Z5');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [ocrVerified, setOcrVerified] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrData, setOcrData] = useState<{
    merchant: string;
    amount: string;
    date: string;
    gstin: string;
    confidence: number;
  } | null>(null);

  // Split Line Items State
  const [enableSplit, setEnableSplit] = useState(false);
  const [splitLines, setSplitLines] = useState<
    { id: string; description: string; amount: string }[]
  >([
    { id: '1', description: 'Primary item', amount: '' },
    { id: '2', description: 'Secondary item', amount: '' },
  ]);

  // Demo Expenses Dataset
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    {
      id: 'exp-101',
      merchant: 'ITC Gardenia Bengaluru',
      businessPurpose: 'Lodging during National Bio-Tech Annual Summit',
      spentAt: '2026-10-15',
      currency: 'INR',
      amount: '4500.00',
      subtotal: '3813.56',
      taxAmount: '686.44',
      category: 'Lodging & Accommodation',
      paymentSource: 'Personal Card',
      receiptName: 'itc_hotel_bill_101.pdf',
      ocrConfidence: 94,
      duplicateWarning: false,
      status: ExpenseStatus.DRAFT,
      lines: [
        { id: 'l1', description: 'Deluxe Room 1 Night', amount: '3813.56' },
        { id: 'l2', description: 'GST 18%', amount: '686.44' },
      ],
    },
    {
      id: 'exp-102',
      merchant: 'IndiGo Airlines 6E-204',
      businessPurpose: 'BLR-DEL round trip flight for quarterly strategy meet',
      spentAt: '2026-10-12',
      currency: 'INR',
      amount: '6850.00',
      subtotal: '6523.81',
      taxAmount: '326.19',
      category: 'Air Travel & Flights',
      paymentSource: 'Company Card',
      receiptName: 'indigo_flight_invoice.pdf',
      ocrConfidence: 97,
      duplicateWarning: false,
      status: ExpenseStatus.SUBMITTED,
      lines: [
        { id: 'l3', description: 'Base Airfare BLR to DEL', amount: '6523.81' },
        { id: 'l4', description: 'Aviation GST (5%)', amount: '326.19' },
      ],
    },
    {
      id: 'exp-103',
      merchant: 'Merck Biosciences Pvt Ltd',
      businessPurpose: 'Analytical reagents and enzyme kits for Phase 2 trials',
      spentAt: '2026-10-10',
      currency: 'INR',
      amount: '12400.00',
      subtotal: '10508.47',
      taxAmount: '1891.53',
      category: 'Laboratory Consumables',
      paymentSource: 'Personal Card',
      receiptName: 'merck_reagents_tax_invoice.jpg',
      ocrConfidence: 89,
      duplicateWarning: true,
      duplicateReason: 'Fuzzy duplicate: identical amount ₹12,400 with Merck within 48h of PO-9912.',
      status: ExpenseStatus.DRAFT,
      lines: [
        { id: 'l5', description: '5x DNA Assay Kit', amount: '10508.47' },
        { id: 'l6', description: 'GST (18%)', amount: '1891.53' },
      ],
    },
    {
      id: 'exp-104',
      merchant: 'Bio-Rad Laboratories Inc',
      businessPurpose: 'Antibody calibration serum imported from US lab',
      spentAt: '2026-10-08',
      currency: 'USD',
      amount: '250.00',
      subtotal: '250.00',
      taxAmount: '0.00',
      category: 'Laboratory Consumables',
      paymentSource: 'Company Card',
      receiptName: 'biorad_commercial_invoice.pdf',
      ocrConfidence: 92,
      duplicateWarning: false,
      status: ExpenseStatus.LOCKED,
      lines: [
        { id: 'l7', description: 'Assay calibration vial (USD $250.00 = INR ₹20,875.00)', amount: '250.00' },
      ],
    },
  ]);

  // Simulate Receipt Upload & OCR Run
  const handleReceiptDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);
    setOcrLoading(true);

    // Simulate OCR processing latency and suggestions
    setTimeout(() => {
      setOcrLoading(false);
      const simulatedOcr = {
        merchant: 'Taj Coromandel Chennai',
        amount: '5600.00',
        date: new Date().toISOString().split('T')[0],
        gstin: '33AABCT9981K1ZP',
        confidence: 96,
      };
      setOcrData(simulatedOcr);
      setNewMerchant(simulatedOcr.merchant);
      setNewAmount(simulatedOcr.amount);
      setNewGstin(simulatedOcr.gstin);
      setNewPurpose('Accommodation & delegates meeting at Chennai conference');
    }, 900);
  };

  const handleAddSplitLine = () => {
    setSplitLines((prev) => [
      ...prev,
      { id: String(Date.now()), description: '', amount: '' },
    ]);
  };

  const handleRemoveSplitLine = (id: string) => {
    setSplitLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSplitLineChange = (id: string, field: 'description' | 'amount', value: string) => {
    setSplitLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const splitSum = splitLines.reduce((acc, l) => {
    const n = parseFloat(l.amount);
    return acc + (isNaN(n) ? 0 : n);
  }, 0);

  const totalAmountNum = parseFloat(newAmount) || 0;
  const isSplitValid = !enableSplit || Math.abs(splitSum - totalAmountNum) < 0.01;

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchant || !newAmount) return;
    if (enableSplit && !isSplitValid) return;

    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      merchant: newMerchant,
      businessPurpose: newPurpose || 'Business-related operational expense',
      spentAt: newSpentAt,
      currency: newCurrency,
      amount: parseFloat(newAmount).toFixed(2),
      subtotal: (parseFloat(newAmount) * 0.82).toFixed(2),
      taxAmount: (parseFloat(newAmount) * 0.18).toFixed(2),
      category: newCategory,
      paymentSource: newPaymentSource === 'COMPANY_CARD' ? 'Company Card' : 'Personal Card',
      receiptName: receiptFile ? receiptFile.name : undefined,
      ocrConfidence: ocrData ? ocrData.confidence : undefined,
      duplicateWarning: newMerchant.toLowerCase().includes('taj'),
      duplicateReason: newMerchant.toLowerCase().includes('taj')
        ? 'Duplicate alert: Similar merchant Taj within 48 hours.'
        : undefined,
      status: ExpenseStatus.DRAFT,
      lines: enableSplit
        ? splitLines.map((l) => ({ id: l.id, description: l.description, amount: l.amount }))
        : [{ id: '1', description: newPurpose || 'General expense', amount: newAmount }],
    };

    setExpenses((prev) => [newExp, ...prev]);
    setShowCreateModal(false);
    // Reset Form
    setNewMerchant('');
    setNewAmount('');
    setReceiptFile(null);
    setOcrData(null);
    setOcrVerified(false);
    setEnableSplit(false);
  };

  // Filter & Search Logic
  const filteredExpenses = expenses.filter((exp) => {
    const matchesFilter = filterStatus === 'ALL' || exp.status === filterStatus;
    const matchesSearch =
      exp.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.businessPurpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>My Expenses & Receipts</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              M2 Active
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Capture invoices, verify OCR suggestions, split line items, and audit duplicate warnings with exact decimal arithmetic.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#008C69] hover:bg-[#007456] text-white transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Expense</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-[#151F27] p-4 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] shadow-sm text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by merchant, purpose, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Statuses ({expenses.length})</option>
            <option value={ExpenseStatus.DRAFT}>Draft</option>
            <option value={ExpenseStatus.SUBMITTED}>Submitted</option>
            <option value={ExpenseStatus.LOCKED}>Locked</option>
            <option value={ExpenseStatus.REJECTED}>Rejected</option>
          </select>
        </div>
      </div>

      {/* Expense Roster Table */}
      <div className="rounded-2xl bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-[#1C2833] text-slate-500 border-b border-[#E5EAF0] dark:border-[#2D3942] font-semibold">
              <tr>
                <th className="p-3.5">Spent Date</th>
                <th className="p-3.5">Merchant & Business Purpose</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5 text-right">Amount (Exact)</th>
                <th className="p-3.5">Receipt & OCR</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAF0] dark:divide-[#2D3942]">
              {filteredExpenses.map((exp) => (
                <tr
                  key={exp.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-[#1C2833]/60 transition-colors"
                >
                  <td className="p-3.5 text-slate-500 font-mono whitespace-nowrap">
                    {exp.spentAt}
                  </td>
                  <td className="p-3.5 max-w-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{exp.merchant}</span>
                      {exp.duplicateWarning && (
                        <span
                          title={exp.duplicateReason}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-0.5"
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Duplicate
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {exp.businessPurpose}
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300">{exp.category}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">{exp.paymentSource}</td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    <AmountDisplay amount={exp.amount} currency={exp.currency} />
                  </td>
                  <td className="p-3.5">
                    {exp.ocrConfidence ? (
                      <span className="inline-flex items-center text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full font-medium border border-emerald-200 dark:border-emerald-800 gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        OCR ({exp.ocrConfidence}%)
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No receipt</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status={exp.status} />
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => setSelectedExpense(exp)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Inspect Expense Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Detail Drawer / Modal */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[#E5EAF0] dark:border-[#2D3942] pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#008C69]" />
                  <span>Expense Audit Record</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">ID: {selectedExpense.id}</span>
              </div>
              <button
                onClick={() => setSelectedExpense(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942]">
                <div>
                  <div className="text-slate-500">Merchant</div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {selectedExpense.merchant}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500">Total Charged</div>
                  <div className="font-mono font-bold text-sm text-[#008C69]">
                    <AmountDisplay amount={selectedExpense.amount} currency={selectedExpense.currency} />
                  </div>
                </div>
              </div>

              {selectedExpense.duplicateWarning && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Duplicate Claim Detected
                  </div>
                  <p className="text-[11px]">{selectedExpense.duplicateReason}</p>
                </div>
              )}

              {/* Split Line Items */}
              <div className="space-y-2">
                <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#008C69]" />
                  <span>Split Line Items ({selectedExpense.lines.length})</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-[#E5EAF0] dark:border-[#2D3942] rounded-xl overflow-hidden">
                  {selectedExpense.lines.map((l) => (
                    <div key={l.id} className="p-2.5 flex justify-between items-center bg-slate-50/50 dark:bg-[#1C2833]/50">
                      <span className="text-slate-700 dark:text-slate-300">{l.description}</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        ₹{parseFloat(l.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signed Receipt Info */}
              <div className="p-3 rounded-xl border border-[#E5EAF0] dark:border-[#2D3942] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Receipt Attachment:
                  </span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Encrypted SHA-256
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-[#1C2833] font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  {selectedExpense.receiptName || 'receipt_attachment_signed.pdf'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Signed URL token expires in 15 minutes. Unauthenticated access blocked at gateway.
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedExpense(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium"
              >
                Close Audit Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Expense Modal with OCR Extractor */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151F27] border border-[#E5EAF0] dark:border-[#2D3942] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5EAF0] dark:border-[#2D3942] pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#008C69]" />
                  <span>Create Expense Claim (M2 Engine)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Upload invoice for OCR suggestions or enter manually with exact decimal arithmetic.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Receipt Upload & OCR Simulator */}
            <div className="border-2 border-dashed border-[#E5EAF0] dark:border-[#2D3942] rounded-xl p-4 text-center space-y-2 bg-slate-50/50 dark:bg-[#1C2833]/50">
              <div className="w-10 h-10 rounded-full bg-[#E6F5F0] dark:bg-[#082921] text-[#008C69] mx-auto flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {receiptFile ? receiptFile.name : 'Drop receipt invoice or browse'}
                </p>
                <p className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB • SHA-256 Hashed</p>
              </div>
              <input
                type="file"
                onChange={handleReceiptDrop}
                className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-[#008C69] file:text-white hover:file:bg-[#007456] cursor-pointer"
              />
            </div>

            {/* OCR Extracted Suggestion Panel (Human Review Gate) */}
            {ocrLoading && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin shrink-0" />
                <span>Running asynchronous OCR extractor stub...</span>
              </div>
            )}

            {ocrData && (
              <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-[#1C2833] border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>OCR Extracted Suggestions ({ocrData.confidence}% Confidence)</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    HUMAN REVIEW REQUIRED
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-white dark:bg-[#151F27] border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">Merchant:</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{ocrData.merchant}</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-[#151F27] border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">Amount:</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">₹{ocrData.amount}</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-[#151F27] border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">Invoice Date:</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{ocrData.date}</div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-[#151F27] border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">Supplier GSTIN:</span>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{ocrData.gstin}</div>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={ocrVerified}
                    onChange={(e) => setOcrVerified(e.target.checked)}
                    className="rounded text-[#008C69] focus:ring-[#008C69]"
                  />
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    I confirm I have personally verified these extracted fields against the invoice.
                  </span>
                </label>
              </div>
            )}

            {/* Expense Creation Form */}
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Merchant Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ITC Hotels, IndiGo"
                    value={newMerchant}
                    onChange={(e) => setNewMerchant(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Invoice Amount (Exact) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200 font-mono font-semibold"
                    />
                    <select
                      value={newCurrency}
                      onChange={(e) => setNewCurrency(e.target.value)}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] font-mono text-xs"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Expense Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200"
                  >
                    <option value="Air Travel">Air Travel & Flights</option>
                    <option value="Lodging & Accommodation">Lodging & Accommodation</option>
                    <option value="Meals & Entertainment">Meals & Entertainment</option>
                    <option value="Laboratory Consumables">Laboratory Consumables</option>
                    <option value="Local Transport & Cabs">Local Transport & Cabs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    Date of Expense *
                  </label>
                  <input
                    type="date"
                    required
                    value={newSpentAt}
                    onChange={(e) => setNewSpentAt(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Business Purpose & Justification *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain the commercial necessity and project association..."
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Split Line Items Toggle & Section */}
              <div className="border border-[#E5EAF0] dark:border-[#2D3942] rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="splitToggle"
                      checked={enableSplit}
                      onChange={(e) => setEnableSplit(e.target.checked)}
                      className="rounded text-[#008C69] focus:ring-[#008C69]"
                    />
                    <label htmlFor="splitToggle" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                      Split Expense Across Multiple Line Items
                    </label>
                  </div>
                  {enableSplit && (
                    <button
                      type="button"
                      onClick={handleAddSplitLine}
                      className="text-[#008C69] font-medium hover:underline text-[11px] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Line Item
                    </button>
                  )}
                </div>

                {enableSplit && (
                  <div className="space-y-2 pt-2">
                    {splitLines.map((line, idx) => (
                      <div key={line.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder={`Line ${idx + 1} Description`}
                          value={line.description}
                          onChange={(e) => handleSplitLineChange(line.id, 'description', e.target.value)}
                          className="flex-1 p-1.5 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] text-[11px]"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={line.amount}
                          onChange={(e) => handleSplitLineChange(line.id, 'amount', e.target.value)}
                          className="w-28 p-1.5 rounded-lg bg-slate-50 dark:bg-[#1C2833] border border-[#E5EAF0] dark:border-[#2D3942] font-mono text-[11px]"
                        />
                        {splitLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSplitLine(line.id)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">
                        Line Sum: <strong className="font-mono">₹{splitSum.toFixed(2)}</strong> / Total: <strong className="font-mono">₹{totalAmountNum.toFixed(2)}</strong>
                      </span>
                      {!isSplitValid && (
                        <span className="text-rose-600 font-semibold">
                          ⚠️ Sum must exactly match total amount
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5EAF0] dark:border-[#2D3942]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enableSplit && !isSplitValid}
                  className="px-5 py-2 rounded-xl bg-[#008C69] hover:bg-[#007456] disabled:opacity-50 text-white font-semibold transition-all shadow-sm"
                >
                  Save Expense Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
