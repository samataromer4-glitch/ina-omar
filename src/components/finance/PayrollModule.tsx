import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Download, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  X, 
  Users, 
  DollarSign,
  AlertCircle
} from "lucide-react";
import type { PayrollRecord } from "../../types";
import { formatMoney, exportToExcel, generatePayslipPDF } from "./financeUtils";

interface PayrollModuleProps {
  payroll?: PayrollRecord[];
  teachers?: any[];
  staff?: any[];
  currency: string;
  schoolName: string;
  onRefresh: () => void;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({
  payroll = [],
  teachers = [],
  staff = [],
  currency,
  schoolName,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    employeeType: "Teacher",
    employeeId: "",
    employeeName: "",
    roleOrDepartment: "Teaching Staff",
    basicSalary: 200,
    allowances: 0,
    deductions: 0,
    paymentMethod: "Bank",
    paymentDate: new Date().toISOString().split("T")[0],
    payrollPeriod: "September 2026",
    status: "Draft",
    notes: ""
  });

  const allEmployees = [
    ...(teachers || []).map((t) => ({ id: t.id, name: t.fullName || t.name, type: "Teacher", role: t.specialization || "Macallin" })),
    ...(staff || []).map((s) => ({ id: s.id, name: s.fullName || s.name, type: "Staff", role: s.role || "Shaqaale" }))
  ];

  const handleSelectEmployee = (id: string) => {
    const emp = allEmployees.find((e) => e.id === id);
    if (emp) {
      setForm((prev) => ({
        ...prev,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeType: emp.type as any,
        roleOrDepartment: emp.role
      }));
    }
  };

  const grossSalary = Number(form.basicSalary || 0) + Number(form.allowances || 0);
  const netSalary = Math.max(0, grossSalary - Number(form.deductions || 0));

  const filteredPayroll = (payroll || []).filter((p) => {
    if (statusFilter !== "All" && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.employeeName?.toLowerCase().includes(q);
      const matchPeriod = p.payrollPeriod?.toLowerCase().includes(q);
      if (!matchName && !matchPeriod) return false;
    }
    return true;
  });

  const totalNet = filteredPayroll.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeName) {
      alert("Fadlan dooro shaqaalaha ama macallinka");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          grossSalary,
          netSalary
        })
      });
      if (res.ok) {
        setShowModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    if (!confirm("Ma hubtaa inaad bixiso mushahaarkan? Tani waxay si toos ah u qori doontaa kharashka mushahaarka (Record as paid salary).")) return;
    try {
      const res = await fetch(`/api/payroll/${id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentDate: new Date().toISOString().split("T")[0] })
      });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ma hubtaa inaad tirtirto diiwaankan?")) return;
    try {
      const res = await fetch(`/api/payroll/${id}`, { method: "DELETE" });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    const data = filteredPayroll.map((p) => ({
      Employee: p.employeeName,
      Type: p.employeeType,
      Role: p.roleOrDepartment,
      Period: p.payrollPeriod,
      "Basic Salary": p.basicSalary,
      Allowances: p.allowances,
      Deductions: p.deductions,
      "Gross Salary": p.grossSalary,
      "Net Salary": p.netSalary,
      Status: p.status,
      "Payment Date": p.paymentDate
    }));
    exportToExcel(`Payroll_${schoolName.replace(/\s+/g, "_")}`, "Payroll", data);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Raadi macallin, shaqaale, ama xilli..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#ffffff10] rounded-sm text-xs text-[#a3a3a3] px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Approved">Approved</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0f0f0f] hover:bg-[#ffffff05] text-[#a3a3a3] hover:text-[#e5e5e5] text-[10px] uppercase font-bold tracking-wider cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-purple-600 hover:bg-purple-500 text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Diyaari Mushahaar (Add Payroll)</span>
          </button>
        </div>
      </div>

      {/* Summary Band */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0a0a] border border-[#ffffff08] rounded-sm text-xs">
        <span className="text-[#737373]">
          Shaqaalaha Liiska ku jira: <strong className="text-[#e5e5e5] font-mono">{filteredPayroll.length}</strong> qof
        </span>
        <span className="text-[#737373]">
          Wadarta Mushahaarka Saufiga ah: <strong className="text-purple-400 font-mono text-sm ml-1">{formatMoney(totalNet, currency)}</strong>
        </span>
      </div>

      {/* Payroll Table */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-[#ffffff10] text-[10px] uppercase font-bold tracking-widest text-[#737373]">
                <th className="px-5 py-3.5">Shaqaalaha</th>
                <th className="px-5 py-3.5">Doorka / Nooca</th>
                <th className="px-5 py-3.5">Xilliga (Period)</th>
                <th className="px-5 py-3.5 text-right">Aasaasiga (Basic)</th>
                <th className="px-5 py-3.5 text-right">Gunno (Allow.)</th>
                <th className="px-5 py-3.5 text-right">Jarid (Deduct.)</th>
                <th className="px-5 py-3.5 text-right">Saufiga (Net)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ficillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff08] text-xs">
              {filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[#737373] uppercase tracking-wider text-[10px]">
                    Wax diiwaan mushahaar ah ma jiraan.
                  </td>
                </tr>
              ) : (
                filteredPayroll.map((p) => (
                  <tr key={p.id} className="hover:bg-[#ffffff02] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-[#e5e5e5]">{p.employeeName}</td>
                    <td className="px-5 py-3.5 text-[#a3a3a3]">
                      <span className="text-xs">{p.roleOrDepartment}</span>
                      <span className="text-[10px] text-[#737373] block">{p.employeeType}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[#a3a3a3]">{p.payrollPeriod}</td>
                    <td className="px-5 py-3.5 font-mono text-[#e5e5e5] text-right">
                      {formatMoney(p.basicSalary, currency)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-emerald-400 text-right">
                      +{formatMoney(p.allowances, currency)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-rose-400 text-right">
                      -{formatMoney(p.deductions, currency)}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-purple-400 text-right text-sm">
                      {formatMoney(p.netSalary, currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-xs text-[9px] font-bold uppercase tracking-wider ${
                          p.status === "Paid"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : p.status === "Approved"
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      {p.status !== "Paid" && (
                        <button
                          onClick={() => handleMarkAsPaid(p.id)}
                          className="p-1.5 rounded-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 inline-block cursor-pointer"
                          title="Bixi Mushahaarka (Mark as Paid)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => generatePayslipPDF(schoolName, currency, p)}
                        className="p-1.5 rounded-sm bg-[#ffffff05] hover:bg-[#ffffff10] text-[#a3a3a3] hover:text-[#e5e5e5] border border-[#ffffff10] inline-block cursor-pointer"
                        title="Daabac Payslip PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-sm bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 inline-block cursor-pointer"
                        title="Tirtir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PAYROLL MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm w-full max-w-lg shadow-2xl p-6 relative">
            <button
              className="absolute right-4 top-4 p-1.5 rounded-sm text-[#737373] hover:bg-[#ffffff05]"
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold font-serif text-[#f5f5f5] mb-5">
              Diyaari Mushahaar (Prepare Payroll)
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                  Dooro Macallinka ama Shaqaalaha *
                </label>
                <select
                  value={form.employeeId}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">-- Dooro Qofka --</option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.type}: {emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Xilliga Mushahaarka (Period) *
                  </label>
                  <input
                    type="text"
                    value={form.payrollPeriod}
                    onChange={(e) => setForm({ ...form, payrollPeriod: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Qaabka Bixinta *
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-purple-500"
                  >
                    <option value="Bank">Bank</option>
                    <option value="Cash">Cash</option>
                    <option value="EVC Plus">EVC Plus</option>
                    <option value="Zaad">Zaad</option>
                  </select>
                </div>
              </div>

              {/* Salary Breakdown Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Aasaasiga (Basic) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.basicSalary}
                    onChange={(e) => setForm({ ...form, basicSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-purple-500 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Gunno (Allowances)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.allowances}
                    onChange={(e) => setForm({ ...form, allowances: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-purple-500 font-mono text-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Jarid (Deductions)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.deductions}
                    onChange={(e) => setForm({ ...form, deductions: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-purple-500 font-mono text-rose-400"
                  />
                </div>
              </div>

              {/* Net Salary Preview */}
              <div className="p-3 bg-[#0a0a0a] border border-[#ffffff0a] rounded-sm flex items-center justify-between">
                <span className="text-xs text-[#a3a3a3]">Mushaharka Saufiga ah (Net Salary):</span>
                <span className="font-mono font-bold text-lg text-purple-400">
                  {formatMoney(netSalary, currency)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Taariikhda Bixinta
                  </label>
                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">
                    Xaaladda (Status)
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs text-[#e5e5e5] focus:outline-none focus:border-purple-500"
                  >
                    <option value="Draft">Draft (Qabyo)</option>
                    <option value="Approved">Approved (La Ansixiyay)</option>
                    <option value="Paid">Paid (La Bixiyay)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#737373] hover:text-[#e5e5e5] text-[10px] uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-sm bg-purple-600 hover:bg-purple-500 text-white text-[10px] uppercase font-bold tracking-wider disabled:opacity-50"
                >
                  {submitting ? "Kaydinaya..." : "Save Payroll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
