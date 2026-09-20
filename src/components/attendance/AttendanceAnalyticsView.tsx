import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  PieChart,
  Filter,
  Layers,
  FileText
} from "lucide-react";
import { Student, SchoolClass, AttendanceRecord, AuthUser } from "../../types";
import {
  normalizeStatus,
  getStoredSessions,
  formatSessionName,
  exportAttendancePDF,
  exportAttendanceExcel
} from "./attendanceUtils";

interface AttendanceAnalyticsViewProps {
  user: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
}

export const AttendanceAnalyticsView: React.FC<AttendanceAnalyticsViewProps> = ({
  user,
  students,
  classes,
  attendance
}) => {
  const sessions = useMemo(() => getStoredSessions(), []);

  const [dateRange, setDateRange] = useState<"30days" | "90days" | "year">("30days");
  const [reportClass, setReportClass] = useState<string>("All");

  // Filtered date range
  const filteredRecords = useMemo(() => {
    const now = new Date();
    let daysToSubtract = 30;
    if (dateRange === "90days") daysToSubtract = 90;
    if (dateRange === "year") daysToSubtract = 365;

    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - daysToSubtract);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    let list = attendance.filter(r => r.date >= cutoffStr);

    if (reportClass !== "All") {
      const classStudentIds = new Set(
        students.filter(s => s.class === reportClass).map(s => s.id)
      );
      list = list.filter(r => classStudentIds.has(r.studentId));
    }

    return list;
  }, [attendance, dateRange, reportClass, students]);

  // Overall totals
  const totals = useMemo(() => {
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

  // Day-of-week breakdown (Sunday = 0 to Saturday = 6)
  const dayOfWeekStats = useMemo(() => {
    const days = [
      { name: "Axad (Sun)", present: 0, absent: 0, total: 0 },
      { name: "Isnin (Mon)", present: 0, absent: 0, total: 0 },
      { name: "Tala (Tue)", present: 0, absent: 0, total: 0 },
      { name: "Arba (Wed)", present: 0, absent: 0, total: 0 },
      { name: "Kham (Thu)", present: 0, absent: 0, total: 0 },
      { name: "Jimce (Fri)", present: 0, absent: 0, total: 0 },
      { name: "Sabti (Sat)", present: 0, absent: 0, total: 0 }
    ];

    filteredRecords.forEach(r => {
      const d = new Date(r.date);
      const dayIdx = d.getDay();
      if (days[dayIdx]) {
        days[dayIdx].total++;
        const st = normalizeStatus(r.status);
        if (st === "Present") days[dayIdx].present++;
        else if (st === "Absent") days[dayIdx].absent++;
      }
    });

    return days.map(d => ({
      ...d,
      rate: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0
    }));
  }, [filteredRecords]);

  // Class comparison stats
  const classComparison = useMemo(() => {
    const studentClassMap = new Map<string, string>();
    students.forEach(s => studentClassMap.set(s.id, s.class));

    const map = new Map<string, { present: number; absent: number; late: number; total: number }>();
    classes.forEach(c => {
      map.set(c.className, { present: 0, absent: 0, late: 0, total: 0 });
    });

    filteredRecords.forEach(r => {
      const cName = studentClassMap.get(r.studentId);
      if (cName && map.has(cName)) {
        const item = map.get(cName)!;
        item.total++;
        const st = normalizeStatus(r.status);
        if (st === "Present") item.present++;
        else if (st === "Absent") item.absent++;
        else if (st === "Late") item.late++;
      }
    });

    return Array.from(map.entries()).map(([cName, data]) => {
      const rate = data.total > 0 ? Math.round(((data.present + (data.late * 0.5)) / data.total) * 100) : 0;
      return {
        className: cName,
        ...data,
        rate
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [filteredRecords, students, classes]);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & EXPORT ACTIONS */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#c4b5fd]" />
            <span>Xog-ururinta & Warbixinnada Xaadiriska (Analytics & Reports)</span>
          </h2>
          <p className="text-xs text-[#737373] mt-0.5">
            Dabagalka kobaca, heerarka xaadiriska maalmaha toddobaadka, iyo dhoofinta warbixinnada rasmiga ah.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as any)}
            className="px-3 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs font-semibold text-white focus:outline-none focus:border-[#7c3aed]"
          >
            <option value="30days">30-kii Maalmood ee u Dambeeyay</option>
            <option value="90days">90-kii Maalmood (Xilli/Term)</option>
            <option value="year">Sannadka oo Dhan (Full Year)</option>
          </select>

          <select
            value={reportClass}
            onChange={e => setReportClass(e.target.value)}
            className="px-3 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs font-semibold text-white focus:outline-none focus:border-[#7c3aed]"
          >
            <option value="All">Dhammaan Fasallada</option>
            {classes.map(c => (
              <option key={c.id} value={c.className}>{c.className}</option>
            ))}
          </select>

          <button
            onClick={() => {
              const matchedStudents = students.filter(
                s => reportClass === "All" || s.class === reportClass
              );
              exportAttendanceExcel({
                date: new Date().toISOString().split("T")[0],
                className: reportClass,
                sessionName: "Warbixin Guud",
                students: matchedStudents,
                records: filteredRecords
              });
            }}
            className="px-3 py-1.5 rounded-xs bg-[#1a1a1a] hover:bg-[#252525] border border-[#ffffff15] text-[#e5e5e5] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 2. AGGREGATE SUMMARY TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#737373] block">Wadarta Xaadirinta La Sameeyay</span>
          <span className="text-2xl font-mono font-bold text-white">{totals.total}</span>
          <span className="text-[10px] text-[#888888] block">Diiwaanno la qabtay muddadan</span>
        </div>

        <div className="bg-[#7c3aed]/10 border border-[#7c3aed]/30 p-4 rounded-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#c4b5fd] block">Celceliska Joogitaanka</span>
          <span className="text-2xl font-mono font-bold text-[#c4b5fd]">{totals.rate}%</span>
          <span className="text-[10px] text-[#c4b5fd]/70 block">Overall Attendance Rate</span>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-emerald-400 block">Wadar Jooga (Present)</span>
          <span className="text-2xl font-mono font-bold text-emerald-400">{totals.p}</span>
          <span className="text-[10px] text-emerald-400/60 block">Xilliyo ardaydu yimaadeen</span>
        </div>

        <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-rose-400 block">Wadar Maqan (Absent)</span>
          <span className="text-2xl font-mono font-bold text-rose-400">{totals.a}</span>
          <span className="text-[10px] text-rose-400/60 block">Maqnaansho la qabtay</span>
        </div>
      </div>

      {/* 3. DAY OF WEEK COMPARISON */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 space-y-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Heerka Xaadiriska Maalmaha Toddobaadka (Day of Week Attendance Pattern)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
          {dayOfWeekStats.map(day => (
            <div
              key={day.name}
              className="p-3 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] space-y-2 text-center"
            >
              <span className="text-[10px] font-mono text-[#737373] uppercase block">
                {day.name}
              </span>
              <div className="text-lg font-mono font-bold text-white">
                {day.rate}%
              </div>
              <div className="h-1.5 w-full bg-[#1c1c1c] rounded-full overflow-hidden">
                <div
                  style={{ width: `${day.rate}%` }}
                  className={`h-full ${
                    day.rate < 75 ? "bg-rose-500" : day.rate < 88 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />
              </div>
              <span className="text-[9px] text-[#737373] font-mono block">
                {day.total} records
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. CLASS COMPARISON LEADERBOARD */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden shadow-xl">
        <div className="p-4 bg-[#0a0a0a] border-b border-[#ffffff10]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Kala Horreynta Fasallada ee Joogitaanka (Class Comparison)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0c0c0c] text-[10px] uppercase font-bold tracking-wider text-[#737373] border-b border-[#ffffff08]">
                <th className="px-4 py-3">Fasalka (Class)</th>
                <th className="px-4 py-3">Heerka Joogitaanka</th>
                <th className="px-4 py-3 text-center">Wadar Jooga</th>
                <th className="px-4 py-3 text-center">Wadar Maqan</th>
                <th className="px-4 py-3 text-center">Wadar Daahay</th>
                <th className="px-4 py-3 text-right">Wadarta Diiwaanka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff05]">
              {classComparison.map(cls => (
                <tr key={cls.className} className="hover:bg-[#ffffff02] transition-colors">
                  <td className="px-4 py-3 font-bold text-white">{cls.className}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold text-sm ${
                        cls.rate < 75 ? "text-rose-400" : cls.rate < 90 ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        {cls.rate}%
                      </span>
                      <div className="w-28 h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden hidden sm:block">
                        <div
                          style={{ width: `${cls.rate}%` }}
                          className={`h-full ${
                            cls.rate < 75 ? "bg-rose-500" : cls.rate < 90 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-emerald-400 font-bold">{cls.present}</td>
                  <td className="px-4 py-3 text-center font-mono text-rose-400 font-bold">{cls.absent}</td>
                  <td className="px-4 py-3 text-center font-mono text-amber-400 font-bold">{cls.late}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#737373]">{cls.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
