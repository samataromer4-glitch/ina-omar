import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  PieChart, 
  Users, 
  Layers, 
  FileSpreadsheet,
  RefreshCw,
  AlertTriangle,
  Percent,
  RotateCcw
} from "lucide-react";
import { FinanceDashboard } from "./finance/FinanceDashboard";
import { InvoicesModule } from "./finance/InvoicesModule";
import { PaymentsModule } from "./finance/PaymentsModule";
import { OutstandingModule } from "./finance/OutstandingModule";
import { DiscountsModule } from "./finance/DiscountsModule";
import { ExpensesModule } from "./finance/ExpensesModule";
import { RefundsModule } from "./finance/RefundsModule";
import { ReceiptsModule } from "./finance/ReceiptsModule";
import { IncomeModule } from "./finance/IncomeModule";
import { ProfitLossView } from "./finance/ProfitLossView";
import { CashFlowView } from "./finance/CashFlowView";
import { BudgetsModule } from "./finance/BudgetsModule";
import { PayrollModule } from "./finance/PayrollModule";
import { FeeStructuresModule } from "./finance/FeeStructuresModule";
import { FinancialReportsModule } from "./finance/FinancialReportsModule";
import type { 
  Invoice, 
  PaymentTransaction, 
  ExpenseRecord, 
  IncomeRecord, 
  BudgetRecord, 
  PayrollRecord, 
  FeeStructure,
  DiscountRecord,
  RefundRecord
} from "../types";

interface FinanceViewProps {
  students: any[];
  classes: any[];
  teachers?: any[];
  staff?: any[];
  currency?: string;
  schoolName?: string;
  initialSubTab?: string;
  onSubTabChange?: (subTab: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  students = [],
  classes = [],
  teachers = [],
  staff = [],
  currency = "USD",
  schoolName = "Dugsiga Pro 2026",
  initialSubTab,
  onSubTabChange
}) => {
  const normalizeTab = (t?: string) => {
    if (!t) return "overview";
    if (t === "dashboard") return "overview";
    if (t === "fee-structures") return "fee_structures";
    return t;
  };

  const [activeSubTab, setActiveSubTab] = useState<string>(normalizeTab(initialSubTab));
  const [loading, setLoading] = useState(true);

  // Synchronize when initialSubTab changes from sidebar
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(normalizeTab(initialSubTab));
    }
  }, [initialSubTab]);

  const handleTabSelect = (tabId: string) => {
    setActiveSubTab(tabId);
    if (onSubTabChange) {
      const routeTab = tabId === "overview" ? "dashboard" : tabId === "fee_structures" ? "fee-structures" : tabId;
      onSubTabChange(routeTab);
    }
  };

  // Data States
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [pnlData, setPnlData] = useState<any>(null);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [discounts, setDiscounts] = useState<DiscountRecord[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [incomeList, setIncomeList] = useState<IncomeRecord[]>([]);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);

  // Modals / Triggers from Dashboard
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState<Invoice | null>(null);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [
        dashRes,
        pnlRes,
        cfRes,
        invRes,
        payRes,
        discRes,
        refRes,
        expRes,
        incRes,
        bgRes,
        prRes,
        fsRes
      ] = await Promise.all([
        fetch("/api/finance/stats").then((r) => r.json()).catch(() => null),
        fetch("/api/profit-loss?period=academic_year").then((r) => r.json()).catch(() => null),
        fetch("/api/cash-flow?period=annual").then((r) => r.json()).catch(() => null),
        fetch("/api/invoices").then((r) => r.json()).catch(() => []),
        fetch("/api/payments").then((r) => r.json()).catch(() => []),
        fetch("/api/discounts").then((r) => r.json()).catch(() => []),
        fetch("/api/refunds").then((r) => r.json()).catch(() => []),
        fetch("/api/expenses").then((r) => r.json()).catch(() => []),
        fetch("/api/income").then((r) => r.json()).catch(() => []),
        fetch("/api/budgets").then((r) => r.json()).catch(() => []),
        fetch("/api/payroll").then((r) => r.json()).catch(() => []),
        fetch("/api/fee-structures").then((r) => r.json()).catch(() => [])
      ]);

      if (dashRes) setDashboardStats(dashRes);
      if (pnlRes) setPnlData(pnlRes);
      if (cfRes) setCashFlowData(cfRes);
      if (Array.isArray(invRes)) setInvoices(invRes);
      if (Array.isArray(payRes)) setPayments(payRes);
      if (Array.isArray(discRes)) setDiscounts(discRes);
      if (Array.isArray(refRes)) setRefunds(refRes);
      if (Array.isArray(expRes)) setExpenses(expRes);
      if (Array.isArray(incRes)) setIncomeList(incRes);
      if (Array.isArray(bgRes)) setBudgets(bgRes);
      if (Array.isArray(prRes)) setPayroll(prRes);
      if (Array.isArray(fsRes)) setFeeStructures(fsRes);
    } catch (err) {
      console.error("Error fetching finance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handlePnlPeriodChange = async (period: string, startDate?: string, endDate?: string) => {
    try {
      let url = `/api/profit-loss?period=${period}`;
      if (startDate && endDate) {
        url += `&from=${startDate}&to=${endDate}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPnlData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCashFlowPeriodChange = async (period: string) => {
    try {
      const res = await fetch(`/api/cash-flow?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setCashFlowData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPaymentFromInvoice = (inv: Invoice) => {
    setActiveInvoiceForPayment(inv);
    handleTabSelect("payments");
  };

  // 10 Primary Sub-Modules matching the specification
  const primaryTabs = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "fee_structures", label: "Fee Structures", icon: Layers },
    { id: "invoices", label: "Invoices", icon: FileText, count: invoices.filter((i) => i.balance > 0).length },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "outstanding", label: "Outstanding", icon: AlertTriangle, count: invoices.filter((i) => i.balance > 0 && i.dueDate && new Date(i.dueDate) < new Date()).length },
    { id: "discounts", label: "Discounts & Waivers", icon: Percent },
    { id: "expenses", label: "Expenses", icon: CreditCard },
    { id: "refunds", label: "Refunds", icon: RotateCcw },
    { id: "receipts", label: "Receipts", icon: Receipt },
    { id: "reports", label: "Financial Reports", icon: FileSpreadsheet }
  ];

  // Secondary Accounting & Payroll Tabs
  const secondaryTabs = [
    { id: "income", label: "Other Income", icon: DollarSign },
    { id: "payroll", label: "Payroll", icon: Users },
    { id: "profit_loss", label: "Profit & Loss", icon: TrendingUp },
    { id: "cash_flow", label: "Cash Flow", icon: Wallet },
    { id: "budgets", label: "Budgets", icon: PieChart }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Finance Sub-Navigation Tabs */}
      <div className="flex flex-col gap-2.5 bg-[#0d0d0d] border border-[#ffffff0f] p-2.5 rounded-sm shadow-xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1">
            {primaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#e5e5e5] text-[#0a0a0a] shadow-xs"
                      : "text-[#a3a3a3] hover:text-[#e5e5e5] hover:bg-[#ffffff05]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${isActive ? "bg-[#0a0a0a] text-white" : "bg-amber-500/20 text-amber-400"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchFinanceData}
            title="Dib u cusbooneysii xogta maaliyadda"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#141414] hover:bg-[#1a1a1a] text-[#a3a3a3] hover:text-[#e5e5e5] text-xs font-semibold cursor-pointer transition-colors shrink-0 ml-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Secondary Accounting Suite Bar */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px] pt-1.5 border-t border-[#ffffff08]">
          <span className="text-[10px] text-[#737373] uppercase font-bold tracking-wider mr-2 shrink-0 font-mono">
            Accounting Suite:
          </span>
          {secondaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#7c3aed]/20 text-[#c4b5fd] font-bold border border-[#7c3aed]/35"
                    : "text-[#737373] hover:text-[#d4d4d4] hover:bg-[#ffffff03]"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Dashboard Module */}
      {activeSubTab === "overview" && (
        <FinanceDashboard
          stats={dashboardStats}
          pnlData={pnlData}
          cashFlowData={cashFlowData}
          currency={currency}
          onNavigateTab={(tab) => handleTabSelect(tab)}
          onOpenNewInvoice={() => handleTabSelect("invoices")}
          onOpenNewExpense={() => handleTabSelect("expenses")}
          onOpenNewPayment={() => handleTabSelect("payments")}
          onOpenNewIncome={() => handleTabSelect("income")}
        />
      )}

      {/* 2. Fee Structures Module */}
      {activeSubTab === "fee_structures" && (
        <FeeStructuresModule
          feeStructures={feeStructures}
          classes={classes}
          currency={currency}
          schoolName={schoolName}
          onRefresh={fetchFinanceData}
        />
      )}

      {/* 3. Invoices Module */}
      {activeSubTab === "invoices" && (
        <InvoicesModule
          invoices={invoices}
          students={students}
          classes={classes}
          feeStructures={feeStructures}
          currency={currency}
          schoolName={schoolName}
          onRefresh={fetchFinanceData}
          onRecordPayment={handleOpenPaymentFromInvoice}
        />
      )}

      {/* 4. Payments Module */}
      {activeSubTab === "payments" && (
        <PaymentsModule
          payments={payments}
          invoices={invoices}
          currency={currency}
          schoolName={schoolName}
          onRefresh={fetchFinanceData}
          activeInvoiceForPayment={activeInvoiceForPayment}
          onClosePaymentModal={() => setActiveInvoiceForPayment(null)}
        />
      )}

      {/* 5. Outstanding & Aging Analysis Module */}
      {activeSubTab === "outstanding" && (
        <OutstandingModule
          invoices={invoices}
          currency={currency}
          schoolName={schoolName}
          onRecordPayment={handleOpenPaymentFromInvoice}
        />
      )}

      {/* 6. Discounts & Waivers Module */}
      {activeSubTab === "discounts" && (
        <DiscountsModule
          invoices={invoices}
          discounts={discounts}
          currency={currency}
          onRefresh={fetchFinanceData}
        />
      )}

      {/* 7. Expenses Module */}
      {activeSubTab === "expenses" && (
        <ExpensesModule
          expenses={expenses}
          currency={currency}
          schoolName={schoolName}
          onRefresh={fetchFinanceData}
        />
      )}

      {/* 8. Refunds Module */}
      {activeSubTab === "refunds" && (
        <RefundsModule
          payments={payments}
          refunds={refunds}
          currency={currency}
          onRefresh={fetchFinanceData}
        />
      )}

      {/* 9. Receipts Module */}
      {activeSubTab === "receipts" && (
        <ReceiptsModule
          payments={payments}
          invoices={invoices}
          currency={currency}
          schoolName={schoolName}
        />
      )}

      {/* 10. Financial Reports Module */}
      {activeSubTab === "reports" && (
        <FinancialReportsModule
          stats={dashboardStats}
          pnlData={pnlData}
          cashFlowData={cashFlowData}
          invoices={invoices}
          expenses={expenses}
          incomeList={incomeList}
          payroll={payroll}
          currency={currency}
          schoolName={schoolName}
        />
      )}

      {/* Secondary Modules */}
      {activeSubTab === "income" && (
        <IncomeModule
          incomeList={incomeList}
          currency={currency}
          schoolName={schoolName}
          onRefresh={fetchFinanceData}
        />
      )}

      {activeSubTab === "profit_loss" && (
        <ProfitLossView
          pnlData={pnlData}
          currency={currency}
          schoolName={schoolName}
          onPeriodChange={handlePnlPeriodChange}
        />
      )}

      {activeSubTab === "cash_flow" && (
        <CashFlowView
          cashFlowData={cashFlowData}
          currency={currency}
          schoolName={schoolName}
          onPeriodChange={handleCashFlowPeriodChange}
        />
      )}

      {activeSubTab === "budgets" && (
        <BudgetsModule
          budgets={budgets}
          currency={currency}
          schoolName={schoolName}
          onRefresh={fetchFinanceData}
        />
      )}

      {activeSubTab === "payroll" && (
        <PayrollModule
          payroll={payroll}
          teachers={teachers}
          staff={staff}
          currency={currency}
          schoolName={schoolName}
          onRefresh={fetchFinanceData}
        />
      )}
    </div>
  );
};
