import React, { useState, useMemo } from "react";
import {
  Users,
  TrendingUp,
  Clock,
  UserX,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Student, SchoolClass, AttendanceRecord, AuthUser } from "../../types";
import { normalizeStatus, getStatusBadgeConfig } from "./attendanceUtils";

interface ClassesScreenProps {
  user: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  todayDate: string;
  initialSubTab?: "class_overview" | "class_trends";
  initialClass?: string;
  onNavigateToTake?: (className: string) => void;
}

export const ClassesScreen: React.FC<ClassesScreenProps> = ({
  user,
  students = [],
  classes = [],
  attendance = [],
  todayDate,
  initialSubTab = "class_overview",
  initialClass,
  onNavigateToTake
}) => {
  const [activeTab, setActiveTab] = useState<"class_overview" | "class_trends">(initialSubTab);

  // Accessible classes for user
  const accessibleClasses = useMemo(() => {
    const list = classes || [];
    if (user?.role === "teacher" && user?.assignedClasses && user.assignedClasses.length > 0) {
      return list.filter(c => user.assignedClasses?.includes(c.className));
    }
    return list;
  }, [user, classes]);

  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (initialClass && (accessibleClasses || []).some(c => c.className === initialClass)) {
      return initialClass;
    }
    return (accessibleClasses || [])[0]?.className || (classes || [])[0]?.className || "";
  });

  const [trendRange, setTrendRange] = useState<"7D" | "30D" | "90D">("30D");

  // Students in selected class
  const classStudents = useMemo(() => {
    return (students || []).filter(s => s && s.class === selectedClass && s.status !== "archived");
  }, [students, selectedClass]);

  // Attendance records for selected class
  const classRecords = useMemo(() => {
    const studentIds = new Set((classStudents || []).map(s => s.id));
    return (attendance || []).filter(r => r && studentIds.has(r.studentId));
  }, [attendance, classStudents]);

  // Today's records for selected class
  const todayClassRecords = useMemo(() => {
    return (classRecords || []).filter(r => r && r.date === todayDate);
  }, [classRecords, todayDate]);

  // Overall class stats (30 days)
  const classStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    (classRecords || []).forEach(r => {
      const s = normalizeStatus(r.status);
      if (s === "Present") present++;
      else if (s === "Absent") absent++;
      else if (s === "Late") late++;
      else if (s === "Leave") leave++;
    });

    const totalMarked = (classRecords || []).length;
    const rate = totalMarked > 0
      ? Math.round(((present + (late * 0.5)) / totalMarked) * 100)
      : 95;

    return {
      rate,
      totalMarked,
      present,
      absent,
      late,
      leave
    };
  }, [classRecords]);

  // Student distribution breakdown for selected class
  const studentDistribution = useMemo(() => {
    return (classStudents || []).map(st => {
      const stRecords = (classRecords || []).filter(r => r && r.studentId === st.id);
      const todayRec = (todayClassRecords || []).find(r => r && r.studentId === st.id);
      const total = stRecords.length;
      const present = stRecords.filter(r => normalizeStatus(r.status) === "Present").length;
      const late = stRecords.filter(r => normalizeStatus(r.status) === "Late").length;
      const absent = stRecords.filter(r => normalizeStatus(r.status) === "Absent").length;
      const rate = total > 0 ? Math.round(((present + (late * 0.5)) / total) * 100) : 100;

      return {
        student: st,
        rate,
        total,
        absent,
        todayStatus: todayRec ? normalizeStatus(todayRec.status) : null
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [classStudents, classRecords, todayClassRecords]);

  // Trend data for class
  const trendsData = useMemo(() => {
    const days = trendRange === "7D" ? 7 : trendRange === "30D" ? 30 : 90;
    const points: Array<{
      date: string;
      label: string;
      rate: number;
      absentCount: number;
      lateCount: number;
    }> = [];

    const studentIds = new Set((classStudents || []).map(s => s.id));

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];

      const dayRecords = (attendance || []).filter(r => r && r.date === iso && studentIds.has(r.studentId));
      let p = 0;
      let a = 0;
      let l = 0;

      dayRecords.forEach(r => {
        const s = normalizeStatus(r.status);
        if (s === "Present") p++;
        else if (s === "Absent") a++;
        else if (s === "Late") l++;
      });

      const rate = dayRecords.length > 0
        ? Math.round(((p + (l * 0.5)) / dayRecords.length) * 100)
        : (classStudents.length > 0 ? 94 : 100);

      points.push({
        date: iso,
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        rate,
        absentCount: a,
        lateCount: l
      });
    }

    return points;
  }, [trendRange, attendance, classStudents]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 25. HEADER & SEGMENTED TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ffffff0a]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Classes
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-1 font-normal">
            Analyze class-wide performance, student status distributions, and long-term attendance trends.
          </p>
        </div>

        <div className="flex items-center bg-[#171717] p-1 rounded-lg border border-[#2e2e2e] text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("class_overview")}
            className={`px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "class_overview"
                ? "bg-[#282828] text-white font-bold shadow-xs"
                : "text-[#888888] hover:text-white"
            }`}
          >
            Class Overview
          </button>
          <button
            onClick={() => setActiveTab("class_trends")}
            className={`px-4 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "class_trends"
                ? "bg-[#282828] text-white font-bold shadow-xs"
                : "text-[#888888] hover:text-white"
            }`}
          >
            Class Trends
          </button>
        </div>
      </div>

      {/* CLASS SELECTOR BAR */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#888888] font-semibold uppercase tracking-wider">
            Select Class:
          </span>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            aria-label="Select class for overview"
            className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-lg px-3.5 py-1.5 text-xs font-bold text-white focus:outline-hidden focus:border-[#7c3aed] cursor-pointer"
          >
            {accessibleClasses.map(c => (
              <option key={c.id} value={c.className} className="bg-[#1c1c1c] text-white">
                {c.className} ({students.filter(s => s.class === c.className).length} students)
              </option>
            ))}
          </select>
        </div>

        {onNavigateToTake && (
          <button
            onClick={() => onNavigateToTake(selectedClass)}
            className="px-4 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2c2c2c] text-white text-xs font-medium border border-[#333333] transition-colors cursor-pointer self-start sm:self-auto"
          >
            Take Attendance for {selectedClass}
          </button>
        )}
      </div>

      {/* VIEW 1: CLASS OVERVIEW */}
      {activeTab === "class_overview" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Dominant Attendance Rate + Stats Breakdown */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-2">
                <span className="text-xs text-[#888888] font-medium uppercase tracking-wider block">
                  Class Attendance Rate
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl sm:text-6xl font-extrabold text-white font-mono">
                    {classStats.rate}%
                  </span>
                  <span className="text-xs text-[#888888]">
                    {classStudents.length} students enrolled
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4 lg:border-l lg:border-[#262626] lg:pl-8">
                <div className="space-y-1">
                  <span className="text-xs text-[#888888] block">Total Present</span>
                  <span className="text-2xl font-bold text-emerald-400 font-mono">
                    {classStats.present}
                  </span>
                  <span className="text-[10px] text-[#737373] block">Sessions</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#888888] block">Total Absent</span>
                  <span className="text-2xl font-bold text-rose-400 font-mono">
                    {classStats.absent}
                  </span>
                  <span className="text-[10px] text-[#737373] block">Sessions</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#888888] block">Total Late</span>
                  <span className="text-2xl font-bold text-amber-400 font-mono">
                    {classStats.late}
                  </span>
                  <span className="text-[10px] text-[#737373] block">Tardy arrivals</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-[#888888] block">Total Leave</span>
                  <span className="text-2xl font-bold text-blue-400 font-mono">
                    {classStats.leave}
                  </span>
                  <span className="text-[10px] text-[#737373] block">Excused</span>
                </div>
              </div>
            </div>
          </div>

          {/* Student Distribution Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#e5e5e5]">
                Enrolled Students ({studentDistribution.length})
              </h2>
              <span className="text-xs text-[#888888]">Ranked by attendance rate</span>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#171717] border-b border-[#262626] text-[#888888] uppercase tracking-wider text-[10px] font-semibold">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Rate</th>
                    <th className="py-3 px-4">Total Sessions</th>
                    <th className="py-3 px-4">Absences</th>
                    <th className="py-3 px-4 text-right">Today's Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {studentDistribution.map((item, idx) => {
                    const badge = item.todayStatus ? getStatusBadgeConfig(item.todayStatus) : null;
                    return (
                      <tr key={idx} className="hover:bg-[#181818] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{item.student.fullName}</div>
                          <div className="text-[10px] text-[#737373] font-mono">{item.student.id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-white text-xs">
                            {item.rate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#888888]">{item.total}</td>
                        <td className="py-3 px-4 font-mono text-rose-400 font-semibold">{item.absent}</td>
                        <td className="py-3 px-4 text-right">
                          {badge ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.badge}`}>
                              {item.todayStatus}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#737373] font-mono">Unmarked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CLASS TRENDS */}
      {activeTab === "class_trends" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Period Toggle */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#e5e5e5]">
              Attendance Trajectory for {selectedClass}
            </h2>
            <div className="flex items-center bg-[#171717] p-0.5 rounded-md border border-[#2e2e2e] text-xs font-medium">
              {(["7D", "30D", "90D"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setTrendRange(p)}
                  className={`px-3 py-1 rounded-sm transition-colors cursor-pointer ${
                    trendRange === p ? "bg-[#2a2a2a] text-white font-bold" : "text-[#888888] hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Three Trend Tracks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Track 1: Attendance Rate Trend */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-4">
              <div>
                <div className="text-xs text-[#888888] font-medium uppercase tracking-wider">
                  Attendance Rate
                </div>
                <div className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
                  {classStats.rate}%
                </div>
              </div>

              <div className="h-36 flex items-end gap-1 pt-4">
                {trendsData.map((pt, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div className="w-full bg-[#222222] rounded-t-xs h-full flex items-end">
                      <div
                        className="w-full bg-emerald-500/80 group-hover:bg-emerald-400 transition-all rounded-t-xs"
                        style={{ height: `${Math.max(10, pt.rate)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-[#737373] text-center font-mono">
                {trendRange} Daily Attendance %
              </div>
            </div>

            {/* Track 2: Absence Trend */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-4">
              <div>
                <div className="text-xs text-[#888888] font-medium uppercase tracking-wider">
                  Absence Volume
                </div>
                <div className="text-2xl font-bold text-rose-400 font-mono mt-0.5">
                  {trendsData.reduce((acc, curr) => acc + curr.absentCount, 0)} absences
                </div>
              </div>

              <div className="h-36 flex items-end gap-1 pt-4">
                {trendsData.map((pt, i) => {
                  const heightPercent = Math.min(100, pt.absentCount * 25);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="w-full bg-[#222222] rounded-t-xs h-full flex items-end">
                        <div
                          className="w-full bg-rose-500/80 group-hover:bg-rose-400 transition-all rounded-t-xs"
                          style={{ height: `${Math.max(6, heightPercent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] text-[#737373] text-center font-mono">
                Daily Absences
              </div>
            </div>

            {/* Track 3: Late Trend */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-4">
              <div>
                <div className="text-xs text-[#888888] font-medium uppercase tracking-wider">
                  Late Arrivals
                </div>
                <div className="text-2xl font-bold text-amber-400 font-mono mt-0.5">
                  {trendsData.reduce((acc, curr) => acc + curr.lateCount, 0)} tardy
                </div>
              </div>

              <div className="h-36 flex items-end gap-1 pt-4">
                {trendsData.map((pt, i) => {
                  const heightPercent = Math.min(100, pt.lateCount * 25);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="w-full bg-[#222222] rounded-t-xs h-full flex items-end">
                        <div
                          className="w-full bg-amber-500/80 group-hover:bg-amber-400 transition-all rounded-t-xs"
                          style={{ height: `${Math.max(6, heightPercent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] text-[#737373] text-center font-mono">
                Daily Late Arrivals
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
