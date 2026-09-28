import React, { useState, useMemo } from "react";
import {
  Search,
  User,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserX,
  TrendingUp,
  Calendar,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  MessageSquare,
  ShieldAlert,
  Info
} from "lucide-react";
import { Student, SchoolClass, AttendanceRecord, AuthUser } from "../../types";
import {
  normalizeStatus,
  getStatusBadgeConfig,
  calculateStudentAttendance,
  openWhatsAppAttendanceAlert
} from "./attendanceUtils";

interface StudentsScreenProps {
  user: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  todayDate: string;
  initialSubTab?: "student_attendance" | "alerts";
  initialStudentId?: string;
  onNavigateToTake?: (className?: string) => void;
}

export const StudentsScreen: React.FC<StudentsScreenProps> = ({
  user,
  students = [],
  classes = [],
  attendance = [],
  todayDate,
  initialSubTab = "student_attendance",
  initialStudentId,
  onNavigateToTake
}) => {
  const [activeTab, setActiveTab] = useState<"student_attendance" | "alerts">(initialSubTab);

  // Accessible students
  const accessibleStudents = useMemo(() => {
    const list = students || [];
    if (user?.role === "teacher" && user?.assignedClasses && user.assignedClasses.length > 0) {
      return list.filter(s => user.assignedClasses?.includes(s.class));
    }
    return list;
  }, [user, students]);

  // Selected student state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (initialStudentId && (accessibleStudents || []).some(s => s.id === initialStudentId)) {
      return initialStudentId;
    }
    return (accessibleStudents || [])[0]?.id || "";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // Filtered student search list
  const filteredStudents = useMemo(() => {
    return accessibleStudents.filter(s => {
      if (classFilter !== "ALL" && s.class !== classFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.fullName.toLowerCase().includes(q);
        const matchId = s.id.toLowerCase().includes(q);
        return matchName || matchId;
      }
      return true;
    });
  }, [accessibleStudents, classFilter, searchQuery]);

  const selectedStudent = useMemo(() => {
    return (accessibleStudents || []).find(s => s && s.id === selectedStudentId);
  }, [accessibleStudents, selectedStudentId]);

  // Student metrics
  const studentMetrics = useMemo(() => {
    if (!selectedStudentId) return null;
    return calculateStudentAttendance(selectedStudentId, attendance || []);
  }, [selectedStudentId, attendance]);

  // Recent attendance timeline (last 10 records)
  const recentRecords = useMemo(() => {
    if (!studentMetrics || !studentMetrics.statusLogs) return [];
    return (studentMetrics.statusLogs || []).slice(0, 10);
  }, [studentMetrics]);

  // -------------------------------------------------------------
  // ATTENDANCE ALERTS COMPUTATION
  // -------------------------------------------------------------
  const alertsData = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateLimit = thirtyDaysAgo.toISOString().split("T")[0];

    const recentRecords = (attendance || []).filter(a => a && a.date >= dateLimit);

    // Track absences, lates, totals per student
    const studentStats = new Map<string, { total: number; present: number; absent: number; late: number }>();

    recentRecords.forEach(r => {
      if (!studentStats.has(r.studentId)) {
        studentStats.set(r.studentId, { total: 0, present: 0, absent: 0, late: 0 });
      }
      const st = studentStats.get(r.studentId)!;
      st.total++;
      const norm = normalizeStatus(r.status);
      if (norm === "Present") st.present++;
      else if (norm === "Absent") st.absent++;
      else if (norm === "Late") st.late++;
    });

    // 1. Repeated Absence (3+ in 30 days)
    const repeatedAbsenceList: Array<{ student: Student; count: number }> = [];
    // 2. Repeated Late (3+ in 30 days)
    const repeatedLateList: Array<{ student: Student; count: number }> = [];
    // 3. Low Attendance Rate (< 80%)
    const lowRateList: Array<{ student: Student; rate: number; total: number }> = [];

    (accessibleStudents || []).forEach(st => {
      if (!st) return;
      const stats = studentStats.get(st.id);
      if (!stats) return;

      if (stats.absent >= 3) {
        repeatedAbsenceList.push({ student: st, count: stats.absent });
      }
      if (stats.late >= 3) {
        repeatedLateList.push({ student: st, count: stats.late });
      }
      const rate = stats.total > 0 ? Math.round(((stats.present + (stats.late * 0.5)) / stats.total) * 100) : 100;
      if (stats.total >= 5 && rate < 80) {
        lowRateList.push({ student: st, rate, total: stats.total });
      }
    });

    // 4. Incomplete Attendance Today (classes with missing records)
    const todayRecords = (attendance || []).filter(a => a && a.date === todayDate);
    const incompleteClasses: Array<{ className: string; marked: number; total: number }> = [];

    (classes || []).forEach(c => {
      if (!c) return;
      const clsStudents = (accessibleStudents || []).filter(s => s && s.class === c.className);
      const studentIds = new Set(clsStudents.map(s => s.id));
      const marked = todayRecords.filter(r => studentIds.has(r.studentId)).length;
      if (clsStudents.length > 0 && marked < clsStudents.length) {
        incompleteClasses.push({
          className: c.className,
          marked,
          total: clsStudents.length
        });
      }
    });

    return {
      repeatedAbsenceList: repeatedAbsenceList.sort((a, b) => b.count - a.count),
      repeatedLateList: repeatedLateList.sort((a, b) => b.count - a.count),
      lowRateList: lowRateList.sort((a, b) => a.rate - b.rate),
      incompleteClasses
    };
  }, [attendance, accessibleStudents, classes, todayDate]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER & SEGMENTED TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ffffff0a]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Students
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-1 font-normal">
            Understand attendance patterns for individual students and resolve attendance alerts.
          </p>
        </div>

        <div className="flex items-center bg-[#171717] p-1 rounded-lg border border-[#2e2e2e] text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("student_attendance")}
            className={`px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "student_attendance"
                ? "bg-[#282828] text-white font-bold shadow-xs"
                : "text-[#888888] hover:text-white"
            }`}
          >
            Student Attendance
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-4 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "alerts"
                ? "bg-[#282828] text-white font-bold shadow-xs"
                : "text-[#888888] hover:text-white"
            }`}
          >
            Attendance Alerts
            {alertsData.repeatedAbsenceList.length + alertsData.repeatedLateList.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      </div>

      {/* VIEW 1: STUDENT ATTENDANCE */}
      {activeTab === "student_attendance" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left Column: Student Selector */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 space-y-3">
              {/* Search & Class Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#1c1c1c] border border-[#2e2e2e] text-xs text-white placeholder-[#666666] focus:outline-hidden focus:border-[#7c3aed]"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#888888]">Class:</span>
                <select
                  value={classFilter}
                  onChange={e => setClassFilter(e.target.value)}
                  aria-label="Filter student class"
                  className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-md px-2 py-1 text-xs text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.className}>{c.className}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scrollable Student List */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl divide-y divide-[#222222] max-h-[600px] overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#737373]">
                  No students found.
                </div>
              ) : (
                filteredStudents.map(student => {
                  const isSelected = student.id === selectedStudentId;
                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`p-3 flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#202020] border-l-2 border-l-[#7c3aed]"
                          : "hover:bg-[#181818]"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className={`text-xs font-semibold truncate ${isSelected ? "text-white" : "text-[#e5e5e5]"}`}>
                          {student.fullName}
                        </div>
                        <div className="text-[10px] text-[#737373] font-mono">
                          {student.id} · {student.class}
                        </div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-[#a855f7]" : "text-[#444444]"}`} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Deep Student Profile */}
          <div className="lg:col-span-8 space-y-6">
            {!selectedStudent || !studentMetrics ? (
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-16 text-center text-xs text-[#737373]">
                Select a student from the list to view attendance insights.
              </div>
            ) : (
              <>
                {/* 22. Header: Photo, Student Name, Student ID, Class */}
                <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {selectedStudent.photo ? (
                      <img
                        src={selectedStudent.photo}
                        alt={selectedStudent.fullName}
                        className="w-14 h-14 rounded-full object-cover border border-[#333333]"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#222222] border border-[#333333] flex items-center justify-center text-base font-bold text-white">
                        {(selectedStudent.fullName || "").split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("")}
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white font-sans">
                        {selectedStudent.fullName}
                      </h2>
                      <div className="text-xs text-[#888888] font-mono mt-0.5">
                        ID: {selectedStudent.id} · Class: {selectedStudent.class} · Parent: {selectedStudent.parentPhone || "Not configured"}
                      </div>
                    </div>
                  </div>

                  {selectedStudent.parentPhone && (
                    <button
                      onClick={() => openWhatsAppAttendanceAlert(selectedStudent, studentMetrics?.statusLogs?.[0]?.date || todayDate, studentMetrics?.statusLogs?.[0]?.status || "Absent")}
                      className="px-3.5 py-2 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-emerald-400 text-xs font-semibold border border-[#333333] transition-colors cursor-pointer self-start sm:self-auto inline-flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Notify Parent
                    </button>
                  )}
                </div>

                {/* 22. Dominant Attendance Rate + Supporting Numbers */}
                <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                    <div className="sm:col-span-5 space-y-1">
                      <span className="text-xs text-[#888888] font-medium uppercase tracking-wider block">
                        Attendance Rate
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono">
                          {studentMetrics.attendanceRate}%
                        </span>
                        <span className="text-xs text-[#888888]">
                          ({studentMetrics.totalSessions} sessions logged)
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-medium">
                        Current Streak: {studentMetrics.currentStreak} consecutive days
                      </div>
                    </div>

                    <div className="sm:col-span-7 grid grid-cols-4 gap-2 pt-4 sm:pt-0 sm:border-l sm:border-[#262626] sm:pl-6 text-center">
                      <div>
                        <span className="text-xs text-[#888888] block">Present</span>
                        <span className="text-xl font-bold text-emerald-400 font-mono">
                          {studentMetrics.presentCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-[#888888] block">Absent</span>
                        <span className="text-xl font-bold text-rose-400 font-mono">
                          {studentMetrics.absentCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-[#888888] block">Late</span>
                        <span className="text-xl font-bold text-amber-400 font-mono">
                          {studentMetrics.lateCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-[#888888] block">Leave</span>
                        <span className="text-xl font-bold text-blue-400 font-mono">
                          {studentMetrics.leaveCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 22. Recent Attendance Timeline (Last 10 Days) */}
                <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#e5e5e5]">
                    Recent Attendance (Last 10 Records)
                  </h3>

                  {recentRecords.length === 0 ? (
                    <div className="text-xs text-[#737373] py-4">No recent records available.</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {recentRecords.map((r, i) => {
                        const norm = normalizeStatus(r.status);
                        const badge = getStatusBadgeConfig(norm);
                        return (
                          <div
                            key={i}
                            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-2.5 text-center space-y-1"
                          >
                            <span className="text-[10px] text-[#888888] font-mono block">
                              {r.date}
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badge.badge}`}>
                              {norm}
                            </span>
                            <span className="text-[9px] text-[#666666] block truncate">
                              {r.sessionType === "after_break" ? "Afternoon" : "Morning"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 22. Progressive Disclosure: Expandable Attendance History Log */}
                <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setHistoryExpanded(!historyExpanded)}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-[#e5e5e5] hover:bg-[#181818] transition-colors cursor-pointer"
                  >
                    <span>Full Attendance History ({studentMetrics.statusLogs.length} entries)</span>
                    {historyExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#888888]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#888888]" />
                    )}
                  </button>

                  {historyExpanded && (
                    <div className="border-t border-[#262626] divide-y divide-[#222222] max-h-64 overflow-y-auto">
                      {(studentMetrics.statusLogs || []).map((log, idx) => {
                        const norm = normalizeStatus(log.status);
                        const badge = getStatusBadgeConfig(norm);
                        return (
                          <div key={idx} className="px-5 py-2.5 flex items-center justify-between text-xs">
                            <span className="font-mono text-[#e5e5e5]">{log.date}</span>
                            <span className="text-[#888888]">
                              {log.sessionType === "after_break" ? "Afternoon Session" : "Morning Session"}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.badge}`}>
                              {norm}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: ATTENDANCE ALERTS */}
      {activeTab === "alerts" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Subtitle */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#e5e5e5]">
              System Attendance Alerts
            </h2>
            <p className="text-xs text-[#888888]">
              Targeted notifications for students and classes requiring administrative review.
            </p>
          </div>

          {/* Alerts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Repeated Absence */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2">
                  <UserX className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                    Repeated Absence (3+ Times)
                  </h3>
                </div>
                <span className="text-xs text-rose-400 font-mono font-bold">
                  {alertsData.repeatedAbsenceList.length} students
                </span>
              </div>

              {alertsData.repeatedAbsenceList.length === 0 ? (
                <div className="text-xs text-[#737373] py-4 text-center">
                  No students with repeated absences in the last 30 days.
                </div>
              ) : (
                <div className="divide-y divide-[#222222] max-h-60 overflow-y-auto">
                  {(alertsData.repeatedAbsenceList || []).map(({ student, count }) => (
                    <div key={student.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{student.fullName}</div>
                        <div className="text-[10px] text-[#737373] font-mono">{student.id} · {student.class}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-rose-400 font-mono font-bold">
                          {count} absences
                        </span>
                        <button
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            setActiveTab("student_attendance");
                          }}
                          className="px-2.5 py-1 rounded bg-[#222222] hover:bg-[#2c2c2c] text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Repeated Late */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                    Repeated Late (3+ Times)
                  </h3>
                </div>
                <span className="text-xs text-amber-400 font-mono font-bold">
                  {(alertsData.repeatedLateList || []).length} students
                </span>
              </div>

              {(alertsData.repeatedLateList || []).length === 0 ? (
                <div className="text-xs text-[#737373] py-4 text-center">
                  No students with excessive tardiness recorded.
                </div>
              ) : (
                <div className="divide-y divide-[#222222] max-h-60 overflow-y-auto">
                  {(alertsData.repeatedLateList || []).map(({ student, count }) => (
                    <div key={student.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{student.fullName}</div>
                        <div className="text-[10px] text-[#737373] font-mono">{student.id} · {student.class}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-400 font-mono font-bold">
                          {count} late
                        </span>
                        <button
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            setActiveTab("student_attendance");
                          }}
                          className="px-2.5 py-1 rounded bg-[#222222] hover:bg-[#2c2c2c] text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Low Attendance Rate (< 80%) */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                    Low Attendance Rate (&lt; 80%)
                  </h3>
                </div>
                <span className="text-xs text-rose-400 font-mono font-bold">
                  {(alertsData.lowRateList || []).length} students
                </span>
              </div>

              {(alertsData.lowRateList || []).length === 0 ? (
                <div className="text-xs text-[#737373] py-4 text-center">
                  All active students maintain satisfactory attendance rates.
                </div>
              ) : (
                <div className="divide-y divide-[#222222] max-h-60 overflow-y-auto">
                  {(alertsData.lowRateList || []).map(({ student, rate, total }) => (
                    <div key={student.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{student.fullName}</div>
                        <div className="text-[10px] text-[#737373] font-mono">{student.id} · {student.class}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-rose-400 font-mono font-bold">
                          {rate}% ({total} days)
                        </span>
                        <button
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            setActiveTab("student_attendance");
                          }}
                          className="px-2.5 py-1 rounded bg-[#222222] hover:bg-[#2c2c2c] text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Incomplete Attendance Today */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                    Incomplete Attendance Today
                  </h3>
                </div>
                <span className="text-xs text-blue-400 font-mono font-bold">
                  {(alertsData.incompleteClasses || []).length} classes
                </span>
              </div>

              {(alertsData.incompleteClasses || []).length === 0 ? (
                <div className="text-xs text-emerald-400 py-4 text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All classes have completed attendance today!
                </div>
              ) : (
                <div className="divide-y divide-[#222222] max-h-60 overflow-y-auto">
                  {(alertsData.incompleteClasses || []).map(({ className, marked, total }) => (
                    <div key={className} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{className}</div>
                        <div className="text-[10px] text-[#737373] font-mono">
                          {marked} / {total} marked ({total - marked} remaining)
                        </div>
                      </div>
                      {onNavigateToTake && (
                        <button
                          onClick={() => onNavigateToTake(className)}
                          className="px-2.5 py-1 rounded bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Take Now
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
