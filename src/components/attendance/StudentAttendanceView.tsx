import React, { useState, useMemo } from "react";
import {
  Calendar,
  Search,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Coffee,
  ExternalLink,
  Flame,
  TrendingUp,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Student, AttendanceRecord, AttendanceStatus, AuthUser } from "../../types";
import {
  normalizeStatus,
  getStatusBadgeConfig,
  calculateStudentAttendance,
  openWhatsAppAttendanceAlert,
  getStoredSessions,
  formatSessionName
} from "./attendanceUtils";

interface StudentAttendanceViewProps {
  user: AuthUser;
  students: Student[];
  attendance: AttendanceRecord[];
  initialStudentId?: string;
}

export const StudentAttendanceView: React.FC<StudentAttendanceViewProps> = ({
  user,
  students,
  attendance,
  initialStudentId
}) => {
  const sessions = useMemo(() => getStoredSessions(), []);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || (students[0]?.id ?? "")
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  // Filter students for the selector
  const filteredStudentOptions = useMemo(() => {
    if (!searchQuery.trim()) return students.slice(0, 30);
    const q = searchQuery.toLowerCase();
    return students.filter(
      s =>
        s.fullName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.class.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [students, searchQuery]);

  const currentStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  // Compute student attendance metrics
  const summary = useMemo(() => {
    if (!currentStudent) {
      return {
        studentId: "",
        totalSessions: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        leaveCount: 0,
        attendanceRate: 100,
        currentStreak: 0,
        statusLogs: []
      };
    }
    return calculateStudentAttendance(currentStudent.id, attendance);
  }, [currentStudent, attendance]);

  // Generate calendar days for the currentMonthDate
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayIndex = firstDay.getDay(); // 0 = Sun, 1 = Mon ...
    const totalDays = lastDay.getDate();

    const days: { dateStr: string; dayNumber: number; records: AttendanceRecord[] }[] = [];

    // Date record map
    const studentRecords = attendance.filter(a => a.studentId === currentStudent?.id);
    const recordMap = new Map<string, AttendanceRecord[]>();
    studentRecords.forEach(r => {
      const existing = recordMap.get(r.date) || [];
      existing.push(r);
      recordMap.set(r.date, existing);
    });

    for (let d = 1; d <= totalDays; d++) {
      const dayDate = new Date(year, month, d);
      const dateStr = dayDate.toISOString().split("T")[0];
      days.push({
        dateStr,
        dayNumber: d,
        records: recordMap.get(dateStr) || []
      });
    }

    return { startingDayIndex, days, monthName: currentMonthDate.toLocaleDateString("so-SO", { month: "long", year: "numeric" }) };
  }, [currentMonthDate, attendance, currentStudent]);

  if (!currentStudent) {
    return (
      <div className="p-12 text-center text-[#737373] bg-[#0f0f0f] border border-[#ffffff10] rounded-sm">
        Arday lama helin. Fadlan hubi xogta ardayda.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. STUDENT SELECTOR SEARCH BAR */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Ka dhex raadi ardayda magac, ID ama fasal..."
            className="w-full pl-9 pr-3 py-2 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#f5f5f5] placeholder-[#737373] focus:outline-none focus:border-[#7c3aed]"
          />
        </div>

        <div className="w-full md:w-80">
          <select
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            className="w-full px-3 py-2 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs font-bold text-white focus:outline-none focus:border-[#7c3aed]"
          >
            {filteredStudentOptions.map(s => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.class}) - ID: {s.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. STUDENT HERO CARD & ATTENDANCE RATE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Profile Details (5 cols) */}
        <div className="lg:col-span-5 bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-sm bg-[#7c3aed]/15 border border-[#7c3aed]/30 flex items-center justify-center font-bold text-lg font-mono text-[#c4b5fd] shrink-0 overflow-hidden">
                {currentStudent.photo ? (
                  <img src={currentStudent.photo} alt={currentStudent.fullName} className="w-full h-full object-cover" />
                ) : (
                  currentStudent.fullName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#737373] block">
                  Xogta Xaadiriska Ardayga
                </span>
                <h2 className="text-lg font-bold text-white truncate">
                  {currentStudent.fullName}
                </h2>
                <div className="text-xs text-[#a3a3a3] font-mono mt-0.5 flex items-center gap-2">
                  <span>ID: {currentStudent.id}</span>
                  <span>•</span>
                  <span>Fasalka: {currentStudent.class}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#0a0a0a] rounded-sm border border-[#ffffff08] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#737373]">Waalidka / Masuulka:</span>
                <span className="font-semibold text-white">{currentStudent.guardianName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Taleefanka Waalidka:</span>
                <span className="font-mono text-[#c4b5fd]">{currentStudent.guardianPhone || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737373]">Xaaladda Dugsiga:</span>
                <span className="capitalize font-medium text-emerald-400">{currentStudent.status || "Active"}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#ffffff08] flex items-center gap-2">
            {currentStudent.guardianPhone ? (
              <button
                onClick={() =>
                  openWhatsAppAttendanceAlert(
                    currentStudent,
                    new Date().toISOString().split("T")[0],
                    summary.absentCount > 0 ? "Absent" : "Present",
                    user.schoolName || "Dugsiga Pro 2026"
                  )
                }
                className="flex-1 py-2 px-3 rounded-xs bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>U dir Waalidka WhatsApp</span>
              </button>
            ) : (
              <span className="text-xs text-[#737373] italic">Ma jiro taleefan waalid oo diiwaangashan</span>
            )}
          </div>
        </div>

        {/* Metrics Grid (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Rate Gauge Card */}
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#737373]">
              Heerka Joogitaanka (Rate)
            </span>
            <div className="my-2">
              <span className="text-3xl font-mono font-bold text-white">
                {summary.attendanceRate}%
              </span>
              <div className="h-1.5 w-full bg-[#1c1c1c] rounded-full overflow-hidden mt-2">
                <div
                  style={{ width: `${summary.attendanceRate}%` }}
                  className="bg-[#7c3aed] h-full"
                />
              </div>
            </div>
            <span className="text-[10px] text-[#888888] font-mono">
              Wadarta {summary.totalSessions} xilliyo
            </span>
          </div>

          {/* Consecutive Streak */}
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400/80 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Xiriirka Joogitaanka (Streak)</span>
            </span>
            <div className="my-2">
              <span className="text-3xl font-mono font-bold text-amber-400">
                {summary.currentStreak}
              </span>
              <span className="text-xs text-[#737373] ml-1">xilli toos ah</span>
            </div>
            <span className="text-[10px] text-[#888888]">Joogitaan xiriir ah</span>
          </div>

          {/* Present Count */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-sm p-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400/80">
              Maalmaha Joogay (Present)
            </span>
            <div className="my-2">
              <span className="text-3xl font-mono font-bold text-emerald-400">
                {summary.presentCount}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400/60 font-mono">Xilliyo buuxa</span>
          </div>

          {/* Absent Count */}
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-sm p-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-rose-400/80">
              Maalmaha Maqnaa (Absent)
            </span>
            <div className="my-2">
              <span className="text-3xl font-mono font-bold text-rose-400">
                {summary.absentCount}
              </span>
            </div>
            <span className="text-[10px] text-rose-400/60 font-mono">Maqnaansho aan idan lahayn</span>
          </div>

          {/* Late Count */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-sm p-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400/80">
              Daahay (Late)
            </span>
            <div className="my-2">
              <span className="text-3xl font-mono font-bold text-amber-400">
                {summary.lateCount}
              </span>
            </div>
            <span className="text-[10px] text-amber-400/60 font-mono">Waqti dambe yimid</span>
          </div>

          {/* Leave/Excused Count */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-sm p-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-blue-400/80">
              Fasax / Idan (Leave)
            </span>
            <div className="my-2">
              <span className="text-3xl font-mono font-bold text-blue-400">
                {summary.leaveCount}
              </span>
            </div>
            <span className="text-[10px] text-blue-400/60 font-mono">Fasax rasmi ah</span>
          </div>
        </div>
      </div>

      {/* 3. MONTHLY ATTENDANCE CALENDAR GRID */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#c4b5fd]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#f5f5f5]">
              Jadwalka Bisha ee Xaadiriska (Monthly Attendance Heatmap)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = new Date(currentMonthDate);
                prev.setMonth(prev.getMonth() - 1);
                setCurrentMonthDate(prev);
              }}
              className="p-1 rounded-sm bg-[#1a1a1a] hover:bg-[#252525] text-[#a3a3a3] hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold font-mono text-white px-2">
              {calendarDays.monthName}
            </span>
            <button
              onClick={() => {
                const next = new Date(currentMonthDate);
                next.setMonth(next.getMonth() + 1);
                setCurrentMonthDate(next);
              }}
              className="p-1 rounded-sm bg-[#1a1a1a] hover:bg-[#252525] text-[#a3a3a3] hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase text-[#737373] pb-1 border-b border-[#ffffff08]">
          <span>Axad (Sun)</span>
          <span>Isnin (Mon)</span>
          <span>Tala (Tue)</span>
          <span>Arba (Wed)</span>
          <span>Kham (Thu)</span>
          <span>Jimce (Fri)</span>
          <span>Sabti (Sat)</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty placeholders before month start */}
          {Array.from({ length: calendarDays.startingDayIndex }).map((_, i) => (
            <div key={`empty_${i}`} className="h-16 rounded-xs bg-transparent" />
          ))}

          {calendarDays.days.map(day => {
            const hasRecord = day.records.length > 0;
            const isAbsent = day.records.some(r => normalizeStatus(r.status) === "Absent");
            const isLate = day.records.some(r => normalizeStatus(r.status) === "Late");
            const isLeave = day.records.some(r => normalizeStatus(r.status) === "Leave");
            const isPresent = day.records.some(r => normalizeStatus(r.status) === "Present");

            let dayBg = "bg-[#0a0a0a] border-[#ffffff08]";
            let dotColor = "bg-transparent";

            if (isAbsent) {
              dayBg = "bg-rose-500/10 border-rose-500/30";
              dotColor = "bg-rose-500";
            } else if (isLate) {
              dayBg = "bg-amber-500/10 border-amber-500/30";
              dotColor = "bg-amber-400";
            } else if (isLeave) {
              dayBg = "bg-blue-500/10 border-blue-500/30";
              dotColor = "bg-blue-400";
            } else if (isPresent) {
              dayBg = "bg-emerald-500/10 border-emerald-500/20";
              dotColor = "bg-emerald-400";
            }

            return (
              <div
                key={day.dateStr}
                className={`h-16 p-1.5 rounded-sm border flex flex-col justify-between transition-colors ${dayBg}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#d4d4d4]">
                    {day.dayNumber}
                  </span>
                  {hasRecord && (
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  )}
                </div>

                {hasRecord ? (
                  <div className="space-y-0.5">
                    {day.records.slice(0, 2).map((rec, i) => {
                      const st = normalizeStatus(rec.status);
                      const b = getStatusBadgeConfig(st);
                      return (
                        <div
                          key={i}
                          className={`text-[9px] font-mono px-1 py-0.2 rounded-2xs truncate ${b.bg} ${b.text}`}
                          title={`${formatSessionName(rec.sessionType || "before_break", sessions)}: ${b.label}`}
                        >
                          {b.label}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-[9px] text-[#404040] font-mono">-</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-[#888888] pt-3 border-t border-[#ffffff08] flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Jooga (Present)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Ma Joogo (Absent)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Daahay (Late)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span>Fasax (Leave)</span>
          </div>
        </div>
      </div>

      {/* 4. CHRONOLOGICAL LEDGER LOGS */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden">
        <div className="p-3.5 bg-[#0a0a0a] border-b border-[#ffffff10]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            Diiwaanka Xaadiriska oo Dhammaystiran ({summary.statusLogs.length} entries)
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0c0c0c] text-[10px] uppercase font-bold tracking-wider text-[#737373] border-b border-[#ffffff08]">
                <th className="px-4 py-3">Taariikhda</th>
                <th className="px-4 py-3">Xilliga (Session)</th>
                <th className="px-4 py-3">Xaaladda (Status)</th>
                <th className="px-4 py-3">Waqtiga La Qabtay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff05]">
              {summary.statusLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#737373]">
                    Ardaygan weli ma laha wax diiwaan xaadiris ah.
                  </td>
                </tr>
              ) : (
                summary.statusLogs.map((rec, i) => {
                  const b = getStatusBadgeConfig(rec.status);
                  return (
                    <tr key={i} className="hover:bg-[#ffffff02]">
                      <td className="px-4 py-2.5 font-mono text-[#e5e5e5] font-semibold">
                        {rec.date}
                      </td>
                      <td className="px-4 py-2.5 text-[#a3a3a3]">
                        {formatSessionName(rec.sessionType || "before_break", sessions)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[10px] font-bold ${b.bg} ${b.border} ${b.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${b.dotColor}`} />
                          <span>{b.label} ({b.subLabel})</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-[#737373]">
                        {rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
