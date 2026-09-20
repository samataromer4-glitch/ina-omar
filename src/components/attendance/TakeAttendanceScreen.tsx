import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Search,
  CheckCircle2,
  Users,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Filter,
  UserCheck,
  Clock,
  UserX,
  AlertCircle
} from "lucide-react";
import { Student, SchoolClass, AttendanceRecord, AttendanceStatus, AuthUser } from "../../types";
import { normalizeStatus, getStoredSessions } from "./attendanceUtils";

interface TakeAttendanceScreenProps {
  user: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  initialClass?: string;
  initialDate?: string;
  initialSession?: string;
  onSaveSheet: (date: string, session: string, records: { studentId: string; status: AttendanceStatus }[]) => Promise<void>;
  onViewSummary?: () => void;
  onSelectNextClass?: (nextClass: string) => void;
}

export const TakeAttendanceScreen: React.FC<TakeAttendanceScreenProps> = ({
  user,
  students,
  classes,
  attendance,
  initialClass,
  initialDate,
  initialSession,
  onSaveSheet,
  onViewSummary,
  onSelectNextClass
}) => {
  // Configured sessions
  const sessions = useMemo(() => getStoredSessions(), []);

  // Accessible classes for teacher or all for admin
  const accessibleClasses = useMemo(() => {
    if (user.role === "teacher" && user.assignedClasses && user.assignedClasses.length > 0) {
      return classes.filter(c => user.assignedClasses?.includes(c.className));
    }
    return classes;
  }, [user, classes]);

  // Command bar selection state
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (initialClass && accessibleClasses.some(c => c.className === initialClass)) {
      return initialClass;
    }
    return accessibleClasses[0]?.className || classes[0]?.className || "";
  });

  const [selectedDate, setSelectedDate] = useState<string>(
    () => initialDate || new Date().toISOString().split("T")[0]
  );

  const [selectedSession, setSelectedSession] = useState<string>(
    () => initialSession || sessions[0]?.id || "before_break"
  );

  // Sync if initialClass changes
  useEffect(() => {
    if (initialClass) setSelectedClass(initialClass);
  }, [initialClass]);

  // Students in selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.class === selectedClass && s.status !== "archived");
  }, [students, selectedClass]);

  // Local draft status map: studentId -> AttendanceStatus
  const [draftStatuses, setDraftStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [hasSavedSuccess, setHasSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedStatsSnapshot, setSavedStatsSnapshot] = useState<{
    total: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
  }>({ total: 0, present: 0, absent: 0, late: 0, leave: 0 });

  // Initialize draft statuses from existing attendance records when class, date, or session changes
  useEffect(() => {
    const existingForDay = attendance.filter(
      a => a.date === selectedDate && (a.sessionType || "before_break") === selectedSession
    );
    const existingMap = new Map<string, AttendanceStatus>();
    existingForDay.forEach(r => existingMap.set(r.studentId, normalizeStatus(r.status)));

    const initialMap: Record<string, AttendanceStatus> = {};
    classStudents.forEach(st => {
      if (existingMap.has(st.id)) {
        initialMap[st.id] = existingMap.get(st.id)!;
      }
    });
    setDraftStatuses(initialMap);
    setHasSavedSuccess(false);
  }, [selectedClass, selectedDate, selectedSession, attendance, classStudents]);

  // Toolbar controls
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnmarkedOnly, setShowUnmarkedOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | AttendanceStatus>("ALL");

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return classStudents.filter(st => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = st.fullName.toLowerCase().includes(q);
        const matchId = st.id.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }

      const stStatus = draftStatuses[st.id];

      // Show unmarked
      if (showUnmarkedOnly && stStatus) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL") {
        if (draftStatuses[st.id] !== statusFilter) return false;
      }

      return true;
    });
  }, [classStudents, searchQuery, showUnmarkedOnly, statusFilter, draftStatuses]);

  // Live status summary calculation
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    classStudents.forEach(st => {
      const s = draftStatuses[st.id];
      if (s === "Present") present++;
      else if (s === "Absent") absent++;
      else if (s === "Late") late++;
      else if (s === "Leave") leave++;
    });

    const total = classStudents.length;
    const marked = Object.keys(draftStatuses).filter(id =>
      classStudents.some(s => s.id === id)
    ).length;
    const remaining = Math.max(0, total - marked);

    return { total, marked, remaining, present, absent, late, leave };
  }, [classStudents, draftStatuses]);

  // Actions
  const handleMarkStudent = (studentId: string, status: AttendanceStatus) => {
    setDraftStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = { ...draftStatuses };
    classStudents.forEach(st => {
      if (!updated[st.id]) {
        updated[st.id] = "Present";
      }
    });
    setDraftStatuses(updated);
  };

  const handleSave = async () => {
    if (classStudents.length === 0) return;
    setIsSaving(true);
    try {
      const recordsToSave = classStudents.map(st => ({
        studentId: st.id,
        status: draftStatuses[st.id] || ("Present" as AttendanceStatus)
      }));

      await onSaveSheet(selectedDate, selectedSession, recordsToSave);

      setSavedStatsSnapshot({
        total: stats.total,
        present: stats.present || recordsToSave.filter(r => r.status === "Present").length,
        absent: stats.absent,
        late: stats.late,
        leave: stats.leave
      });
      setHasSavedSuccess(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Next class calculation
  const nextClass = useMemo(() => {
    const currentIndex = accessibleClasses.findIndex(c => c.className === selectedClass);
    if (currentIndex >= 0 && currentIndex < accessibleClasses.length - 1) {
      return accessibleClasses[currentIndex + 1].className;
    }
    return null;
  }, [accessibleClasses, selectedClass]);

  // SUCCESS STATE VIEW
  if (hasSavedSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-fadeIn">
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 sm:p-10 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Attendance Saved
            </h2>
            <p className="text-sm text-[#888888]">
              {selectedClass} · {selectedDate} · {sessions.find(s => s.id === selectedSession)?.name || selectedSession}
            </p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 max-w-md mx-auto">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#888888] mb-3">
              {savedStatsSnapshot.total} Students Recorded
            </div>
            <div className="grid grid-cols-4 gap-2 text-center divide-x divide-[#262626]">
              <div>
                <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400 block">
                  {savedStatsSnapshot.present}
                </span>
                <span className="text-[10px] text-[#888888] uppercase tracking-wider">Present</span>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold font-mono text-rose-400 block">
                  {savedStatsSnapshot.absent}
                </span>
                <span className="text-[10px] text-[#888888] uppercase tracking-wider">Absent</span>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold font-mono text-amber-400 block">
                  {savedStatsSnapshot.late}
                </span>
                <span className="text-[10px] text-[#888888] uppercase tracking-wider">Late</span>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold font-mono text-blue-400 block">
                  {savedStatsSnapshot.leave}
                </span>
                <span className="text-[10px] text-[#888888] uppercase tracking-wider">Leave</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {onViewSummary && (
              <button
                onClick={onViewSummary}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-white text-xs font-semibold transition-colors border border-[#333333] cursor-pointer"
              >
                View Summary
              </button>
            )}

            <button
              onClick={() => setHasSavedSuccess(false)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-white hover:bg-[#f0f0f0] text-black text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              Done
            </button>

            {nextClass && (
              <button
                onClick={() => {
                  setSelectedClass(nextClass);
                  setHasSavedSuccess(false);
                  if (onSelectNextClass) onSelectNextClass(nextClass);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                Continue to {nextClass}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* 8. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ffffff0a]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Take Attendance
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-1 font-normal">
            Mark today's attendance for your class.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <div className="relative inline-flex items-center bg-[#171717] border border-[#2e2e2e] rounded-md px-3 py-1.5 text-xs text-white shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#888888] mr-2 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              aria-label="Attendance date"
              className="bg-transparent text-xs font-medium text-white focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 8. COMMAND BAR: Clean Horizontal Selection Area */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
          {/* Class Selector */}
          <div className="flex items-center gap-2.5 flex-1 sm:max-w-xs">
            <span className="text-xs text-[#888888] font-medium uppercase tracking-wider shrink-0">
              Class:
            </span>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              aria-label="Select class"
              className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-hidden focus:border-[#7c3aed] cursor-pointer"
            >
              {accessibleClasses.map(cls => (
                <option key={cls.id} value={cls.className} className="bg-[#1c1c1c] text-white">
                  {cls.className}
                </option>
              ))}
            </select>
          </div>

          {/* Session Selector */}
          <div className="flex items-center gap-2.5 flex-1 sm:max-w-xs">
            <span className="text-xs text-[#888888] font-medium uppercase tracking-wider shrink-0">
              Session:
            </span>
            <select
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)}
              aria-label="Select session"
              className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-hidden focus:border-[#7c3aed] cursor-pointer"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id} className="bg-[#1c1c1c] text-white">
                  {s.somaliName} ({s.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 9 & 10. SUMMARY & ATTENDANCE STATUS SUMMARY */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Summary */}
          <div className="flex items-baseline gap-4">
            <span className="text-base sm:text-lg font-bold text-white font-mono">
              {stats.total} Students
            </span>
            <span className="text-xs text-[#888888] font-mono">
              <strong className="text-white font-bold">{stats.marked}</strong> Marked
            </span>
            <span className="text-xs text-amber-400 font-mono font-medium">
              {stats.remaining} Remaining
            </span>
          </div>

          {/* Compact Status Statistics (updates visually live) */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20">
              <span>Present</span>
              <span className="font-bold">{stats.present}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-md border border-rose-500/20">
              <span>Absent</span>
              <span className="font-bold">{stats.absent}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md border border-amber-500/20">
              <span>Late</span>
              <span className="font-bold">{stats.late}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/20">
              <span>Leave</span>
              <span className="font-bold">{stats.leave}</span>
            </div>
          </div>
        </div>

        {/* Subtle Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-[#262626] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#7c3aed] h-full transition-all duration-300"
              style={{
                width: `${stats.total > 0 ? (stats.marked / stats.total) * 100 : 0}%`
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[#737373] font-mono">
            <span>Progress</span>
            <span>{stats.marked} / {stats.total}</span>
          </div>
        </div>
      </div>

      {/* 14. TAKE ATTENDANCE TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#141414] border border-[#262626] text-xs text-white placeholder-[#666666] focus:outline-hidden focus:border-[#7c3aed]"
            />
          </div>

          {/* Show Unmarked Toggle */}
          <button
            onClick={() => setShowUnmarkedOnly(!showUnmarkedOnly)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              showUnmarkedOnly
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : "bg-[#141414] border-[#262626] text-[#888888] hover:text-white"
            }`}
          >
            Show Unmarked ({stats.remaining})
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Filter status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            aria-label="Filter status"
            className="bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-xs font-medium text-[#e5e5e5] focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Leave">Leave</option>
          </select>

          {/* Mark All Present */}
          <button
            onClick={handleMarkAllPresent}
            className="px-4 py-2 rounded-lg bg-[#222222] hover:bg-[#2c2c2c] text-white text-xs font-semibold transition-colors border border-[#333333] cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5" />
            Mark All Present
          </button>
        </div>
      </div>

      {/* 11 & 12 & 13. TAKE ATTENDANCE — STUDENT WORKSPACE */}
      <div className="space-y-2">
        {filteredStudents.length === 0 ? (
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-[#555555] mx-auto" />
            <p className="text-sm text-[#e5e5e5] font-medium">No students match current view.</p>
            <p className="text-xs text-[#737373]">
              {showUnmarkedOnly
                ? "All students in this class have already been marked!"
                : "Try clearing your search query or status filter."}
            </p>
          </div>
        ) : (
          filteredStudents.map(student => {
            const currentStatus = draftStatuses[student.id];

            return (
              <div
                key={student.id}
                className="bg-[#141414] hover:bg-[#181818] border border-[#262626] rounded-xl p-3.5 sm:p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
              >
                {/* Student Identity */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {student.photo ? (
                    <img
                      src={student.photo}
                      alt={student.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-[#333333] shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#242424] border border-[#333333] flex items-center justify-center text-xs font-bold text-[#e5e5e5] shrink-0">
                      {student.fullName
                        .split(" ")
                        .map(n => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {student.fullName}
                    </div>
                    <div className="text-xs text-[#888888] font-mono mt-0.5 truncate">
                      {student.id} · {student.class}
                    </div>
                  </div>
                </div>

                {/* 13. Status Control: Refined Segmented Control / Pill Interaction (>= 44px Touch Targets) */}
                <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:gap-2">
                  {(
                    [
                      {
                        key: "Present" as AttendanceStatus,
                        label: "Present",
                        activeClass: "bg-emerald-500 text-white font-bold border-emerald-400 shadow-sm"
                      },
                      {
                        key: "Absent" as AttendanceStatus,
                        label: "Absent",
                        activeClass: "bg-rose-500 text-white font-bold border-rose-400 shadow-sm"
                      },
                      {
                        key: "Late" as AttendanceStatus,
                        label: "Late",
                        activeClass: "bg-amber-500 text-black font-bold border-amber-400 shadow-sm"
                      },
                      {
                        key: "Leave" as AttendanceStatus,
                        label: "Leave",
                        activeClass: "bg-blue-500 text-white font-bold border-blue-400 shadow-sm"
                      }
                    ] as const
                  ).map(btn => {
                    const isSelected = currentStatus === btn.key;
                    return (
                      <button
                        key={btn.key}
                        type="button"
                        onClick={() => handleMarkStudent(student.id, btn.key)}
                        className={`min-h-[44px] sm:min-h-[38px] px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer border flex items-center justify-center font-medium ${
                          isSelected
                            ? btn.activeClass
                            : "bg-[#1c1c1c] border-[#2e2e2e] text-[#888888] hover:text-white hover:bg-[#252525]"
                        }`}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 15. FIXED ACTION AREA AT BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#121212]/95 backdrop-blur-md border-t border-[#262626] px-4 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-bold font-mono text-white">
              {stats.marked} / {stats.total} marked
            </span>
            {stats.remaining > 0 ? (
              <span className="text-xs text-amber-400 hidden sm:inline-block">
                ({stats.remaining} students remaining)
              </span>
            ) : (
              <span className="text-xs text-emerald-400 hidden sm:inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All marked
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || classStudents.length === 0}
            className="min-h-[44px] px-6 sm:px-8 py-2.5 rounded-xl bg-white hover:bg-[#eaeaea] text-black text-xs sm:text-sm font-bold transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isSaving ? (
              <>Saving Attendance...</>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Attendance
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
