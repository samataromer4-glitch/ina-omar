import React, { useState, useMemo } from "react";
import { 
  RotateCcw, 
  Plus, 
  Search, 
  Download, 
  AlertCircle, 
  Receipt, 
  ShieldAlert, 
  UserCheck, 
  CreditCard,
  FileCheck
} from "lucide-react";
import type { PaymentTransaction, RefundRecord } from "../../types";
import { formatMoney, exportToExcel } from "./financeUtils";
import { PageHeader } from "../ui/PageHeader";
import { MetricCard } from "../ui/MetricCard";

interface RefundsModuleProps {
  refunds?: RefundRecord[];
  payments?: PaymentTransaction[];
  currency: string;
  schoolName: string;
  onRefresh: () => void;
}

export const RefundsModule: React.FC<RefundsModuleProps> = ({
  refunds = [],
  payments = [],
  currency,
  schoolName,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [selectedPaymentId, setSelectedPaymentId] = useState("");
  const [refundAmount, setRefundAmount] = useState<number | "">("");
  const [reason, setReason] = useState("Lacag qalad loogu wareejiyey dugsiga (Incorrect transfer)");
  const [customReason, setCustomReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<any>("Cash");
  const [approvedBy, setApprovedBy] = useState("Maamulaha Dugsiga (Principal)");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Map of refunds per payment
  const refundsByPayment = useMemo(() => {
    const map: Record<string, number> = {};
    (refunds || []).forEach((r) => {
      map[r.paymentId] = (map[r.paymentId] || 0) + Number(r.refundAmount || 0);
    });
    return map;
  }, [refunds]);

  // Eligible payments (where payment.amount > refunded so far)
  const eligiblePayments = useMemo(() => {
    return (payments || []).filter((p) => {
      const alreadyRefunded = refundsByPayment[p.id] || 0;
      return p.amount - alreadyRefunded > 0.01;
    });
  }, [payments, refundsByPayment]);

  const selectedPayment = useMemo(() => {
    return (payments || []).find((p) => p.id === selectedPaymentId);
  }, [payments, selectedPaymentId]);

  const remainingRefundable = useMemo(() => {
    if (!selectedPayment) return 0;
    const alreadyRefunded = refundsByPayment[selectedPayment.id] || 0;
    return Math.max(0, Math.round((selectedPayment.amount - alreadyRefunded) * 100) / 100);
  }, [selectedPayment, refundsByPayment]);

  const totalRefunded = useMemo(() => {
    return refunds.reduce((s, r) => s + (Number(r.refundAmount) || 0), 0);
  }, [refunds]);

  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.studentName?.toLowerCase().includes(q) ||
        r.receiptNumber?.toLowerCase().includes(q) ||
        r.invoiceNumber?.toLowerCase().includes(q) ||
        r.reason?.toLowerCase().includes(q) ||
        r.approvedBy?.toLowerCase().includes(q)
      );
    });
  }, [refunds, searchQuery]);

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentId) {
      setErrorMsg("Fadlan dooro lacagtii hore loo qabtay ee la celinayo (Select original payment)");
      return;
    }
    const amt = Number(refundAmount);
    if (!amt || amt <= 0) {
      setErrorMsg("Fadlan geli cadad lacageed oo sax ah");
      return;
    }
    if (amt > remainingRefundable) {
      setErrorMsg(`Cadadka la celinayo ($${amt}) kama badnaan karo inta hadda u qalanta celinta ($${remainingRefundable})`);
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const finalReason = reason === "Other" ? customReason : reason;

    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPaymentId,
          refundAmount: amt,
          reason: finalReason,
          paymentMethod,
          approvedBy,
          date,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process refund");
      }

      setIsModalOpen(false);
      setSelectedPaymentId("");
      setRefundAmount("");
      setNotes("");
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Khalad ayaa dhacay inta lagu guda jiray celinta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    const data = filteredRefunds.map((r) => ({
      "Receipt Number": r.receiptNumber,
      "Invoice Number": r.invoiceNumber,
      "Student Name": r.studentName,
      Class: r.className,
      "Refund Amount": r.refundAmount,
      "Payment Method": r.paymentMethod,
      Reason: r.reason,
      "Approved By": r.approvedBy,
      Date: r.date,
      Notes: r.notes || ""
    }));
    exportToExcel(`Refunds_Audit_${schoolName.replace(/\s+/g, "_")}`, "Refunds", data);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Celinta Lacagaha / Refunds & Reversals"
        subtitle="Diiwaanka lacagaha qaladka lagu bixiyey ama dib loogu celiyey waalidiinta, oo leh tixraacyo rasmi ah iyo oggolaansho."
        badge={`${refunds.length} Refunds`}
        badgeVariant="rose"
        breadcrumbs={[
          { label: "Maamulka" },
          { label: "Maaliyadda (Finance)" },
          { label: "Celinta Lacagaha" }
        ]}
        primaryAction={{
          label: "Diiwaangeli Celin (Issue Refund)",
          icon: Plus,
          onClick: () => setIsModalOpen(true)
        }}
        secondaryActions={[
          {
            label: "Dhoofi Excel",
            icon: Download,
            onClick: handleExportExcel
          }
        ]}
      />

      {/* Top metrics banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Wadarta La Celiyey (Total Refunded)"
          value={formatMoney(totalRefunded, currency)}
          subtitle="Wadarta rasmiga ah ee dib loo celiyey"
          icon={RotateCcw}
          variant="rose"
        />
        <MetricCard
          label="Tirada Celinaha (Refunds Count)"
          value={refunds.length}
          subtitle="Hawlgal celin oo la diiwaangeliyey"
          icon={FileCheck}
          variant="info"
        />
        <MetricCard
          label="Rasiidhada Dib Loo Celin Karo"
          value={eligiblePayments.length}
          subtitle="Rasiidhada leh haraa dib loo celin karo"
          icon={Receipt}
          variant="emerald"
        />
      </div>

      {/* Action and Search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Raadi celin, arday, rasiid #, ama sabab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-rose-500"
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-rose-600 hover:bg-rose-500 text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Diiwaangeli Celin (Issue Refund)</span>
          </button>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-[#ffffff10] text-[10px] uppercase font-bold tracking-widest text-[#737373]">
                <th className="px-5 py-3.5">Rasiidka Asalka Ah</th>
                <th className="px-5 py-3.5">Ardayga (Student)</th>
                <th className="px-5 py-3.5">Fasalka</th>
                <th className="px-5 py-3.5">Qaabka (Method)</th>
                <th className="px-5 py-3.5 text-right text-rose-400">Cadadka La Celiyey</th>
                <th className="px-5 py-3.5">Sababta (Reason)</th>
                <th className="px-5 py-3.5">Ansixiyaha</th>
                <th className="px-5 py-3.5">Taariikhda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff08] text-xs">
              {filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-[#737373] uppercase tracking-wider text-[10px]">
                    Weli ma jirto wax lacag ah oo dib loo celiyey.
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((r) => (
                  <tr key={r.id} className="hover:bg-[#ffffff02] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[#a3a3a3]">
                      <div>{r.receiptNumber}</div>
                      {r.invoiceNumber && <div className="text-[10px] text-[#737373]">{r.invoiceNumber}</div>}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#e5e5e5]">{r.studentName}</td>
                    <td className="px-5 py-3.5 text-[#a3a3a3]">{r.className}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-xs text-[9px] font-bold font-mono uppercase bg-[#ffffff05] border border-[#ffffff10] text-[#a3a3a3]">
                        {r.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-rose-400 text-right">
                      -{formatMoney(r.refundAmount, currency)}
                    </td>
                    <td className="px-5 py-3.5 text-[#e5e5e5] max-w-[200px] truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="px-5 py-3.5 text-[#a3a3a3]">{r.approvedBy}</td>
                    <td className="px-5 py-3.5 font-mono text-[#737373]">{r.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Refund Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#121212] border border-[#ffffff15] rounded-sm w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ffffff10] bg-[#171717]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-[#e5e5e5] uppercase tracking-wider">
                  Diiwaangeli Celin Lacageed (Controlled Refund)
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#737373] hover:text-[#e5e5e5] text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitRefund} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-sm text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Payment Selector */}
              <div>
                <label className="block text-[#a3a3a3] uppercase text-[10px] font-bold mb-1.5">
                  Dooro Rasiidka / Lacagtii Hore Loo Qabtay *
                </label>
                <select
                  value={selectedPaymentId}
                  onChange={(e) => setSelectedPaymentId(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-rose-500"
                  required
                >
                  <option value="">-- Dooro Lacag Bixinta Asalka Ah --</option>
                  {eligiblePayments.map((p) => {
                    const alreadyRefunded = refundsByPayment[p.id] || 0;
                    const maxRef = p.amount - alreadyRefunded;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.receiptNumber} — {p.studentName} ({p.className}) — Bixiyey: ${p.amount} | La Celin Karo: ${maxRef}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedPayment && (
                <div className="p-3 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-[#737373]">
                    <span>Lacagtii Hore Loo Bixiyey:</span>
                    <span className="text-emerald-400">{formatMoney(selectedPayment.amount, currency)}</span>
                  </div>
                  <div className="flex justify-between text-[#737373]">
                    <span>Hore Looga Celiyey:</span>
                    <span className="text-rose-400">{formatMoney(refundsByPayment[selectedPayment.id] || 0, currency)}</span>
                  </div>
                  <div className="flex justify-between text-[#737373] border-t border-[#ffffff10] pt-1">
                    <span>U Qalma In La Celiyo:</span>
                    <span className="text-[#e5e5e5] font-bold">{formatMoney(remainingRefundable, currency)}</span>
                  </div>
                </div>
              )}

              {/* Refund Amount & Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a3a3a3] uppercase text-[10px] font-bold mb-1.5">
                    Cadadka La Celinayo ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remainingRefundable || undefined}
                    placeholder="Tusaale: 35"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] font-mono focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#a3a3a3] uppercase text-[10px] font-bold mb-1.5">
                    Habka Celinta (Method)
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-rose-500"
                  >
                    <option value="Cash">Cash (Lacag Cadaan)</option>
                    <option value="EVC Plus">EVC Plus</option>
                    <option value="Zaad">Zaad</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[#a3a3a3] uppercase text-[10px] font-bold mb-1.5">
                  Sababta Celinta (Reason) *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-rose-500"
                >
                  <option value="Lacag qalad loogu wareejiyey dugsiga (Incorrect transfer)">Lacag qalad loogu wareejiyey dugsiga (Incorrect transfer)</option>
                  <option value="Ardayga oo ka tagay dugsiga (Student left school / withdrawn)">Ardayga oo ka tagay dugsiga (Student left school / withdrawn)</option>
                  <option value="Laba-jibbaar lacag bixin (Duplicate payment)">Laba-jibbaar lacag bixin (Duplicate payment)</option>
                  <option value="Dhimis dib ka timid (Retroactive discount applied)">Dhimis dib ka timid (Retroactive discount applied)</option>
                  <option value="Other">Sabab Kale (Other custom reason)</option>
                </select>
                {reason === "Other" && (
                  <input
                    type="text"
                    placeholder="Qor sababta oo faahfaahsan..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full mt-2 bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-rose-500"
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
                    className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-rose-500"
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
                    className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[#a3a3a3] uppercase text-[10px] font-bold mb-1.5">
                  Qoraal Dheeraad Ah (Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="Xus ciddii loo celiyey iyo faahfaahinta xisaabta..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#ffffff15] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ffffff10]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-[#e5e5e5] text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-sm bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                >
                  {submitting ? "Waa la celinayaa..." : "Xaqiiji Celinta Lacagta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
