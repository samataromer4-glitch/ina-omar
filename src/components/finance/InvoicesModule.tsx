import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Download, 
  Printer, 
  Send, 
  Trash2, 
  Edit2, 
  CreditCard, 
  X,
  Layers,
  CheckCircle2
} from "lucide-react";
import type { Invoice, FeeStructure } from "../../types";
import { formatMoney, exportToExcel, generateInvoicePDF, openWhatsApp } from "./financeUtils";
import { PageHeader } from "../ui/PageHeader";
import { MetricCard } from "../ui/MetricCard";
import { FilterBar, FilterChip } from "../ui/FilterBar";
import { StatusBadge } from "../ui/StatusBadge";
import { EmptyState } from "../ui/EmptyState";

interface InvoicesModuleProps {
  invoices?: Invoice[];
  students?: any[];
  classes?: any[];
  feeStructures?: FeeStructure[];
  currency: string;
  schoolName: string;
  onRefresh: () => void;
  onRecordPayment: (invoice: Invoice) => void;
}

export const InvoicesModule: React.FC<InvoicesModuleProps> = ({
  invoices = [],
  students = [],
  classes = [],
  feeStructures = [],
  currency,
  schoolName,
  onRefresh,
  onRecordPayment
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Single Invoice Form state
  const [singleForm, setSingleForm] = useState({
    studentId: "",
    title: "Waxbarasho / Tuition",
    category: "Monthly Tuition",
    amount: 50,
    discount: 0,
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    notes: ""
  });

  // Bulk Invoice Form state
  const [bulkForm, setBulkForm] = useState({
    targetClass: "All",
    selectedFeeStructureIds: [] as string[],
    month: "September",
    year: new Date().getFullYear(),
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    customAmount: 50
  });

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== "All" && inv.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (classFilter !== "All" && inv.className !== classFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = inv.invoiceNumber?.toLowerCase().includes(q);
      const matchName = inv.studentName?.toLowerCase().includes(q);
      const matchPhone = inv.guardianPhone?.includes(q);
      if (!matchNum && !matchName && !matchPhone) return false;
    }
    return true;
  });

  // Handlers
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.studentId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(singleForm)
      });
      if (res.ok) {
        setShowCreateModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/invoices/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetClass: bulkForm.targetClass,
          feeStructureIds: bulkForm.selectedFeeStructureIds,
          month: bulkForm.month,
          year: bulkForm.year,
          dueDate: bulkForm.dueDate,
          customAmount: bulkForm.customAmount
        })
      });
      if (res.ok) {
        setShowBulkModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Ma hubtaa inaad tirtirto biilkan? (Confirm invoice deletion)")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendWhatsApp = (inv: Invoice) => {
    const student = students.find((s) => s.id === inv.studentId);
    const phone = inv.guardianPhone || student?.guardianPhone;
    if (!phone) {
      alert("Waalidka telefoonkiisa lama hayo (No guardian phone number on record)");
      return;
    }
    const message = `Salaamu Calaykum. Waxaan ku ogeysiinaynaa in biilka waxbarashada ee ardayga: ${inv.studentName} uu diyaar yahay.\nBiilka #: ${inv.invoiceNumber}\nCadadka Guud: ${currency} ${inv.total}\nBaaqiga Hada: ${currency} ${inv.balance}\nXilliga Bixinta: ${inv.dueDate}\nMahadsanidin.`;
    openWhatsApp(phone, message);
  };

  const handleExportExcel = () => {
    const exportData = filteredInvoices.map((inv) => ({
      "Invoice Number": inv.invoiceNumber,
      Student: inv.studentName,
      Class: inv.className,
      "Guardian Phone": inv.guardianPhone,
      "Total Amount": inv.total,
      "Paid Amount": inv.paidAmount,
      Balance: inv.balance,
      Status: inv.status,
      "Issue Date": inv.issueDate,
      "Due Date": inv.dueDate
    }));
    exportToExcel(`Invoices_${schoolName.replace(/\s+/g, "_")}`, "Invoices", exportData);
  };

  const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
  const totalBalance = invoices.reduce((sum, i) => sum + (Number(i.balance) || 0), 0);
  const pendingCount = invoices.filter((i) => (Number(i.balance) || 0) > 0).length;

  const activeChips: FilterChip[] = [];
  if (statusFilter !== "All") {
    activeChips.push({
      id: "status",
      label: "Xaaladda",
      value: statusFilter,
      onRemove: () => setStatusFilter("All")
    });
  }
  if (classFilter !== "All") {
    activeChips.push({
      id: "class",
      label: "Fasalka",
      value: classFilter,
      onRemove: () => setClassFilter("All")
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Maamulka Biilasha / Invoices & Fee Billing"
        subtitle="Abuur biilal cusub, u samee dufcad ahaan (bulk), la soco lacagaha baaqiga ah, una dir waalidka PDF iyo WhatsApp."
        badge={`${invoices.length} Biil`}
        badgeColor="text-emerald-400 bg-emerald-950/40 border-emerald-800/40"
        breadcrumbs={[
          { label: "Maamulka" },
          { label: "Maaliyadda" },
          { label: "Biilasha (Invoices)" }
        ]}
        primaryAction={{
          label: "Abuur Biil (New Invoice)",
          icon: Plus,
          onClick: () => {
            setSingleForm({
              studentId: students[0]?.id || "",
              title: "Waxbarasho / Tuition",
              category: "Monthly Tuition",
              amount: 50,
              discount: 0,
              dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
              notes: ""
            });
            setShowCreateModal(true);
          }
        }}
        secondaryActions={[
          {
            label: "Dufcad (Bulk Generate)",
            icon: Layers,
            onClick: () => setShowBulkModal(true)
          },
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
          title="Wadarta Biilasha (Invoiced)"
          value={formatMoney(totalInvoiced, currency)}
          subtitle={`${invoices.length} biilal guud ahaan`}
          icon={CheckCircle2}
          variant="default"
        />
        <MetricCard
          title="Lacagta La Qabtay (Collected)"
          value={formatMoney(totalPaid, currency)}
          subtitle={`${totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0}% ee wadarta biilasha`}
          icon={CheckCircle2}
          variant="success"
        />
        <MetricCard
          title="Baaqiga Dhiman (Outstanding)"
          value={formatMoney(totalBalance, currency)}
          subtitle={`${pendingCount} arday ayaa baaqi ku yahay`}
          icon={CreditCard}
          variant="warning"
        />
        <MetricCard
          title="Biilasha Sugaya (Pending)"
          value={pendingCount}
          subtitle="Biilal aan wali si buuxda loo bixin"
          icon={CreditCard}
          variant={pendingCount > 0 ? "danger" : "success"}
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Raadi biil #: (INV-...), magaca ardayda, ama telefoon..."
        activeFilterChips={activeChips}
        onClearAllFilters={() => {
          setSearchQuery("");
          setStatusFilter("All");
          setClassFilter("All");
        }}
        filteredResultsCount={filteredInvoices.length}
        totalResultsCount={invoices.length}
        resultLabel="biil"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
          >
            <option value="All">Dhammaan Xaaladaha (All Status)</option>
            <option value="Unpaid">Aan La Bixin (Unpaid)</option>
            <option value="Partially Paid">Qayb La Bixiyey (Partial)</option>
            <option value="Paid">Si Buuxda Loo Bixiyey (Paid)</option>
            <option value="Overdue">Wakhtigu Ka Dhacay (Overdue)</option>
          </select>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
          >
            <option value="All">Dhammaan Fasallada (All Classes)</option>
            {(classes || []).map((c) => (
              <option key={c.id} value={c.className}>{c.className}</option>
            ))}
          </select>
        </div>
      </FilterBar>

      {/* Invoices Table Card */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-[#ffffff10] text-[10px] uppercase font-bold tracking-widest text-[#737373]">
                <th className="px-5 py-3.5">Biilka #</th>
                <th className="px-5 py-3.5">Ardayga (Student)</th>
                <th className="px-5 py-3.5">Fasalka</th>
                <th className="px-5 py-3.5 text-right">Cadadka</th>
                <th className="px-5 py-3.5 text-right">Bixiyay</th>
                <th className="px-5 py-3.5 text-right">Baaqi</th>
                <th className="px-5 py-3.5">Xilliga (Due)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ficillo (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff08] text-xs">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8">
                    <EmptyState
                      icon={CreditCard}
                      title="Wax biilal ah lama helin"
                      description={
                        searchQuery || statusFilter !== "All" || classFilter !== "All"
                          ? "Isku day inaad beddesho shaandhada raadinta ama tirtirto."
                          : "Wali lama abuurin wax biilal ah. Guji 'Abuur Biil' si aad u bilowdo."
                      }
                      action={{
                        label: "Abuur Biil Cusub",
                        onClick: () => {
                          setSingleForm({
                            studentId: students[0]?.id || "",
                            title: "Waxbarasho / Tuition",
                            category: "Monthly Tuition",
                            amount: 50,
                            discount: 0,
                            dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
                            notes: ""
                          });
                          setShowCreateModal(true);
                        }
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const statusVariant =
                    inv.status === "Paid"
                      ? "success"
                      : inv.status === "Partially Paid"
                      ? "warning"
                      : "danger";

                  return (
                    <tr key={inv.id} className="hover:bg-[#ffffff02] transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[#a3a3a3] font-semibold">{inv.invoiceNumber}</td>
                      <td className="px-5 py-3.5 font-bold text-[#e5e5e5]">
                        <div>{inv.studentName}</div>
                        <div className="text-[10px] text-[#737373] font-normal">{inv.guardianPhone || "No Phone"}</div>
                      </td>
                      <td className="px-5 py-3.5 text-[#a3a3a3]">{inv.className}</td>
                      <td className="px-5 py-3.5 font-mono font-bold text-[#e5e5e5] text-right">
                        {formatMoney(inv.total, currency)}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-emerald-400 text-right">
                        {formatMoney(inv.paidAmount, currency)}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-amber-400 text-right">
                        {formatMoney(inv.balance, currency)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#737373]">{inv.dueDate}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          label={inv.status}
                          variant={statusVariant}
                          dot
                        />
                      </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      {inv.balance > 0 && (
                        <button
                          onClick={() => onRecordPayment(inv)}
                          className="p-1.5 rounded-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 inline-block cursor-pointer"
                          title="Qabo Lacag (Record Payment)"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => generateInvoicePDF(schoolName, currency, inv)}
                        className="p-1.5 rounded-sm bg-[#ffffff05] hover:bg-[#ffffff10] text-[#a3a3a3] hover:text-[#e5e5e5] border border-[#ffffff10] inline-block cursor-pointer"
                        title="Dhoofi PDF Invoice"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleSendWhatsApp(inv)}
                        className="p-1.5 rounded-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 inline-block cursor-pointer"
                        title="Ku dir WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(inv.id)}
                        className="p-1.5 rounded-sm bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 inline-block cursor-pointer"
                        title="Tirtir Biilka"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SINGLE INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm w-full max-w-lg shadow-2xl p-6 relative">
            <button
              className="absolute right-4 top-4 p-1.5 rounded-sm text-[#737373] hover:bg-[#ffffff05]"
              onClick={() => setShowCreateModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold font-serif text-[#f5f5f5] mb-5">
              Abuur Biil Cusub (Create Single Invoice)
            </h2>
            <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                  Dooro Ardayga (Select Student) *
                </label>
                <select
                  value={singleForm.studentId}
                  onChange={(e) => setSingleForm({ ...singleForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                  required
                >
                  <option value="">-- Dooro Arday --</option>
                  {(students || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.class})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Nooca Khidmadda (Category) *
                  </label>
                  <select
                    value={singleForm.category}
                    onChange={(e) => setSingleForm({ ...singleForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="Monthly Tuition">Monthly Tuition</option>
                    <option value="Term Fee">Term Fee</option>
                    <option value="Admission Fee">Admission Fee</option>
                    <option value="Exam Fee">Exam Fee</option>
                    <option value="Transport Fee">Transport Fee</option>
                    <option value="Library Fee">Library Fee</option>
                    <option value="Other Fee">Other Fee</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Qeexid / Title *
                  </label>
                  <input
                    type="text"
                    value={singleForm.title}
                    onChange={(e) => setSingleForm({ ...singleForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Cadadka ({currency}) *
                  </label>
                  <input
                    type="number"
                    value={singleForm.amount}
                    onChange={(e) => setSingleForm({ ...singleForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Sicir-dhimis ({currency})
                  </label>
                  <input
                    type="number"
                    value={singleForm.discount}
                    onChange={(e) => setSingleForm({ ...singleForm, discount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Xilliga Bixinta (Due Date) *
                  </label>
                  <input
                    type="date"
                    value={singleForm.dueDate}
                    onChange={(e) => setSingleForm({ ...singleForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#737373] hover:text-[#e5e5e5] text-[10px] uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-sm bg-[#e5e5e5] hover:bg-white text-[#0a0a0a] text-[10px] uppercase font-bold tracking-wider disabled:opacity-50"
                >
                  {submitting ? "Abuuraya..." : "Save Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK INVOICE MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm w-full max-w-lg shadow-2xl p-6 relative">
            <button
              className="absolute right-4 top-4 p-1.5 rounded-sm text-[#737373] hover:bg-[#ffffff05]"
              onClick={() => setShowBulkModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold font-serif text-[#f5f5f5] mb-2">
              Abuur Biilal Wadajir ah (Bulk Invoice Generation)
            </h2>
            <p className="text-[11px] text-[#737373] mb-5">
              Si toos ah ugu samee biil dhammaan ardayda fasal ama dugsiga oo dhan
            </p>
            <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Fasalka La Beegsanayo (Target Class) *
                  </label>
                  <select
                    value={bulkForm.targetClass}
                    onChange={(e) => setBulkForm({ ...bulkForm, targetClass: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="All">Dhammaan Fasallada (All Classes)</option>
                    {(classes || []).map((c) => (
                      <option key={c.id} value={c.className}>{c.className}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Cadadka Khidmadda ({currency}) *
                  </label>
                  <input
                    type="number"
                    value={bulkForm.customAmount}
                    onChange={(e) => setBulkForm({ ...bulkForm, customAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Bisha (Month) *
                  </label>
                  <select
                    value={bulkForm.month}
                    onChange={(e) => setBulkForm({ ...bulkForm, month: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                  >
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Sanadka (Year) *
                  </label>
                  <input
                    type="number"
                    value={bulkForm.year}
                    onChange={(e) => setBulkForm({ ...bulkForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                  Xilliga Bixinta Ugu Dambaysa (Due Date) *
                </label>
                <input
                  type="date"
                  value={bulkForm.dueDate}
                  onChange={(e) => setBulkForm({ ...bulkForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#737373] hover:text-[#e5e5e5] text-[10px] uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-sm bg-purple-600 hover:bg-purple-500 text-white text-[10px] uppercase font-bold tracking-wider disabled:opacity-50"
                >
                  {submitting ? "Abuuraya..." : "Generate Bulk Invoices"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
