import React, { useState, useMemo } from "react";
import { 
  Search, 
  Download, 
  AlertTriangle, 
  Clock, 
  Users, 
  FileText, 
  CreditCard, 
  Send, 
  ArrowUpRight,
  Filter,
  CheckCircle2
} from "lucide-react";
import type { Invoice } from "../../types";
import { formatMoney, exportToExcel, openWhatsApp } from "./financeUtils";
import { PageHeader } from "../ui/PageHeader";
import { MetricCard } from "../ui/MetricCard";

interface OutstandingModuleProps {
  invoices?: Invoice[];
  classes?: any[];
  currency: string;
  schoolName: string;
  onRefresh: () => void;
  onRecordPayment: (invoice: Invoice) => void;
}

export const OutstandingModule: React.FC<OutstandingModuleProps> = ({
  invoices = [],
  classes = [],
  currency,
  schoolName,
  onRefresh,
  onRecordPayment
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [agingFilter, setAgingFilter] = useState<string>("All"); // 'All' | 'Overdue' | '1-30' | '31-60' | '60+'
  const [sortBy, setSortBy] = useState<"balance" | "daysOverdue" | "dueDate">("balance");

  const now = useMemo(() => new Date(), []);

  // Compute debtors from invoices with balance > 0
  const debtors = useMemo(() => {
    return (invoices || [])
      .filter((inv) => inv.balance > 0 && inv.status !== "Cancelled")
      .map((inv) => {
        const dueDate = new Date(inv.dueDate);
        const diffTime = now.getTime() - dueDate.getTime();
        const daysOverdue = diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;
        
        let agingBucket = "Current";
        if (daysOverdue > 60) agingBucket = "60+ Days";
        else if (daysOverdue > 30) agingBucket = "31-60 Days";
        else if (daysOverdue > 0) agingBucket = "1-30 Days";

        return {
          ...inv,
          daysOverdue,
          isOverdue: daysOverdue > 0,
          agingBucket
        };
      });
  }, [invoices, now]);

  // Filtered debtors
  const filteredDebtors = useMemo(() => {
    return debtors
      .filter((d) => {
        if (classFilter !== "All" && d.className !== classFilter) return false;
        if (agingFilter === "Overdue" && !d.isOverdue) return false;
        if (agingFilter === "1-30" && d.agingBucket !== "1-30 Days") return false;
        if (agingFilter === "31-60" && d.agingBucket !== "31-60 Days") return false;
        if (agingFilter === "60+" && d.agingBucket !== "60+ Days") return false;
        if (agingFilter === "Current" && d.agingBucket !== "Current") return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = d.studentName?.toLowerCase().includes(q);
          const matchNum = d.invoiceNumber?.toLowerCase().includes(q);
          const matchPhone = d.guardianPhone?.includes(q);
          if (!matchName && !matchNum && !matchPhone) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "balance") return b.balance - a.balance;
        if (sortBy === "daysOverdue") return b.daysOverdue - a.daysOverdue;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [debtors, classFilter, agingFilter, searchQuery, sortBy]);

  // Aggregate stats
  const totalOutstanding = useMemo(() => debtors.reduce((s, d) => s + d.balance, 0), [debtors]);
  const overdueDebtors = useMemo(() => debtors.filter((d) => d.isOverdue), [debtors]);
  const totalOverdue = useMemo(() => overdueDebtors.reduce((s, d) => s + d.balance, 0), [overdueDebtors]);
  const uniqueStudents = useMemo(() => new Set(debtors.map((d) => d.studentId)).size, [debtors]);

  // Aging distribution sums
  const agingStats = useMemo(() => {
    return {
      current: debtors.filter((d) => d.agingBucket === "Current").reduce((s, d) => s + d.balance, 0),
      days1to30: debtors.filter((d) => d.agingBucket === "1-30 Days").reduce((s, d) => s + d.balance, 0),
      days31to60: debtors.filter((d) => d.agingBucket === "31-60 Days").reduce((s, d) => s + d.balance, 0),
      days60plus: debtors.filter((d) => d.agingBucket === "60+ Days").reduce((s, d) => s + d.balance, 0)
    };
  }, [debtors]);

  const handleSendReminder = (d: typeof debtors[0]) => {
    if (!d.guardianPhone) {
      alert("Lama hayo telefoonka waalidka (No phone number available for guardian)");
      return;
    }
    const message = `Asc Waalidka sharafta leh ee ardayga ${d.studentName} (${d.className}).\nWaxaan idin xusuusinaynaa in biilka #: ${d.invoiceNumber} oo cadadkiisu yahay ${currency} ${d.balance} uu dhacay ${d.dueDate}.\nFadlan ku bixi xafiiska maaliyadda ama xisaabaadka dugsiga. Mahadsanidiin.`;
    openWhatsApp(d.guardianPhone, message);
  };

  const handleExportExcel = () => {
    const exportData = filteredDebtors.map((d) => ({
      "Invoice Number": d.invoiceNumber,
      "Student Name": d.studentName,
      Class: d.className,
      "Guardian Name": d.guardianName,
      "Guardian Phone": d.guardianPhone,
      "Total Amount": d.total,
      "Amount Paid": d.paidAmount,
      "Outstanding Balance": d.balance,
      "Due Date": d.dueDate,
      "Days Overdue": d.daysOverdue,
      "Aging Category": d.agingBucket,
      Status: d.status
    }));
    exportToExcel(`Outstanding_Debtors_${schoolName.replace(/\s+/g, "_")}`, "Outstanding", exportData);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Deymaha Baaqiga Ah / Outstanding Balances"
        subtitle="Dabagalka biilasha aan weli la bixin, falanqaynta da'da deynta (aging analysis), iyo fariimaha xusuusinta waalidiinta."
        badge={`${debtors.length} Unpaid`}
        badgeVariant="amber"
        breadcrumbs={[
          { label: "Maamulka", onClick: onRefresh },
          { label: "Maaliyadda (Finance)", onClick: onRefresh },
          { label: "Deymaha Baaqiga Ah" }
        ]}
        secondaryActions={[
          {
            label: "Dhoofi Excel",
            icon: Download,
            onClick: handleExportExcel
          }
        ]}
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Wadarta Daymaha (Outstanding)"
          value={formatMoney(totalOutstanding, currency)}
          subtitle={`${debtors.length} biilal ayaa baaqi ah`}
          icon={CreditCard}
          variant="amber"
        />
        <MetricCard
          label="Waqtigiisii Dhaafay (Overdue)"
          value={formatMoney(totalOverdue, currency)}
          subtitle={`${overdueDebtors.length} biilal waqtigu ka dhacay`}
          icon={AlertTriangle}
          variant="rose"
        />
        <MetricCard
          label="Ardayda Daynta Leh (Debtors)"
          value={uniqueStudents}
          subtitle="Tirada ardayda ay ku dhiman tahay"
          icon={Users}
          variant="violet"
        />
        <MetricCard
          label="60+ Maalmood (Critical)"
          value={formatMoney(agingStats.days60plus, currency)}
          subtitle={`31-60d: ${formatMoney(agingStats.days31to60, currency)}`}
          icon={Clock}
          variant="rose"
        />
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Raadi arday, biil #, ama taleefan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#a3a3a3] px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Classes</option>
            {(classes || []).map((c) => (
              <option key={c.id || c.className} value={c.className}>{c.className}</option>
            ))}
          </select>

          <select
            value={agingFilter}
            onChange={(e) => setAgingFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#a3a3a3] px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Aging Periods</option>
            <option value="Overdue">Overdue Only (Waqtigu Dhaafay)</option>
            <option value="Current">Current (Aan Dhicin Weli)</option>
            <option value="1-30">1 - 30 Days Overdue</option>
            <option value="31-60">31 - 60 Days Overdue</option>
            <option value="60+">60+ Days Overdue</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#a3a3a3] px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="balance">Kala Saaran: Baaqiga Ugu Weyn</option>
            <option value="daysOverdue">Kala Saaran: Maalmaha Ugu Badan</option>
            <option value="dueDate">Kala Saaran: Taariikhda Bixinta</option>
          </select>
        </div>

        <button
          onClick={handleExportExcel}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] hover:bg-[#ffffff05] text-[#a3a3a3] hover:text-[#e5e5e5] text-[10px] uppercase font-bold tracking-wider cursor-pointer self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Excel Debtors</span>
        </button>
      </div>

      {/* Debtors Table */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-[#ffffff10] text-[10px] uppercase font-bold tracking-widest text-[#737373]">
                <th className="px-5 py-3.5">Ardayga (Student)</th>
                <th className="px-5 py-3.5">Fasalka</th>
                <th className="px-5 py-3.5">Biilka #</th>
                <th className="px-5 py-3.5 text-right">Wadarta</th>
                <th className="px-5 py-3.5 text-right">La Bixiyey</th>
                <th className="px-5 py-3.5 text-right text-amber-400">Baaqiga (Balance)</th>
                <th className="px-5 py-3.5">Xilliga Bixinta</th>
                <th className="px-5 py-3.5">Da'da Daynta</th>
                <th className="px-5 py-3.5 text-right">Ficillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff08] text-xs">
              {filteredDebtors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[#737373] uppercase tracking-wider text-[10px]">
                    Ma jiraan daymo ama biilal baaqi ah oo shuruudahan waafaqsan.
                  </td>
                </tr>
              ) : (
                filteredDebtors.map((d) => (
                  <tr key={d.id} className="hover:bg-[#ffffff02] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-[#e5e5e5]">
                      <div>{d.studentName}</div>
                      {d.guardianPhone && (
                        <div className="text-[10px] text-[#737373] font-normal font-mono">{d.guardianPhone}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[#a3a3a3]">{d.className}</td>
                    <td className="px-5 py-3.5 font-mono text-[#a3a3a3]">{d.invoiceNumber}</td>
                    <td className="px-5 py-3.5 font-mono text-[#737373] text-right">
                      {formatMoney(d.total, currency)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-emerald-400 text-right">
                      {formatMoney(d.paidAmount, currency)}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-amber-400 text-right">
                      {formatMoney(d.balance, currency)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[#a3a3a3]">{d.dueDate}</td>
                    <td className="px-5 py-3.5">
                      {d.daysOverdue > 0 ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[9px] font-bold font-mono ${
                          d.daysOverdue > 60 
                            ? "bg-rose-500/15 border border-rose-500/30 text-rose-400" 
                            : d.daysOverdue > 30 
                            ? "bg-orange-500/15 border border-orange-500/30 text-orange-400" 
                            : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                        }`}>
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>{d.daysOverdue} maalmood ({d.agingBucket})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[9px] font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Weli ma dhicin</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => onRecordPayment(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-wider uppercase cursor-pointer"
                        title="Qabo Lacag (Record Payment)"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Qabo</span>
                      </button>
                      <button
                        onClick={() => handleSendReminder(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[10px] font-bold tracking-wider uppercase cursor-pointer"
                        title="U dir Xusuusin WhatsApp"
                      >
                        <Send className="w-3 h-3" />
                        <span>Xusuusi</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
