import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  DollarSign, 
  X,
  TrendingUp,
  Tag
} from "lucide-react";
import type { IncomeRecord } from "../../types";
import { formatMoney, exportToExcel } from "./financeUtils";
import { PageHeader } from "../ui/PageHeader";
import { MetricCard } from "../ui/MetricCard";

interface IncomeModuleProps {
  incomeList: IncomeRecord[];
  currency: string;
  schoolName: string;
  onRefresh: () => void;
  showCreateModalDefault?: boolean;
}

const INCOME_CATEGORIES = [
  "Student Fees",
  "Admission Fees",
  "Exam Fees",
  "Transport Fees",
  "Library Fees",
  "Donations",
  "Grants",
  "Other Income"
];

export const IncomeModule: React.FC<IncomeModuleProps> = ({
  incomeList,
  currency,
  schoolName,
  onRefresh,
  showCreateModalDefault = false
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showModal, setShowModal] = useState(showCreateModalDefault);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    category: "Donations",
    description: "",
    amount: 100,
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank",
    reference: "",
    payer: "",
    notes: ""
  });

  const filteredIncome = incomeList.filter((inc) => {
    if (categoryFilter !== "All" && inc.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = inc.description?.toLowerCase().includes(q);
      const matchPayer = inc.payer?.toLowerCase().includes(q);
      const matchRef = inc.reference?.toLowerCase().includes(q);
      if (!matchDesc && !matchPayer && !matchRef) return false;
    }
    return true;
  });

  const totalIncome = filteredIncome.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ma hubtaa inaad tirtirto dakhligan? (Delete income)")) return;
    try {
      const res = await fetch(`/api/income/${id}`, { method: "DELETE" });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredIncome.map((inc) => ({
      "Income ID": inc.incomeId,
      Category: inc.category,
      Description: inc.description,
      Amount: inc.amount,
      Date: inc.date,
      "Payment Method": inc.paymentMethod,
      Payer: inc.payer,
      Reference: inc.reference,
      Notes: inc.notes
    }));
    exportToExcel(`Income_${schoolName.replace(/\s+/g, "_")}`, "Income", exportData);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dakhliga Kale / Other Income"
        subtitle="Diiwaanka dakhliga ka baxsan fiiga ardayda sida deeqaha (grants), tabarucaadka (donations), iyo adeegyada dugsiga."
        badge={`${incomeList.length} Records`}
        badgeVariant="emerald"
        breadcrumbs={[
          { label: "Maamulka" },
          { label: "Maaliyadda (Finance)" },
          { label: "Dakhliga Kale" }
        ]}
        primaryAction={{
          label: "Qor Dakhli (Add Income)",
          icon: Plus,
          onClick: () => setShowModal(true)
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          label="Wadarta Dakhliga Kale (Total Income)"
          value={formatMoney(totalIncome, currency)}
          subtitle="Wadarta dhammaan dakhliga soo xarooday"
          icon={TrendingUp}
          variant="emerald"
        />
        <MetricCard
          label="Tirada Diiwaannada (Records)"
          value={filteredIncome.length}
          subtitle="Dakhliyo gaar ah oo la diiwaangeliyey"
          icon={DollarSign}
          variant="info"
        />
      </div>

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Raadi dakhli, qofka bixiyey, ama tixraac..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#a3a3a3] px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="All">Dhammaan Qeybaha</option>
            {INCOME_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
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
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Qor Dakhli (Add Income)</span>
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0a0a] border border-[#ffffff08] rounded-sm text-xs">
        <span className="text-[#737373]">
          Diiwaanka Dakhliga: <strong className="text-[#e5e5e5] font-mono">{filteredIncome.length}</strong> xabbo
        </span>
        <span className="text-[#737373]">
          Wadarta Dakhliga: <strong className="text-emerald-400 font-mono text-sm ml-1">{formatMoney(totalIncome, currency)}</strong>
        </span>
      </div>

      {/* Income Table */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-[#ffffff10] text-[10px] uppercase font-bold tracking-widest text-[#737373]">
                <th className="px-5 py-3.5">ID #</th>
                <th className="px-5 py-3.5">Qaybta (Category)</th>
                <th className="px-5 py-3.5">Qeexidda (Description)</th>
                <th className="px-5 py-3.5">Bixiyaha (Payer)</th>
                <th className="px-5 py-3.5 text-right">Cadadka</th>
                <th className="px-5 py-3.5">Taariikh</th>
                <th className="px-5 py-3.5">Qaabka</th>
                <th className="px-5 py-3.5 text-right">Ficillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff08] text-xs">
              {filteredIncome.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-[#737373] uppercase tracking-wider text-[10px]">
                    Wax dakhli ah oo diiwaangashan ma jiraan.
                  </td>
                </tr>
              ) : (
                filteredIncome.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#ffffff02] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[#a3a3a3]">{inc.incomeId}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded-xs text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {inc.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#e5e5e5]">{inc.description}</td>
                    <td className="px-5 py-3.5 text-[#a3a3a3]">{inc.payer || "N/A"}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-400 text-right">
                      {formatMoney(inc.amount, currency)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[#737373]">{inc.date}</td>
                    <td className="px-5 py-3.5 text-[#a3a3a3]">{inc.paymentMethod}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(inc.id)}
                        className="p-1.5 rounded-sm bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 inline-block cursor-pointer"
                        title="Tirtir Dakhliga"
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

      {/* ADD INCOME MODAL */}
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
              Diiwaangeli Dakhli Cusub (Record Income)
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Qaybta Dakhliga *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-blue-500"
                  >
                    {INCOME_CATEGORIES.map((cat) => (
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
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-blue-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                  Qeexidda Dakhliga *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deeq laga helay Hay'adda Al-Khayr"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Qofka / Hay'adda Bixisay (Payer)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shariif Axmed"
                    value={form.payer}
                    onChange={(e) => setForm({ ...form, payer: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Qaabka Bixinta
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-blue-500"
                  >
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="EVC Plus">EVC Plus</option>
                    <option value="Zaad">Zaad</option>
                    <option value="Sahal">Sahal</option>
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
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Tixraac / Tx ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BNK-2026-081"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-blue-500"
                  />
                </div>
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
                  className="px-5 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase font-bold tracking-wider disabled:opacity-50"
                >
                  {submitting ? "Kaydinaya..." : "Save Income"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
