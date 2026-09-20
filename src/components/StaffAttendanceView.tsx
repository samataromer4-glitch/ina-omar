import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Save, 
  Download, 
  Search, 
  Users,
  CheckCheck
} from 'lucide-react';
import { StaffAttendance, Teacher, StaffMember } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface StaffAttendanceViewProps {
  teachers: Teacher[];
  staff: StaffMember[];
  attendanceRecords?: StaffAttendance[];
  records?: StaffAttendance[];
  onSaveAttendance: (recordsOrDate: any, maybeRecords?: any) => Promise<void>;
  theme: 'light' | 'dark';
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function StaffAttendanceView({
  teachers,
  staff,
  attendanceRecords = [],
  records = [],
  onSaveAttendance,
  showToast = () => {}
}: StaffAttendanceViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Teachers' | 'Staff'>('All');
  const [saving, setSaving] = useState(false);

  // Combine teachers and staff into a single list of employees
  const allEmployees = [
    ...teachers.map(t => ({
      id: t.id,
      name: t.name,
      employeeId: t.teacherId,
      type: 'Teacher',
      role: 'Teacher',
      phone: t.phone
    })),
    ...staff.map(s => ({
      id: s.id,
      name: s.name,
      employeeId: s.employeeId,
      type: 'Staff',
      role: s.role,
      phone: s.phone
    }))
  ];

  // Map existing attendance for selected date or initialize default
  const recordsList = attendanceRecords.length > 0 ? attendanceRecords : records;
  const existingForDate = recordsList.filter(a => a.date === selectedDate);
  const existingMap = new Map<string, string>();
  existingForDate.forEach(a => existingMap.set(a.staffId, a.status));

  // Current session working state
  const [statusMap, setStatusMap] = useState<{ [id: string]: 'Present' | 'Absent' | 'Late' | 'Excused' | 'Leave' }>({});

  // Get effective status
  const getStatus = (empId: string): 'Present' | 'Absent' | 'Late' | 'Excused' | 'Leave' => {
    if (statusMap[empId]) return statusMap[empId];
    if (existingMap.has(empId)) return existingMap.get(empId) as any;
    return 'Present'; // Default
  };

  const handleStatusChange = (empId: string, status: 'Present' | 'Absent' | 'Late' | 'Excused' | 'Leave') => {
    setStatusMap(prev => ({
      ...prev,
      [empId]: status
    }));
  };

  const markAllPresent = () => {
    const updated: any = {};
    allEmployees.forEach(e => {
      updated[e.id] = 'Present';
    });
    setStatusMap(updated);
    showToast("Dhammaan waxaa loo calaamadeeyay Jooga (Present)");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsToSave = allEmployees.map(e => ({
        staffId: e.id,
        staffName: e.name,
        role: e.role,
        status: getStatus(e.id),
        date: selectedDate,
        timestamp: new Date().toISOString()
      }));

      await onSaveAttendance(selectedDate, recordsToSave);
      showToast("Xaadiriska macallimiinta iyo shaqaalaha waa la kaydiyey");
    } catch (err: any) {
      showToast(err?.message || "Khalad ayaa dhacay xilliga kaydinta", "error");
    } finally {
      setSaving(false);
    }
  };

  // Filtered employees
  const filteredEmployees = allEmployees.filter(e => {
    const matchQuery = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'All' || e.type === filterType;
    return matchQuery && matchType;
  });

  // Calculate statistics for today
  const totalEmployees = allEmployees.length;
  const presentCount = allEmployees.filter(e => getStatus(e.id) === 'Present').length;
  const absentCount = allEmployees.filter(e => getStatus(e.id) === 'Absent').length;
  const lateCount = allEmployees.filter(e => getStatus(e.id) === 'Late').length;
  const leaveCount = allEmployees.filter(e => getStatus(e.id) === 'Leave' || getStatus(e.id) === 'Excused').length;
  const attendanceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

  // Export PDF
  const exportPDF = () => {
    if (filteredEmployees.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Dugsiga Pro 2026 - Xaadiriska Shaqaalaha (${selectedDate})`, 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [['ID', 'Name', 'Category', 'Role', 'Status']],
      body: filteredEmployees.map(e => [
        e.employeeId,
        e.name,
        e.type,
        e.role,
        getStatus(e.id)
      ])
    });
    doc.save(`Staff_Attendance_${selectedDate}.pdf`);
  };

  // Export Excel
  const exportExcel = () => {
    if (filteredEmployees.length === 0) return;
    const data = filteredEmployees.map(e => ({
      ID: e.employeeId,
      Name: e.name,
      Category: e.type,
      Role: e.role,
      Date: selectedDate,
      Status: getStatus(e.id)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Staff_Attendance_${selectedDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif italic text-[#f5f5f5]">
            Xaadiriska Macallimiinta & Shaqaalaha
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-[#737373] mt-1">
            Diiwaangelinta joogitaanka maalinlaha ah ee macallimiinta iyo shaqaalaha iskuulka
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#ffffff10] px-3 py-1.5 rounded-sm">
            <Calendar className="w-4 h-4 text-[#c4b5fd]" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-[#f5f5f5] focus:outline-none"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#7c3aed] text-white rounded-sm text-xs font-semibold hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Kaydinaya...' : 'Kaydi Xaadiriska'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-[#737373] uppercase tracking-wider block font-mono">Isku-gaynta</span>
          <div className="text-xl font-bold font-mono text-[#f5f5f5] mt-1">{totalEmployees}</div>
          <div className="text-[10px] text-[#525252] mt-0.5">Shaqaale Guud</div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-mono">Jooga (Present)</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{presentCount}</div>
          <div className="text-[10px] text-emerald-500/70 mt-0.5">{attendanceRate}% heerka joogitaanka</div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-rose-400 uppercase tracking-wider block font-mono">Maqan (Absent)</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{absentCount}</div>
          <div className="text-[10px] text-rose-500/70 mt-0.5">Aan xaadirin</div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-mono">Daahay (Late)</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{lateCount}</div>
          <div className="text-[10px] text-amber-500/70 mt-0.5">Soo daahay</div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] text-purple-400 uppercase tracking-wider block font-mono">Fasax (Leave)</span>
          <div className="text-xl font-bold font-mono text-purple-400 mt-1">{leaveCount}</div>
          <div className="text-[10px] text-purple-500/70 mt-0.5">Idan leh</div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filter, Quick Mark All */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Raadi shaqaale ama macallin..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm pl-9 pr-3 py-2 text-xs text-[#f5f5f5] placeholder-[#525252] focus:outline-none focus:border-[#7c3aed]"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[#ffffff10] p-1 rounded-sm">
            <button
              onClick={() => setFilterType('All')}
              className={`px-3 py-1 text-xs font-semibold rounded-sm ${filterType === 'All' ? 'bg-[#7c3aed] text-white' : 'text-[#737373] hover:text-white'}`}
            >
              Dhammaan
            </button>
            <button
              onClick={() => setFilterType('Teachers')}
              className={`px-3 py-1 text-xs font-semibold rounded-sm ${filterType === 'Teachers' ? 'bg-[#7c3aed] text-white' : 'text-[#737373] hover:text-white'}`}
            >
              Macallimiinta
            </button>
            <button
              onClick={() => setFilterType('Staff')}
              className={`px-3 py-1 text-xs font-semibold rounded-sm ${filterType === 'Staff' ? 'bg-[#7c3aed] text-white' : 'text-[#737373] hover:text-white'}`}
            >
              Shaqaalaha
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={markAllPresent}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-[#ffffff05] border border-[#ffffff10] text-xs font-semibold text-emerald-400 hover:bg-emerald-950/30 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Dhammaan Jooga</span>
          </button>
          <button
            onClick={exportPDF}
            className="p-2 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05]"
            title="Dhoofi PDF"
          >
            <Download className="w-4 h-4 text-[#c4b5fd]" />
          </button>
          <button
            onClick={exportExcel}
            className="p-2 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05]"
            title="Dhoofi Excel"
          >
            <Download className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Roster Table with Status Selectors */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0a0a0a] text-[10px] uppercase font-mono tracking-wider text-[#737373] border-b border-[#ffffff10]">
            <tr>
              <th className="py-3 px-4">ID & Magaca</th>
              <th className="py-3 px-4">Qaybta (Category)</th>
              <th className="py-3 px-4">Doorka (Role)</th>
              <th className="py-3 px-4 text-center">Xaaladda Joogitaanka (Attendance Status)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ffffff05] text-[#d4d4d4]">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-[#525252]">
                  Ma jiraan shaqaale ama macallimiin la helay
                </td>
              </tr>
            ) : (
              filteredEmployees.map(e => {
                const currentStatus = getStatus(e.id);
                return (
                  <tr key={e.id} className="hover:bg-[#ffffff02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#f5f5f5]">{e.name}</div>
                      <div className="text-[10px] text-[#525252] font-mono">{e.employeeId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold ${
                        e.type === 'Teacher' 
                          ? 'bg-[#7c3aed]/10 text-[#c4b5fd] border border-[#7c3aed]/30' 
                          : 'bg-[#ffffff05] text-[#a3a3a3] border border-[#ffffff10]'
                      }`}>
                        {e.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#a3a3a3]">{e.role}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(e.id, 'Present')}
                          className={`px-3 py-1 rounded-sm text-xs font-semibold transition-all ${
                            currentStatus === 'Present'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-[#0a0a0a] text-[#737373] border border-[#ffffff05] hover:text-white'
                          }`}
                        >
                          Jooga
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(e.id, 'Absent')}
                          className={`px-3 py-1 rounded-sm text-xs font-semibold transition-all ${
                            currentStatus === 'Absent'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-[#0a0a0a] text-[#737373] border border-[#ffffff05] hover:text-white'
                          }`}
                        >
                          Maqan
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(e.id, 'Late')}
                          className={`px-3 py-1 rounded-sm text-xs font-semibold transition-all ${
                            currentStatus === 'Late'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-[#0a0a0a] text-[#737373] border border-[#ffffff05] hover:text-white'
                          }`}
                        >
                          Daahay
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(e.id, 'Leave')}
                          className={`px-3 py-1 rounded-sm text-xs font-semibold transition-all ${
                            currentStatus === 'Leave' || currentStatus === 'Excused'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-[#0a0a0a] text-[#737373] border border-[#ffffff05] hover:text-white'
                          }`}
                        >
                          Fasax
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
