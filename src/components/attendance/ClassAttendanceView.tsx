import React, { useState, useMemo } from "react";
import {
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Coffee,
  Download,
  FileSpreadsheet,
  Zap,
  ArrowRight,
  TrendingUp,
  Search,
  ChevronRight
} from "lucide-react";
import { Student, SchoolClass, AttendanceRecord, AuthUser } from "../../types";
import {
  normalizeStatus,
  getStatusBadgeConfig,
  getStoredSessions,
  formatSessionName,
  exportAttendancePDF,
  exportAttendanceExcel
} from "./attendanceUtils";

interface ClassAttendanceViewProps {
  user: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  onTakeAttendanceForClass: (className: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export const ClassAttendanceView: React.FC<ClassAttendanceViewProps> = ({
  user,
  students,
  classes,
  attendance,
  onTakeAttendanceForClass,
  onSelectStudent
}) => {
  const sessions = useMemo(() => getStoredSessions(), []);

  const accessibleClasses = useMemo(() => {
    if (user.role === "teacher" && user.assignedClasses && user.assignedClasses.length > 0) {
      return classes.filter(c => user.assignedClasses?.includes(c.className));
    }
    return classes;
  }, [user, classes]);

  const [selectedClass, setSelectedClass] = useState<string>(
    accessibleClasses[0]?.className || ""
  );
  const [studentSearch, setStudentSearch] = useState("");

  // Students belonging to selected class
  const classStudents = useMemo(() => {
    return students.filter(s => s.class === selectedClass && s.status !== "inactive");
  }, [students, selectedClass]);

  // Attendance metrics per student in this class
  const studentMetrics = useMemo(() => {
    const recordsByStudent = new Map<string, AttendanceRecord[]>();
    attendance.forEach(r => {
      const existing = recordsByStudent.get(r.studentId) || [];
      existing.push(r);
      recordsByStudent.set(r.studentId, existing);
    });

    return classStudents.map(student => {
      const recs = recordsByStudent.get(student.id) || [];
      const total = recs.length;
      const present = recs.filter(r => normalizeStatus(r.status) === "Present").length;
      const absent = recs.filter(r => normalizeStatus(r.status) === "Absent").length;
      const late = recs.filter(r => normalizeStatus(r.status) === "Late").length;
      const leave = recs.filter(r => normalizeStatus(r.status) === "Leave").length;
      const rate = total > 0 ? Math.round(((present + (late * 0.5)) / total) * 100) : 100;

      return {
        student,
        total,
        present,
        absent,
        late,
        leave,
        rate
      };
    }).sort((a, b) => b.rate - a.rate); // Ranked highest attendance to lowest
  }, [classStudents, attendance]);

  // Overall class summary
  const classSummary = useMemo(() => {
    let totalSessions = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalLeave = 0;

    studentMetrics.forEach(m => {
      totalSessions += m.total;
      totalPresent += m.present;
      totalAbsent += m.absent;
      totalLate += m.late;
      totalLeave += m.leave;
    });

    const overallRate = totalSessions > 0
      ? Math.round(((totalPresent + (totalLate * 0.5)) / totalSessions) * 100)
      : 100;

    return {
      totalStudents: classStudents.length,
      totalSessions,
      totalPresent,
      totalAbsent,
      totalLate,
      totalLeave,
      overallRate
    };
  }, [studentMetrics, classStudents]);

  const filteredStudentMetrics = useMemo(() => {
    if (!studentSearch.trim()) return studentMetrics;
    const q = studentSearch.toLowerCase();
    return studentMetrics.filter(
      m =>
        m.student.fullName.toLowerCase().includes(q) ||
        m.student.id.toLowerCase().includes(q)
    );
  }, [studentMetrics, studentSearch]);

  return (
    <div className="space-y-6">
      {/* 1. CLASS PICKER & ACTION BAR */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm bg-[#7c3aed]/15 text-[#c4b5fd] border border-[#7c3aed]/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#737373] block">
              Dooro Fasalka (Select Class Workspace)
            </label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-sm font-bold text-white focus:outline-none focus:border-[#7c3aed]"
            >
              {accessibleClasses.map(c => (
                <option key={c.id} value={c.className}>
                  {c.className} ({students.filter(s => s.class === c.className).length} arday)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => onTakeAttendanceForClass(selectedClass)}
            className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-sm shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Qabo Xaadirinta Fasalkan</span>
          </button>

          <button
            onClick={() => {
              const today = new Date().toISOString().split("T")[0];
              const relevantRecords = attendance.filter(a => {
                const s = students.find(st => st.id === a.studentId);
                return s && s.class === selectedClass && a.date === today;
              });

              exportAttendancePDF({
                schoolName: user.schoolName || "Dugsiga Pro 2026",
                date: today,
                className: selectedClass,
                sessionName: "Dhammaan Xilliyada",
                students: classStudents,
                records: relevantRecords
              });
            }}
            className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#ffffff15] text-[#e5e5e5] text-xs font-semibold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Dhoofi PDF</span>
          </button>
        </div>
      </div>

      {/* 2. CLASS OVERVIEW METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#737373] block">Wadarta Ardayda</span>
          <span className="text-2xl font-mono font-bold text-white">{classSummary.totalStudents}</span>
          <span className="text-[10px] text-[#888888] block">Arday firfircoon</span>
        </div>

        <div className="bg-[#7c3aed]/10 border border-[#7c3aed]/30 p-4 rounded-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#c4b5fd] block">Heerka Joogitaanka (Rate)</span>
          <span className="text-2xl font-mono font-bold text-[#c4b5fd]">{classSummary.overallRate}%</span>
          <span className="text-[10px] text-[#c4b5fd]/70 block">Celceliska fasalka</span>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-emerald-400 block">Wadar Jooga (Present)</span>
          <span className="text-2xl font-mono font-bold text-emerald-400">{classSummary.totalPresent}</span>
          <span className="text-[10px] text-emerald-400/60 block">Xilliyo la xaadiray</span>
        </div>

        <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-sm space-y-1">
          <span className="text-[10px] uppercase font-mono text-rose-400 block">Wadar Maqan (Absent)</span>
          <span className="text-2xl font-mono font-bold text-rose-400">{classSummary.totalAbsent}</span>
          <span className="text-[10px] text-rose-400/60 block">Maqnaansho la qabtay</span>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-sm space-y-1 col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-mono text-amber-400 block">Wadar Daahay (Late)</span>
          <span className="text-2xl font-mono font-bold text-amber-400">{classSummary.totalLate}</span>
          <span className="text-[10px] text-amber-400/60 block">Waqti dambe yimid</span>
        </div>
      </div>

      {/* 3. STUDENT ROSTER WITH ATTENDANCE RANKINGS */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden shadow-xl space-y-3">
        <div className="p-4 bg-[#0a0a0a] border-b border-[#ffffff10] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#f5f5f5]">
              Kala Horreynta Xaadiriska ee Ardayda Fasalka {selectedClass}
            </h3>
            <p className="text-[11px] text-[#737373]">
              Ku kala horreeya boqolleyda joogitaanka (Highest to lowest attendance rate)
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              placeholder="Ka raadi ardayda..."
              className="w-full pl-8 pr-3 py-1.5 rounded-sm bg-[#141414] border border-[#ffffff10] text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#7c3aed]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0c0c0c] border-b border-[#ffffff08] text-[10px] uppercase font-bold tracking-wider text-[#737373]">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Ardayga / Student</th>
                <th className="px-4 py-3">Heerka Joogitaanka</th>
                <th className="px-4 py-3 text-center">Jooga (Present)</th>
                <th className="px-4 py-3 text-center">Ma Joogo (Absent)</th>
                <th className="px-4 py-3 text-center">Daahay (Late)</th>
                <th className="px-4 py-3 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff05]">
              {filteredStudentMetrics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#737373]">
                    Fasalkan ma laha arday diiwaangashan ama raadintu ma helin wax arday ah.
                  </td>
                </tr>
              ) : (
                filteredStudentMetrics.map((m, idx) => {
                  let rateColor = "text-emerald-400";
                  if (m.rate < 75) rateColor = "text-rose-400";
                  else if (m.rate < 90) rateColor = "text-amber-400";

                  return (
                    <tr key={m.student.id} className="hover:bg-[#ffffff02] transition-colors">
                      <td className="px-4 py-3 text-[#737373] font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">
                          {m.student.fullName}
                        </div>
                        <div className="text-[10px] text-[#737373] font-mono">
                          ID: {m.student.id} {m.student.rollNumber ? `• Roll #${m.student.rollNumber}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`font-mono font-bold text-sm ${rateColor}`}>
                            {m.rate}%
                          </span>
                          <div className="w-24 h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden hidden sm:block">
                            <div
                              style={{ width: `${m.rate}%` }}
                              className={`h-full ${
                                m.rate < 75 ? "bg-rose-500" : m.rate < 90 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-emerald-400">
                        {m.present}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-rose-400">
                        {m.absent}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-amber-400">
                        {m.late}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onSelectStudent(m.student.id)}
                          className="px-2.5 py-1 rounded-xs bg-[#1a1a1a] hover:bg-[#252525] border border-[#ffffff15] text-[#c4b5fd] text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Arag Xaadiriska</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
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
