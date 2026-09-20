import React, { useState, useMemo } from "react";
import {
  Calendar,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Clock,
  User,
  Edit2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Check,
  Save,
  X
} from "lucide-react";
import { Student, SchoolClass, AttendanceRecord, AttendanceStatus, AuthUser } from "../../types";
import {
  normalizeStatus,
  getStatusBadgeConfig,
  getStoredSessions,
  formatSessionName,
  exportAttendancePDF,
  exportAttendanceExcel
} from "./attendanceUtils";

interface AttendanceHistoryViewProps {
  user: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  onUpdateRecord: (date: string, studentId: string, newStatus: AttendanceStatus, sessionType?: string, reason?: string) => Promise<void>;
}

export const AttendanceHistoryView: React.FC<AttendanceHistoryViewProps> = ({
  user,
  students,
  classes,
  attendance,
  onUpdateRecord
}) => {
  const sessions = useMemo(() => getStoredSessions(), []);

  // Filter state
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month" | "custom">("month");
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [selectedSession, setSelectedSession] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Correction Modal state
  const [editingRecord, setEditingRecord] = useState<{
    date: string;
    studentId: string;
    sessionType?: string;
    currentStatus: AttendanceStatus;
    newStatus: AttendanceStatus;
    reason: string;
    studentName: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Student lookup map
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.id, s));
    return map;
  }, [students]);

  // Filter records based on active criteria
  const filteredRecords = useMemo(() => {
    let list = attendance;

    // Date range
    const today = new Date().toISOString().split("T")[0];
    if (dateFilter === "today") {
      list = list.filter(r => r.date === today);
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekStr = weekAgo.toISOString().split("T")[0];
      list = list.filter(r => r.date >= weekStr && r.date <= today);
    } else if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthStr = monthAgo.toISOString().split("T")[0];
      list = list.filter(r => r.date >= monthStr && r.date <= today);
    } else if (dateFilter === "custom") {
      if (startDate) list = list.filter(r => r.date >= startDate);
      if (endDate) list = list.filter(r => r.date <= endDate);
    }

    // Session filter
    if (selectedSession !== "All") {
      list = list.filter(r => (r.sessionType || "before_break") === selectedSession);
    }

    // Status filter
    if (selectedStatus !== "All") {
      list = list.filter(r => normalizeStatus(r.status) === selectedStatus);
    }

    // Class filter & Student Search
    list = list.filter(r => {
      const s = studentMap.get(r.studentId);
      if (!s) return false;

      if (selectedClass !== "All" && s.class !== selectedClass) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.fullName.toLowerCase().includes(q);
        const matchesId = s.id.toLowerCase().includes(q);
        const matchesClass = s.class.toLowerCase().includes(q);
        return matchesName || matchesId || matchesClass;
      }

      return true;
    });

    // Sort newest first
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.timestamp.localeCompare(a.timestamp));
  }, [attendance, dateFilter, startDate, endDate, selectedSession, selectedStatus, selectedClass, searchQuery, studentMap]);

  // Aggregate stats for filtered view
  const aggregateStats = useMemo(() => {
    let p = 0, a = 0, l = 0, e = 0;
    filteredRecords.forEach(r => {
      const st = normalizeStatus(r.status);
      if (st === "Present") p++;
      else if (st === "Absent") a++;
      else if (st === "Late") l++;
      else if (st === "Leave") e++;
    });

    const total = filteredRecords.length;
    const rate = total > 0 ? Math.round(((p + (l * 0.5)) / total) * 100) : 0;

    return { total, p, a, l, e, rate };
  }, [filteredRecords]);

  // Handle record correction submission
  const handleSaveCorrection = async () => {
    if (!editingRecord) return;
    setIsUpdating(true);
    try {
      await onUpdateRecord(
        editingRecord.date,
        editingRecord.studentId,
        editingRecord.newStatus,
        editingRecord.sessionType,
        editingRecord.reason
      );
      setEditingRecord(null);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. FILTERING BAR */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-4 space-y-4">
        {/* Quick Date Presets & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-[#0a0a0a] border border-[#ffffff10] p-1 rounded-sm overflow-x-auto">
            {[
              { id: "today", label: "Maanta (Today)" },
              { id: "week", label: "7-dii Maalmood (7 Days)" },
              { id: "month", label: "30-kii Maalmood (30 Days)" },
              { id: "custom", label: "Waqti Gaar ah (Custom)" }
            ].map(dp => (
              <button
                key={dp.id}
                onClick={() => setDateFilter(dp.id as any)}
                className={`px-3 py-1.5 rounded-xs text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  dateFilter === dp.id
                    ? "bg-[#7c3aed] text-white"
                    : "text-[#888888] hover:text-[#e5e5e5]"
                }`}
              >
                {dp.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 md:max-w-xs">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Raadi arday, ID ama fasal..."
              className="w-full pl-9 pr-3 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#f5f5f5] placeholder-[#737373] focus:outline-none focus:border-[#7c3aed]"
            />
          </div>
        </div>

        {/* Custom Date Pickers (if custom selected) */}
        {dateFilter === "custom" && (
          <div className="flex items-center gap-3 pt-2 border-t border-[#ffffff08] flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#737373] uppercase">Ka bilaabata:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-2.5 py-1 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs font-mono text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#737373] uppercase">Ku eg:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-2.5 py-1 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs font-mono text-white"
              />
            </div>
          </div>
        )}

        {/* Dropdown Filters (Class, Session, Status) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#ffffff08]">
          {/* Class Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#737373] block">
              Fasalka (Class)
            </label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full px-3 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs font-medium text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
            >
              <option value="All">Dhammaan Fasallada (All Classes)</option>
              {classes.map(c => (
                <option key={c.id} value={c.className}>{c.className}</option>
              ))}
            </select>
          </div>

          {/* Session Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#737373] block">
              Xilliga (Session)
            </label>
            <select
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)}
              className="w-full px-3 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs font-medium text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
            >
              <option value="All">Dhammaan Xilliyada (All Sessions)</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.somaliName} ({s.name})</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#737373] block">
              Xaaladda (Status)
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs font-medium text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
            >
              <option value="All">Dhammaan Xaaladaha (All)</option>
              <option value="Present">Jooga (Present)</option>
              <option value="Absent">Ma Joogo (Absent)</option>
              <option value="Late">Daahay (Late)</option>
              <option value="Leave">Fasax (Leave/Excused)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. AGGREGATE STATS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-3.5 rounded-sm space-y-0.5">
          <span className="text-[10px] uppercase font-mono text-[#737373] block">Wadarta Diiwaannada</span>
          <span className="text-xl font-bold font-mono text-white">{aggregateStats.total}</span>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-3.5 rounded-sm space-y-0.5">
          <span className="text-[10px] uppercase font-mono text-emerald-400/80 block">Jooga (Present)</span>
          <span className="text-xl font-bold font-mono text-emerald-400">{aggregateStats.p}</span>
        </div>
        <div className="bg-rose-500/5 border border-rose-500/20 p-3.5 rounded-sm space-y-0.5">
          <span className="text-[10px] uppercase font-mono text-rose-400/80 block">Ma Joogo (Absent)</span>
          <span className="text-xl font-bold font-mono text-rose-400">{aggregateStats.a}</span>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-sm space-y-0.5">
          <span className="text-[10px] uppercase font-mono text-amber-400/80 block">Daahay (Late)</span>
          <span className="text-xl font-bold font-mono text-amber-400">{aggregateStats.l}</span>
        </div>
        <div className="bg-[#7c3aed]/10 border border-[#7c3aed]/30 p-3.5 rounded-sm space-y-0.5 col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-mono text-[#c4b5fd] block">Heerka Guud (Rate)</span>
          <span className="text-xl font-bold font-mono text-[#c4b5fd]">{aggregateStats.rate}%</span>
        </div>
      </div>

      {/* 3. TIMELINE & AUDIT LEDGER TABLE */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden shadow-xl">
        <div className="p-3.5 bg-[#0a0a0a] border-b border-[#ffffff10] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#c4b5fd]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#f5f5f5]">
              Diiwaanka Taariikhda Xaadiriska ({filteredRecords.length} qoraal)
            </span>
          </div>

          <button
            onClick={() => {
              const matchedStudents = Array.from(
                new Set(filteredRecords.map(r => r.studentId))
              ).map(id => studentMap.get(id)).filter(Boolean) as Student[];

              exportAttendanceExcel({
                date: startDate || new Date().toISOString().split("T")[0],
                className: selectedClass,
                sessionName: selectedSession,
                students: matchedStudents,
                records: filteredRecords
              });
            }}
            className="px-3 py-1.5 rounded-xs bg-[#1a1a1a] hover:bg-[#262626] border border-[#ffffff15] text-[#e5e5e5] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dhoofi Excel (.xlsx)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0c0c0c] border-b border-[#ffffff08] text-[10px] uppercase font-bold tracking-wider text-[#737373]">
                <th className="px-4 py-3">Taariikhda (Date)</th>
                <th className="px-4 py-3">Ardayga / Student</th>
                <th className="px-4 py-3">Fasalka</th>
                <th className="px-4 py-3">Xilliga (Session)</th>
                <th className="px-4 py-3">Xaaladda (Status)</th>
                <th className="px-4 py-3">Waqtiga La Qabtay</th>
                <th className="px-4 py-3 text-right">Tallaabo (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff05]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#737373]">
                    Ma jiraan diiwaanno xaadiris oo ku jira shaandhayntan.
                  </td>
                </tr>
              ) : (
                filteredRecords.slice(0, 100).map(rec => {
                  const student = studentMap.get(rec.studentId);
                  const st = normalizeStatus(rec.status);
                  const badge = getStatusBadgeConfig(st);

                  return (
                    <tr key={`${rec.date}_${rec.studentId}_${rec.sessionType || "default"}`} className="hover:bg-[#ffffff02] transition-colors">
                      <td className="px-4 py-3 font-mono text-[#d4d4d4] font-semibold whitespace-nowrap">
                        {rec.date}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-[#f5f5f5]">
                          {student ? student.fullName : rec.studentId}
                        </div>
                        <div className="text-[10px] text-[#737373] font-mono">
                          ID: {rec.studentId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#a3a3a3] font-medium">
                        {student?.class || "-"}
                      </td>
                      <td className="px-4 py-3 text-[#888888]">
                        {formatSessionName(rec.sessionType || "before_break", sessions)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[10px] font-bold ${badge.bg} ${badge.border} ${badge.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
                          <span>{badge.label} ({badge.subLabel})</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#737373] whitespace-nowrap">
                        {rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setEditingRecord({
                              date: rec.date,
                              studentId: rec.studentId,
                              sessionType: rec.sessionType,
                              currentStatus: st,
                              newStatus: st,
                              reason: "",
                              studentName: student?.fullName || rec.studentId
                            });
                          }}
                          className="px-2.5 py-1 rounded-xs bg-[#1a1a1a] hover:bg-[#262626] border border-[#ffffff15] text-[#c4b5fd] text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Sax xaaladda xaadiriska (Correction Workflow)"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Sax (Correct)</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredRecords.length > 100 && (
          <div className="p-3 bg-[#0a0a0a] border-t border-[#ffffff08] text-center text-xs text-[#737373]">
            Waxaa la muujiyey 100-ka diiwaan ee ugu horreeya. Isticmaal shaandhaynta ama dhoofi Excel si aad u hesho dhammaan {filteredRecords.length} diiwaan.
          </div>
        )}
      </div>

      {/* CORRECTION / AUDIT MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-[#ffffff15] rounded-sm p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#ffffff10] pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#c4b5fd]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Sax Xaadiriska (Correction Workflow)
                </h3>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-[#737373] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#0a0a0a] p-3 rounded-sm border border-[#ffffff08] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#737373]">Ardayga:</span>
                  <span className="font-bold text-white">{editingRecord.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Taariikhda:</span>
                  <span className="font-mono text-white">{editingRecord.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Xilliga:</span>
                  <span className="text-white">{formatSessionName(editingRecord.sessionType || "before_break", sessions)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#737373]">Xaaladdii Hore:</span>
                  <span className="font-bold text-amber-400">{editingRecord.currentStatus}</span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-[#737373]">
                  Dooro Xaaladda Cusub (New Status):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "Present" as AttendanceStatus, label: "Jooga (Present)" },
                    { key: "Absent" as AttendanceStatus, label: "Ma Joogo (Absent)" },
                    { key: "Late" as AttendanceStatus, label: "Daahay (Late)" },
                    { key: "Leave" as AttendanceStatus, label: "Fasax (Leave)" }
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setEditingRecord({ ...editingRecord, newStatus: opt.key })}
                      className={`py-2 px-3 rounded-xs border text-xs font-semibold text-center transition-all cursor-pointer ${
                        editingRecord.newStatus === opt.key
                          ? "bg-[#7c3aed] text-white border-[#7c3aed] shadow-md"
                          : "bg-[#141414] text-[#888888] border-[#ffffff10] hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Audit Note */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-[#737373]">
                  Sababta Wax Ka Beddelka (Audit Reason):
                </label>
                <textarea
                  value={editingRecord.reason}
                  onChange={e => setEditingRecord({ ...editingRecord, reason: e.target.value })}
                  placeholder="Tusaale: Macallinka ayaa qaldamay, ama waalidka ayaa soo wacay..."
                  className="w-full p-2 rounded-xs bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed] h-18 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ffffff10]">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#ffffff10] text-[#a3a3a3] text-xs font-semibold rounded-sm cursor-pointer"
              >
                Kanoqo (Cancel)
              </button>
              <button
                onClick={handleSaveCorrection}
                disabled={isUpdating}
                className="px-4 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isUpdating ? "Kaydinayaa..." : "Xaqiiji & Kaydi"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
