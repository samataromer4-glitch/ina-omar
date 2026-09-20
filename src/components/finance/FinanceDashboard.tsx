import React from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  CreditCard, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart as PieChartIcon,
  PlusCircle
} from "lucide-react";
import { formatMoney } from "./financeUtils";
import { PageHeader } from "../ui/PageHeader";
import { MetricCard } from "../ui/MetricCard";

interface FinanceDashboardProps {
  stats: any;
  pnlData: any;
  cashFlowData: any;
  currency: string;
  onNavigateTab: (tabId: string) => void;
  onOpenNewInvoice: () => void;
  onOpenNewExpense: () => void;
  onOpenNewPayment: () => void;
  onOpenNewIncome: () => void;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  stats,
  pnlData,
  currency,
  onNavigateTab,
  onOpenNewInvoice,
  onOpenNewExpense,
  onOpenNewPayment,
  onOpenNewIncome
}) => {
  const isProfitable = (stats?.netProfit ?? 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Page Header with Breadcrumbs & Action Buttons */}
      <PageHeader
        title="Dulmarka Maaliyadda / Finance Dashboard"
        subtitle="Xogta dhabta ah ee dakhliga, kharashaadka, faa'iidada saufiga ah, iyo baaqiga dugsiga."
        badge="Live Metrics"
        badgeColor="text-emerald-400 bg-emerald-950/40 border-emerald-800/40"
        breadcrumbs={[
          { label: "Maamulka", onClick: () => onNavigateTab("overview") },
          { label: "Maaliyadda (Finance)", onClick: () => onNavigateTab("overview") },
          { label: "Dulmar Guud (Overview)" }
        ]}
        primaryAction={{
          label: "Qabo Lacag (Record Payment)",
          icon: Receipt,
          onClick: onOpenNewPayment
        }}
        secondaryActions={[
          {
            label: "Abuur Biil",
            icon: PlusCircle,
            onClick: onOpenNewInvoice
          },
          {
            label: "Qor Kharash",
            icon: CreditCard,
            onClick: onOpenNewExpense
          },
          {
            label: "Dakhli Kale",
            icon: DollarSign,
            onClick: onOpenNewIncome
          }
        ]}
      />

      {/* 1. HIERARCHICAL FINANCIAL COMMAND SUMMARY (No identical card spam) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Main Executive Collected Amount Banner (Hero Focus) */}
        <div className="lg:col-span-3 bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#737373]">
                Dakhliga La Qabtay / Total Revenue Collected
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                Bishan: {formatMoney(stats?.cashInflow ?? 0, currency)}
              </span>
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-mono font-bold text-emerald-400 tracking-tight">
              {formatMoney(stats?.totalRevenue ?? 0, currency)}
            </div>
            <p className="text-xs text-[#a3a3a3] mt-1.5 flex items-center gap-2 flex-wrap">
              <span><strong className="text-white font-mono">{stats?.paidInvoicesCount || 0}</strong> biilal oo la bixiyey</span>
              <span>•</span>
              <span>Faa'iido: <strong className={`font-mono ${isProfitable ? "text-emerald-400" : "text-rose-400"}`}>{formatMoney(stats?.netProfit ?? 0, currency)}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-[#ffffff08] flex-wrap">
            <button
              onClick={onOpenNewPayment}
              className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-sm shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Qabo Lacag Bixin (Record Payment)</span>
            </button>
            <button
              onClick={onOpenNewInvoice}
              className="px-3.5 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#ffffff15] text-[#e5e5e5] text-xs font-semibold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#c4b5fd]" />
              <span>Abuur Biil Cusub</span>
            </button>
          </div>
        </div>

        {/* Supporting Secondary Ledgers */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
          {/* Outstanding */}
          <div 
            onClick={() => onNavigateTab("invoices")} 
            className="bg-[#0f0f0f] border border-[#ffffff10] hover:border-amber-500/40 rounded-sm p-4 cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-[#737373] block">
                Lacagta Dhiman (Outstanding)
              </span>
              <span className="text-xl font-mono font-bold text-amber-400 mt-0.5 block">
                {formatMoney(stats?.totalOutstandingFees ?? 0, currency)}
              </span>
              <span className="text-[11px] text-[#888888]">
                {stats?.pendingInvoicesCount || 0} arday oo baaqi ku yahay
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#737373]" />
          </div>

          {/* Expenses */}
          <div 
            onClick={() => onNavigateTab("expenses")} 
            className="bg-[#0f0f0f] border border-[#ffffff10] hover:border-rose-500/40 rounded-sm p-4 cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-[#737373] block">
                Kharashka Guud (Total Expenses)
              </span>
              <span className="text-xl font-mono font-bold text-rose-400 mt-0.5 block">
                {formatMoney(stats?.totalExpenses ?? 0, currency)}
              </span>
              <span className="text-[11px] text-[#888888]">
                Mushahaarka: {formatMoney(stats?.payrollPaid ?? 0, currency)}
              </span>
            </div>
            <ArrowDownRight className="w-4 h-4 text-[#737373]" />
          </div>

          {/* Cash Balance */}
          <div 
            onClick={() => onNavigateTab("cashflow")} 
            className="bg-[#0f0f0f] border border-[#ffffff10] hover:border-emerald-500/40 rounded-sm p-4 cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-[#737373] block">
                Baaqiga Sanduuqa (Cash Balance)
              </span>
              <span className="text-xl font-mono font-bold text-emerald-400 mt-0.5 block">
                {formatMoney(stats?.closingCashBalance ?? 0, currency)}
              </span>
              <span className="text-[11px] text-[#888888]">
                Sanduuqa dhabta ah ee dugsiga
              </span>
            </div>
            <TrendingUp className="w-4 h-4 text-[#737373]" />
          </div>
        </div>
      </div>

      {/* Visual Chart / Trend Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Bars */}
        <div className="lg:col-span-2 bg-[#0f0f0f] border border-[#ffffff10] p-5 rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#e5e5e5]">
                Dhaqdhaqaaqa Sanadlaha ah (Annual Financial Trend)
              </h3>
              <p className="text-[10px] text-[#737373]">
                Isbarbardhigga Dakhliga iyo Kharashaadka bishiiba
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block"></span>
                Dakhli
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs inline-block"></span>
                Kharash
              </span>
            </div>
          </div>

          <div className="h-48 flex items-end gap-2 pt-6 border-b border-[#ffffff10] pb-2">
            {(pnlData?.monthlyTrend || []).map((m: any, idx: number) => {
              const maxVal = Math.max(
                100,
                ...(pnlData?.monthlyTrend || []).map((item: any) => Math.max(item.revenue || 0, item.expenses || 0))
              );
              const revHeight = Math.round(((m.revenue || 0) / maxVal) * 100);
              const expHeight = Math.round(((m.expenses || 0) / maxVal) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-[#171717] border border-[#ffffff20] text-[9px] font-mono p-1 rounded-sm shadow-lg pointer-events-none transition-opacity z-10 whitespace-nowrap">
                    <div>Rev: ${m.revenue}</div>
                    <div>Exp: ${m.expenses}</div>
                  </div>
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    <div 
                      style={{ height: `${Math.max(4, revHeight)}%` }} 
                      className="w-1/2 bg-emerald-500/80 rounded-t-xs hover:bg-emerald-400 transition-all"
                      title={`Revenue: $${m.revenue}`}
                    />
                    <div 
                      style={{ height: `${Math.max(4, expHeight)}%` }} 
                      className="w-1/2 bg-rose-500/80 rounded-t-xs hover:bg-rose-400 transition-all"
                      title={`Expenses: $${m.expenses}`}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-[#737373] mt-1">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expenses by Category Breakdown */}
        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-5 rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#e5e5e5]">
                Qeybaha Kharashka (Categories)
              </h3>
              <PieChartIcon className="w-4 h-4 text-[#737373]" />
            </div>
            <p className="text-[10px] text-[#737373] mb-4">
              Kharashyada ugu waaweyn ee bishan/sanadkan
            </p>

            <div className="space-y-3">
              {Object.entries(pnlData?.expensesByCategory || {}).length === 0 ? (
                <p className="text-[11px] text-[#737373] text-center py-6">
                  Wali kharashyo ma diiwaangashana.
                </p>
              ) : (
                Object.entries(pnlData?.expensesByCategory || {})
                  .slice(0, 5)
                  .map(([cat, amt]: [string, any], idx) => {
                    const total = pnlData?.totalExpenses || 1;
                    const pct = Math.round((Number(amt) / total) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#a3a3a3] font-medium">{cat}</span>
                          <span className="font-mono text-[#e5e5e5] font-bold">
                            {formatMoney(amt, currency)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#ffffff0a] rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${pct}%` }} 
                            className="h-full bg-rose-500/70 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("expenses")}
            className="w-full mt-4 py-2 border border-[#ffffff10] hover:bg-[#ffffff05] rounded-sm text-[10px] uppercase tracking-wider font-bold text-[#a3a3a3] hover:text-[#e5e5e5] transition-colors cursor-pointer"
          >
            Eeg Dhammaan Kharashyada &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
