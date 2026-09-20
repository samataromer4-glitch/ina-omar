import React, { useMemo } from "react";
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  UserX,
  PlusCircle,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Zap
} from "lucide-react";
import { Student, SchoolClass, AttendanceRecord, AuthUser } from "../../types";
import {
  normalizeStatus,
  getStatusBadgeConfig,
  getStoredSessions,
  formatSessionName,
  openWhatsAppAttendanceAlert
} from "./attendanceUtils";

interface AttendanceDashboardProps {
  user: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  todayDate: string;
  currentSession: string;
  onNavigateSubTab: (subTab: string, initialFilter?: { class?: string; date?: string; session?: string }) => void;
  onTakeAttendance: (className?: string) => void;
}

export const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({
  user,
  students,
  classes,
  attendance,
  todayDate,
  currentSession,
  onNavigateSubTab,
  onTakeAttendance
}) => {
  const sessions = useMemo(() => getStoredSessions(), []);

  // Filter accessible classes for teachers
  const accessibleClasses = useMemo(() => {
    if (user.role === "teacher" && user.assignedClasses && user.assignedClasses.length > 0) {
      return classes.filter(c => user.assignedClasses?.includes(c.className));
    }
    return classes;
  }, [user, classes]);

  const accessibleStudents = useMemo(() => {
    if (user.role === "teacher" && user.assignedClasses && user.assignedClasses.length > 0) {
      return students.filter(s => user.assignedClasses?.includes(s.class));
    }
    return students;
  }, [user, students]);

  // Today's records for accessible students
  const todayRecords = useMemo(() => {
    const studentIds = new Set(accessibleStudents.map(s => s.id));
    return attendance.filter(
      a => a.date === todayDate && studentIds.has(a.studentId)
    );
  }, [attendance, todayDate, accessibleStudents]);

  // Session-specific records for today
  const sessionRecords = useMemo(() => {
    return todayRecords.filter(r => (r.sessionType || "before_break") === currentSession);
  }, [todayRecords, currentSession]);

  // Calculation of today's status counts
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    sessionRecords.forEach(r => {
      const st = normalizeStatus(r.status);
      if (st === "Present") present++;
      else if (st === "Absent") absent++;
      else if (st === "Late") late++;
      else if (st === "Leave") leave++;
    });

    const totalMarked = sessionRecords.length;
    const totalStudents = accessibleStudents.length;
    const pendingStudents = Math.max(0, totalStudents - totalMarked);
    const attendanceRate = totalMarked > 0
      ? Math.round(((present + (late * 0.5)) / totalMarked) * 100)
      : 0;

    return {
      totalStudents,
      totalMarked,
      pendingStudents,
      present,
      absent,
      late,
      leave,
      attendanceRate
    };
  }, [sessionRecords, accessibleStudents]);

  // Class completion tracking for today's session
  const classStatusList = useMemo(() => {
    return accessibleClasses.map(cls => {
      const classStudents = accessibleStudents.filter(s => s.class === cls.className);
      const studentIds = new Set(classStudents.map(s => s.id));
      const marked = sessionRecords.filter(r => studentIds.has(r.studentId));

      const isCompleted = classStudents.length > 0 && marked.length >= classStudents.length;
      const isPartially = marked.length > 0 && marked.length < classStudents.length;
      const isNotStarted = marked.length === 0;

      const pCount = marked.filter(r => normalizeStatus(r.status) === "Present").length;
      const aCount = marked.filter(r => normalizeStatus(r.status) === "Absent").length;
      const lCount = marked.filter(r => normalizeStatus(r.status) === "Late").length;

      return {
        className: cls.className,
        total: classStudents.length,
        markedCount: marked.length,
        isCompleted,
        isPartially,
        isNotStarted,
        presentCount: pCount,
        absentCount: aCount,
        lateCount: lCount,
        rate: marked.length > 0 ? Math.round(((pCount + (lCount * 0.5)) / marked.length) * 100) : 0
      };
    });
  }, [accessibleClasses, accessibleStudents, sessionRecords]);

  const completedClassesCount = classStatusList.filter(c => c.isCompleted).length;
  const pendingClassesCount = classStatusList.filter(c => !c.isCompleted).length;

  // Absentees and Late arrivals today
  const todayAbsentees = useMemo(() => {
    return sessionRecords
      .filter(r => normalizeStatus(r.status) === "Absent")
      .map(r => {
        const student = accessibleStudents.find(s => s.id === r.studentId);
        return { record: r, student };
      })
      .filter(item => Boolean(item.student));
  }, [sessionRecords, accessibleStudents]);

  const todayLateArrivals = useMemo(() => {
    return sessionRecords
      .filter(r => normalizeStatus(r.status) === "Late")
      .map(r => {
        const student = accessibleStudents.find(s => s.id === r.studentId);
        return { record: r, student };
      })
      .filter(item => Boolean(item.student));
  }, [sessionRecords, accessibleStudents]);

  // 7-day trend calculation
  const weeklyTrend = useMemo(() => {
    const dates: string[] = [];
    const now = new Date(todayDate);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const studentIds = new Set(accessibleStudents.map(s => s.id));

    return dates.map(dt => {
      const recs = attendance.filter(a => a.date === dt && studentIds.has(a.studentId));
      const p = recs.filter(a => normalizeStatus(a.status) === "Present").length;
      const l = recs.filter(a => normalizeStatus(a.status) === "Late").length;
      const total = recs.length;
      const rate = total > 0 ? Math.round(((p + (l * 0.5)) / total) * 100) : 0;
      const dayName = new Date(dt).toLocaleDateString("so-SO", { weekday: "short" });
      return { date: dt, dayName, total, rate, present: p };
    });
  }, [attendance, todayDate, accessibleStudents]);

  return (
    <div className="space-y-6">
      {/* 1. HERO COMMAND PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Attendance Rate Card (7 cols) */}
        <div className="lg:col-span-7 bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-mono text-[#a3a3a3]">
                  Heerka Xaadirinta Guud ee Maanta ({todayDate})
                </span>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-xs bg-[#7c3aed]/15 text-[#c4b5fd] border border-[#7c3aed]/30">
                {formatSessionName(currentSession, sessions)}
              </span>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-white">
                {stats.attendanceRate}%
              </span>
              <div className="text-xs text-[#a3a3a3] font-medium leading-tight">
                <span className="text-emerald-400 font-bold">{stats.present}</span> jooga •{" "}
                <span className="text-rose-400 font-bold">{stats.absent}</span> maqan •{" "}
                <span className="text-amber-400 font-bold">{stats.late}</span> daahay
              </div>
            </div>

            {/* Attendance Rate Progress bar */}
            <div className="space-y-1.5 pt-1">
              <div className="h-2.5 w-full bg-[#1c1c1c] rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${stats.totalMarked > 0 ? (stats.present / stats.totalMarked) * 100 : 0}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title={`Present: ${stats.present}`}
                />
                <div
                  style={{ width: `${stats.totalMarked > 0 ? (stats.late / stats.totalMarked) * 100 : 0}%` }}
                  className="bg-amber-500 h-full transition-all duration-500"
                  title={`Late: ${stats.late}`}
                />
                <div
                  style={{ width: `${stats.totalMarked > 0 ? (stats.leave / stats.totalMarked) * 100 : 0}%` }}
                  className="bg-blue-500 h-full transition-all duration-500"
                  title={`Leave: ${stats.leave}`}
                />
                <div
                  style={{ width: `${stats.totalMarked > 0 ? (stats.absent / stats.totalMarked) * 100 : 0}%` }}
                  className="bg-rose-500 h-full transition-all duration-500"
                  title={`Absent: ${stats.absent}`}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#737373]">
                <span>Diiwaangashan: {stats.totalMarked} / {stats.totalStudents} arday</span>
                <span>{stats.pendingStudents > 0 ? `${stats.pendingStudents} aan la diiwaangelin` : "100% Dhammaystiran"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-5 mt-4 border-t border-[#ffffff08] flex-wrap">
            <button
              onClick={() => onTakeAttendance()}
              className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Qabo Xaadirinta Hadda (Take Attendance)</span>
            </button>
            <button
              onClick={() => onNavigateSubTab("history")}
              className="px-3.5 py-2 bg-[#1a1a1a] hover:bg-[#262626] border border-[#ffffff15] text-[#e5e5e5] text-xs font-semibold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-[#a3a3a3]" />
              <span>Taariikhda Xaadiriska</span>
            </button>
            <button
              onClick={() => onNavigateSubTab("late_absence")}
              className="px-3.5 py-2 bg-[#1a1a1a] hover:bg-[#262626] border border-[#ffffff15] text-[#e5e5e5] text-xs font-semibold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Xarunta Maqnaanshaha ({stats.absent})</span>
            </button>
          </div>
        </div>

        {/* Supporting Operations Cards (5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          {/* Class Completion Tile */}
          <div
            onClick={() => onNavigateSubTab("class")}
            className="bg-[#0f0f0f] border border-[#ffffff10] hover:border-[#7c3aed]/40 rounded-sm p-4 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-[#737373] block">
                Fasallada Dhameystiray
              </span>
              <div className="text-2xl font-mono font-bold text-white mt-1">
                {completedClassesCount} / {accessibleClasses.length}
              </div>
              <span className="text-[11px] text-[#888888] mt-1 block">
                {pendingClassesCount > 0 ? `${pendingClassesCount} fasal ayaa dhiman` : "Dhammaan fasallada waa diyaar"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#7c3aed] font-semibold pt-2 border-t border-[#ffffff08]">
              <span>Faahfaahinta Fasallada</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Maqnaanshaha Maanta Tile */}
          <div
            onClick={() => onNavigateSubTab("late_absence")}
            className="bg-[#0f0f0f] border border-[#ffffff10] hover:border-rose-500/40 rounded-sm p-4 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-rose-400/80 block">
                Maqnaanshaha Maanta
              </span>
              <div className="text-2xl font-mono font-bold text-rose-400 mt-1">
                {stats.absent}
              </div>
              <span className="text-[11px] text-[#888888] mt-1 block">
                Arday aan maanta xaadirin
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-rose-400 font-semibold pt-2 border-t border-[#ffffff08]">
              <span>U dir Waalidka WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Daahitaanka Tile */}
          <div
            onClick={() => onNavigateSubTab("late_absence")}
            className="bg-[#0f0f0f] border border-[#ffffff10] hover:border-amber-500/40 rounded-sm p-4 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-amber-400/80 block">
                Ardayda Daahday
              </span>
              <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
                {stats.late}
              </div>
              <span className="text-[11px] text-[#888888] mt-1 block">
                Yimid waqtiga ka dib
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-amber-400 font-semibold pt-2 border-t border-[#ffffff08]">
              <span>Arag liiska</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Fasax/Leave Tile */}
          <div
            onClick={() => onNavigateSubTab("history")}
            className="bg-[#0f0f0f] border border-[#ffffff10] hover:border-blue-500/40 rounded-sm p-4 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono text-blue-400/80 block">
                Idan / Fasax Qaba
              </span>
              <div className="text-2xl font-mono font-bold text-blue-400 mt-1">
                {stats.leave}
              </div>
              <span className="text-[11px] text-[#888888] mt-1 block">
                Waalidku soo fasaxay
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-blue-400 font-semibold pt-2 border-t border-[#ffffff08]">
              <span>Diiwaanka Fasaxa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. ATTENTION REQUIRED SECTION: Unsubmitted Classes & Chronic Absentees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Unsubmitted Classes Alert */}
        <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#f5f5f5]">
                  Fasallada Sugaya Xaadiriska (Pending Submissions)
                </h3>
                <p className="text-[11px] text-[#737373]">
                  Fasallada aan weli loo gudbin xaadirinta maanta ee {formatSessionName(currentSession, sessions)}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded-xs bg-amber-500/10 border border-amber-500/20">
              {pendingClassesCount} Haray
            </span>
          </div>

          <div className="space-y-2">
            {classStatusList.filter(c => !c.isCompleted).length === 0 ? (
              <div className="p-4 rounded-sm bg-emerald-500/5 border border-emerald-500/20 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Hambalyo! Dhammaan fasallada xaadirintooda maanta si buuxda ayaa loo gudbiyey.</span>
              </div>
            ) : (
              classStatusList.filter(c => !c.isCompleted).slice(0, 5).map(cls => (
                <div
                  key={cls.className}
                  className="flex items-center justify-between p-3 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] hover:border-[#7c3aed]/30 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-[#f5f5f5]">{cls.className}</span>
                    <div className="text-[10px] text-[#737373] font-mono flex items-center gap-2">
                      <span>Wadarta: {cls.total} arday</span>
                      <span>•</span>
                      <span className={cls.markedCount > 0 ? "text-amber-400" : "text-[#737373]"}>
                        {cls.markedCount > 0 ? `${cls.markedCount} ayaa la qabtay` : "Lama bilaabin"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onTakeAttendance(cls.className)}
                    className="px-3 py-1.5 rounded-xs bg-[#7c3aed]/15 hover:bg-[#7c3aed]/30 border border-[#7c3aed]/30 text-[#c4b5fd] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3 h-3 text-[#c4b5fd]" />
                    <span>Qabo Xaadiriska</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Absentees Action Log */}
        <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-sm bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <UserX className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#f5f5f5]">
                  Ardayda Maqan Maanta (Absent Today)
                </h3>
                <p className="text-[11px] text-[#737373]">
                  Wargeli waalidka ardayda aan maanta soo xaadirin dugsiga
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400 px-2 py-0.5 rounded-xs bg-rose-500/10 border border-rose-500/20">
              {todayAbsentees.length} Arday
            </span>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {todayAbsentees.length === 0 ? (
              <div className="p-4 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] text-center text-xs text-[#737373]">
                Ma jiraan arday maanta maqan oo diiwaangashan.
              </div>
            ) : (
              todayAbsentees.map(({ student, record }) => (
                <div
                  key={student?.id}
                  className="flex items-center justify-between p-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] hover:border-rose-500/30 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-xs text-[#f5f5f5] truncate">
                      {student?.fullName}
                    </div>
                    <div className="text-[10px] text-[#737373] font-mono flex items-center gap-1.5 mt-0.5">
                      <span>ID: {student?.id}</span>
                      <span>•</span>
                      <span>Fasalka: {student?.class}</span>
                      {student?.guardianPhone && (
                        <>
                          <span>•</span>
                          <span>Tel: {student.guardianPhone}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (student) {
                        openWhatsAppAttendanceAlert(
                          student,
                          todayDate,
                          "Absent",
                          user.schoolName || "Dugsiga Pro 2026"
                        );
                      }
                    }}
                    className="px-2.5 py-1 rounded-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                    title="U dir waalidka fariin WhatsApp ah"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. WEEKLY TREND MINI BAR */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#c4b5fd]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#f5f5f5]">
              Socodka Xaadiriska 7-dii Maalmood ee u Dambeeyay (7-Day Attendance Trend)
            </h3>
          </div>
          <button
            onClick={() => onNavigateSubTab("reports")}
            className="text-[11px] text-[#c4b5fd] hover:text-white font-semibold flex items-center gap-1"
          >
            <span>Arag Warbixinta Buuxda</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2">
          {weeklyTrend.map(day => (
            <div
              key={day.date}
              className={`p-3 rounded-sm border text-center transition-colors ${
                day.date === todayDate
                  ? "bg-[#7c3aed]/10 border-[#7c3aed]/40"
                  : "bg-[#0a0a0a] border-[#ffffff08] hover:border-[#ffffff15]"
              }`}
            >
              <span className="text-[10px] text-[#737373] uppercase font-mono block">
                {day.dayName}
              </span>
              <span className="text-base font-bold font-mono text-[#f5f5f5] block mt-0.5">
                {day.rate}%
              </span>
              <span className="text-[9px] text-[#888888] font-mono block mt-0.5">
                {day.total} qof
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
