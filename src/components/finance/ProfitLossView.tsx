import React, { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Printer, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react";
import { formatMoney, exportToExcel } from "./financeUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ProfitLossViewProps {
  pnlData: any;
  currency: string;
  schoolName: string;
  onPeriodChange: (period: string, startDate?: string, endDate?: string) => void;
}

export const ProfitLossView: React.FC<ProfitLossViewProps> = ({
  pnlData,
  currency,
  schoolName,
  onPeriodChange
}) => {
  const [activePeriod, setActivePeriod] = useState("academic_year");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const handleSelectPeriod = (period: string) => {
    setActivePeriod(period);
    if (period !== "custom") {
      onPeriodChange(period);
    }
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      onPeriodChange("custom", customStart, customEnd);
    }
  };

  const totalRev = pnlData?.totalRevenue || 0;
  const totalExp = pnlData?.totalExpenses || 0;
  const netProfit = pnlData?.netProfit || (totalRev - totalExp);
  const isProfit = netProfit >= 0;
  const marginPct = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : "0.0";

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 8, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text(schoolName || "DUGSI PRO", 15, 22);

    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text("Baaqa Faa'iidada & Qasaaraha (Profit & Loss Statement)", 15, 30);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`Xilliga: ${activePeriod.replace("_", " ").toUpperCase()}  |  Taariikhda Daabacaadda: ${new Date().toLocaleDateString()}`, 15, 36);

    const rows: any[] = [];
    rows.push(["DAKHLIGA (REVENUE)", ""]);
    Object.entries(pnlData?.revenueByCategory || {}).forEach(([cat, amt]) => {
      rows.push([`  ${cat}`, `${currency} ${Number(amt).toLocaleString()}`]);
    });
    rows.push(["WADARTA DAKHLIGA (TOTAL REVENUE)", `${currency} ${totalRev.toLocaleString()}`]);
    rows.push(["", ""]);
    rows.push(["KHARASHAADKA (EXPENSES)", ""]);
    Object.entries(pnlData?.expensesByCategory || {}).forEach(([cat, amt]) => {
      rows.push([`  ${cat}`, `${currency} ${Number(amt).toLocaleString()}`]);
    });
    rows.push(["WADARTA KHARASHAADKA (TOTAL EXPENSES)", `${currency} ${totalExp.toLocaleString()}`]);
    rows.push(["", ""]);
    rows.push(["FAA'IIDADA SAUFIGA AH (NET PROFIT / LOSS)", `${currency} ${netProfit.toLocaleString()}`]);

    autoTable(doc, {
      startY: 44,
      head: [["Qaybta (Particulars)", "Cadadka (Amount)"]],
      body: rows,
      headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`Profit_Loss_Statement_${activePeriod}.pdf`);
  };

  const exportExcel = () => {
    const data = [
      { Section: "Revenue", Category: "Total Revenue", Amount: totalRev },
      ...Object.entries(pnlData?.revenueByCategory || {}).map(([c, a]) => ({ Section: "Revenue", Category: c, Amount: a })),
      { Section: "Expenses", Category: "Total Expenses", Amount: totalExp },
      ...Object.entries(pnlData?.expensesByCategory || {}).map(([c, a]) => ({ Section: "Expenses", Category: c, Amount: a })),
      { Section: "Summary", Category: "Net Profit / Loss", Amount: netProfit }
    ];
    exportToExcel(`Profit_Loss_${activePeriod}`, "P&L", data);
  };

  return (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#0f0f0f] border border-[#ffffff10] rounded-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "today", label: "Maanta (Today)" },
            { id: "this_week", label: "Toddobaadkan (This Week)" },
            { id: "this_month", label: "Bishan (This Month)" },
            { id: "this_term", label: "Xilligan (This Term)" },
            { id: "academic_year", label: "Sanad-Dugsiyeedka (Academic Year)" },
            { id: "custom", label: "Custom Range" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSelectPeriod(tab.id)}
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-[#e5e5e5] text-xs uppercase font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#e5e5e5] hover:bg-white text-[#0a0a0a] text-xs uppercase font-bold"
          >
            <Printer className="w-3.5 h-3.5" />
            PDF Statement
          </button>
        </div>
      </div>

      {activePeriod === "custom" && (
        <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-[#ffffff08] rounded-sm text-xs">
          <span className="text-[#737373]">Laga bilaabo:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 bg-[#171717] border border-[#ffffff10] rounded-sm text-[#e5e5e5]"
          />
          <span className="text-[#737373]">Ilaa:</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 bg-[#171717] border border-[#ffffff10] rounded-sm text-[#e5e5e5]"
          />
          <button
            onClick={handleApplyCustom}
            className="px-3 py-1 bg-emerald-500 text-black font-bold rounded-sm"
          >
            Raadi
          </button>
        </div>
      )}

      {/* KPI 3-Column Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-5 rounded-sm">
          <div className="flex items-center justify-between text-[#737373] text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Dakhliga Guud (Total Revenue)</span>
            <div className="p-1.5 rounded-sm bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400">
            {formatMoney(totalRev, currency)}
          </div>
          <p className="text-[10px] text-[#737373] mt-2">
            Fiiga ardayda, diiwaangelinta & dakhliyo kale
          </p>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-5 rounded-sm">
          <div className="flex items-center justify-between text-[#737373] text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Kharashaadka Guud (Total Expenses)</span>
            <div className="p-1.5 rounded-sm bg-rose-500/10 text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-rose-400">
            {formatMoney(totalExp, currency)}
          </div>
          <p className="text-[10px] text-[#737373] mt-2">
            Mushahaar, kirada, internet, iyo agab
          </p>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-5 rounded-sm">
          <div className="flex items-center justify-between text-[#737373] text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Faa'iidada Saufiga ah (Net Margin: {marginPct}%)</span>
            <div className={`p-1.5 rounded-sm ${isProfit ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
              {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-3xl font-bold font-mono ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
            {formatMoney(netProfit, currency)}
          </div>
          <p className="text-[10px] text-[#737373] mt-2">
            {isProfit ? "Xaaladda maaliyadeed waa faa'iido" : "Kharashku wuu ka batay dakhliga"}
          </p>
        </div>
      </div>

      {/* Side-by-Side Breakdown Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#ffffff10] pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Qaybaha Dakhliga (Revenue Breakdown)
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {formatMoney(totalRev, currency)}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {Object.entries(pnlData?.revenueByCategory || {}).length === 0 ? (
              <p className="text-[#737373] py-4 text-center">Wali dakhli ma jiro xilligan.</p>
            ) : (
              Object.entries(pnlData?.revenueByCategory || {}).map(([cat, amt]: [string, any], idx) => {
                const pct = totalRev > 0 ? ((Number(amt) / totalRev) * 100).toFixed(1) : "0";
                return (
                  <div key={idx} className="flex justify-between items-center py-1.5 border-b border-[#ffffff05]">
                    <span className="text-[#e5e5e5]">{cat}</span>
                    <div className="text-right">
                      <span className="font-mono font-bold text-[#e5e5e5] block">{formatMoney(amt, currency)}</span>
                      <span className="text-[10px] text-[#737373]">{pct}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#ffffff10] pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4" />
              Qaybaha Kharashka (Expenses Breakdown)
            </h3>
            <span className="text-xs font-mono font-bold text-rose-400">
              {formatMoney(totalExp, currency)}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {Object.entries(pnlData?.expensesByCategory || {}).length === 0 ? (
              <p className="text-[#737373] py-4 text-center">Wali kharash ma jiro xilligan.</p>
            ) : (
              Object.entries(pnlData?.expensesByCategory || {}).map(([cat, amt]: [string, any], idx) => {
                const pct = totalExp > 0 ? ((Number(amt) / totalExp) * 100).toFixed(1) : "0";
                return (
                  <div key={idx} className="flex justify-between items-center py-1.5 border-b border-[#ffffff05]">
                    <span className="text-[#e5e5e5]">{cat}</span>
                    <div className="text-right">
                      <span className="font-mono font-bold text-[#e5e5e5] block">{formatMoney(amt, currency)}</span>
                      <span className="text-[10px] text-[#737373]">{pct}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
