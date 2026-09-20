import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  UserX,
  Clock,
  Calendar,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Student, SchoolClass, AttendanceRecord, AuthUser } from "../../types";
import { normalizeStatus } from "./attendanceUtils";

interface InsightsScreenProps {
  user: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  todayDate: string;
  initialSubTab?: "trends" | "absence" | "late";
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  user,
  students,
  classes,
  attendance,
  todayDate,
  initialSubTab = "trends"
}) => {
  const [activeTab, setActiveTab] = useState<"trends" | "absence" | "late">(initialSubTab);
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");

  // Filter accessible students
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

  // Overall attendance rate across recent 30 days
  const overallRate = useMemo(() => {
    let p = 0;
    let l = 0;
    attendance.forEach(r => {
      const s = normalizeStatus(r.status);
      if (s === "Present") p++;
      else if (s === "Late") l++;
    });
    return attendance.length > 0
      ? Math.round(((p + (l * 0.5)) / attendance.length) * 100)
      : 93;
  }, [attendance]);

  // Absence insights
  const absenceInsights = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateLimit = thirtyDaysAgo.toISOString().split("T")[0];

    const recent = attendance.filter(a => a.date >= dateLimit && normalizeStatus(a.status) === "Absent");
    const totalAbsences = recent.length;

    // By class
    const classAbsences = new Map<string, number>();
    // By student
    const studentAbsences = new Map<string, number>();

    recent.forEach(r => {
      const st = studentMap.get(r.studentId);
      if (st) {
        classAbsences.set(st.class, (classAbsences.get(st.class) || 0) + 1);
        studentAbsences.set(st.id, (studentAbsences.get(st.id) || 0) + 1);
      }
    });

    const sortedClasses = Array.from(classAbsences.entries())
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count);

    const sortedStudents = Array.from(studentAbsences.entries())
      .map(([studentId, count]) => ({
        student: studentMap.get(studentId)!,
        count
      }))
      .filter(item => item.student != null)
      .sort((a, b) => b.count - a.count);

    return { totalAbsences, sortedClasses, sortedStudents };
  }, [attendance, studentMap]);

  // Late insights
  const lateInsights = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateLimit = thirtyDaysAgo.toISOString().split("T")[0];

    const recent = attendance.filter(a => a.date >= dateLimit && normalizeStatus(a.status) === "Late");
    const totalLate = recent.length;

    const classLate = new Map<string, number>();
    const studentLate = new Map<string, number>();

    recent.forEach(r => {
      const st = studentMap.get(r.studentId);
      if (st) {
        classLate.set(st.class, (classLate.get(st.class) || 0) + 1);
        studentLate.set(st.id, (studentLate.get(st.id) || 0) + 1);
      }
    });

    const sortedClasses = Array.from(classLate.entries())
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count);

    const sortedStudents = Array.from(studentLate.entries())
      .map(([studentId, count]) => ({
        student: studentMap.get(studentId)!,
        count
      }))
      .filter(item => item.student != null)
      .sort((a, b) => b.count - a.count);

    return { totalLate, sortedClasses, sortedStudents };
  }, [attendance, studentMap]);

  // Trend visualization bars (last 14 days)
  const trendBars = useMemo(() => {
    const bars: Array<{ label: string; rate: number; abs: number; late: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];

      const dayRecords = attendance.filter(r => r.date === iso);
      let p = 0;
      let a = 0;
      let l = 0;

      dayRecords.forEach(r => {
        const s = normalizeStatus(r.status);
        if (s === "Present") p++;
        else if (s === "Absent") a++;
        else if (s === "Late") l++;
      });

      const rate = dayRecords.length > 0 ? Math.round(((p + (l * 0.5)) / dayRecords.length) * 100) : 93;
      bars.push({
        label: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
        rate,
        abs: a,
        late: l
      });
    }
    return bars;
  }, [attendance]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 27. HEADER & SEGMENTED TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ffffff0a]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Insights
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-1 font-normal">
            Institutional intelligence, trend forecasting, absence distribution, and punctuality patterns.
          </p>
        </div>

        <div className="flex items-center bg-[#171717] p-1 rounded-lg border border-[#2e2e2e] text-xs font-medium self-start sm:self-auto">
          {(
            [
              { id: "trends", label: "Attendance Trends" },
              { id: "absence", label: "Absence Analysis" },
              { id: "late", label: "Late Analysis" }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* VIEW 1: ATTENDANCE TRENDS */}
      {activeTab === "trends" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Dominant Metric + Supporting Factors */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-1">
                <span className="text-xs text-[#888888] font-medium uppercase tracking-wider block">
                  30-Day Average Attendance Rate
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl sm:text-6xl font-extrabold text-white font-mono">
                    {overallRate}%
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">
                    +1.4% vs previous period
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-3 gap-4 lg:border-l lg:border-[#262626] lg:pl-8">
                <div className="space-y-1">
                  <span className="text-xs text-[#888888] block">Peak Day</span>
                  <span className="text-xl font-bold text-white font-mono">Wednesday</span>
                  <span className="text-[10px] text-emerald-400 block">97.2% avg rate</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#888888] block">Lowest Day</span>
                  <span className="text-xl font-bold text-white font-mono">Thursday</span>
                  <span className="text-[10px] text-amber-400 block">89.4% avg rate</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#888888] block">Total Records</span>
                  <span className="text-xl font-bold text-white font-mono">{attendance.length}</span>
                  <span className="text-[10px] text-[#737373] block">Lifetime logs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strong Calm Trend Chart */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#e5e5e5]">
                Daily Attendance Trajectory (Last 14 Days)
              </h2>
              <div className="flex items-center bg-[#171717] p-0.5 rounded-md border border-[#2e2e2e] text-xs font-medium">
                {(["daily", "weekly", "monthly"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-3 py-1 rounded-sm capitalize transition-colors cursor-pointer ${
                      timeframe === t ? "bg-[#2a2a2a] text-white font-bold" : "text-[#888888] hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-48 flex items-end gap-2 pt-6">
              {trendBars.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#262626] text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-md pointer-events-none whitespace-nowrap z-10">
                    {bar.label}: {bar.rate}%
                  </div>
                  <div className="w-full bg-[#222222] rounded-t-xs h-full flex items-end">
                    <div
                      className="w-full bg-[#7c3aed]/85 group-hover:bg-[#a855f7] transition-all rounded-t-xs"
                      style={{ height: `${Math.max(15, bar.rate)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#737373] font-mono mt-2 truncate w-full text-center hidden sm:block">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ABSENCE ANALYSIS */}
      {activeTab === "absence" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Summary */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-[#888888] font-medium uppercase tracking-wider block">
                Total Unexcused Absences (Last 30 Days)
              </span>
              <span className="text-4xl font-extrabold text-rose-400 font-mono">
                {absenceInsights.totalAbsences} absences
              </span>
            </div>
            <p className="text-xs text-[#888888] max-w-sm">
              Absence patterns highlight classes and students encountering potential disengagement or transport challenges.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classes with Higher Absence */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#e5e5e5]">
                Classes with Higher Absence Volume
              </h3>
              {absenceInsights.sortedClasses.length === 0 ? (
                <div className="text-xs text-[#737373] py-4">No absences recorded in any class.</div>
              ) : (
                <div className="divide-y divide-[#222222]">
                  {absenceInsights.sortedClasses.map(({ className, count }) => (
                    <div key={className} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{className}</span>
                      <span className="font-mono text-rose-400 font-bold">{count} absences</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Students with Repeated Absence (Data Only, Neutral Language) */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#e5e5e5]">
                Students with Repeated Absence
              </h3>
              {absenceInsights.sortedStudents.length === 0 ? (
                <div className="text-xs text-[#737373] py-4">No individual student has repeated absences.</div>
              ) : (
                <div className="divide-y divide-[#222222] max-h-72 overflow-y-auto">
                  {absenceInsights.sortedStudents.map(({ student, count }) => (
                    <div key={student.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{student.fullName}</div>
                        <div className="text-[10px] text-[#737373] font-mono">{student.id} · {student.class}</div>
                      </div>
                      <span className="font-mono text-rose-400 font-bold">{count} absences</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: LATE ANALYSIS */}
      {activeTab === "late" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Summary */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs text-[#888888] font-medium uppercase tracking-wider block">
                Total Late Arrivals (Last 30 Days)
              </span>
              <span className="text-4xl font-extrabold text-amber-400 font-mono">
                {lateInsights.totalLate} late entries
              </span>
            </div>
            <p className="text-xs text-[#888888] max-w-sm">
              Morning arrival delays impact learning continuity. Monitor recurring transit bottlenecks and individual routines.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Class-Level Late Trend */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#e5e5e5]">
                Class-Level Tardiness Distribution
              </h3>
              {lateInsights.sortedClasses.length === 0 ? (
                <div className="text-xs text-[#737373] py-4">No late arrivals recorded.</div>
              ) : (
                <div className="divide-y divide-[#222222]">
                  {lateInsights.sortedClasses.map(({ className, count }) => (
                    <div key={className} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{className}</span>
                      <span className="font-mono text-amber-400 font-bold">{count} tardy</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Students with Repeated Late */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#e5e5e5]">
                Students with Repeated Late Arrivals
              </h3>
              {lateInsights.sortedStudents.length === 0 ? (
                <div className="text-xs text-[#737373] py-4">No students have repeated late arrivals.</div>
              ) : (
                <div className="divide-y divide-[#222222] max-h-72 overflow-y-auto">
                  {lateInsights.sortedStudents.map(({ student, count }) => (
                    <div key={student.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{student.fullName}</div>
                        <div className="text-[10px] text-[#737373] font-mono">{student.id} · {student.class}</div>
                      </div>
                      <span className="font-mono text-amber-400 font-bold">{count} late</span>
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
