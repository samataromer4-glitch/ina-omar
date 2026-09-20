import React from "react";
import { 
  FileText, 
  Download, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Layers 
} from "lucide-react";
import { exportToExcel } from "./financeUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "../ui/PageHeader";

interface FinancialReportsModuleProps {
  stats: any;
  pnlData: any;
  cashFlowData: any;
  invoices: any[];
  expenses: any[];
  incomeList: any[];
  payroll: any[];
  currency: string;
  schoolName: string;
}

export const FinancialReportsModule: React.FC<FinancialReportsModuleProps> = ({
  stats,
  pnlData,
  cashFlowData,
  invoices,
  expenses,
  incomeList,
  payroll,
  currency,
  schoolName
}) => {
  // Report 1: Revenue Report
  const downloadRevenueReport = () => {
    const doc = new jsPDF();
    doc.setFont("Helvetica", "bold");
    doc.text(`${schoolName} - Warbixinta Dakhliga (Revenue Report)`, 14, 20);
    const rows = (incomeList || []).map((inc) => [
      inc.incomeId || inc.id,
      inc.category,
      inc.description,
      inc.payer || "N/A",
      inc.date,
      `${currency} ${Number(inc.amount).toLocaleString()}`
    ]);
    autoTable(doc, {
      startY: 28,
      head: [["ID", "Category", "Description", "Payer", "Date", "Amount"]],
      body: rows
    });
    doc.save("Revenue_Report.pdf");
  };

  // Report 2: Expense Report
  const downloadExpenseReport = () => {
    const doc = new jsPDF();
    doc.setFont("Helvetica", "bold");
    doc.text(`${schoolName} - Warbixinta Kharashaadka (Expense Report)`, 14, 20);
    const rows = (expenses || []).map((exp) => [
      exp.expenseId || exp.id,
      exp.category,
      exp.description,
      exp.vendorPayee || "N/A",
      exp.date,
      exp.status,
      `${currency} ${Number(exp.amount).toLocaleString()}`
    ]);
    autoTable(doc, {
      startY: 28,
      head: [["ID", "Category", "Description", "Vendor", "Date", "Status", "Amount"]],
      body: rows
    });
    doc.save("Expense_Report.pdf");
  };

  // Report 3: Fee Aging & Outstanding Report
  const downloadOutstandingFeesReport = () => {
    const doc = new jsPDF();
    doc.setFont("Helvetica", "bold");
    doc.text(`${schoolName} - Warbixinta Baaqiga Fiiga (Outstanding Fees Report)`, 14, 20);
    const unpaidInvoices = (invoices || []).filter((i) => i.balance > 0);
    const rows = unpaidInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.studentName,
      inv.className,
      inv.dueDate,
      `${currency} ${Number(inv.total).toLocaleString()}`,
      `${currency} ${Number(inv.paidAmount).toLocaleString()}`,
      `${currency} ${Number(inv.balance).toLocaleString()}`
    ]);
    autoTable(doc, {
      startY: 28,
      head: [["Invoice #", "Student", "Class", "Due Date", "Total", "Paid", "Outstanding"]],
      body: rows
    });
    doc.save("Outstanding_Fees_Report.pdf");
  };

  // Report 4: Payroll Report
  const downloadPayrollReport = () => {
    const doc = new jsPDF();
    doc.setFont("Helvetica", "bold");
    doc.text(`${schoolName} - Warbixinta Mushahaarka Shaqaalaha (Payroll Report)`, 14, 20);
    const rows = (payroll || []).map((p) => [
      p.employeeName,
      p.roleOrDepartment || p.employeeType,
      p.payrollPeriod,
      p.status,
      `${currency} ${Number(p.basicSalary).toLocaleString()}`,
      `${currency} ${Number(p.netSalary).toLocaleString()}`
    ]);
    autoTable(doc, {
      startY: 28,
      head: [["Employee", "Role", "Period", "Status", "Basic", "Net Salary"]],
      body: rows
    });
    doc.save("Payroll_Report.pdf");
  };

  const reportsList = [
    {
      title: "Warbixinta Dakhliga (Revenue Report)",
      desc: "Dhammaan ilaha dakhliga dugsiga: fiiga ardayda, deeqaha, iyo dakhliyada kale.",
      icon: TrendingUp,
      color: "text-emerald-400",
      pdfAction: downloadRevenueReport,
      excelAction: () => exportToExcel("Revenue_Report", "Revenue", incomeList)
    },
    {
      title: "Warbixinta Kharashaadka (Expense Report)",
      desc: "Kharashaadka guud ee dugsiga loo kala saaray qaybaha, ganacsatada, iyo taariikhda.",
      icon: TrendingDown,
      color: "text-rose-400",
      pdfAction: downloadExpenseReport,
      excelAction: () => exportToExcel("Expense_Report", "Expenses", expenses)
    },
    {
      title: "Warbixinta Fiiga Dhiman (Outstanding Fees)",
      desc: "Liiska ardayda leh lacagaha baaqiga ah, fasalladooda, iyo xilliyada bixinta.",
      icon: FileText,
      color: "text-amber-400",
      pdfAction: downloadOutstandingFeesReport,
      excelAction: () => exportToExcel("Outstanding_Fees", "Outstanding", invoices.filter((i) => i.balance > 0))
    },
    {
      title: "Warbixinta Mushahaarka (Payroll Report)",
      desc: "Warbixin faahfaahsan oo ku saabsan mushahaarka macallimiinta iyo shaqaalaha maamulka.",
      icon: Users,
      color: "text-purple-400",
      pdfAction: downloadPayrollReport,
      excelAction: () => exportToExcel("Payroll_Report", "Payroll", payroll)
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xarunta Warbixinnada Maaliyadda / Financial Reports"
        subtitle="Soo saar oo daabac warbixinno rasmi ah oo maaliyadeed qaab PDF ama Excel ah oo diyaarsan."
        badge="Audited Reports"
        badgeVariant="emerald"
        breadcrumbs={[
          { label: "Maamulka" },
          { label: "Maaliyadda (Finance)" },
          { label: "Warbixinnada" }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((rep, idx) => {
          const Icon = rep.icon;
          return (
            <div key={idx} className="bg-[#0f0f0f] border border-[#ffffff10] p-5 rounded-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#0a0a0a] border border-[#ffffff0a] rounded-sm">
                  <Icon className={`w-5 h-5 ${rep.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#e5e5e5]">{rep.title}</h3>
                  <p className="text-[11px] text-[#737373] mt-1">{rep.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#ffffff08]">
                <button
                  onClick={rep.pdfAction}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm bg-[#e5e5e5] hover:bg-white text-[#0a0a0a] text-xs uppercase font-bold cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PDF Report</span>
                </button>
                <button
                  onClick={rep.excelAction}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] hover:bg-[#ffffff05] text-[#a3a3a3] hover:text-[#e5e5e5] text-xs uppercase font-bold cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
