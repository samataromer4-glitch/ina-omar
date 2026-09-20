import React, { useState, useMemo } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  ArrowLeft, 
  Check, 
  Filter, 
  Layers,
  Printer,
  Table
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, SchoolClass, FeeRecord } from '../../types';

interface StudentExportViewProps {
  students: Student[];
  classes: SchoolClass[];
  fees: FeeRecord[];
  settings: {
    schoolName: string;
    currency: string;
    [key: string]: any;
  };
  onCancel: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  theme?: 'light' | 'dark';
}

export default function StudentExportView({
  students,
  classes,
  fees,
  settings,
  onCancel,
  showToast,
  theme = 'dark'
}: StudentExportViewProps) {
  // Scope selector
  const [scope, setScope] = useState<'all' | 'active' | 'inactive' | 'archived' | 'class'>('all');
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.className || '');
  const [format, setFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');

  // Column Selector
  const [selectedColumns, setSelectedColumns] = useState({
    id: true,
    fullName: true,
    class: true,
    gender: true,
    guardianPhone: true,
    guardianName: true,
    status: true,
    feeStatus: true,
    address: true,
    registrationDate: true
  });

  // Calculate filtered students based on scope
  const targetStudents = useMemo(() => {
    if (scope === 'active') return students.filter(s => s.status === 'active');
    if (scope === 'inactive') return students.filter(s => s.status === 'inactive');
    if (scope === 'archived') return students.filter(s => s.status === 'archived');
    if (scope === 'class' && selectedClass) return students.filter(s => s.class === selectedClass);
    return students;
  }, [students, scope, selectedClass]);

  const monthsList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonth = monthsList[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  const getStudentFeeStatus = (studentId: string) => {
    const studentFee = fees.find(f => f.studentId === studentId && f.month === currentMonth && f.year === currentYear);
    if (!studentFee) return { status: 'unpaid', paid: 0, balance: settings.feeAmount || 0 };
    return {
      status: studentFee.status,
      paid: studentFee.paidAmount,
      balance: Math.max(0, studentFee.amount - studentFee.paidAmount)
    };
  };

  // Toggle all columns
  const handleToggleAllColumns = (val: boolean) => {
    setSelectedColumns({
      id: val,
      fullName: val,
      class: val,
      gender: val,
      guardianPhone: val,
      guardianName: val,
      status: val,
      feeStatus: val,
      address: val,
      registrationDate: val
    });
  };

  // Perform Export
  const handleExport = () => {
    if (targetStudents.length === 0) {
      showToast("Ma jiraan arday buuxisa shuruudaha la doortay", "warning");
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];

    // Excel or CSV Export
    if (format === 'excel' || format === 'csv') {
      const rows = targetStudents.map((s, idx) => {
        const fee = getStudentFeeStatus(s.id);
        const row: Record<string, any> = { "#": idx + 1 };

        if (selectedColumns.id) row["Student ID"] = s.id;
        if (selectedColumns.fullName) row["Full Name"] = s.fullName;
        if (selectedColumns.class) row["Class"] = s.class;
        if (selectedColumns.gender) row["Gender"] = s.gender;
        if (selectedColumns.guardianPhone) row["Guardian Phone"] = s.guardianPhone || "-";
        if (selectedColumns.guardianName) row["Guardian Name"] = s.guardianName || "-";
        if (selectedColumns.status) row["Status"] = s.status || "active";
        if (selectedColumns.feeStatus) row["Fee Status"] = `${fee.status} (Bal: ${settings.currency} ${fee.balance})`;
        if (selectedColumns.address) row["Address"] = s.address || "-";
        if (selectedColumns.registrationDate) row["Registration Date"] = s.createdAt || "-";

        return row;
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ardayda");

      if (format === 'excel') {
        XLSX.writeFile(wb, `DugsiPro_Students_${scope}_${dateStr}.xlsx`);
        showToast(`Faylka Excel waa la dhoofiyey (${targetStudents.length} arday)`, "success");
      } else {
        XLSX.writeFile(wb, `DugsiPro_Students_${scope}_${dateStr}.csv`, { bookType: 'csv' });
        showToast(`Faylka CSV waa la dhoofiyey (${targetStudents.length} arday)`, "success");
      }
      return;
    }

    // PDF Export
    if (format === 'pdf') {
      try {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // Header
        doc.setFillColor(15, 15, 15);
        doc.rect(0, 0, 210, 28, 'F');

        doc.setTextColor(245, 245, 245);
        doc.setFontSize(15);
        doc.setFont('helvetica', 'bold');
        doc.text(settings.schoolName || "DUGSI PRO SCHOOL", 14, 13);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(167, 139, 250);
        doc.text(`STUDENT DIRECTORY — SCOPE: ${scope.toUpperCase()}`, 14, 21);

        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text(`Generated: ${new Date().toLocaleDateString()} | Total: ${targetStudents.length} Students`, 135, 21);

        // Build Table Columns based on selection
        const headers: string[] = ['#'];
        if (selectedColumns.id) headers.push('ID');
        if (selectedColumns.fullName) headers.push('NAME');
        if (selectedColumns.class) headers.push('CLASS');
        if (selectedColumns.gender) headers.push('GENDER');
        if (selectedColumns.guardianPhone) headers.push('PHONE');
        if (selectedColumns.status) headers.push('STATUS');

        const tableBody = targetStudents.map((s, idx) => {
          const row: any[] = [idx + 1];
          if (selectedColumns.id) row.push(s.id);
          if (selectedColumns.fullName) row.push(s.fullName);
          if (selectedColumns.class) row.push(s.class);
          if (selectedColumns.gender) row.push(s.gender);
          if (selectedColumns.guardianPhone) row.push(s.guardianPhone || '-');
          if (selectedColumns.status) row.push((s.status || 'active').toUpperCase());
          return row;
        });

        autoTable(doc, {
          head: [headers],
          body: tableBody,
          startY: 34,
          theme: 'striped',
          headStyles: {
            fillColor: [124, 58, 237],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: 2.5
          },
          styles: {
            fontSize: 8,
            cellPadding: 2.5
          },
          alternateRowStyles: {
            fillColor: [248, 248, 250]
          }
        });

        doc.save(`DugsiPro_Students_${scope}_${dateStr}.pdf`);
        showToast("Faylka PDF waa la daabacay", "success");
      } catch (err) {
        console.error(err);
        showToast("Khalad ayaa dhacay dhoofinta PDF", "error");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ffffff10] pb-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#737373] font-mono mb-1">
            <span className="hover:text-[#c4b5fd] cursor-pointer" onClick={onCancel}>Students</span>
            <span>/</span>
            <span className="text-[#c4b5fd] font-bold">Export Students</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif italic font-bold text-[#f5f5f5] tracking-tight">
            Dhoofinta Xogta Ardayda (Export Center)
          </h1>
          <p className="text-xs text-[#a3a3a3] mt-1">
            Kala soo bax xogta ardayda qaabab kala duwan sida Excel, CSV, ama PDF adigoo dooranaya qaybaha aad u baahan tahay.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-sm border border-[#ffffff10] hover:bg-[#ffffff05] text-[#a3a3a3] hover:text-[#e5e5e5] uppercase tracking-wider text-[11px] font-bold transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ka Noqo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Scope & Format */}
        <div className="space-y-6 md:col-span-2">
          
          {/* SECTION 1: Scope Selection */}
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-[#ffffff08] pb-3">
              <div className="w-7 h-7 rounded-sm bg-[#7c3aed]/10 text-[#c4b5fd] flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#f5f5f5]">
                Dooro Ardayda Aad Dhoofinayso (Target Audience Scope)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-4 rounded-sm border text-left transition-all ${
                  scope === 'all'
                    ? 'bg-[#7c3aed]/10 border-[#7c3aed] text-white'
                    : 'bg-[#0a0a0a] border-[#ffffff08] text-[#a3a3a3] hover:border-[#ffffff20]'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider">Dhammaan Ardayda (All)</div>
                <div className="text-[11px] text-[#737373] mt-1">
                  Guud ahaan diiwaanka ({students.length} arday)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('active')}
                className={`p-4 rounded-sm border text-left transition-all ${
                  scope === 'active'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white'
                    : 'bg-[#0a0a0a] border-[#ffffff08] text-[#a3a3a3] hover:border-[#ffffff20]'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Firfircoon Kaliya (Active)</div>
                <div className="text-[11px] text-[#737373] mt-1">
                  Ardayda hadda dhigata ({students.filter(s => s.status === 'active').length} arday)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('inactive')}
                className={`p-4 rounded-sm border text-left transition-all ${
                  scope === 'inactive'
                    ? 'bg-amber-500/10 border-amber-500 text-white'
                    : 'bg-[#0a0a0a] border-[#ffffff08] text-[#a3a3a3] hover:border-[#ffffff20]'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Aan Firfircoonayn (Inactive)</div>
                <div className="text-[11px] text-[#737373] mt-1">
                  Ardayda fasax ama hakad ku jira ({students.filter(s => s.status === 'inactive').length} arday)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('archived')}
                className={`p-4 rounded-sm border text-left transition-all ${
                  scope === 'archived'
                    ? 'bg-zinc-500/20 border-zinc-400 text-white'
                    : 'bg-[#0a0a0a] border-[#ffffff08] text-[#a3a3a3] hover:border-[#ffffff20]'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ardayda Kaydsan (Archived)</div>
                <div className="text-[11px] text-[#737373] mt-1">
                  Diiwaanka hore ee la keydiyey ({students.filter(s => s.status === 'archived').length} arday)
                </div>
              </button>

              <div className={`p-4 rounded-sm border col-span-1 sm:col-span-2 transition-all ${
                scope === 'class'
                  ? 'bg-[#7c3aed]/10 border-[#7c3aed]'
                  : 'bg-[#0a0a0a] border-[#ffffff08]'
              }`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => setScope('class')}>
                    <input
                      type="radio"
                      checked={scope === 'class'}
                      onChange={() => setScope('class')}
                      className="accent-[#7c3aed]"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#e5e5e5]">Fasal Gaar ah (Specific Class)</span>
                  </div>
                  {scope === 'class' && (
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="px-3 py-1.5 rounded-sm bg-[#0f0f0f] border border-[#ffffff15] text-xs text-white uppercase focus:outline-none focus:border-[#7c3aed]"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.className}>{c.className}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Format Selection */}
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-[#ffffff08] pb-3">
              <div className="w-7 h-7 rounded-sm bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#f5f5f5]">
                Nooca Faylka (Export Format)
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`p-4 rounded-sm border text-center transition-all flex flex-col items-center gap-2 ${
                  format === 'excel'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : 'bg-[#0a0a0a] border-[#ffffff08] text-[#737373] hover:border-[#ffffff20]'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-wider">Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-4 rounded-sm border text-center transition-all flex flex-col items-center gap-2 ${
                  format === 'csv'
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                    : 'bg-[#0a0a0a] border-[#ffffff08] text-[#737373] hover:border-[#ffffff20]'
                }`}
              >
                <Table className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-wider">CSV (.csv)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-4 rounded-sm border text-center transition-all flex flex-col items-center gap-2 ${
                  format === 'pdf'
                    ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                    : 'bg-[#0a0a0a] border-[#ffffff08] text-[#737373] hover:border-[#ffffff20]'
                }`}
              >
                <FileText className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-wider">PDF Document</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Column Selector & Action Card */}
        <div className="space-y-6">
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#ffffff08] pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#f5f5f5]">
                Tiirarka (Columns)
              </h2>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleToggleAllColumns(true)}
                  className="text-[#c4b5fd] hover:underline"
                >
                  Dhammaan
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => handleToggleAllColumns(false)}
                  className="text-[#737373] hover:underline"
                >
                  Ka Qaad
                </button>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-[#e5e5e5]">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={selectedColumns.id}
                  onChange={(e) => setSelectedColumns({ ...selectedColumns, id: e.target.checked })}
                  className="accent-[#7c3aed]"
                />
                <span>Student ID</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={selectedColumns.fullName}
                  onChange={(e) => setSelectedColumns({ ...selectedColumns, fullName: e.target.checked })}
                  className="accent-[#7c3aed]"
                />
                <span>Magaca oo Buuxa (Full Name)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={selectedColumns.class}
                  onChange={(e) => setSelectedColumns({ ...selectedColumns, class: e.target.checked })}
                  className="accent-[#7c3aed]"
                />
                <span>Fasalka (Class)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={selectedColumns.gender}
                  onChange={(e) => setSelectedColumns({ ...selectedColumns, gender: e.target.checked })}
                  className="accent-[#7c3aed]"
                />
                <span>Jinsiga (Gender)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={selectedColumns.guardianPhone}
                  onChange={(e) => setSelectedColumns({ ...selectedColumns, guardianPhone: e.target.checked })}
                  className="accent-[#7c3aed]"
                />
                <span>Telefoonka Waalidka</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={selectedColumns.guardianName}
                  onChange={(e) => setSelectedColumns({ ...selectedColumns, guardianName: e.target.checked })}
                  className="accent-[#7c3aed]"
                />
                <span>Magaca Waalidka</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={selectedColumns.status}
                  onChange={(e) => setSelectedColumns({ ...selectedColumns, status: e.target.checked })}
                  className="accent-[#7c3aed]"
                />
                <span>Xaaladda (Status)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={selectedColumns.feeStatus}
                  onChange={(e) => setSelectedColumns({ ...selectedColumns, feeStatus: e.target.checked })}
                  className="accent-[#7c3aed]"
                />
                <span>Xaaladda Lacagta (Fee Status)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={selectedColumns.registrationDate}
                  onChange={(e) => setSelectedColumns({ ...selectedColumns, registrationDate: e.target.checked })}
                  className="accent-[#7c3aed]"
                />
                <span>Taariikhda Qorista</span>
              </label>
            </div>
          </div>

          {/* Export Trigger Box */}
          <div className="bg-[#0f0f0f] border border-[#7c3aed]/30 rounded-sm p-6 space-y-4">
            <div className="text-[10px] uppercase font-mono tracking-widest text-[#a3a3a3]">
              Xisaabta Guud (Export Summary)
            </div>

            <div className="flex items-baseline justify-between border-b border-[#ffffff08] pb-3">
              <span className="text-xs text-[#a3a3a3]">Ardayda La Dhoofinayo:</span>
              <span className="text-2xl font-bold font-mono text-[#c4b5fd]">
                {targetStudents.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={targetStudents.length === 0}
              className="w-full py-3.5 rounded-sm bg-[#e5e5e5] hover:bg-white text-[#0a0a0a] uppercase tracking-widest text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Dhoofi Faylka ({format.toUpperCase()})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
