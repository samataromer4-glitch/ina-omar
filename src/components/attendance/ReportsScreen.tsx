import React, { useState, useMemo } from "react";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Users,
  Eye,
  Sparkles
} from "lucide-react";
import { Student, SchoolClass, AttendanceRecord, AuthUser } from "../../types";
import {
  normalizeStatus,
  getStatusBadgeConfig,
  getStoredSessions,
  exportAttendanceToCSV,
  exportAttendanceToPDF,
  exportAttendanceToExcel
} from "./attendanceUtils";

interface ReportsScreenProps {
  user: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  todayDate: string;
  initialSubTab?: "daily" | "student" | "class" | "monthly";
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  user,
  students,
  classes,
  attendance,
  todayDate,
  initialSubTab = "daily"
}) => {
  const [reportType, setReportType] = useState<"daily" | "student" | "class" | "monthly">(initialSubTab);
  const sessions = useMemo(() => getStoredSessions(), []);

  // Accessible students
  const accessibleStudents = useMemo(() => {
    if (user.role === "teacher" && user.assignedClasses && user.assignedClasses.length > 0) {
      return students.filter(s => user.assignedClasses?.includes(s.class));
    }
    return students;
  }, [user, students]);

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.id, s));
    return map;
  }, [students]);

  // -------------------------------------------------------------
  // CONFIGURATION STATE (Stage 1)
  // -------------------------------------------------------------
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [selectedMonth, setSelectedMonth] = useState<string>(todayDate.slice(0, 7)); // YYYY-MM
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("ALL");
  const [selectedSession, setSelectedSession] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // -------------------------------------------------------------
  // PREVIEW DATA GENERATION (Stage 2)
  // -------------------------------------------------------------
  const previewRecords = useMemo(() => {
    return attendance.filter(r => {
      // Date or Month filter based on report type
      if (reportType === "daily") {
        if (r.date !== selectedDate) return false;
      } else if (reportType === "monthly") {
        if (!r.date.startsWith(selectedMonth)) return false;
      }

      const st = studentMap.get(r.studentId);
      if (!st) return false;

      // Class filter
      if (selectedClass !== "ALL" && st.class !== selectedClass) return false;

      // Student filter
      if (reportType === "student" && selectedStudentId !== "ALL" && r.studentId !== selectedStudentId) {
        return false;
      }

      // Session filter
      if (selectedSession !== "ALL" && (r.sessionType || "before_break") !== selectedSession) return false;

      // Status filter
      if (selectedStatus !== "ALL" && normalizeStatus(r.status) !== selectedStatus) return false;

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date) || (b.timestamp || "").localeCompare(a.timestamp || ""));
  }, [
    attendance,
    reportType,
    selectedDate,
    selectedMonth,
    selectedClass,
    selectedStudentId,
    selectedSession,
    selectedStatus,
    studentMap
  ]);

  // Aggregate stats of preview
  const previewStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    previewRecords.forEach(r => {
      const s = normalizeStatus(r.status);
      if (s === "Present") present++;
      else if (s === "Absent") absent++;
      else if (s === "Late") late++;
      else if (s === "Leave") leave++;
    });

    const total = previewRecords.length;
    const rate = total > 0 ? Math.round(((present + (late * 0.5)) / total) * 100) : 0;

    return { total, present, absent, late, leave, rate };
  }, [previewRecords]);

  // -------------------------------------------------------------
  // EXPORT HANDLERS (Stage 3)
  // -------------------------------------------------------------
  const reportTitle = useMemo(() => {
    const typeLabel =
      reportType === "daily"
        ? `Daily Attendance Report (${selectedDate})`
        : reportType === "monthly"
        ? `Monthly Attendance Report (${selectedMonth})`
        : reportType === "student"
        ? `Student Attendance Report - ${studentMap.get(selectedStudentId)?.fullName || "All Students"}`
        : `Class Attendance Report - ${selectedClass}`;
    return typeLabel;
  }, [reportType, selectedDate, selectedMonth, selectedClass, selectedStudentId, studentMap]);

  const handleExportCSV = () => {
    exportAttendanceToCSV(previewRecords, students, reportTitle.replace(/[^a-zA-Z0-9_-]/g, "_"));
  };

  const handleExportPDF = () => {
    exportAttendanceToPDF(previewRecords, students, reportTitle);
  };

  const handleExportExcel = () => {
    exportAttendanceToExcel(previewRecords, students, reportTitle.replace(/[^a-zA-Z0-9_-]/g, "_"));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 30. HEADER & SEGMENTED TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ffffff0a]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-1 font-normal">
            Generate and export official attendance registers in PDF, Excel, and CSV format.
          </p>
        </div>

        <div className="flex items-center bg-[#171717] p-1 rounded-lg border border-[#2e2e2e] text-xs font-medium self-start sm:self-auto">
          {(
            [
              { id: "daily", label: "Daily" },
              { id: "student", label: "Student" },
              { id: "class", label: "Class" },
              { id: "monthly", label: "Monthly" }
            ] as const
          ).map(t => (
            <button
              key={t.id}
              onClick={() => setReportType(t.id)}
              className={`px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
                reportType === t.id
                  ? "bg-[#282828] text-white font-bold shadow-xs"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 31. STAGE 1: CONFIGURE CONTROLS */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#7c3aed] text-white text-[11px] font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
              Configure Report Parameters
            </h2>
          </div>
          <span className="text-xs text-[#888888] font-mono">{previewRecords.length} records ready</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Date or Month Picker */}
          {reportType === "monthly" ? (
            <div className="space-y-1.5">
              <label className="text-xs text-[#888888] block">Select Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                aria-label="Select month"
                className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs text-[#888888] block">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                aria-label="Select report date"
                className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
              />
            </div>
          )}

          {/* Class Filter */}
          <div className="space-y-1.5">
            <label className="text-xs text-[#888888] block">Class:</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              aria-label="Filter class"
              className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.className}>{c.className}</option>
              ))}
            </select>
          </div>

          {/* Student Filter (when in Student report mode) */}
          {reportType === "student" ? (
            <div className="space-y-1.5">
              <label className="text-xs text-[#888888] block">Specific Student:</label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                aria-label="Filter student"
                className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Students</option>
                {accessibleStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.id})</option>
                ))}
              </select>
            </div>
          ) : (
            /* Session Filter */
            <div className="space-y-1.5">
              <label className="text-xs text-[#888888] block">Session:</label>
              <select
                value={selectedSession}
                onChange={e => setSelectedSession(e.target.value)}
                aria-label="Filter session"
                className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Sessions</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs text-[#888888] block">Attendance Status:</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              aria-label="Filter status"
              className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Present">Present Only</option>
              <option value="Absent">Absent Only</option>
              <option value="Late">Late Only</option>
              <option value="Leave">Leave Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* 32. STAGE 2: LIVE PREVIEW */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#262626] text-[#e5e5e5] text-[11px] font-bold flex items-center justify-center">
              2
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e5e5e5]">
              Live Document Preview
            </h2>
          </div>

          {/* 33. STAGE 3: EXPORT BUTTONS */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportPDF}
              disabled={previewRecords.length === 0}
              className="px-3.5 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-white text-xs font-semibold border border-[#333333] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={previewRecords.length === 0}
              className="px-3.5 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-white text-xs font-semibold border border-[#333333] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Export Excel
            </button>
            <button
              onClick={handleExportCSV}
              disabled={previewRecords.length === 0}
              className="px-3.5 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-white text-xs font-semibold border border-[#333333] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Live Summary Bar */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="font-semibold text-white">
            {reportTitle}
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>Rate: <strong className="text-white font-bold">{previewStats.rate}%</strong></span>
            <span className="text-emerald-400">Present: {previewStats.present}</span>
            <span className="text-rose-400">Absent: {previewStats.absent}</span>
            <span className="text-amber-400">Late: {previewStats.late}</span>
            <span className="text-blue-400">Leave: {previewStats.leave}</span>
          </div>
        </div>

        {/* Table Preview */}
        {previewRecords.length === 0 ? (
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-16 text-center text-xs text-[#737373]">
            No attendance records matched the specified report configuration.
          </div>
        ) : (
          <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-xs">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#171717] border-b border-[#262626] text-[#888888] uppercase tracking-wider text-[10px] font-semibold z-10">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Class</th>
                    <th className="py-2.5 px-4">Session</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {previewRecords.slice(0, 100).map((r, i) => {
                    const st = studentMap.get(r.studentId);
                    const norm = normalizeStatus(r.status);
                    const badge = getStatusBadgeConfig(norm);
                    return (
                      <tr key={i} className="hover:bg-[#181818] transition-colors">
                        <td className="py-2.5 px-4 font-mono text-[#888888]">{r.date}</td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-white">{st?.fullName || r.studentId}</div>
                          <div className="text-[10px] text-[#737373] font-mono">{r.studentId}</div>
                        </td>
                        <td className="py-2.5 px-4 text-[#e5e5e5]">{st?.class || "-"}</td>
                        <td className="py-2.5 px-4 text-[#888888]">
                          {r.sessionType === "after_break" ? "Afternoon" : "Morning"}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.badge}`}>
                            {norm}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {previewRecords.length > 100 && (
              <div className="px-4 py-2 bg-[#171717] text-[11px] text-[#737373] text-center border-t border-[#262626]">
                Showing preview of first 100 rows. Full export includes all {previewRecords.length} records.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
