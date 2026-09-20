import React, { useState } from "react";
import { 
  Search, 
  Download, 
  Send, 
  Receipt, 
  X, 
  CheckCircle2, 
  Calendar,
  CreditCard,
  Smartphone,
  Plus
} from "lucide-react";
import type { PaymentTransaction, Invoice } from "../../types";
import { formatMoney, exportToExcel, generateReceiptPDF, openWhatsApp } from "./financeUtils";
import { PageHeader } from "../ui/PageHeader";
import { MetricCard } from "../ui/MetricCard";
import { FilterBar, FilterChip } from "../ui/FilterBar";
import { EmptyState } from "../ui/EmptyState";
import { PaymentSuccessModal } from "../ui/PaymentSuccessModal";

interface PaymentsModuleProps {
  payments: PaymentTransaction[];
  invoices: Invoice[];
  currency: string;
  schoolName: string;
  onRefresh: () => void;
  activeInvoiceForPayment?: Invoice | null;
  onClosePaymentModal: () => void;
}

export const PaymentsModule: React.FC<PaymentsModuleProps> = ({
  payments,
  invoices,
  currency,
  schoolName,
  onRefresh,
  activeInvoiceForPayment,
  onClosePaymentModal
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");

  // Payment Recording State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(activeInvoiceForPayment?.id || "");
  const [paymentAmount, setPaymentAmount] = useState<number>(activeInvoiceForPayment?.balance || 50);
  const [paymentMethod, setPaymentMethod] = useState("EVC Plus");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [receivedBy, setReceivedBy] = useState("Accountant");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successPaymentData, setSuccessPaymentData] = useState<any | null>(null);

  // Synced invoice if selected
  const activeInv = invoices.find((inv) => inv.id === (selectedInvoiceId || activeInvoiceForPayment?.id));

  const filteredPayments = payments.filter((p) => {
    if (methodFilter !== "All" && p.paymentMethod !== methodFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRec = p.receiptNumber?.toLowerCase().includes(q);
      const matchName = p.studentName?.toLowerCase().includes(q);
      const matchInv = p.invoiceNumber?.toLowerCase().includes(q);
      const matchRef = p.reference?.toLowerCase().includes(q);
      if (!matchRec && !matchName && !matchInv && !matchRef) return false;
    }
    return true;
  });

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInv) {
      alert("Fadlan dooro biilka (Please select an invoice)");
      return;
    }
    if (paymentAmount <= 0) {
      alert("Cadadka lacagtu waa inuu ka bataa 0 (Amount must be > 0)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: activeInv.id,
          amount: paymentAmount,
          paymentMethod,
          paymentDate,
          reference,
          receivedBy,
          notes
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.payment) {
          setSuccessPaymentData({
            receiptNumber: data.payment.receiptNumber,
            studentName: data.payment.studentName,
            studentClass: data.payment.className,
            guardianPhone: activeInv.guardianPhone,
            amountPaid: data.payment.amount,
            remainingBalance: data.invoice?.balance ?? 0,
            paymentMethod: data.payment.paymentMethod,
            invoiceNumber: data.payment.invoiceNumber,
            paymentDate: data.payment.paymentDate
          });
          setShowSuccessModal(true);
        }
        onClosePaymentModal();
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || "Khalad ayaa dhacay intii lacagta la qabanayay");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWhatsAppReceipt = (p: PaymentTransaction) => {
    const inv = invoices.find((i) => i.id === p.invoiceId);
    const phone = inv?.guardianPhone;
    if (!phone) {
      alert("Telefoonka waalidka lama hayo (No phone number available)");
      return;
    }
    const message = `Mahadsanid! Waxaan xaqiijinaynaa in la qabtay lacag bixintaada ee ardayga: ${p.studentName}.\nRasiidka #: ${p.receiptNumber}\nCadadka: ${currency} ${p.amount}\nHabka: ${p.paymentMethod}\nTaariikh: ${p.paymentDate}\nBaaqiga Hada: ${currency} ${p.remainingBalance ?? 0}\nMahadsanidin.`;
    openWhatsApp(phone, message);
  };

  const handleExportExcel = () => {
    const exportData = filteredPayments.map((p) => ({
      "Receipt Number": p.receiptNumber,
      "Invoice Number": p.invoiceNumber,
      Student: p.studentName,
      Class: p.className,
      Amount: p.amount,
      "Payment Method": p.paymentMethod,
      Reference: p.reference,
      "Payment Date": p.paymentDate,
      "Received By": p.receivedBy,
      "Remaining Balance": p.remainingBalance
    }));
    exportToExcel(`Receipts_${schoolName.replace(/\s+/g, "_")}`, "Receipts", exportData);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const todayCollected = payments
    .filter((p) => p.paymentDate === todayStr)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const mobileCollected = payments
    .filter((p) => ["EVC Plus", "Zaad", "Sahal"].includes(p.paymentMethod))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const activeChips: FilterChip[] = [];
  if (methodFilter !== "All") {
    activeChips.push({
      id: "method",
      label: "Habka",
      value: methodFilter,
      onRemove: () => setMethodFilter("All")
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Diiwaanka Lacag Qabashada / Payment Receipts"
        subtitle="Diiwaanka lacagaha la qabtay, rasiidhada rasmiga ah (PDF), iyo xaqiijinta tooska ah ee WhatsApp."
        badge={`${payments.length} Rasiid`}
        badgeColor="text-emerald-400 bg-emerald-950/40 border-emerald-800/40"
        breadcrumbs={[
          { label: "Maamulka" },
          { label: "Maaliyadda" },
          { label: "Rasiidhada (Payments)" }
        ]}
        secondaryActions={[
          {
            label: "Dhoofi Excel",
            icon: Download,
            onClick: handleExportExcel
          }
        ]}
      />

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Wadarta La Qabtay (Total)"
          value={formatMoney(totalCollected, currency)}
          subtitle={`${payments.length} macaamil lacageed guud ahaan`}
          icon={Receipt}
          variant="success"
        />
        <MetricCard
          title="Ururinta Maanta (Today)"
          value={formatMoney(todayCollected, currency)}
          subtitle="Lacagaha la qabtay maanta oo dhan"
          icon={Calendar}
          variant="default"
        />
        <MetricCard
          title="Lacagaha Mobilada (Mobile)"
          value={formatMoney(mobileCollected, currency)}
          subtitle="EVC Plus, Zaad, iyo Sahal"
          icon={Smartphone}
          variant="default"
        />
        <MetricCard
          title="Tirada Rasiidhada (Count)"
          value={payments.length}
          subtitle="Diiwaanno rasiid oo la keydiyey"
          icon={CheckCircle2}
          variant="default"
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Raadi rasiid #: (REC-...), biilka, magaca ardayda, ama tixraaca..."
        activeFilterChips={activeChips}
        onClearAllFilters={() => {
          setSearchQuery("");
          setMethodFilter("All");
        }}
        filteredResultsCount={filteredPayments.length}
        totalResultsCount={payments.length}
        resultLabel="rasiid"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] focus:outline-none focus:border-emerald-500"
          >
            <option value="All">Dhammaan Hababka (All Methods)</option>
            <option value="Cash">Cash (Lacag Cadaan ah)</option>
            <option value="EVC Plus">EVC Plus (Hormuud)</option>
            <option value="Zaad">Zaad Service (Telesom)</option>
            <option value="Sahal">Sahal (Golis)</option>
            <option value="Bank">Xisaab Bangi (Bank Transfer)</option>
            <option value="Other">Kuwo Kale (Other)</option>
          </select>
        </div>
      </FilterBar>

      {/* 4. Receipts Table */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-[#ffffff10] text-[10px] uppercase font-bold tracking-widest text-[#737373]">
                <th className="px-5 py-3.5">Rasiid #</th>
                <th className="px-5 py-3.5">Biilka #</th>
                <th className="px-5 py-3.5">Ardayga (Student)</th>
                <th className="px-5 py-3.5">Qaabka (Method)</th>
                <th className="px-5 py-3.5 text-right">Cadadka (Amount)</th>
                <th className="px-5 py-3.5 text-right">Baaqi Kadib</th>
                <th className="px-5 py-3.5">Taariikh</th>
                <th className="px-5 py-3.5 text-right">Ficillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff08] text-xs">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8">
                    <EmptyState
                      icon={Receipt}
                      title="Wax rasiidyo ah lama helin"
                      description={
                        searchQuery || methodFilter !== "All"
                          ? "Isku day inaad beddesho shaandhada ama raadinta."
                          : "Wali lama qaban wax lacag bixin ah."
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-[#ffffff02] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-emerald-400 font-bold">{pay.receiptNumber}</td>
                    <td className="px-5 py-3.5 font-mono text-[#a3a3a3]">{pay.invoiceNumber}</td>
                    <td className="px-5 py-3.5 font-bold text-[#e5e5e5]">
                      <div>{pay.studentName}</div>
                      <div className="text-[10px] text-[#737373] font-normal">{pay.className}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2 py-0.5 rounded-xs text-[9px] font-bold uppercase tracking-wider bg-[#ffffff05] border border-[#ffffff10] text-[#e5e5e5]">
                        {pay.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-400 text-right">
                      {formatMoney(pay.amount, currency)}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-amber-400 text-right">
                      {formatMoney(pay.remainingBalance ?? 0, currency)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[#737373]">{pay.paymentDate}</td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => generateReceiptPDF(schoolName, currency, pay)}
                        className="p-1.5 rounded-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 inline-block cursor-pointer"
                        title="Dhoofi Rasiid PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleSendWhatsAppReceipt(pay)}
                        className="p-1.5 rounded-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 inline-block cursor-pointer"
                        title="Ku dir WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {showSuccessModal && successPaymentData && (
        <PaymentSuccessModal
          isOpen={showSuccessModal}
          paymentDetails={successPaymentData}
          currency={currency}
          schoolName={schoolName}
          onViewReceipt={() => {
            generateReceiptPDF(schoolName, currency, successPaymentData);
          }}
          onRecordAnother={() => {
            setShowSuccessModal(false);
          }}
          onClose={() => {
            setShowSuccessModal(false);
          }}
        />
      )}

      {/* RECORD PAYMENT MODAL */}
      {activeInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm w-full max-w-lg shadow-2xl p-6 relative">
            <button
              className="absolute right-4 top-4 p-1.5 rounded-sm text-[#737373] hover:bg-[#ffffff05]"
              onClick={onClosePaymentModal}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold font-serif text-[#f5f5f5] mb-2">
              Qabo Lacag Bixin (Record Payment)
            </h2>
            <div className="bg-[#0a0a0a] border border-[#ffffff0a] p-3 rounded-sm mb-4 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#737373]">Ardayga:</span>
                <span className="font-bold text-[#e5e5e5]">{activeInvoiceForPayment.studentName} ({activeInvoiceForPayment.className})</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#737373]">Biilka #:</span>
                <span className="font-mono text-[#a3a3a3]">{activeInvoiceForPayment.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#737373]">Baaqiga Hada:</span>
                <span className="font-mono font-bold text-amber-400">{formatMoney(activeInvoiceForPayment.balance, currency)}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a3a3a3] mb-1 font-medium">Cadadka La Bixinayo ({currency}) *</label>
                <input
                  type="number"
                  min="1"
                  max={activeInvoiceForPayment.balance}
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#e5e5e5] font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-[#737373] block mt-1">
                  Kama badnaan karo baaqiga: {formatMoney(activeInvoiceForPayment.balance, currency)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a3a3a3] mb-1 font-medium">Qaabka Bixinta *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-emerald-500"
                  >
                    <option value="EVC Plus">EVC Plus</option>
                    <option value="Zaad">Zaad</option>
                    <option value="Sahal">Sahal</option>
                    <option value="Cash">Cash (Lacag Cadaan)</option>
                    <option value="Bank">Bank Account</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#a3a3a3] mb-1 font-medium">Taariikhda *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a3a3a3] mb-1 font-medium">Tixraaca Bixinta (Reference / Trx ID)</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-984282 ama EVC Ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#e5e5e5] font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[#a3a3a3] mb-1 font-medium">Qofka Qabtay (Received By)</label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[#a3a3a3] mb-1 font-medium">Fiiro Gaar ah (Notes)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Xusuusin ku saabsan lacagtan..."
                  className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#e5e5e5] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#ffffff10]">
                <button
                  type="button"
                  onClick={onClosePaymentModal}
                  className="px-4 py-2 border border-[#ffffff10] rounded-sm text-[#a3a3a3] hover:text-[#e5e5e5] cursor-pointer"
                >
                  Ka noqo
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider text-[11px] rounded-sm cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {submitting ? "Diiwaangelinaya..." : "Xaqiiji & Qabo Lacagta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
