import React, { useState, useMemo } from "react";
import {
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit2,
  X,
  Save,
  FileSpreadsheet,
  Download
} from "lucide-react";
import { Student, SchoolClass, AttendanceRecord, AttendanceStatus, AuthUser } from "../../types";
import { normalizeStatus, getStatusBadgeConfig, getStoredSessions, exportAttendanceToCSV } from "./attendanceUtils";

interface RecordsScreenProps {
  user: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  todayDate: string;
  initialSubTab?: "today" | "history" | "corrections";
  onUpdateRecord: (
    date: string,
    studentId: string,
    status: AttendanceStatus,
    sessionType?: string,
    reason?: string
  ) => Promise<void>;
}

export const RecordsScreen: React.FC<RecordsScreenProps> = ({
  user,
  students = [],
  classes = [],
  attendance = [],
  todayDate,
  initialSubTab = "today",
  onUpdateRecord
}) => {
  const [activeTab, setActiveTab] = useState<"today" | "history" | "corrections">(initialSubTab);
  const sessions = useMemo(() => getStoredSessions(), []);

  // Student lookup map
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    (students || []).forEach(s => s && map.set(s.id, s));
    return map;
  }, [students]);

  // Accessible classes for teacher / admin
  const accessibleClasses = useMemo(() => {
    const list = classes || [];
    if (user?.role === "teacher" && user?.assignedClasses && user.assignedClasses.length > 0) {
      return list.filter(c => user.assignedClasses?.includes(c.className));
    }
    return list;
  }, [user, classes]);

  // -------------------------------------------------------------
  // TODAY'S RECORDS STATE
  // -------------------------------------------------------------
  const [todayClassFilter, setTodayClassFilter] = useState<string>("ALL");
  const [todaySessionFilter, setTodaySessionFilter] = useState<string>("ALL");
  const [todayStatusFilter, setTodayStatusFilter] = useState<string>("ALL");

  const todayRecords = useMemo(() => {
    return (attendance || [])
      .filter(r => r && r.date === todayDate)
      .filter(r => {
        const student = studentMap.get(r.studentId);
        if (!student) return false;
        if (todayClassFilter !== "ALL" && student.class !== todayClassFilter) return false;
        if (todaySessionFilter !== "ALL" && (r.sessionType || "before_break") !== todaySessionFilter) return false;
        if (todayStatusFilter !== "ALL" && normalizeStatus(r.status) !== todayStatusFilter) return false;
        return true;
      })
      .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
  }, [attendance, todayDate, todayClassFilter, todaySessionFilter, todayStatusFilter, studentMap]);

  // -------------------------------------------------------------
  // HISTORY STATE & PAGINATION
  // -------------------------------------------------------------
  const [histSearch, setHistSearch] = useState<string>("");
  const [histStartDate, setHistStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [histEndDate, setHistEndDate] = useState<string>(todayDate);
  const [histClassFilter, setHistClassFilter] = useState<string>("ALL");
  const [histSessionFilter, setHistSessionFilter] = useState<string>("ALL");
  const [histStatusFilter, setHistStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;

  const filteredHistory = useMemo(() => {
    return (attendance || [])
      .filter(r => r && r.date >= histStartDate && r.date <= histEndDate)
      .filter(r => {
        const student = studentMap.get(r.studentId);
        if (!student) return false;

        if (histSearch.trim()) {
          const q = histSearch.toLowerCase().trim();
          const matchName = student.fullName.toLowerCase().includes(q);
          const matchId = student.id.toLowerCase().includes(q);
          if (!matchName && !matchId) return false;
        }

        if (histClassFilter !== "ALL" && student.class !== histClassFilter) return false;
        if (histSessionFilter !== "ALL" && (r.sessionType || "before_break") !== histSessionFilter) return false;
        if (histStatusFilter !== "ALL" && normalizeStatus(r.status) !== histStatusFilter) return false;

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || (b.timestamp || "").localeCompare(a.timestamp || ""));
  }, [attendance, histStartDate, histEndDate, histSearch, histClassFilter, histSessionFilter, histStatusFilter, studentMap]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const paginatedHistory = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, page, pageSize]);

  // -------------------------------------------------------------
  // CORRECTIONS DRAWER / MODAL STATE
  // -------------------------------------------------------------
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>("Present");
  const [correctionReason, setCorrectionReason] = useState<string>("");
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState<boolean>(false);

  const handleOpenCorrection = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setNewStatus(normalizeStatus(record.status));
    setCorrectionReason("");
  };

  const handleSaveCorrection = async () => {
    if (!editingRecord) return;
    setIsSubmittingCorrection(true);
    try {
      await onUpdateRecord(
        editingRecord.date,
        editingRecord.studentId,
        newStatus,
        editingRecord.sessionType,
        correctionReason
      );
      setEditingRecord(null);
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 17. HEADER & SEGMENTED NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ffffff0a]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Records
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-1 font-normal">
            Inspect daily records, historical archives, and submit audit-logged corrections.
          </p>
        </div>

        {/* Segmented Navigation */}
        <div className="flex items-center bg-[#171717] p-1 rounded-lg border border-[#2e2e2e] text-xs font-medium self-start sm:self-auto">
          {(
            [
              { id: "today", label: "Today" },
              { id: "history", label: "History" },
              { id: "corrections", label: "Corrections" }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#282828] text-white font-bold shadow-xs"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 18. TODAY'S RECORDS VIEW */}
      {activeTab === "today" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls Bar */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Class Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888888] font-medium">Class:</span>
                <select
                  value={todayClassFilter}
                  onChange={e => setTodayClassFilter(e.target.value)}
                  aria-label="Filter class"
                  className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Classes</option>
                  {accessibleClasses.map(c => (
                    <option key={c.id} value={c.className}>{c.className}</option>
                  ))}
                </select>
              </div>

              {/* Session Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888888] font-medium">Session:</span>
                <select
                  value={todaySessionFilter}
                  onChange={e => setTodaySessionFilter(e.target.value)}
                  aria-label="Filter session"
                  className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Sessions</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888888] font-medium">Status:</span>
                <select
                  value={todayStatusFilter}
                  onChange={e => setTodayStatusFilter(e.target.value)}
                  aria-label="Filter status"
                  className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>
            </div>

            <div className="text-xs text-[#888888] font-mono">
              {todayRecords.length} records today
            </div>
          </div>

          {/* Records Output: Desktop Refined Table / Mobile Structured List Rows */}
          {todayRecords.length === 0 ? (
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-12 text-center text-xs text-[#737373]">
              No attendance records recorded yet for today matching these filters.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#171717] border-b border-[#262626] text-[#888888] uppercase tracking-wider text-[10px] font-semibold">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Session</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Marked By</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222]">
                    {todayRecords.map((rec, i) => {
                      const st = studentMap.get(rec.studentId);
                      const norm = normalizeStatus(rec.status);
                      const badge = getStatusBadgeConfig(norm);
                      const timeStr = rec.timestamp
                        ? new Date(rec.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "-";

                      return (
                        <tr key={i} className="hover:bg-[#181818] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{st?.fullName || rec.studentId}</div>
                            <div className="text-[10px] text-[#737373] font-mono">{rec.studentId}</div>
                          </td>
                          <td className="py-3 px-4 text-[#e5e5e5]">{st?.class || "-"}</td>
                          <td className="py-3 px-4 text-[#888888]">
                            {rec.sessionType === "after_break" ? "Afternoon" : "Morning"}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.badge}`}>
                              {norm}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#888888] font-mono">{timeStr}</td>
                          <td className="py-3 px-4 text-[#888888]">Teacher (Classroom)</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenCorrection(rec)}
                              className="text-xs text-[#a855f7] hover:text-[#c084fc] font-medium inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              Correct
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Structured List Rows */}
              <div className="md:hidden space-y-2.5">
                {todayRecords.map((rec, i) => {
                  const st = studentMap.get(rec.studentId);
                  const norm = normalizeStatus(rec.status);
                  const badge = getStatusBadgeConfig(norm);
                  const timeStr = rec.timestamp
                    ? new Date(rec.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "-";

                  return (
                    <div
                      key={i}
                      className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">{st?.fullName || rec.studentId}</div>
                          <div className="text-xs text-[#888888] font-mono">{st?.class} · {rec.studentId}</div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.badge}`}>
                          {norm}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#888888] pt-1 border-t border-[#222222]">
                        <span className="font-mono">{rec.sessionType === "after_break" ? "Afternoon" : "Morning"} · {timeStr}</span>
                        <button
                          onClick={() => handleOpenCorrection(rec)}
                          className="text-[#a855f7] font-medium"
                        >
                          Correct
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* 19. RECORDS — HISTORY VIEW */}
      {activeTab === "history" && (
        <div className="space-y-4 animate-fadeIn">
          {/* History Controls Bar */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
                <input
                  type="text"
                  value={histSearch}
                  onChange={e => {
                    setHistSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search student name or ID..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#1c1c1c] border border-[#2e2e2e] text-xs text-white placeholder-[#666666] focus:outline-hidden focus:border-[#7c3aed]"
                />
              </div>

              {/* Date Range Picker */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#888888]">From:</span>
                <input
                  type="date"
                  value={histStartDate}
                  onChange={e => {
                    setHistStartDate(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Start date"
                  className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden cursor-pointer"
                />
                <span className="text-[#888888]">To:</span>
                <input
                  type="date"
                  value={histEndDate}
                  onChange={e => {
                    setHistEndDate(e.target.value);
                    setPage(1);
                  }}
                  aria-label="End date"
                  className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#222222]">
              {/* Class Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888888]">Class:</span>
                <select
                  value={histClassFilter}
                  onChange={e => {
                    setHistClassFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter history class"
                  className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Classes</option>
                  {accessibleClasses.map(c => (
                    <option key={c.id} value={c.className}>{c.className}</option>
                  ))}
                </select>
              </div>

              {/* Session Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888888]">Session:</span>
                <select
                  value={histSessionFilter}
                  onChange={e => {
                    setHistSessionFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter history session"
                  className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Sessions</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#888888]">Status:</span>
                <select
                  value={histStatusFilter}
                  onChange={e => {
                    setHistStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter history status"
                  className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              <div className="ml-auto text-xs text-[#888888] font-mono">
                {filteredHistory.length} records found
              </div>
            </div>
          </div>

          {/* History Results Table */}
          {filteredHistory.length === 0 ? (
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-12 text-center text-xs text-[#737373]">
              No attendance records match these filters.
            </div>
          ) : (
            <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#171717] border-b border-[#262626] text-[#888888] uppercase tracking-wider text-[10px] font-semibold">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Session</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222]">
                    {paginatedHistory.map((rec, i) => {
                      const st = studentMap.get(rec.studentId);
                      const norm = normalizeStatus(rec.status);
                      const badge = getStatusBadgeConfig(norm);

                      return (
                        <tr key={i} className="hover:bg-[#181818] transition-colors">
                          <td className="py-3 px-4 font-mono text-[#e5e5e5]">{rec.date}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{st?.fullName || rec.studentId}</div>
                            <div className="text-[10px] text-[#737373] font-mono">{rec.studentId}</div>
                          </td>
                          <td className="py-3 px-4 text-[#888888]">{st?.class || "-"}</td>
                          <td className="py-3 px-4 text-[#888888]">
                            {rec.sessionType === "after_break" ? "Afternoon" : "Morning"}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.badge}`}>
                              {norm}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenCorrection(rec)}
                              className="text-xs text-[#a855f7] hover:text-[#c084fc] font-medium inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              Review
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Clean Pagination Bar */}
              {totalPages > 1 && (
                <div className="px-4 py-3 bg-[#171717] border-t border-[#262626] flex items-center justify-between text-xs text-[#888888]">
                  <span>Page {page} of {totalPages}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-2.5 py-1 rounded-md bg-[#222222] border border-[#333333] text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-2.5 py-1 rounded-md bg-[#222222] border border-[#333333] text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 20. RECORDS — CORRECTIONS VIEW */}
      {activeTab === "corrections" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#e5e5e5]">
              Attendance Corrections & Audit Log
            </h2>
            <p className="text-xs text-[#888888]">
              Modify records with explicit reasons. Historical records are preserved with audit logs.
            </p>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-xl divide-y divide-[#262626] overflow-hidden">
            {(attendance || []).slice(0, 15).map((rec, i) => {
              const st = studentMap.get(rec.studentId);
              const norm = normalizeStatus(rec.status);
              const badge = getStatusBadgeConfig(norm);

              return (
                <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#181818] transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{st?.fullName || rec.studentId}</span>
                      <span className="text-xs text-[#737373] font-mono">({rec.studentId})</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.badge}`}>
                        {norm}
                      </span>
                    </div>
                    <div className="text-xs text-[#888888]">
                      Date: <strong className="text-white font-mono">{rec.date}</strong> · Session: {rec.sessionType === "after_break" ? "Afternoon" : "Morning"} · Class: {st?.class || "-"}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenCorrection(rec)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2c2c2c] text-white text-xs font-medium border border-[#333333] transition-colors cursor-pointer self-start sm:self-auto inline-flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3 h-3 text-[#a855f7]" />
                    Change Status
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 20. CORRECTION MODAL / DRAWER */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 max-w-lg w-full space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Attendance Correction
                </h3>
                <p className="text-xs text-[#888888]">Submit audit-logged status update</p>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-md text-[#737373] hover:text-white hover:bg-[#222222] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Record Information */}
            <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#888888]">Student:</span>
                <span className="font-semibold text-white">
                  {studentMap.get(editingRecord.studentId)?.fullName || editingRecord.studentId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Date:</span>
                <span className="font-mono text-white">{editingRecord.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Session:</span>
                <span className="text-white">
                  {editingRecord.sessionType === "after_break" ? "Afternoon" : "Morning"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Current Status:</span>
                <span className="font-bold text-white">{editingRecord.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Timestamp:</span>
                <span className="font-mono text-[#888888]">
                  {editingRecord.timestamp ? new Date(editingRecord.timestamp).toLocaleString() : "-"}
                </span>
              </div>
            </div>

            {/* Change Status Control */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#e5e5e5] block">
                Change Status:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["Present", "Absent", "Late", "Leave"] as AttendanceStatus[]).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewStatus(st)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      newStatus === st
                        ? "bg-[#7c3aed] text-white border-[#7c3aed] shadow-sm"
                        : "bg-[#1c1c1c] border-[#2e2e2e] text-[#888888] hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#e5e5e5] block">
                Reason for correction:
              </label>
              <textarea
                value={correctionReason}
                onChange={e => setCorrectionReason(e.target.value)}
                placeholder="e.g. Parent provided doctor letter; bus arrived late; administrative correction"
                rows={3}
                className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg p-3 text-xs text-white placeholder-[#666666] focus:outline-hidden focus:border-[#7c3aed]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-lg bg-[#222222] hover:bg-[#2c2c2c] text-white text-xs font-medium border border-[#333333] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                disabled={isSubmittingCorrection}
                className="px-5 py-2 rounded-lg bg-white hover:bg-[#f0f0f0] text-black text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSubmittingCorrection ? "Saving..." : "Save Correction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
