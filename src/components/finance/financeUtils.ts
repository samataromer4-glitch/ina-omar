import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export function formatMoney(amount: number, currency = "USD"): string {
  return `${currency} ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function exportToExcel(filename: string, sheetName: string, data: any[]) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function openWhatsApp(phone: string, message: string) {
  if (!phone) return;
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

export function generateInvoicePDF(schoolName: string, currency: string, inv: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Header band
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 8, "F");

  // School Header
  doc.setTextColor(17, 24, 39);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.text(schoolName || "DUGSI PRO", 15, 24);

  doc.setTextColor(107, 114, 128);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Xafiiska Maaliyadda & Xisaabaadka (Finance Office)", 15, 30);

  // Invoice Title Right
  doc.setTextColor(16, 185, 129);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INVOICE / BIILKA", 195, 24, { align: "right" });

  doc.setTextColor(55, 65, 81);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Biilka #: ${inv.invoiceNumber}`, 195, 31, { align: "right" });
  doc.text(`Taariikhda: ${inv.issueDate}`, 195, 36, { align: "right" });
  doc.text(`Xilliga Bixinta (Due): ${inv.dueDate}`, 195, 41, { align: "right" });

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(15, 46, 195, 46);

  // Bill To Box
  doc.setFillColor(249, 250, 251);
  doc.rect(15, 50, 180, 26, "F");
  doc.rect(15, 50, 180, 26, "S");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text("U SOCOTA (BILL TO):", 20, 56);

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(11);
  doc.text(inv.studentName || "Arday Dugsiga", 20, 63);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(`Fasalka: ${inv.className || "N/A"}  |  Waalidka: ${inv.guardianName || "N/A"}  |  Tel: ${inv.guardianPhone || "N/A"}`, 20, 70);

  // Status Badge
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(inv.status === "Paid" ? 16 : 220, inv.status === "Paid" ? 185 : 38, inv.status === "Paid" ? 129 : 38);
  doc.text(`Xaaladda: ${inv.status.toUpperCase()}`, 190, 63, { align: "right" });

  // Items Table
  const tableData = (inv.items || []).map((it: any, idx: number) => [
    (idx + 1).toString(),
    it.name,
    it.category || "General",
    `${currency} ${Number(it.amount || 0).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 82,
    head: [["#", "Qeexidda Khidmadda (Fee Description)", "Nooca (Category)", "Cadadka (Amount)"]],
    body: tableData,
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 3.5, font: "Helvetica" },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      1: { halign: "left" },
      2: { halign: "center", cellWidth: 40 },
      3: { halign: "right", fontStyle: "bold", cellWidth: 35 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals Breakdown
  doc.setFillColor(249, 250, 251);
  doc.rect(120, finalY, 75, 34, "F");
  doc.rect(120, finalY, 75, 34, "S");

  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text("Isu-geyn (Subtotal):", 125, finalY + 7);
  doc.text("Sicir-dhimis (Discount):", 125, finalY + 14);
  doc.text("Wadarta Guud (Total):", 125, finalY + 21);
  doc.text("Bixiyay (Paid):", 125, finalY + 28);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Baaqi (Remaining Balance):", 125, finalY + 33);

  doc.text(`${currency} ${Number(inv.subtotal || 0).toLocaleString()}`, 190, finalY + 7, { align: "right" });
  doc.text(`${currency} ${Number(inv.discount || 0).toLocaleString()}`, 190, finalY + 14, { align: "right" });
  doc.text(`${currency} ${Number(inv.total || 0).toLocaleString()}`, 190, finalY + 21, { align: "right" });
  doc.setTextColor(16, 185, 129);
  doc.text(`${currency} ${Number(inv.paidAmount || 0).toLocaleString()}`, 190, finalY + 28, { align: "right" });
  doc.setTextColor(220, 38, 38);
  doc.text(`${currency} ${Number(inv.balance || 0).toLocaleString()}`, 190, finalY + 33, { align: "right" });

  // Signature & Notes
  doc.setTextColor(107, 114, 128);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text(inv.notes ? `Fiiro Gaar ah: ${inv.notes}` : "Fadlan bixi inta ka horraysa xilliga loogu talagalay.", 15, finalY + 10);
  doc.line(15, finalY + 30, 65, finalY + 30);
  doc.text("Saxiixa Xisaabiyaha / Stamp", 15, finalY + 35);

  doc.text(`${schoolName} - Rasmi / Official Finance Document`, 105, 285, { align: "center" });

  doc.save(`Invoice_${inv.invoiceNumber}_${inv.studentName?.replace(/\s+/g, "_")}.pdf`);
}

export function generateReceiptPDF(schoolName: string, currency: string, pay: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });

  // Emerald Top Accent
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 148, 6, "F");

  // School Header
  doc.setTextColor(17, 24, 39);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.text(schoolName || "DUGSI PRO", 12, 18);

  doc.setTextColor(107, 114, 128);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Rasiidka Qabashada Lacagta (Official Payment Receipt)", 12, 23);

  // Title Right
  doc.setTextColor(16, 185, 129);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.text("RASIID / RECEIPT", 136, 18, { align: "right" });

  doc.setTextColor(75, 85, 99);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Rasiid #: ${pay.receiptNumber}`, 136, 23, { align: "right" });
  doc.text(`Taariikh: ${pay.paymentDate}`, 136, 27, { align: "right" });

  doc.setDrawColor(229, 231, 235);
  doc.line(12, 32, 136, 32);

  // Details Grid Box
  doc.setFillColor(249, 250, 251);
  doc.rect(12, 36, 124, 52, "F");
  doc.rect(12, 36, 124, 52, "S");

  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  doc.text("Laga Qabtay (Received From):", 16, 43);
  doc.text("Fasalka (Class):", 16, 50);
  doc.text("Biilka Xiriirsan (Invoice #):", 16, 57);
  doc.text("Qaabka Bixinta (Method):", 16, 64);
  doc.text("Tixraac (Reference):", 16, 71);
  doc.text("Qabtay (Received By):", 16, 78);

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text(pay.studentName || "Arday Dugsiga", 60, 43);
  doc.text(pay.className || "N/A", 60, 50);
  doc.text(pay.invoiceNumber || "N/A", 60, 57);
  doc.text(pay.paymentMethod || "Cash", 60, 64);
  doc.text(pay.reference || "N/A", 60, 71);
  doc.text(pay.receivedBy || "Xisaabiyaha", 60, 78);

  // Big Amount Highlight
  doc.setFillColor(16, 185, 129, 0.1);
  doc.rect(12, 94, 124, 20, "F");
  doc.setDrawColor(16, 185, 129);
  doc.rect(12, 94, 124, 20, "S");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129);
  doc.text("CADADKA LA BIXIYEY (AMOUNT PAID):", 16, 102);

  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text(`${currency} ${Number(pay.amount || 0).toLocaleString()}`, 130, 107, { align: "right" });

  // Signature & Footer
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.line(16, 130, 56, 130);
  doc.text("Saxiixa / Official Stamp", 16, 134);

  doc.text("Waad ku mahadsan tahay bixintaada waqtiga ku habboon!", 74, 142, { align: "center" });

  doc.save(`Receipt_${pay.receiptNumber}_${pay.studentName?.replace(/\s+/g, "_")}.pdf`);
}

export function generatePayslipPDF(schoolName: string, currency: string, pr: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });

  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, 148, 6, "F");

  doc.setTextColor(17, 24, 39);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.text(schoolName || "DUGSI PRO", 12, 17);

  doc.setTextColor(107, 114, 128);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Baaqa Mushahaarka Shaqaalaha (Official Salary Payslip)", 12, 22);

  doc.setTextColor(124, 58, 237);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.text("PAYSLIP", 136, 17, { align: "right" });

  doc.setTextColor(75, 85, 99);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Xilliga (Period): ${pr.payrollPeriod}`, 136, 22, { align: "right" });
  doc.text(`Taariikh: ${pr.paymentDate}`, 136, 26, { align: "right" });

  doc.setDrawColor(229, 231, 235);
  doc.line(12, 30, 136, 30);

  // Employee details
  doc.setFillColor(249, 250, 251);
  doc.rect(12, 34, 124, 22, "F");
  doc.rect(12, 34, 124, 22, "S");

  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  doc.text("Magaca Shaqaalaha:", 16, 41);
  doc.text("Doorka / Qaybta:", 16, 48);

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text(pr.employeeName, 55, 41);
  doc.text(`${pr.employeeType} - ${pr.roleOrDepartment || "General Staff"}`, 55, 48);

  // Breakdown
  const tableData = [
    ["Mushaharka Aasaasiga ah (Basic Salary)", `${currency} ${Number(pr.basicSalary || 0).toLocaleString()}`],
    ["Gunnooyinka (Allowances / Bonus)", `+ ${currency} ${Number(pr.allowances || 0).toLocaleString()}`],
    ["Jaridda (Deductions / Penalties)", `- ${currency} ${Number(pr.deductions || 0).toLocaleString()}`],
    ["Mushaharka Guud (Gross Salary)", `${currency} ${Number(pr.grossSalary || 0).toLocaleString()}`]
  ];

  autoTable(doc, {
    startY: 60,
    head: [["Qaybaha Mushahaarka (Item)", "Cadadka (Amount)"]],
    body: tableData,
    headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 8.5, cellPadding: 2.5, font: "Helvetica" },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "right", fontStyle: "bold" }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Net Salary Box
  doc.setFillColor(245, 243, 255);
  doc.rect(12, finalY, 124, 18, "F");
  doc.setDrawColor(124, 58, 237);
  doc.rect(12, finalY, 124, 18, "S");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(124, 58, 237);
  doc.text("MUSHAHARKA SAUFIGA AH (NET SALARY):", 16, finalY + 11);

  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text(`${currency} ${Number(pr.netSalary || 0).toLocaleString()}`, 130, finalY + 12, { align: "right" });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text(`Qaabka Bixinta: ${pr.paymentMethod}  |  Xaaladda: ${pr.status.toUpperCase()}`, 12, finalY + 25);
  doc.text("Saxiixa Shaqaalaha: ____________________", 12, finalY + 36);
  doc.text("Saxiixa Maamulka: ____________________", 80, finalY + 36);

  doc.save(`Payslip_${pr.employeeName.replace(/\s+/g, "_")}_${pr.payrollPeriod}.pdf`);
}
