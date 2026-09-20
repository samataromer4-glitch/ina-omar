import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Coffee,
  Save,
  Search,
  CheckCheck,
  RotateCcw,
  AlertTriangle,
  Download,
  Share2,
  Filter,
  Check,
  UserCheck,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Wifi,
  WifiOff
} from "lucide-react";
import { Student, SchoolClass, AttendanceRecord, AttendanceStatus, AuthUser } from "../../types";
import {
  normalizeStatus,
  getStatusBadgeConfig,
  getStoredSessions,
  formatSessionName,
  exportAttendancePDF,
  openWhatsAppAttendanceAlert
} from "./attendanceUtils";

interface TakeAttendanceViewProps {
  user: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  currentDate: string;
  currentClass: string;
  currentSession: string;
  onDateChange: (date: string) => void;
  onClassChange: (className: string) => void;
  onSessionChange: (session: string) => void;
  onSaveAttendance: (records: { studentId: string; status: AttendanceStatus }[]) => Promise<void>;
  isSubmitting?: boolean;
}

export const TakeAttendanceView: React.FC<TakeAttendanceViewProps> = ({
  user,
  students,
  classes,
  attendance,
  currentDate,
  currentClass,
  currentSession,
  onDateChange,
  onClassChange,
  onSessionChange,
  onSaveAttendance,
  isSubmitting = false
}) => {
  const sessions = useMemo(() => getStoredSessions(), []);

  // Filter accessible classes based on teacher assignment
  const accessibleClasses = useMemo(() => {
    if (user.role === "teacher" && user.assignedClasses && user.assignedClasses.length > 0) {
      return classes.filter(c => user.assignedClasses?.includes(c.className));
    }
    return classes;
  }, [user, classes]);

  // Target class students
  const targetStudents = useMemo(() => {
    const list = students.filter(s => s.status !== "inactive" && s.status !== "archived");
    if (!currentClass || currentClass === "All") {
      if (user.role === "teacher" && user.assignedClasses && user.assignedClasses.length > 0) {
        return list.filter(s => user.assignedClasses?.includes(s.class));
      }
      return list;
    }
    return list.filter(s => s.class === currentClass);
  }, [students, currentClass, user]);

  // Working state for active attendance sheet: studentId -> status
  const [workingSheet, setWorkingSheet] = useState<Map<string, AttendanceStatus>>(new Map());
  const [initialSheetSnapshot, setInitialSheetSnapshot] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unmarked" | "Present" | "Absent" | "Late" | "Leave">("all");
  const [lastMarkAllCount, setLastMarkAllCount] = useState<number | null>(null);
  const [showUnmarkedModal, setShowUnmarkedModal] = useState(false);
  const [showAbsentNotificationModal, setShowAbsentNotificationModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load existing records whenever date, class, or session changes
  useEffect(() => {
    const sessionRecords = attendance.filter(
      a => a.date === currentDate && (a.sessionType || "before_break") === currentSession
    );

    const sheet = new Map<string, AttendanceStatus>();
    sessionRecords.forEach(r => {
      sheet.set(r.studentId, normalizeStatus(r.status));
    });

    setWorkingSheet(sheet);
    setInitialSheetSnapshot(JSON.stringify(Array.from(sheet.entries())));
    setLastMarkAllCount(null);
  }, [currentDate, currentSession, attendance]);

  // Check if modified
  const isDirty = useMemo(() => {
    const current = JSON.stringify(Array.from(workingSheet.entries()));
    return current !== initialSheetSnapshot;
  }, [workingSheet, initialSheetSnapshot]);

  // Handle single student status change
  const handleSetStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setWorkingSheet(prev => {
      const next = new Map(prev);
      next.set(studentId, status);
      return next;
    });
  }, []);

  // Smart Mark All Present
  const handleMarkAll = useCallback((statusToSet: AttendanceStatus = "Present") => {
    let count = 0;
    setWorkingSheet(prev => {
      const next = new Map(prev);
      targetStudents.forEach(s => {
        next.set(s.id, statusToSet);
        count++;
      });
      return next;
    });
    setLastMarkAllCount(count);
  }, [targetStudents]);

  // Reset to saved state
  const handleReset = useCallback(() => {
    try {
      const parsed = JSON.parse(initialSheetSnapshot || "[]");
      setWorkingSheet(new Map(parsed));
      setLastMarkAllCount(null);
    } catch {
      setWorkingSheet(new Map());
    }
  }, [initialSheetSnapshot]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    let list = targetStudents;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        s =>
          s.fullName.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          (s.rollNumber && s.rollNumber.toString().includes(q))
      );
    }

    if (statusFilter === "unmarked") {
      list = list.filter(s => !workingSheet.has(s.id));
    } else if (statusFilter !== "all") {
      list = list.filter(s => workingSheet.get(s.id) === statusFilter);
    }

    return list;
  }, [targetStudents, searchQuery, statusFilter, workingSheet]);

  // Summary counts
  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let marked = 0;

    targetStudents.forEach(s => {
      const st = workingSheet.get(s.id);
      if (st) {
        marked++;
        if (st === "Present") present++;
        else if (st === "Absent") absent++;
        else if (st === "Late") late++;
        else if (st === "Leave") leave++;
      }
    });

    const total = targetStudents.length;
    const unmarked = Math.max(0, total - marked);
    const rate = marked > 0 ? Math.round(((present + (late * 0.5)) / marked) * 100) : 0;

    return { total, marked, unmarked, present, absent, late, leave, rate };
  }, [targetStudents, workingSheet]);

  // Save handler with unmarked validation
  const handleTriggerSave = async () => {
    if (counts.unmarked > 0) {
      setShowUnmarkedModal(true);
      return;
    }
    await executeSave();
  };

  const executeSave = async () => {
    const records = targetStudents.map(s => ({
      studentId: s.id,
      status: workingSheet.get(s.id) || "Present"
    }));

    await onSaveAttendance(records);
    setInitialSheetSnapshot(JSON.stringify(Array.from(workingSheet.entries())));
    setLastMarkAllCount(null);
    setShowUnmarkedModal(false);

    // If there are absent students with guardian numbers, ask if they want to review WhatsApp notifications
    if (counts.absent > 0) {
      setShowAbsentNotificationModal(true);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP COMMAND BAR: DATE, CLASS, SESSION */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            {/* Date Picker */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-[#737373] block">
                Taariikhda (Date)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={currentDate}
                  onChange={e => onDateChange(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 rounded-sm bg-[#0a0a0a] text-xs font-bold font-mono border border-[#ffffff10] text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>

            {/* Class Selector */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-[#737373] block">
                Fasalka (Class)
              </label>
              <select
                value={currentClass}
                onChange={e => onClassChange(e.target.value)}
                className="w-full px-3 py-2 rounded-sm bg-[#0a0a0a] text-xs font-bold border border-[#ffffff10] text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
              >
                {user.role !== "teacher" && (
                  <option value="All">Dhammaan Fasallada (All Classes)</option>
                )}
                {accessibleClasses.map(c => (
                  <option key={c.id} value={c.className}>
                    {c.className} ({students.filter(s => s.class === c.className).length} arday)
                  </option>
                ))}
              </select>
            </div>

            {/* Session Selector */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-[#737373] block">
                Xilliga (Session)
              </label>
              <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[#ffffff10] p-1 rounded-sm">
                {sessions.map(s => {
                  const isCurrent = currentSession === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSessionChange(s.id)}
                      className={`flex-1 py-1.5 px-2 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer truncate ${
                        isCurrent
                          ? "bg-[#7c3aed] text-white shadow-sm"
                          : "text-[#737373] hover:text-[#e5e5e5]"
                      }`}
                      title={s.name}
                    >
                      {s.somaliName}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Offline/Online Indicator & Quick Export */}
          <div className="flex items-center gap-2 justify-end pt-1 lg:pt-0">
            <div
              className={`px-2.5 py-1.5 rounded-xs border text-[11px] font-mono flex items-center gap-1.5 ${
                isOnline
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? "Online (Toos)" : "Offline (Kayd Guurguura)"}</span>
            </div>

            <button
              onClick={() =>
                exportAttendancePDF({
                  schoolName: user.schoolName || "Dugsiga Pro 2026",
                  date: currentDate,
                  className: currentClass,
                  sessionName: formatSessionName(currentSession, sessions),
                  students: targetStudents,
                  records: Array.from(workingSheet.entries()).map(([studentId, status]) => ({
                    date: currentDate,
                    studentId,
                    status,
                    timestamp: new Date().toISOString(),
                    sessionType: currentSession
                  }))
                })
              }
              className="p-2 rounded-sm bg-[#1a1a1a] hover:bg-[#252525] border border-[#ffffff10] text-[#a3a3a3] hover:text-white transition-colors"
              title="Dhoofi xaadirinta PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Rapid Actions Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-[#ffffff08]">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleMarkAll("Present")}
              className="px-3 py-1.5 rounded-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Dhammaan Calaamadee: Jooga (Mark All Present)</span>
            </button>

            {isDirty && (
              <button
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded-xs bg-[#1a1a1a] hover:bg-[#252525] border border-[#ffffff15] text-[#a3a3a3] hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Dib ugu celi xaaladdii hore"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kanoqo (Reset)</span>
              </button>
            )}

            {lastMarkAllCount !== null && (
              <span className="text-[11px] text-emerald-400 font-mono">
                ✓ {lastMarkAllCount} arday ayaa loo calaamadeeyay Jooga.
              </span>
            )}
          </div>

          <button
            onClick={handleTriggerSave}
            disabled={isSubmitting}
            className={`px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              isDirty
                ? "bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-purple-900/30 ring-2 ring-[#7c3aed]/40"
                : "bg-[#262626] hover:bg-[#333333] text-[#e5e5e5]"
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "Waa la kaydinayaa..." : isDirty ? "Kaydi Isbedelka (Save Sheet)" : "Xaadirinta Waa Kaydsan Tahay"}</span>
          </button>
        </div>
      </div>

      {/* 2. ATTENDANCE PROGRESS & STATS BANNER */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-4 space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-mono tracking-wider text-[#a3a3a3]">
              Heerka Xaadiriska Fasalka:
            </span>
            <span className="text-xl font-bold font-mono text-white">
              {counts.rate}%
            </span>
            <span className="text-xs font-mono text-[#737373]">
              ({counts.marked} / {counts.total} la calaamadeeyay)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-xs border border-emerald-500/20">
              {counts.present} Jooga
            </span>
            <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-xs border border-rose-500/20">
              {counts.absent} Ma Joogo
            </span>
            <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-xs border border-amber-500/20">
              {counts.late} Daahay
            </span>
            <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-xs border border-blue-500/20">
              {counts.leave} Fasax
            </span>
            {counts.unmarked > 0 && (
              <span className="text-amber-400 font-bold bg-amber-500/15 px-2 py-0.5 rounded-xs border border-amber-500/30 animate-pulse">
                {counts.unmarked} Dhiman!
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-[#1a1a1a] rounded-full overflow-hidden flex">
          <div
            style={{ width: `${counts.total > 0 ? (counts.present / counts.total) * 100 : 0}%` }}
            className="bg-emerald-500 h-full transition-all"
          />
          <div
            style={{ width: `${counts.total > 0 ? (counts.late / counts.total) * 100 : 0}%` }}
            className="bg-amber-500 h-full transition-all"
          />
          <div
            style={{ width: `${counts.total > 0 ? (counts.leave / counts.total) * 100 : 0}%` }}
            className="bg-blue-500 h-full transition-all"
          />
          <div
            style={{ width: `${counts.total > 0 ? (counts.absent / counts.total) * 100 : 0}%` }}
            className="bg-rose-500 h-full transition-all"
          />
        </div>
      </div>

      {/* 3. ROSTER FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Ka raadi ardayda magaca, ID-ga ama Roll Number..."
            className="w-full pl-9 pr-3 py-2 rounded-sm bg-[#0f0f0f] border border-[#ffffff10] text-xs text-[#f5f5f5] placeholder-[#737373] focus:outline-none focus:border-[#7c3aed]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#737373] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-[#0f0f0f] border border-[#ffffff10] p-1 rounded-sm overflow-x-auto">
          {[
            { id: "all", label: `Dhammaan (${counts.total})` },
            { id: "unmarked", label: `Aan la calaamadayn (${counts.unmarked})`, alert: counts.unmarked > 0 },
            { id: "Present", label: `Jooga (${counts.present})` },
            { id: "Absent", label: `Ma Joogo (${counts.absent})` },
            { id: "Late", label: `Daahay (${counts.late})` },
            { id: "Leave", label: `Fasax (${counts.leave})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-2.5 py-1 rounded-xs text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === f.id
                  ? "bg-[#7c3aed]/20 text-white border border-[#7c3aed]/40"
                  : f.alert
                  ? "text-amber-400 hover:bg-[#ffffff05]"
                  : "text-[#888888] hover:text-[#e5e5e5] hover:bg-[#ffffff03]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. STUDENT ATTENDANCE WORKSPACE ROSTER */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden shadow-xl">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-8 h-8 text-[#737373] mx-auto opacity-50" />
            <h4 className="text-sm font-bold text-[#e5e5e5]">Ma jiraan arday buuxisa shuruudahaaga</h4>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              Wax natiijo ah laguma helin raadintaada. Isku day inaad bedesho fasalka ama filtarrada.
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="px-3 py-1.5 rounded-xs bg-[#1a1a1a] text-xs font-semibold text-[#c4b5fd] border border-[#ffffff10]"
              >
                Nadiifi Filtarrada (Clear Filters)
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#ffffff08]">
            {filteredStudents.map(student => {
              const currentStatus = workingSheet.get(student.id);
              const isMarked = currentStatus !== undefined;

              return (
                <div
                  key={student.id}
                  className={`p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                    !isMarked ? "bg-amber-500/[0.02]" : "hover:bg-[#ffffff02]"
                  }`}
                >
                  {/* Student Identity Block */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-sm overflow-hidden bg-[#7c3aed]/10 border border-[#7c3aed]/25 flex items-center justify-center font-bold text-xs font-mono text-[#c4b5fd] shrink-0">
                      {student.photo ? (
                        <img src={student.photo} alt={student.fullName} className="w-full h-full object-cover" />
                      ) : (
                        student.fullName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#f5f5f5] truncate block">
                          {student.fullName}
                        </span>
                        {!isMarked && (
                          <span className="px-1.5 py-0.2 rounded-xs bg-amber-500/15 border border-amber-500/30 text-[9px] font-mono text-amber-400">
                            Aan la calaamadayn
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#737373] font-mono flex items-center gap-2 mt-0.5">
                        <span>{student.id}</span>
                        <span>•</span>
                        <span className="text-[#a3a3a3] font-sans font-medium">{student.class}</span>
                        {student.rollNumber && <span>(Roll #{student.rollNumber})</span>}
                        {student.guardianPhone && (
                          <>
                            <span>•</span>
                            <span className="text-[#888888]">Tel: {student.guardianPhone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* High-Velocity Touch-Friendly Status Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap md:flex-nowrap justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#ffffff05]">
                    {[
                      {
                        key: "Present" as AttendanceStatus,
                        label: "Jooga",
                        sub: "Present",
                        activeClass: "bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/25 border-emerald-400 ring-1 ring-emerald-400",
                        inactiveClass: "bg-[#141414] text-[#888888] border-[#ffffff10] hover:text-[#d4d4d4] hover:border-[#ffffff20]"
                      },
                      {
                        key: "Absent" as AttendanceStatus,
                        label: "Ma Joogo",
                        sub: "Absent",
                        activeClass: "bg-rose-500 text-white font-bold shadow-md shadow-rose-500/25 border-rose-400 ring-1 ring-rose-400",
                        inactiveClass: "bg-[#141414] text-[#888888] border-[#ffffff10] hover:text-[#d4d4d4] hover:border-[#ffffff20]"
                      },
                      {
                        key: "Late" as AttendanceStatus,
                        label: "Daahay",
                        sub: "Late",
                        activeClass: "bg-amber-500 text-black font-bold shadow-md shadow-amber-500/25 border-amber-400 ring-1 ring-amber-400",
                        inactiveClass: "bg-[#141414] text-[#888888] border-[#ffffff10] hover:text-[#d4d4d4] hover:border-[#ffffff20]"
                      },
                      {
                        key: "Leave" as AttendanceStatus,
                        label: "Fasax",
                        sub: "Leave",
                        activeClass: "bg-blue-500 text-white font-bold shadow-md shadow-blue-500/25 border-blue-400 ring-1 ring-blue-400",
                        inactiveClass: "bg-[#141414] text-[#888888] border-[#ffffff10] hover:text-[#d4d4d4] hover:border-[#ffffff20]"
                      }
                    ].map(btn => {
                      const isSelected = currentStatus === btn.key;
                      return (
                        <button
                          key={btn.key}
                          type="button"
                          onClick={() => handleSetStatus(student.id, btn.key)}
                          className={`min-h-[42px] px-3.5 py-1.5 rounded-sm border text-xs flex flex-col items-center justify-center transition-all cursor-pointer min-w-[72px] sm:min-w-[80px] ${
                            isSelected ? btn.activeClass : btn.inactiveClass
                          }`}
                        >
                          <span className="leading-tight">{btn.label}</span>
                          <span className="text-[9px] opacity-75 font-mono uppercase leading-tight">
                            {btn.sub}
                          </span>
                        </button>
                      );
                    })}

                    {/* WhatsApp Quick Alert Trigger if Absent or Late */}
                    {(currentStatus === "Absent" || currentStatus === "Late") && student.guardianPhone && (
                      <button
                        onClick={() =>
                          openWhatsAppAttendanceAlert(
                            student,
                            currentDate,
                            currentStatus,
                            user.schoolName || "Dugsiga Pro 2026"
                          )
                        }
                        className="p-2 rounded-sm bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-colors ml-1"
                        title="U dir waalidka fariin WhatsApp ah"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. STICKY MOBILE SAVE BAR (Visible when scrolled) */}
      <div className="fixed bottom-3 left-4 right-4 md:hidden z-40 bg-[#0f0f0f]/95 backdrop-blur-md border border-[#ffffff15] p-3 rounded-lg shadow-2xl flex items-center justify-between gap-2">
        <div className="text-xs font-mono">
          <span className="text-[#a3a3a3]">Diiwaanka: </span>
          <span className="text-white font-bold">{counts.marked}/{counts.total}</span>
          {counts.unmarked > 0 && (
            <span className="text-amber-400 ml-1.5">({counts.unmarked} haray)</span>
          )}
        </div>

        <button
          onClick={handleTriggerSave}
          disabled={isSubmitting}
          className="px-4 py-2 bg-[#7c3aed] text-white text-xs font-bold rounded-sm shadow-md flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSubmitting ? "Kaydinayaa..." : "Kaydi"}</span>
        </button>
      </div>

      {/* UNMARKED STUDENTS MODAL PROTECTION */}
      {showUnmarkedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-[#ffffff15] rounded-sm p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Digniin: Arday Aan La Calaamadayn</h3>
            </div>

            <p className="text-xs text-[#d4d4d4] leading-relaxed">
              Waxaa jira <strong className="text-amber-400 font-mono">{counts.unmarked} arday</strong> oo aan weli loo diiwaangelin xaaladdooda xaadiriska maanta.
            </p>

            <div className="p-3 bg-[#0a0a0a] border border-[#ffffff08] rounded-sm text-xs text-[#a3a3a3] space-y-1">
              <p>Dooro mid ka mid ah tallaabooyinka soo socda:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>U calaamadee inta dhiman inay yihiin <strong>Jooga (Present)</strong></li>
                <li>Ama dib ugu noqo liiska si aad mid-mid ugu xaqiijiso</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  // Mark remaining unmarked students as Present and save
                  targetStudents.forEach(s => {
                    if (!workingSheet.has(s.id)) {
                      handleSetStatus(s.id, "Present");
                    }
                  });
                  executeSave();
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-sm cursor-pointer"
              >
                Inta Dhiman Jooga Ka Dhig & Kaydi
              </button>
              <button
                onClick={() => {
                  setShowUnmarkedModal(false);
                  setStatusFilter("unmarked");
                }}
                className="px-3.5 py-2 bg-[#1a1a1a] hover:bg-[#262626] border border-[#ffffff15] text-[#e5e5e5] text-xs font-semibold rounded-sm cursor-pointer"
              >
                Dib u Eeg Ardayda Dhiman
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP ABSENT NOTIFICATION PROMPT MODAL */}
      {showAbsentNotificationModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-[#ffffff15] rounded-sm p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-3 text-emerald-400">
              <Share2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Wargelinta Waalidiinta (WhatsApp)</h3>
            </div>

            <p className="text-xs text-[#d4d4d4] leading-relaxed">
              Xaadirinta si guul leh ayaa loo kaydiyey! Waxaa jira{" "}
              <strong className="text-rose-400 font-mono">{counts.absent} arday</strong> oo maanta maqan. Ma doonaysaa inaad wargeliso waalidiintooda WhatsApp?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAbsentNotificationModal(false)}
                className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#ffffff10] text-[#a3a3a3] text-xs font-semibold rounded-sm cursor-pointer"
              >
                Haatan Maya (Dismiss)
              </button>
              <button
                onClick={() => {
                  setShowAbsentNotificationModal(false);
                  // Filter to absents so teacher can send WhatsApp directly
                  setStatusFilter("Absent");
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Arag & U Dir WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
