import React, { useState } from "react";
import { 
  Plus, 
  Download, 
  Trash2, 
  Edit2, 
  PieChart, 
  X, 
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import type { BudgetRecord } from "../../types";
import { formatMoney, exportToExcel } from "./financeUtils";

interface BudgetsModuleProps {
  budgets: BudgetRecord[];
  currency: string;
  schoolName: string;
  onRefresh: () => void;
}

const BUDGET_CATEGORIES = [
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
  "Student Fees",
  "Donations",
  "Other"
];

export const BudgetsModule: React.FC<BudgetsModuleProps> = ({
  budgets,
  currency,
  schoolName,
  onRefresh
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    academicYear: "2026-2027",
    period: "Annual",
    category: "Salaries",
    type: "Expense",
    plannedAmount: 1000,
    notes: ""
  });

  const openAddModal = () => {
    setEditingBudget(null);
    setForm({
      academicYear: "2026-2027",
      period: "Annual",
      category: "Salaries",
      type: "Expense",
      plannedAmount: 1000,
      notes: ""
    });
    setShowModal(true);
  };

  const openEditModal = (b: BudgetRecord) => {
    setEditingBudget(b);
    setForm({
      academicYear: b.academicYear,
      period: b.period,
      category: b.category,
      type: b.type,
      plannedAmount: b.plannedAmount,
      notes: b.notes || ""
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingBudget) {
        await fetch(`/api/budgets/${editingBudget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
      } else {
        await fetch("/api/budgets", {
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

  const handleDelete = async (id: string) => {
    if (!confirm("Ma hubtaa inaad tirtirto miisaaniyaddan?")) return;
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    const data = budgets.map((b) => ({
      Category: b.category,
      Type: b.type,
      "Academic Year": b.academicYear,
      Period: b.period,
      "Planned Amount": b.plannedAmount,
      "Actual Amount": b.actualAmount,
      "Remaining Amount": b.remainingAmount,
      "Variance %": b.variance ? `${b.variance}%` : "0%"
    }));
    exportToExcel(`Budgets_${schoolName.replace(/\s+/g, "_")}`, "Budgets", data);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#e5e5e5]">
            Maareynta Miisaaniyadda (Budget Management)
          </h2>
          <p className="text-[10px] text-[#737373]">
            Deji miisaaniyad sanadle ah ama bille ah, la soco inta ka baxday
          </p>
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-[#e5e5e5] hover:bg-white text-[#0a0a0a] text-[10px] uppercase font-bold tracking-wider cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Deji Miisaaniyad (Add Budget)</span>
          </button>
        </div>
      </div>

      {/* Budgets Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-[#737373] bg-[#0f0f0f] border border-[#ffffff10] rounded-sm">
            Wali wax miisaaniyado ah lama dejin. Guji "Deji Miisaaniyad" si aad u bilowdo.
          </div>
        ) : (
          budgets.map((b) => {
            const spentPct = b.plannedAmount > 0 ? Math.min(100, Math.round(((b.actualAmount || 0) / b.plannedAmount) * 100)) : 0;
            const isOver = (b.actualAmount || 0) > b.plannedAmount;

            return (
              <div key={b.id} className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#e5e5e5] block">{b.category}</span>
                    <span className="text-[9px] text-[#737373]">{b.academicYear} • {b.period}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1 rounded-sm text-[#737373] hover:text-[#e5e5e5] hover:bg-[#ffffff05]"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1 rounded-sm text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#737373]">La Isticmaalay:</span>
                    <span className={`font-mono font-bold ${isOver ? "text-rose-400" : "text-[#e5e5e5]"}`}>
                      {formatMoney(b.actualAmount || 0, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#737373]">Qorshaha (Planned):</span>
                    <span className="font-mono text-[#a3a3a3]">{formatMoney(b.plannedAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#737373]">Harsan (Remaining):</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatMoney(b.remainingAmount ?? (b.plannedAmount - (b.actualAmount || 0)), currency)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#ffffff08]">
                    <div
                      style={{ width: `${spentPct}%` }}
                      className={`h-full rounded-full ${isOver ? "bg-rose-500" : spentPct > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-[#737373]">
                    <span>Isticmaal: {spentPct}%</span>
                    {isOver ? (
                      <span className="text-rose-400 flex items-center gap-1 font-bold">
                        <AlertTriangle className="w-2.5 h-2.5" /> Dhaafsiisan
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Xakamaysan
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm w-full max-w-md shadow-2xl p-6 relative">
            <button
              className="absolute right-4 top-4 p-1.5 rounded-sm text-[#737373] hover:bg-[#ffffff05]"
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold font-serif text-[#f5f5f5] mb-5">
              {editingBudget ? "Wax ka beddel Miisaaniyadda" : "Deji Miisaaniyad Cusub"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Qaybta (Category) *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-emerald-500"
                  >
                    {BUDGET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Nooca (Type) *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Expense">Expense (Kharash)</option>
                    <option value="Income">Income (Dakhli)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Cadadka Qorshaysan ({currency}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.plannedAmount}
                    onChange={(e) => setForm({ ...form, plannedAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Muddada (Period) *
                  </label>
                  <select
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Annual">Annual (Sanadle)</option>
                    <option value="Monthly">Monthly (Bille)</option>
                    <option value="Term">Term (Xilliyeed)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                  Sanad-Dugsiyeedka (Academic Year) *
                </label>
                <input
                  type="text"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-emerald-500"
                  required
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
                  className="px-5 py-2 rounded-sm bg-[#e5e5e5] hover:bg-white text-[#0a0a0a] text-[10px] uppercase font-bold tracking-wider disabled:opacity-50"
                >
                  {submitting ? "Kaydinaya..." : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
