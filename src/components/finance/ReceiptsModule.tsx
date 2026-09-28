import React, { useState, useMemo } from "react";
import { 
  Receipt, 
  Search, 
  Download, 
  Printer, 
  Send, 
  Eye, 
  Calendar, 
  CreditCard,
  Building2,
  CheckCircle2,
  FileText
} from "lucide-react";
import type { PaymentTransaction, Invoice } from "../../types";
import { formatMoney, exportToExcel, generateReceiptPDF, openWhatsApp } from "./financeUtils";
import { PageHeader } from "../ui/PageHeader";
import { MetricCard } from "../ui/MetricCard";

interface ReceiptsModuleProps {
  payments?: PaymentTransaction[];
  invoices?: Invoice[];
  currency: string;
  schoolName: string;
}

export const ReceiptsModule: React.FC<ReceiptsModuleProps> = ({
  payments = [],
  invoices = [],
  currency,
  schoolName
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return (payments || []).filter((p) => {
      if (methodFilter !== "All" && p.paymentMethod !== methodFilter) return false;
      if (dateFrom && p.paymentDate < dateFrom) return false;
      if (dateTo && p.paymentDate > dateTo) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRec = p.receiptNumber?.toLowerCase().includes(q);
        const matchInv = p.invoiceNumber?.toLowerCase().includes(q);
        const matchName = p.studentName?.toLowerCase().includes(q);
        const matchRef = p.reference?.toLowerCase().includes(q);
        if (!matchRec && !matchInv && !matchName && !matchRef) return false;
      }
      return true;
    });
  }, [payments, methodFilter, dateFrom, dateTo, searchQuery]);

  const totalReceiptsAmount = useMemo(() => {
    return filteredReceipts.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  }, [filteredReceipts]);

  const handlePrintPDF = (pay: PaymentTransaction) => {
    generateReceiptPDF(schoolName, currency, pay);
  };

  const handleWhatsAppReceipt = (pay: any) => {
    const inv = invoices.find((i) => i.id === pay.invoiceId);
    const phone = inv?.guardianPhone;
    if (!phone) {
      alert("Lama hayo telefoonka waalidka (No phone number found)");
      return;
    }
    const message = `Asc Waalidka sharafta leh.\nWaxaan idiin xaqiijinaynaa in la helay lacag bixinta ardayga ${pay.studentName} (${pay.className}).\nRasiid #: ${pay.receiptNumber}\nBiilka #: ${pay.invoiceNumber || "N/A"}\nCadadka: ${currency} ${pay.amount}\nTaariikh: ${pay.paymentDate}\nMahadsanidiin. — ${schoolName}`;
    openWhatsApp(phone, message);
  };

  const handleExportExcel = () => {
    const data = filteredReceipts.map((p) => {
      const inv = invoices.find((i) => i.id === p.invoiceId);
      return {
        "Receipt Number": p.receiptNumber,
        "Invoice Number": p.invoiceNumber || "",
        "Student Name": p.studentName,
        Class: p.className,
        "Guardian Phone": inv?.guardianPhone || "",
        "Amount Paid": p.amount,
        "Payment Method": p.paymentMethod,
        Reference: p.reference || "",
        "Payment Date": p.paymentDate,
        "Received By": p.receivedBy,
        Notes: p.notes || ""
      };
    });
    exportToExcel(`Official_Receipts_${schoolName.replace(/\s+/g, "_")}`, "Receipts", data);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Rasiidhada Rasmiga Ah / Official Receipts"
        subtitle="Kaydka dhijitaalka ah ee rasiidhada lacag-qabashada ardayda, daabacaadda PDF, iyo xaqiijinta xisaabaadka dugsiga."
        badge={`${filteredReceipts.length} Receipts`}
        badgeVariant="emerald"
        breadcrumbs={[
          { label: "Maamulka" },
          { label: "Maaliyadda (Finance)" },
          { label: "Rasiidhada" }
        ]}
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
          label="Wadarta Rasiidhada (Total Receipts)"
          value={formatMoney(totalReceiptsAmount, currency)}
          subtitle={`${filteredReceipts.length} rasiid oo la jaray`}
          icon={Receipt}
          variant="emerald"
        />
        <MetricCard
          label="Hababka Ugu Badan (Top Method)"
          value="EVC Plus & Cash"
          subtitle="Bixinta tooska ah ee xafiiska iyo mobaylka"
          icon={CreditCard}
          variant="info"
        />
        <MetricCard
          label="Xaqiijinta Sharciga (Status)"
          value="100% Rasmi Ah"
          subtitle="Dhammaan rasiidhadu waxay leeyihiin tixraac"
          icon={CheckCircle2}
          variant="violet"
        />
      </div>

      {/* Action and Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Raadi rasiid #, arday, biil #, ama tixraac..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#a3a3a3] px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Payment Methods</option>
            <option value="Cash">Cash (Lacag Cadaan)</option>
            <option value="EVC Plus">EVC Plus</option>
            <option value="Zaad">Zaad</option>
            <option value="Bank">Bank Transfer</option>
            <option value="Other">Other</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-[#737373]">
            <span>Ka:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#a3a3a3] px-2 py-1.5 focus:outline-none"
            />
            <span>Ilaa:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#a3a3a3] px-2 py-1.5 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleExportExcel}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] hover:bg-[#ffffff05] text-[#a3a3a3] hover:text-[#e5e5e5] text-[10px] uppercase font-bold tracking-wider cursor-pointer self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Excel Receipts</span>
        </button>
      </div>

      {/* Receipts Table */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-[#ffffff10] text-[10px] uppercase font-bold tracking-widest text-[#737373]">
                <th className="px-5 py-3.5">Rasiidka #</th>
                <th className="px-5 py-3.5">Biilka #</th>
                <th className="px-5 py-3.5">Ardayga (Student)</th>
                <th className="px-5 py-3.5">Fasalka</th>
                <th className="px-5 py-3.5 text-right text-emerald-400">Cadadka La Qabtay</th>
                <th className="px-5 py-3.5">Habka (Method)</th>
                <th className="px-5 py-3.5">Taariikhda</th>
                <th className="px-5 py-3.5">Qabtay (Received By)</th>
                <th className="px-5 py-3.5 text-right">Ficillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff08] text-xs">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[#737373] uppercase tracking-wider text-[10px]">
                    Ma jiraan rasiidho ku habboon raadintan.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((p) => {
                  const inv = invoices.find((i) => i.id === p.invoiceId);
                  return (
                    <tr key={p.id} className="hover:bg-[#ffffff02] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-emerald-400">
                        {p.receiptNumber}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#a3a3a3]">
                        {p.invoiceNumber || "—"}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#e5e5e5]">
                        <div>{p.studentName}</div>
                        {inv?.guardianPhone && (
                          <div className="text-[10px] text-[#737373] font-normal font-mono">{inv.guardianPhone}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#a3a3a3]">{p.className}</td>
                      <td className="px-5 py-3.5 font-mono font-bold text-emerald-400 text-right">
                        {formatMoney(p.amount, currency)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-xs text-[9px] font-bold font-mono uppercase bg-[#ffffff05] border border-[#ffffff10] text-[#a3a3a3]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#737373]">{p.paymentDate}</td>
                      <td className="px-5 py-3.5 text-[#a3a3a3]">{p.receivedBy}</td>
                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedReceipt({ ...p, guardianPhone: inv?.guardianPhone, guardianName: inv?.guardianName })}
                          className="p-1.5 rounded-sm hover:bg-[#ffffff08] text-[#a3a3a3] hover:text-[#e5e5e5] transition-colors cursor-pointer"
                          title="Fiiri Rasiidka (Preview Receipt)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePrintPDF(p)}
                          className="p-1.5 rounded-sm hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer"
                          title="Daabac PDF Rasiid"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleWhatsAppReceipt(p)}
                          className="p-1.5 rounded-sm hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer"
                          title="U dir Waalidka WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Receipt Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#121212] border border-[#ffffff15] rounded-sm w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ffffff10] bg-[#171717]">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-[#e5e5e5] uppercase tracking-wider">
                  Rasiid Rasmi Ah (Official Receipt)
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-[#737373] hover:text-[#e5e5e5] text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-5 text-xs">
              <div className="text-center pb-4 border-b border-[#ffffff10]">
                <div className="text-base font-bold text-[#e5e5e5] tracking-wide uppercase">
                  {schoolName}
                </div>
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                  Xafiiska Maaliyadda & Xisaabaadka
                </div>
                <div className="text-[11px] font-mono text-[#737373] mt-2">
                  Rasiid #: <span className="text-[#e5e5e5] font-bold">{selectedReceipt.receiptNumber}</span>
                </div>
              </div>

              {/* Key Value Details */}
              <div className="space-y-2.5 font-mono text-[11px]">
                <div className="flex justify-between text-[#737373]">
                  <span>Ardayga (Student):</span>
                  <span className="text-[#e5e5e5] font-bold">{selectedReceipt.studentName}</span>
                </div>
                <div className="flex justify-between text-[#737373]">
                  <span>Fasalka (Class):</span>
                  <span className="text-[#e5e5e5]">{selectedReceipt.className}</span>
                </div>
                <div className="flex justify-between text-[#737373]">
                  <span>Biilka (Invoice #):</span>
                  <span className="text-[#e5e5e5]">{selectedReceipt.invoiceNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between text-[#737373]">
                  <span>Habka Bixinta:</span>
                  <span className="text-emerald-400 font-bold">{selectedReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-[#737373]">
                  <span>Tixraaca (Ref):</span>
                  <span className="text-[#a3a3a3]">{selectedReceipt.reference || "N/A"}</span>
                </div>
                <div className="flex justify-between text-[#737373]">
                  <span>Taariikhda:</span>
                  <span className="text-[#e5e5e5]">{selectedReceipt.paymentDate}</span>
                </div>
                <div className="flex justify-between text-[#737373]">
                  <span>Qabtay (Staff):</span>
                  <span className="text-[#e5e5e5]">{selectedReceipt.receivedBy}</span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-center">
                <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-1">
                  Cadadka La Qabtay (Amount Paid)
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {formatMoney(selectedReceipt.amount, currency)}
                </div>
              </div>

              {/* Verified Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#737373]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rasiidkan waa mid xaqiiqo ah oo ku jira xog-kaydiyaha dugsiga.</span>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#ffffff10]">
                <button
                  onClick={() => handlePrintPDF(selectedReceipt)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Daabac PDF</span>
                </button>
                <button
                  onClick={() => handleWhatsAppReceipt(selectedReceipt)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm border border-[#ffffff15] bg-[#0a0a0a] hover:bg-[#ffffff05] text-[#e5e5e5] text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
