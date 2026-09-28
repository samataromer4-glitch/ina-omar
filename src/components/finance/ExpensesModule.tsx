import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  X,
  CreditCard,
  Building2,
  Calendar
} from "lucide-react";
import type { ExpenseRecord } from "../../types";
import { formatMoney, exportToExcel } from "./financeUtils";
import { PageHeader } from "../ui/PageHeader";
import { MetricCard } from "../ui/MetricCard";

interface ExpensesModuleProps {
  expenses?: ExpenseRecord[];
  currency: string;
  schoolName: string;
  onRefresh: () => void;
  showCreateModalDefault?: boolean;
}

const EXPENSE_CATEGORIES = [
  "Salaries",
  "Rent",
  "Electricity",
  "Water",
  "Internet",
  "Office Supplies",
  "Books",
  "Transportation",
  "Maintenance",
  "Equipment",
  "Cleaning",
  "Security",
  "Marketing",
  "Events",
  "Other"
];

export const ExpensesModule: React.FC<ExpensesModuleProps> = ({
  expenses = [],
  currency,
  schoolName,
  onRefresh,
  showCreateModalDefault = false
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(showCreateModalDefault);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    category: "Office Supplies",
    description: "",
    amount: 50,
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash",
    vendorPayee: "",
    referenceNumber: "",
    notes: "",
    status: "Paid"
  });

  const filteredExpenses = expenses.filter((exp) => {
    if (categoryFilter !== "All" && exp.category !== categoryFilter) return false;
    if (statusFilter !== "All" && exp.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = exp.description?.toLowerCase().includes(q);
      const matchVendor = exp.vendorPayee?.toLowerCase().includes(q);
      const matchId = exp.expenseId?.toLowerCase().includes(q);
      if (!matchDesc && !matchVendor && !matchId) return false;
    }
    return true;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const openAddModal = () => {
    setEditingExpense(null);
    setForm({
      category: "Office Supplies",
      description: "",
      amount: 50,
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "Cash",
      vendorPayee: "",
      referenceNumber: "",
      notes: "",
      status: "Paid"
    });
    setShowModal(true);
  };

  const openEditModal = (exp: ExpenseRecord) => {
    setEditingExpense(exp);
    setForm({
      category: exp.category,
      description: exp.description,
      amount: exp.amount,
      date: exp.date,
      paymentMethod: exp.paymentMethod,
      vendorPayee: exp.vendorPayee || "",
      referenceNumber: exp.referenceNumber || "",
      notes: exp.notes || "",
      status: exp.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingExpense) {
        await fetch(`/api/expenses/${editingExpense.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
      } else {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
      }
      setShowModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}/approve`, { method: "POST" });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ma hubtaa inaad tirtirto kharashkan? (Delete expense)")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredExpenses.map((exp) => ({
      "Expense ID": exp.expenseId,
      Category: exp.category,
      Description: exp.description,
      Amount: exp.amount,
      Date: exp.date,
      "Payment Method": exp.paymentMethod,
      Vendor: exp.vendorPayee,
      Reference: exp.referenceNumber,
      Status: exp.status,
      Notes: exp.notes
    }));
    exportToExcel(`Expenses_${schoolName.replace(/\s+/g, "_")}`, "Expenses", exportData);
  };

  const totalExpensesAmount = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const paidExpensesAmount = expenses.filter(e => e.status === 'Paid').reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const pendingCount = expenses.filter(e => e.status !== 'Paid').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Kharashaadka Guud / Expense Management"
        subtitle="Diiwaanka lacag bixinta adeegyada guud, mushahaadka hawlwadeennada, agabka, iyo dayactirka dugsiga."
        badge={`${expenses.length} Records`}
        badgeVariant="rose"
        breadcrumbs={[
          { label: "Maamulka" },
          { label: "Maaliyadda (Finance)" },
          { label: "Kharashaadka" }
        ]}
        primaryAction={{
          label: "Qor Kharash Cusub (Add Expense)",
          icon: Plus,
          onClick: () => {
            setEditingExpense(null);
            setShowModal(true);
          }
        }}
        secondaryActions={[
          {
            label: "Dhoofi Excel",
            icon: Download,
            onClick: handleExportExcel
          }
        ]}
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Wadarta Kharashaadka (Total Expenses)"
          value={formatMoney(totalExpensesAmount, currency)}
          subtitle={`${expenses.length} kharash ayaa diiwaangashan`}
          icon={CreditCard}
          variant="rose"
        />
        <MetricCard
          label="Kharashka La Bixiyey (Paid)"
          value={formatMoney(paidExpensesAmount, currency)}
          subtitle="Kharashyo si buuxda loo bixiyey"
          icon={CheckCircle2}
          variant="emerald"
        />
        <MetricCard
          label="Kuwo Qabyo Ah / Dhiman"
          value={pendingCount}
          subtitle="Kharashyo u baahan ansixin ama bixin"
          icon={Building2}
          variant="amber"
        />
      </div>

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Raadi kharash, bixiye, ama faahfaahin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-rose-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#a3a3a3] px-3 py-2 focus:outline-none focus:border-rose-500"
          >
            <option value="All">Dhammaan Qeybaha</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#a3a3a3] px-3 py-2 focus:outline-none focus:border-rose-500"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Approved">Approved</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0f0f0f] hover:bg-[#ffffff05] text-[#a3a3a3] hover:text-[#e5e5e5] text-[10px] uppercase font-bold tracking-wider cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-rose-500 hover:bg-rose-400 text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Qor Kharash (New Expense)</span>
          </button>
        </div>
      </div>

      {/* Summary Band */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0a0a] border border-[#ffffff08] rounded-sm text-xs">
        <span className="text-[#737373]">
          Wadarta Kharashaadka Muuqda: <strong className="text-[#e5e5e5] font-mono">{filteredExpenses.length}</strong> xabbo
        </span>
        <span className="text-[#737373]">
          Wadarta Guud: <strong className="text-rose-400 font-mono text-sm ml-1">{formatMoney(totalFilteredAmount, currency)}</strong>
        </span>
      </div>

      {/* Expenses Table */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-[#ffffff10] text-[10px] uppercase font-bold tracking-widest text-[#737373]">
                <th className="px-5 py-3.5">ID #</th>
                <th className="px-5 py-3.5">Qaybta (Category)</th>
                <th className="px-5 py-3.5">Faahfaahinta (Description)</th>
                <th className="px-5 py-3.5">Bixiyaha / Vendor</th>
                <th className="px-5 py-3.5 text-right">Cadadka</th>
                <th className="px-5 py-3.5">Taariikh</th>
                <th className="px-5 py-3.5">Qaabka</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ficillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff08] text-xs">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[#737373] uppercase tracking-wider text-[10px]">
                    Wax kharashyo ah oo la helay ma jiraan.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#ffffff02] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[#a3a3a3] font-semibold">{exp.expenseId}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded-xs text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#e5e5e5] max-w-xs truncate">
                      {exp.description}
                    </td>
                    <td className="px-5 py-3.5 text-[#a3a3a3]">{exp.vendorPayee || "N/A"}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-rose-400 text-right">
                      {formatMoney(exp.amount, currency)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[#737373]">{exp.date}</td>
                    <td className="px-5 py-3.5 text-[#a3a3a3]">{exp.paymentMethod}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-xs text-[9px] font-bold uppercase tracking-wider ${
                          exp.status === "Paid"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : exp.status === "Approved"
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      {exp.status === "Draft" && (
                        <button
                          onClick={() => handleApprove(exp.id)}
                          className="p-1.5 rounded-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 inline-block cursor-pointer"
                          title="Ansixi (Approve)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(exp)}
                        className="p-1.5 rounded-sm bg-[#ffffff05] hover:bg-[#ffffff10] text-[#a3a3a3] hover:text-[#e5e5e5] border border-[#ffffff10] inline-block cursor-pointer"
                        title="Wax ka beddel"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 rounded-sm bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 inline-block cursor-pointer"
                        title="Tirtir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm w-full max-w-lg shadow-2xl p-6 relative">
            <button
              className="absolute right-4 top-4 p-1.5 rounded-sm text-[#737373] hover:bg-[#ffffff05]"
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold font-serif text-[#f5f5f5] mb-5">
              {editingExpense ? "Wax ka beddel Kharashka" : "Qor Kharash Cusub (Record Expense)"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Qaybta Kharashka (Category) *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-rose-500"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Cadadka ({currency}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-rose-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                  Faahfaahinta Kharashka (Description) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dayactirka kuraasta fasalka 2aad"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Shirkadda / Bixiyaha (Vendor/Payee)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hormuud / Najaax Store"
                    value={form.vendorPayee}
                    onChange={(e) => setForm({ ...form, vendorPayee: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Qaabka Bixinta (Payment Method)
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-rose-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="EVC Plus">EVC Plus</option>
                    <option value="Zaad">Zaad</option>
                    <option value="Sahal">Sahal</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Taariikhda *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Status *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-rose-500"
                  >
                    <option value="Paid">Paid (La Bixiyay)</option>
                    <option value="Approved">Approved (La Ansixiyay)</option>
                    <option value="Draft">Draft (Qabyo)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                  Tixraac / Lambarka Rasiidka
                </label>
                <input
                  type="text"
                  placeholder="e.g. REC-9921 ama EVC-482"
                  value={form.referenceNumber}
                  onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#737373] hover:text-[#e5e5e5] text-[10px] uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-sm bg-rose-500 hover:bg-rose-400 text-white text-[10px] uppercase font-bold tracking-wider disabled:opacity-50"
                >
                  {submitting ? "Kaydinaya..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
