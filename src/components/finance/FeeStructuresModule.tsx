import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Layers, 
  X, 
  Download,
  CheckCircle2
} from "lucide-react";
import type { FeeStructure } from "../../types";
import { formatMoney, exportToExcel } from "./financeUtils";
import { PageHeader } from "../ui/PageHeader";
import { MetricCard } from "../ui/MetricCard";

interface FeeStructuresModuleProps {
  feeStructures?: FeeStructure[];
  classes?: any[];
  currency: string;
  schoolName: string;
  onRefresh: () => void;
}

const CATEGORIES = [
  "Monthly Tuition",
  "Term Fee",
  "Admission Fee",
  "Exam Fee",
  "Transport Fee",
  "Library Fee",
  "Uniform Fee",
  "Other Fee"
];

export const FeeStructuresModule: React.FC<FeeStructuresModuleProps> = ({
  feeStructures = [],
  classes = [],
  currency,
  schoolName,
  onRefresh
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "Lacagta Bishan",
    category: "Monthly Tuition",
    amount: 50,
    className: "All Classes",
    academicYear: "2026-2027",
    term: "All Terms",
    description: "Fiiga caadiga ah ee bishii"
  });

  const openAddModal = () => {
    setEditingFee(null);
    setForm({
      name: "Lacagta Bishan",
      category: "Monthly Tuition",
      amount: 50,
      className: "All Classes",
      academicYear: "2026-2027",
      term: "All Terms",
      description: "Fiiga caadiga ah ee bishii"
    });
    setShowModal(true);
  };

  const openEditModal = (fs: FeeStructure) => {
    setEditingFee(fs);
    setForm({
      name: fs.name,
      category: fs.category,
      amount: fs.amount,
      className: fs.className,
      academicYear: fs.academicYear,
      term: fs.term || "All Terms",
      description: fs.description || ""
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingFee) {
        await fetch(`/api/fee-structures/${editingFee.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
      } else {
        await fetch("/api/fee-structures", {
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
    if (!confirm("Ma hubtaa inaad tirtirto qaab-dhismeedkan fiiga?")) return;
    try {
      const res = await fetch(`/api/fee-structures/${id}`, { method: "DELETE" });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    const data = feeStructures.map((f) => ({
      Name: f.name,
      Category: f.category,
      Amount: f.amount,
      Class: f.className,
      "Academic Year": f.academicYear,
      Term: f.term,
      Description: f.description
    }));
    exportToExcel(`Fee_Structures_${schoolName.replace(/\s+/g, "_")}`, "FeeStructures", data);
  };

  const totalStructures = feeStructures.length;
  const avgFee = totalStructures > 0 ? feeStructures.reduce((acc, f) => acc + (Number(f.amount) || 0), 0) / totalStructures : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Qaab-dhismeedka Fiiga / Fee Structures"
        subtitle="Habee khidmadaha kala duwan ee fasallada, xilliyada waxbarashada, iyo sannad-dugsiyeedka rasmiga ah."
        badge={`${feeStructures.length} Structures`}
        badgeVariant="violet"
        breadcrumbs={[
          { label: "Maamulka" },
          { label: "Maaliyadda (Finance)" },
          { label: "Qaab-dhismeedka Fiiga" }
        ]}
        primaryAction={{
          label: "Kudar Fi Cusub (Add Fee)",
          icon: Plus,
          onClick: openAddModal
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
          label="Tirada Qaab-dhismeedyada"
          value={totalStructures}
          subtitle="Khidmadaha firfircoon ee dugsiga"
          icon={Layers}
          variant="violet"
        />
        <MetricCard
          label="Celceliska Fiiga (Average Fee)"
          value={formatMoney(avgFee, currency)}
          subtitle="Celceliska guud ee khidmadaha"
          icon={CheckCircle2}
          variant="emerald"
        />
        <MetricCard
          label="Fasallada Ku Xiran"
          value={classes.length}
          subtitle="Fasallada nidaamka ku jira"
          icon={Layers}
          variant="info"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feeStructures.map((fs) => (
          <div key={fs.id} className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#e5e5e5] block">{fs.name}</span>
                <span className="text-[9px] text-emerald-400 font-medium">{fs.category}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(fs)}
                  className="p-1 rounded-sm text-[#737373] hover:text-[#e5e5e5] hover:bg-[#ffffff05]"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDelete(fs.id)}
                  className="p-1 rounded-sm text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="text-2xl font-bold font-mono text-emerald-400">
              {formatMoney(fs.amount, currency)}
            </div>

            <div className="text-[10px] text-[#a3a3a3] space-y-1 pt-2 border-t border-[#ffffff08]">
              <div className="flex justify-between">
                <span>Fasalka:</span>
                <span className="text-[#e5e5e5] font-semibold">{fs.className}</span>
              </div>
              <div className="flex justify-between">
                <span>Sanad-dugsiyeedka:</span>
                <span className="text-[#e5e5e5]">{fs.academicYear}</span>
              </div>
              <div className="flex justify-between">
                <span>Xilliga (Term):</span>
                <span className="text-[#e5e5e5]">{fs.term}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

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
              {editingFee ? "Wax ka beddel Fiiga" : "Kudar Qaab-dhismeed Fi Cusub"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                  Magaca Fiiga (Fee Name) *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Nooca (Category) *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
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
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Fasalka *
                  </label>
                  <select
                    value={form.className}
                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-emerald-500"
                  >
                    <option value="All Classes">Dhammaan Fasallada (All)</option>
                    {(classes || []).map((c) => (
                      <option key={c.id} value={c.className}>{c.className}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Xilliga (Term)
                  </label>
                  <select
                    value={form.term}
                    onChange={(e) => setForm({ ...form, term: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-emerald-500"
                  >
                    <option value="All Terms">All Terms</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                  Sanad-Dugsiyeedka *
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
                  {submitting ? "Kaydinaya..." : "Save Structure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
