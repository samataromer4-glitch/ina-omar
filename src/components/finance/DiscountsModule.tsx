import React, { useState, useMemo } from "react";
import { 
  Percent, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  AlertCircle, 
  ShieldCheck, 
  DollarSign, 
  FileText,
  Calendar,
  UserCheck,
  Check
} from "lucide-react";
import type { Invoice, DiscountRecord } from "../../types";
import { formatMoney, exportToExcel } from "./financeUtils";
import { PageHeader } from "../ui/PageHeader";
import { MetricCard } from "../ui/MetricCard";

interface DiscountsModuleProps {
  discounts?: DiscountRecord[];
  invoices?: Invoice[];
  currency: string;
  schoolName: string;
  onRefresh: () => void;
}

export const DiscountsModule: React.FC<DiscountsModuleProps> = ({
  discounts = [],
  invoices = [],
  currency,
  schoolName,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [reason, setReason] = useState("Deeq Waxbarasho (Scholarship)");
  const [customReason, setCustomReason] = useState("");
  const [approvedBy, setApprovedBy] = useState("Maamulaha Dugsiga (Principal)");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Active eligible invoices (balance > 0)
  const eligibleInvoices = useMemo(() => {
    return (invoices || []).filter((i) => i.balance > 0 && i.status !== "Cancelled");
  }, [invoices]);

  const selectedInvoice = useMemo(() => {
    return eligibleInvoices.find((i) => i.id === selectedInvoiceId);
  }, [eligibleInvoices, selectedInvoiceId]);

  // Preview computation
  const preview = useMemo(() => {
    if (!selectedInvoice || !discountValue || Number(discountValue) <= 0) {
      return null;
    }
    const val = Number(discountValue);
    let calculatedAmount = 0;
    if (discountType === "percentage") {
      calculatedAmount = Math.round(((selectedInvoice.subtotal * val) / 100) * 100) / 100;
    } else {
      calculatedAmount = Math.round(val * 100) / 100;
    }

    const maxAllowed = Math.max(0, selectedInvoice.subtotal - (selectedInvoice.paidAmount || 0));
    const effectiveAmount = Math.min(calculatedAmount, maxAllowed);
    const newTotalDiscount = Math.round(((selectedInvoice.discount || 0) + effectiveAmount) * 100) / 100;
    const newTotal = Math.max(0, Math.round((selectedInvoice.subtotal - newTotalDiscount) * 100) / 100);
    const newBalance = Math.max(0, Math.round((newTotal - (selectedInvoice.paidAmount || 0)) * 100) / 100);

    return {
      calculatedAmount: effectiveAmount,
      isExcessive: calculatedAmount > maxAllowed,
      maxAllowed,
      newTotal,
      newBalance
    };
  }, [selectedInvoice, discountType, discountValue]);

  // Filtered discounts list
  const filteredDiscounts = useMemo(() => {
    return discounts.filter((d) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.studentName?.toLowerCase().includes(q) ||
        d.invoiceNumber?.toLowerCase().includes(q) ||
        d.reason?.toLowerCase().includes(q) ||
        d.approvedBy?.toLowerCase().includes(q)
      );
    });
  }, [discounts, searchQuery]);

  const totalDiscountGranted = useMemo(() => {
    return discounts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [discounts]);

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      setErrorMsg("Fadlan dooro biilka loo dhimayo (Please select an invoice)");
      return;
    }
    if (!discountValue || Number(discountValue) <= 0) {
      setErrorMsg("Fadlan geli qiimo sax ah (Valid discount value required)");
      return;
    }
    if (preview?.isExcessive) {
      setErrorMsg(`Qiimo dhimistu kama badnaan karto baaqiga dhiman ee biilka ($${preview.maxAllowed})`);
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const finalReason = reason === "Other" ? customReason : reason;

    try {
      const res = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          discountType,
          value: Number(discountValue),
          reason: finalReason,
          approvedBy,
          date,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to apply discount");
      }

      setIsApplyModalOpen(false);
      setSelectedInvoiceId("");
      setDiscountValue("");
      setNotes("");
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Khalad ayaa dhacay inta lagu guda jiray dhimista");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!window.confirm("Ma hubtaa inaad ka noqonayso qiimo dhimistan? Biilka asalka ah baaqigiisu dib ayuu u kordhayaa.")) {
      return;
    }

    try {
      const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to reverse discount");
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Error reversing discount");
    }
  };

  const handleExportExcel = () => {
    const data = filteredDiscounts.map((d) => ({
      "Invoice Number": d.invoiceNumber,
      "Student Name": d.studentName,
      Class: d.className,
      "Discount Type": d.discountType,
      "Discount Value": d.value,
      "Amount Deducted": d.amount,
      Reason: d.reason,
      "Approved By": d.approvedBy,
      Date: d.date,
      Notes: d.notes || ""
    }));
    exportToExcel(`Discounts_Waivers_${schoolName.replace(/\s+/g, "_")}`, "Discounts", data);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Qiimo-Dhimista & Deeqaha / Discounts & Waivers"
        subtitle="Maamulka dhimisyada gaarka ah, deeqaha waxbarashada (scholarships), iyo cafinta fiiga baaqiga ah ee ardayda."
        badge={`${discounts.length} Grants`}
        badgeVariant="violet"
        breadcrumbs={[
          { label: "Maamulka" },
          { label: "Maaliyadda (Finance)" },
          { label: "Qiimo-Dhimista" }
        ]}
        primaryAction={{
          label: "Bixi Dhimis Cusub (Apply)",
          icon: Plus,
          onClick: () => setIsApplyModalOpen(true)
        }}
        secondaryActions={[
          {
            label: "Dhoofi Excel",
            icon: Download,
            onClick: handleExportExcel
          }
        ]}
      />

      {/* Top summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Wadarta Qiimo-Dhimista (Total Discounts)"
          value={formatMoney(totalDiscountGranted, currency)}
          subtitle="Wadarta lacagta laga dhimay ardayda"
          icon={Percent}
          variant="violet"
        />
        <MetricCard
          label="Tirada Dhimisyada (Records Count)"
          value={discounts.length}
          subtitle="Dhimisyo rasmi ah oo la ansixiyey"
          icon={ShieldCheck}
          variant="info"
        />
        <MetricCard
          label="Biilasha U Qalmi Kara (Eligible)"
          value={eligibleInvoices.length}
          subtitle="Biilasha baaqi leh ee dhimis qaadan kara"
          icon={FileText}
          variant="emerald"
        />
      </div>

      {/* Action and Search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Raadi dhimis, arday, sabab, ama biil #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] hover:bg-[#ffffff05] text-[#a3a3a3] hover:text-[#e5e5e5] text-[10px] uppercase font-bold tracking-wider cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-purple-600 hover:bg-purple-500 text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Bixi Qiimo-Dhimis (Apply Discount)</span>
          </button>
        </div>
      </div>

      {/* Discounts Table */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-[#ffffff10] text-[10px] uppercase font-bold tracking-widest text-[#737373]">
                <th className="px-5 py-3.5">Biilka #</th>
                <th className="px-5 py-3.5">Ardayga (Student)</th>
                <th className="px-5 py-3.5">Fasalka</th>
                <th className="px-5 py-3.5">Nooca (Type)</th>
                <th className="px-5 py-3.5 text-right text-purple-400">Cadadka Laga Dhimay</th>
                <th className="px-5 py-3.5">Sababta (Reason)</th>
                <th className="px-5 py-3.5">Ansixiyaha</th>
                <th className="px-5 py-3.5">Taariikhda</th>
                <th className="px-5 py-3.5 text-right">Ka Noqosho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff08] text-xs">
              {filteredDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[#737373] uppercase tracking-wider text-[10px]">
                    Weli ma jirto wax qiimo-dhimis ah oo la diiwaangeliyey.
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map((d) => (
                  <tr key={d.id} className="hover:bg-[#ffffff02] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[#a3a3a3]">{d.invoiceNumber}</td>
                    <td className="px-5 py-3.5 font-bold text-[#e5e5e5]">{d.studentName}</td>
                    <td className="px-5 py-3.5 text-[#a3a3a3]">{d.className}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-xs text-[9px] font-bold font-mono uppercase bg-[#ffffff05] border border-[#ffffff10] text-[#a3a3a3]">
                        {d.discountType === "percentage" ? `${d.value}% Off` : "Fixed Cash"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-purple-400 text-right">
                      {formatMoney(d.amount, currency)}
                    </td>
                    <td className="px-5 py-3.5 text-[#e5e5e5] max-w-[200px] truncate" title={d.reason}>
                      {d.reason}
                    </td>
                    <td className="px-5 py-3.5 text-[#a3a3a3]">{d.approvedBy}</td>
                    <td className="px-5 py-3.5 font-mono text-[#737373]">{d.date}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteDiscount(d.id)}
                        className="p-1.5 rounded-sm hover:bg-rose-500/20 text-[#737373] hover:text-rose-400 transition-colors cursor-pointer"
                        title="Ka noqo dhimistan"
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

      {/* Apply Discount Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#121212] border border-[#ffffff15] rounded-sm w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ffffff10] bg-[#171717]">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-[#e5e5e5] uppercase tracking-wider">
                  Bixi Qiimo-Dhimis Rasmi Ah (Controlled Discount)
                </h3>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-[#737373] hover:text-[#e5e5e5] text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleApplyDiscount} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-sm text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Invoice Selector */}
              <div>
                <label className="block text-[#a3a3a3] uppercase text-[10px] font-bold mb-1.5">
                  Dooro Biilka (Select Invoice) *
                </label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">-- Dooro Biil Baaqi Leh --</option>
                  {eligibleInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.studentName} ({inv.className}) — Baaqi: {formatMoney(inv.balance, currency)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="p-3 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-[#737373]">
                    <span>Wadarta Guud (Subtotal):</span>
                    <span className="text-[#e5e5e5]">{formatMoney(selectedInvoice.subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-[#737373]">
                    <span>Dhimista Hore:</span>
                    <span className="text-purple-400">{formatMoney(selectedInvoice.discount || 0, currency)}</span>
                  </div>
                  <div className="flex justify-between text-[#737373]">
                    <span>La Bixiyey:</span>
                    <span className="text-emerald-400">{formatMoney(selectedInvoice.paidAmount || 0, currency)}</span>
                  </div>
                  <div className="flex justify-between text-[#737373] border-t border-[#ffffff10] pt-1">
                    <span>Baaqiga Hadda:</span>
                    <span className="text-amber-400 font-bold">{formatMoney(selectedInvoice.balance, currency)}</span>
                  </div>
                </div>
              )}

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a3a3a3] uppercase text-[10px] font-bold mb-1.5">
                    Nooca Dhimista (Type)
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-purple-500"
                  >
                    <option value="fixed">Fixed Cash Amount ($)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#a3a3a3] uppercase text-[10px] font-bold mb-1.5">
                    Cadadka / Boqolleyda *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder={discountType === "fixed" ? "Tusaale: 20" : "Tusaale: 25 (%)"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] font-mono focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              {preview && (
                <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-sm space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-purple-400 font-bold">
                    <span>Lacagta Laga Jarayo:</span>
                    <span>-{formatMoney(preview.calculatedAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between text-[#a3a3a3]">
                    <span>Wadarta Cusub ee Biilka:</span>
                    <span>{formatMoney(preview.newTotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-amber-400 font-bold">
                    <span>Baaqiga Cusub ee Haraya:</span>
                    <span>{formatMoney(preview.newBalance, currency)}</span>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-[#a3a3a3] uppercase text-[10px] font-bold mb-1.5">
                  Sababta (Reason) *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-purple-500"
                >
                  <option value="Deeq Waxbarasho (Scholarship)">Deeq Waxbarasho (Scholarship)</option>
                  <option value="Dhimis Walaalo (Sibling Discount)">Dhimis Walaalo (Sibling Discount)</option>
                  <option value="Duruf Dhaqaale (Financial Hardship)">Duruf Dhaqaale (Financial Hardship)</option>
                  <option value="Arday Xifdiyey Quraanka (Quran Merit)">Arday Xifdiyey Quraanka (Quran Merit)</option>
                  <option value="Shaqaale Ilmohood (Staff Child)">Shaqaale Ilmohood (Staff Child)</option>
                  <option value="Other">Sabab Kale (Other custom reason)</option>
                </select>
                {reason === "Other" && (
                  <input
                    type="text"
                    placeholder="Qor sababta oo faahfaahsan..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full mt-2 bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-purple-500"
                    required
                  />
                )}
              </div>

              {/* Approved By & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a3a3a3] uppercase text-[10px] font-bold mb-1.5">
                    Ansixiyaha (Approved By) *
                  </label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#a3a3a3] uppercase text-[10px] font-bold mb-1.5">
                    Taariikhda (Date)
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[#a3a3a3] uppercase text-[10px] font-bold mb-1.5">
                  Faahfaahin Dheeraad Ah (Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="Xus qodobada go'aanka..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ffffff10]">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-[#e5e5e5] text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                >
                  {submitting ? "Waa la dhimayaa..." : "Ansiixi Qiimo-Dhimista"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
