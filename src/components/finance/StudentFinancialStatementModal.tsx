import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, 
  Download, 
  Printer, 
  Send, 
  DollarSign, 
  CreditCard, 
  AlertTriangle, 
  Percent, 
  RotateCcw,
  Calendar,
  User,
  X,
  CheckCircle2
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatMoney, exportToExcel, openWhatsApp } from "./financeUtils";

interface StudentFinancialStatementModalProps {
  studentId: string;
  currency: string;
  schoolName: string;
  onClose: () => void;
}

export const StudentFinancialStatementModal: React.FC<StudentFinancialStatementModalProps> = ({
  studentId,
  currency,
  schoolName,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "invoices" | "payments" | "adjustments">("summary");

  useEffect(() => {
    async function fetchStatement() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/students/${studentId}/finance`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load financial statement");
        }
        setData(json);
      } catch (err: any) {
        setError(err.message || "Error loading statement");
      } finally {
        setLoading(false);
      }
    }
    if (studentId) {
      fetchStatement();
    }
  }, [studentId]);

  const handlePrintPDF = () => {
    if (!data) return;
    const { student, summary, invoices, payments, discounts, refunds } = data;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Top decorative bar
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 8, "F");

    // School Header
    doc.setTextColor(17, 24, 39);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.text(schoolName || "DUGSI PRO", 15, 22);

    doc.setTextColor(107, 114, 128);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Baaqa Xisaabeedka Rasmiga Ah ee Ardayga (Student Financial Statement)", 15, 28);

    doc.setFontSize(8);
    doc.text(`Taariikhda Daabacaadda: ${new Date().toLocaleDateString()}`, 195, 28, { align: "right" });

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(15, 33, 195, 33);

    // Student Info Card
    doc.setFillColor(249, 250, 251);
    doc.rect(15, 36, 180, 22, "F");
    doc.rect(15, 36, 180, 22, "S");

    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(55, 65, 81);
    doc.text(`Ardayga: ${student.fullName}`, 20, 43);
    doc.text(`Fasalka: ${student.class}`, 20, 50);

    doc.setFont("Helvetica", "normal");
    doc.text(`Tirada Aqoonsiga: ${student.admissionNumber || student.id}`, 110, 43);
    doc.text(`Waalidka: ${student.guardianName || "N/A"} (${student.guardianPhone || "N/A"})`, 110, 50);

    // Financial Summary Highlights
    doc.setFontSize(10);
    doc.setFont("Helvetica", "bold");
    doc.text("KOBACA MAALIYADEED (FINANCIAL SUMMARY):", 15, 66);

    const summaryData = [
      ["Wadarta Biilasha (Total Invoiced)", `${currency} ${Number(summary.totalBilled || 0).toLocaleString()}`],
      ["Qiimo-Dhimisyada (Total Discounts)", `${currency} ${Number(summary.totalDiscounts || 0).toLocaleString()}`],
      ["Wadarta Saafiga Ah (Net Billed)", `${currency} ${Number(summary.totalNetBilled || 0).toLocaleString()}`],
      ["Wadarta La Bixiyey (Total Paid)", `${currency} ${Number(summary.totalPaid || 0).toLocaleString()}`],
      ["Lacagaha La Celiyey (Refunded)", `${currency} ${Number(summary.totalRefunded || 0).toLocaleString()}`],
      ["Baaqiga Haray (Balance Due)", `${currency} ${Number(summary.balanceDue || 0).toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: 70,
      head: [["Qeybta Xisaabta", "Cadadka (Amount)"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 8.5, cellPadding: 2.5 }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 8;

    // Invoices Table
    doc.setFontSize(10);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text("DIIDMADA & SOO BIXINTA BIILASHA (INVOICES):", 15, currentY);

    const invoiceRows = (invoices || []).map((inv: any) => [
      inv.invoiceNumber,
      inv.issueDate,
      inv.dueDate,
      `${currency} ${inv.total}`,
      `${currency} ${inv.paidAmount}`,
      `${currency} ${inv.balance}`,
      inv.status
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Biilka #", "Soo Baxay", "Xilliga Bixinta", "Wadarta", "La Bixiyey", "Baaqiga", "Xaaladda"]],
      body: invoiceRows.length > 0 ? invoiceRows : [["Ma jiraan biilal", "-", "-", "-", "-", "-", "-"]],
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // Payments Table
    if (currentY < 240) {
      doc.setFontSize(10);
      doc.setFont("Helvetica", "bold");
      doc.text("LACAG BIXINADA LA QABTAY (PAYMENTS & RECEIPTS):", 15, currentY);

      const paymentRows = (payments || []).map((p: any) => [
        p.receiptNumber,
        p.paymentDate,
        p.paymentMethod,
        p.reference || "N/A",
        `${currency} ${p.amount}`,
        p.receivedBy
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [["Rasiidka #", "Taariikhda", "Habka", "Tixraaca", "Cadadka", "Qabtay"]],
        body: paymentRows.length > 0 ? paymentRows : [["Ma jiraan lacago la qabtay", "-", "-", "-", "-", "-"]],
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });
    }

    doc.save(`Statement_${student.fullName.replace(/\s+/g, "_")}.pdf`);
  };

  const handleSendWhatsApp = () => {
    if (!data?.student?.guardianPhone) {
      alert("Lama hayo telefoonka waalidka (No guardian phone number found)");
      return;
    }
    const { student, summary } = data;
    const message = `Asc Waalidka ardayga ${student.fullName} (${student.class}).\nKani waa baaqa xisaabeed ee rasmiga ah:\n- Wadarta Biilasha: ${currency} ${summary.totalNetBilled}\n- Wadarta La Bixiyey: ${currency} ${summary.totalPaid}\n- Baaqiga Dhiman: ${currency} ${summary.balanceDue}\nMahadsanidiin. — ${schoolName}`;
    openWhatsApp(student.guardianPhone, message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#121212] border border-[#ffffff15] rounded-sm w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ffffff10] bg-[#171717]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-[#e5e5e5] uppercase tracking-wider">
              Baaqa Xisaabeedka Ardayga (Student Financial Statement)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#e5e5e5] text-lg leading-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {loading ? (
            <div className="py-16 text-center text-[#737373] uppercase tracking-wider text-[10px]">
              Fadlan sug, xogta xisaabta ardayga ayaa la soo rarayaa...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-sm text-rose-400">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Student Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm">
                <div>
                  <div className="text-base font-bold text-[#e5e5e5]">{data.student.fullName}</div>
                  <div className="text-[#737373] text-[11px] mt-0.5">
                    Fasalka: <span className="text-[#a3a3a3] font-semibold">{data.student.class}</span> | ID:{" "}
                    <span className="font-mono text-[#a3a3a3]">{data.student.admissionNumber}</span>
                  </div>
                  {data.student.guardianPhone && (
                    <div className="text-[10px] text-[#737373] mt-1 font-mono">
                      Waalidka: {data.student.guardianName || "N/A"} ({data.student.guardianPhone})
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintPDF}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>PDF Statement</span>
                  </button>
                  <button
                    onClick={handleSendWhatsApp}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[#ffffff15] bg-[#0a0a0a] hover:bg-[#ffffff05] text-[#e5e5e5] text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-blue-400" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Financial Metrics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm">
                  <div className="text-[10px] uppercase font-bold text-[#737373] mb-1">Wadarta Biilasha</div>
                  <div className="text-lg font-bold font-mono text-[#e5e5e5]">
                    {formatMoney(data.summary.totalNetBilled, currency)}
                  </div>
                </div>

                <div className="p-3 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm">
                  <div className="text-[10px] uppercase font-bold text-[#737373] mb-1">La Bixiyey</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    {formatMoney(data.summary.totalPaid, currency)}
                  </div>
                </div>

                <div className="p-3 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm">
                  <div className="text-[10px] uppercase font-bold text-[#737373] mb-1">Qiimo-Dhimis</div>
                  <div className="text-lg font-bold font-mono text-purple-400">
                    {formatMoney(data.summary.totalDiscounts, currency)}
                  </div>
                </div>

                <div className="p-3 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm">
                  <div className="text-[10px] uppercase font-bold text-amber-400 mb-1">Baaqiga Haray</div>
                  <div className="text-lg font-bold font-mono text-amber-400">
                    {formatMoney(data.summary.balanceDue, currency)}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-[#ffffff10] pb-2 text-[10px] uppercase font-bold tracking-wider">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`px-3 py-1.5 rounded-sm transition-colors cursor-pointer ${
                    activeTab === "summary"
                      ? "bg-[#ffffff10] text-[#e5e5e5]"
                      : "text-[#737373] hover:text-[#e5e5e5]"
                  }`}
                >
                  Faahfaahinta Biilasha ({data.invoices.length})
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`px-3 py-1.5 rounded-sm transition-colors cursor-pointer ${
                    activeTab === "payments"
                      ? "bg-[#ffffff10] text-[#e5e5e5]"
                      : "text-[#737373] hover:text-[#e5e5e5]"
                  }`}
                >
                  Taariikhda Lacagaha ({data.payments.length})
                </button>
                <button
                  onClick={() => setActiveTab("adjustments")}
                  className={`px-3 py-1.5 rounded-sm transition-colors cursor-pointer ${
                    activeTab === "adjustments"
                      ? "bg-[#ffffff10] text-[#e5e5e5]"
                      : "text-[#737373] hover:text-[#e5e5e5]"
                  }`}
                >
                  Dhimisyo & Celin ({data.discounts.length + data.refunds.length})
                </button>
              </div>

              {/* Tab 1: Invoices */}
              {activeTab === "summary" && (
                <div className="border border-[#ffffff10] rounded-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0a0a0a] border-b border-[#ffffff10] text-[9px] uppercase font-bold tracking-widest text-[#737373]">
                        <th className="px-4 py-2.5">Biilka #</th>
                        <th className="px-4 py-2.5">Soo Baxay</th>
                        <th className="px-4 py-2.5">Xilliga Bixinta</th>
                        <th className="px-4 py-2.5 text-right">Wadarta</th>
                        <th className="px-4 py-2.5 text-right">La Bixiyey</th>
                        <th className="px-4 py-2.5 text-right text-amber-400">Baaqiga</th>
                        <th className="px-4 py-2.5">Xaaladda</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ffffff08] text-[11px] font-mono">
                      {(data?.invoices || []).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-[#737373] text-[10px]">
                            Ma jiraan biilal la helay.
                          </td>
                        </tr>
                      ) : (
                        (data?.invoices || []).map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-[#ffffff02]">
                            <td className="px-4 py-2.5 font-bold text-[#e5e5e5]">{inv.invoiceNumber}</td>
                            <td className="px-4 py-2.5 text-[#a3a3a3]">{inv.issueDate}</td>
                            <td className="px-4 py-2.5 text-[#a3a3a3]">{inv.dueDate}</td>
                            <td className="px-4 py-2.5 text-right text-[#e5e5e5]">{formatMoney(inv.total, currency)}</td>
                            <td className="px-4 py-2.5 text-right text-emerald-400">{formatMoney(inv.paidAmount, currency)}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-amber-400">{formatMoney(inv.balance, currency)}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-xs text-[9px] uppercase font-bold ${
                                inv.status === "Paid"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : inv.status === "Partially Paid"
                                  ? "bg-amber-500/15 text-amber-400"
                                  : "bg-rose-500/15 text-rose-400"
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: Payments */}
              {activeTab === "payments" && (
                <div className="border border-[#ffffff10] rounded-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0a0a0a] border-b border-[#ffffff10] text-[9px] uppercase font-bold tracking-widest text-[#737373]">
                        <th className="px-4 py-2.5">Rasiidka #</th>
                        <th className="px-4 py-2.5">Taariikhda</th>
                        <th className="px-4 py-2.5">Habka</th>
                        <th className="px-4 py-2.5 text-right text-emerald-400">Cadadka</th>
                        <th className="px-4 py-2.5">Tixraaca</th>
                        <th className="px-4 py-2.5">Qabtay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ffffff08] text-[11px] font-mono">
                      {(data?.payments || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-[#737373] text-[10px]">
                            Ma jiraan lacago la qabtay.
                          </td>
                        </tr>
                      ) : (
                        (data?.payments || []).map((p: any) => (
                          <tr key={p.id} className="hover:bg-[#ffffff02]">
                            <td className="px-4 py-2.5 font-bold text-emerald-400">{p.receiptNumber}</td>
                            <td className="px-4 py-2.5 text-[#a3a3a3]">{p.paymentDate}</td>
                            <td className="px-4 py-2.5 text-[#e5e5e5]">{p.paymentMethod}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-emerald-400">{formatMoney(p.amount, currency)}</td>
                            <td className="px-4 py-2.5 text-[#737373]">{p.reference || "N/A"}</td>
                            <td className="px-4 py-2.5 text-[#a3a3a3]">{p.receivedBy}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 3: Adjustments */}
              {activeTab === "adjustments" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2">
                      Qiimo-Dhimisyada La Siiyey (Discounts Applied)
                    </h4>
                    <div className="border border-[#ffffff10] rounded-sm overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#0a0a0a] border-b border-[#ffffff10] text-[9px] uppercase font-bold tracking-widest text-[#737373]">
                            <th className="px-4 py-2.5">Biilka #</th>
                            <th className="px-4 py-2.5">Cadadka Laga Dhimay</th>
                            <th className="px-4 py-2.5">Sababta</th>
                            <th className="px-4 py-2.5">Ansixiyaha</th>
                            <th className="px-4 py-2.5">Taariikhda</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ffffff08] text-[11px] font-mono">
                          {(data?.discounts || []).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-4 text-center text-[#737373] text-[10px]">
                                Ma jirto wax qiimo dhimis ah.
                              </td>
                            </tr>
                          ) : (
                            (data?.discounts || []).map((d: any) => (
                              <tr key={d.id}>
                                <td className="px-4 py-2.5 text-[#e5e5e5]">{d.invoiceNumber}</td>
                                <td className="px-4 py-2.5 font-bold text-purple-400">-{formatMoney(d.amount, currency)}</td>
                                <td className="px-4 py-2.5 text-[#a3a3a3]">{d.reason}</td>
                                <td className="px-4 py-2.5 text-[#737373]">{d.approvedBy}</td>
                                <td className="px-4 py-2.5 text-[#737373]">{d.date}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-2">
                      Lacagaha Dib Loo Celiyey (Refunds)
                    </h4>
                    <div className="border border-[#ffffff10] rounded-sm overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#0a0a0a] border-b border-[#ffffff10] text-[9px] uppercase font-bold tracking-widest text-[#737373]">
                            <th className="px-4 py-2.5">Rasiidka #</th>
                            <th className="px-4 py-2.5">Cadadka La Celiyey</th>
                            <th className="px-4 py-2.5">Sababta</th>
                            <th className="px-4 py-2.5">Ansixiyaha</th>
                            <th className="px-4 py-2.5">Taariikhda</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ffffff08] text-[11px] font-mono">
                          {(data?.refunds || []).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-4 text-center text-[#737373] text-[10px]">
                                Ma jirto wax lacag ah oo dib loo celiyey.
                              </td>
                            </tr>
                          ) : (
                            (data?.refunds || []).map((r: any) => (
                              <tr key={r.id}>
                                <td className="px-4 py-2.5 text-[#e5e5e5]">{r.receiptNumber}</td>
                                <td className="px-4 py-2.5 font-bold text-rose-400">-{formatMoney(r.refundAmount, currency)}</td>
                                <td className="px-4 py-2.5 text-[#a3a3a3]">{r.reason}</td>
                                <td className="px-4 py-2.5 text-[#737373]">{r.approvedBy}</td>
                                <td className="px-4 py-2.5 text-[#737373]">{r.date}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
