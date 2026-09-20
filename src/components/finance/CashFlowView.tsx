import React, { useState } from "react";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Printer, 
  Wallet, 
  CheckCircle2, 
  Clock 
} from "lucide-react";
import { formatMoney, exportToExcel } from "./financeUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CashFlowViewProps {
  cashFlowData: any;
  currency: string;
  schoolName: string;
  onPeriodChange: (period: string) => void;
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({
  cashFlowData,
  currency,
  schoolName,
  onPeriodChange
}) => {
  const [activePeriod, setActivePeriod] = useState("annual");

  const handlePeriodClick = (p: string) => {
    setActivePeriod(p);
    onPeriodChange(p);
  };

  const opening = cashFlowData?.openingBalance || 0;
  const inflow = cashFlowData?.totalInflows || 0;
  const outflow = cashFlowData?.totalOutflows || 0;
  const closing = cashFlowData?.closingBalance || (opening + inflow - outflow);
  const netChange = cashFlowData?.netCashFlow || (inflow - outflow);

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 8, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text(schoolName || "DUGSI PRO", 15, 22);

    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text("Baaqa Socodka Lacagta (Cash Flow Statement)", 15, 30);

    const rows = [
      ["Baaqiga Hore (Opening Cash Balance)", `${currency} ${opening.toLocaleString()}`],
      ["Lacagta Soo Gashay (Cash Inflows)", `+ ${currency} ${inflow.toLocaleString()}`],
      ["Lacagta Baxday (Cash Outflows)", `- ${currency} ${outflow.toLocaleString()}`],
      ["Farqiga Socodka (Net Cash Flow)", `${currency} ${netChange.toLocaleString()}`],
      ["Baaqiga Xiritaanka (Closing Cash Balance)", `${currency} ${closing.toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: 40,
      head: [["Qodobka (Particulars)", "Cadadka (Amount)"]],
      body: rows,
      headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 4 }
    });

    doc.save(`Cash_Flow_Statement_${activePeriod}.pdf`);
  };

  const exportExcel = () => {
    const data = [
      { Metric: "Opening Balance", Amount: opening },
      { Metric: "Cash Inflow", Amount: inflow },
      { Metric: "Cash Outflow", Amount: outflow },
      { Metric: "Net Cash Flow", Amount: netChange },
      { Metric: "Closing Balance", Amount: closing }
    ];
    exportToExcel(`Cash_Flow_${activePeriod}`, "CashFlow", data);
  };

  return (
    <div className="space-y-6">
      {/* Time Period Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#0f0f0f] border border-[#ffffff10] rounded-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "daily", label: "Maalinle (Daily)" },
            { id: "weekly", label: "Toddobaadle (Weekly)" },
            { id: "monthly", label: "Bille (Monthly)" },
            { id: "term", label: "Xillle (Term)" },
            { id: "annual", label: "Sanadle (Annual)" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handlePeriodClick(tab.id)}
              className={`px-3 py-1.5 rounded-sm text-xs font-semibold tracking-wider transition-colors cursor-pointer ${
                activePeriod === tab.id
                  ? "bg-[#e5e5e5] text-[#0a0a0a]"
                  : "text-[#a3a3a3] hover:text-[#e5e5e5] hover:bg-[#ffffff05]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-[#e5e5e5] text-xs uppercase font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#e5e5e5] hover:bg-white text-[#0a0a0a] text-xs uppercase font-bold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            PDF Statement
          </button>
        </div>
      </div>

      {/* 4 Cards Formula Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Opening Balance */}
        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] uppercase font-bold text-[#737373] block mb-1">
            1. Baaqiga Hore (Opening Balance)
          </span>
          <div className="text-2xl font-bold font-mono text-[#e5e5e5]">
            {formatMoney(opening, currency)}
          </div>
          <span className="text-[9px] text-[#737373] mt-2 block">Bilowga xilligan</span>
        </div>

        {/* Cash Inflow */}
        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] uppercase font-bold text-[#737373] flex items-center justify-between mb-1">
            <span>2. Lacagta Soo Gashay (+)</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {formatMoney(inflow, currency)}
          </div>
          <span className="text-[9px] text-[#737373] mt-2 block">Dakhliga & fiiga la qabtay</span>
        </div>

        {/* Cash Outflow */}
        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] uppercase font-bold text-[#737373] flex items-center justify-between mb-1">
            <span>3. Lacagta Baxday (-)</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
          </span>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {formatMoney(outflow, currency)}
          </div>
          <span className="text-[9px] text-[#737373] mt-2 block">Kharashaadka & mushahaarka</span>
        </div>

        {/* Closing Balance */}
        <div className="bg-[#0f0f0f] border border-emerald-500/30 p-4 rounded-sm">
          <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between mb-1">
            <span>4. Baaqiga Hada (Closing Balance)</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {formatMoney(closing, currency)}
          </div>
          <span className="text-[9px] text-emerald-400/80 mt-2 block">
            Net Change: {netChange >= 0 ? "+" : ""}{formatMoney(netChange, currency)}
          </span>
        </div>
      </div>

      {/* Transaction Timeline / Recent Flow */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#e5e5e5]">
          Dhaqdhaqaaqa Sanduuqa (Cash Activity Timeline)
        </h3>

        <div className="space-y-2">
          {(cashFlowData?.timeline || []).length === 0 ? (
            <p className="text-xs text-[#737373] py-8 text-center">
              Wax dhaqdhaqaaq ah lagama helin muddadan.
            </p>
          ) : (
            (cashFlowData?.timeline || []).map((item: any, idx: number) => {
              const isInflow = item.type === "Inflow";
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#ffffff08] rounded-sm text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-sm ${isInflow ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                      {isInflow ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-[#e5e5e5]">{item.description}</div>
                      <div className="text-[10px] text-[#737373] flex items-center gap-2">
                        <span>{item.date}</span>
                        <span>•</span>
                        <span>{item.paymentMethod || "Cash"}</span>
                        <span>•</span>
                        <span>{item.category || "General"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`font-mono font-bold text-sm ${isInflow ? "text-emerald-400" : "text-rose-400"}`}>
                      {isInflow ? "+" : "-"}{formatMoney(item.amount, currency)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
