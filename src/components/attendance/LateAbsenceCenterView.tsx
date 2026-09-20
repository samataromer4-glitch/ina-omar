import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  UserX,
  Clock,
  ExternalLink,
  Search,
  Filter,
  ShieldAlert,
  Send,
  MessageCircle,
  CheckCircle2,
  Calendar,
  Sparkles
} from "lucide-react";
import { Student, SchoolClass, AttendanceRecord, AuthUser } from "../../types";
import {
  normalizeStatus,
  openWhatsAppAttendanceAlert,
  getStoredSessions,
  formatSessionName
} from "./attendanceUtils";

interface LateAbsenceCenterViewProps {
  user: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
}

export const LateAbsenceCenterView: React.FC<LateAbsenceCenterViewProps> = ({
  user,
  students,
  classes,
  attendance
}) => {
  const sessions = useMemo(() => getStoredSessions(), []);

  const [filterClass, setFilterClass] = useState<string>("All");
  const [minAbsences, setMinAbsences] = useState<number>(2);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"absentees" | "tardy" | "today">("absentees");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Compute student-level counts across attendance
  const studentMetrics = useMemo(() => {
    const studentRecords = new Map<string, AttendanceRecord[]>();
    attendance.forEach(r => {
      const existing = studentRecords.get(r.studentId) || [];
      existing.push(r);
      studentRecords.set(r.studentId, existing);
    });

    return students
      .filter(s => s.status !== "inactive")
      .map(student => {
        const recs = studentRecords.get(student.id) || [];
        const absentCount = recs.filter(r => normalizeStatus(r.status) === "Absent").length;
        const lateCount = recs.filter(r => normalizeStatus(r.status) === "Late").length;
        const total = recs.length;
        const rate = total > 0 ? Math.round(((total - absentCount) / total) * 100) : 100;

        // Check today's status
        const todayRec = recs.find(r => r.date === todayStr);
        const todayStatus = todayRec ? normalizeStatus(todayRec.status) : null;

        return {
          student,
          absentCount,
          lateCount,
          total,
          rate,
          todayStatus,
          records: recs
        };
      });
  }, [students, attendance, todayStr]);

  // Chronic absentees
  const chronicAbsentees = useMemo(() => {
    return studentMetrics
      .filter(m => m.absentCount >= minAbsences)
      .filter(m => filterClass === "All" || m.student.class === filterClass)
      .filter(m => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          m.student.fullName.toLowerCase().includes(q) ||
          m.student.id.toLowerCase().includes(q) ||
          m.student.class.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.absentCount - a.absentCount);
  }, [studentMetrics, minAbsences, filterClass, searchQuery]);

  // Frequent tardy arrivals
  const frequentTardy = useMemo(() => {
    return studentMetrics
      .filter(m => m.lateCount >= 2)
      .filter(m => filterClass === "All" || m.student.class === filterClass)
      .filter(m => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          m.student.fullName.toLowerCase().includes(q) ||
          m.student.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.lateCount - a.lateCount);
  }, [studentMetrics, filterClass, searchQuery]);

  // Today's unattended / absent students
  const todayAbsentList = useMemo(() => {
    return studentMetrics
      .filter(m => m.todayStatus === "Absent" || m.todayStatus === "Late")
      .filter(m => filterClass === "All" || m.student.class === filterClass)
      .filter(m => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          m.student.fullName.toLowerCase().includes(q) ||
          m.student.id.toLowerCase().includes(q)
        );
      });
  }, [studentMetrics, filterClass, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE BANNER */}
      <div className="bg-[#0f0f0f] border border-rose-500/20 rounded-sm p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono uppercase font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Xarunta Dabagalka Maqnaanshaha & Daahitaanka</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Late & Absence Intervention Center
            </h2>
            <p className="text-xs text-[#a3a3a3] max-w-xl">
              Halkan waxaad si gaar ah ugala socon kartaa ardayda khatarta ugu jirta maqnaanshaha joogtada ah, kuwa daaha, adigoo si toos ah fariin WhatsApp ugu diri kara waalidiintooda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0a0a0a] border border-[#ffffff10] px-4 py-2.5 rounded-sm text-center">
              <span className="text-[10px] uppercase font-mono text-rose-400 block">Khatarta Maqnaanshaha</span>
              <span className="text-2xl font-bold font-mono text-rose-400">{chronicAbsentees.length} arday</span>
            </div>
            <div className="bg-[#0a0a0a] border border-[#ffffff10] px-4 py-2.5 rounded-sm text-center">
              <span className="text-[10px] uppercase font-mono text-amber-400 block">Khatarta Daahitaanka</span>
              <span className="text-2xl font-bold font-mono text-amber-400">{frequentTardy.length} arday</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER CONTROLS */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("absentees")}
            className={`px-3 py-1.5 rounded-xs text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "absentees"
                ? "bg-rose-500 text-white"
                : "text-[#888888] hover:text-white bg-[#141414]"
            }`}
          >
            Maqnaanshaha Joogtada ah ({chronicAbsentees.length})
          </button>
          <button
            onClick={() => setActiveTab("tardy")}
            className={`px-3 py-1.5 rounded-xs text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "tardy"
                ? "bg-amber-500 text-black font-bold"
                : "text-[#888888] hover:text-white bg-[#141414]"
            }`}
          >
            Daahitaanka Joogtada ah ({frequentTardy.length})
          </button>
          <button
            onClick={() => setActiveTab("today")}
            className={`px-3 py-1.5 rounded-xs text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "today"
                ? "bg-[#7c3aed] text-white"
                : "text-[#888888] hover:text-white bg-[#141414]"
            }`}
          >
            Maqan/Daahay Maanta ({todayAbsentList.length})
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Raadi arday..."
              className="pl-8 pr-3 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#7c3aed] w-40 sm:w-48"
            />
          </div>

          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="px-2.5 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-white focus:outline-none focus:border-[#7c3aed]"
          >
            <option value="All">Dhammaan Fasallada</option>
            {classes.map(c => (
              <option key={c.id} value={c.className}>{c.className}</option>
            ))}
          </select>

          {activeTab === "absentees" && (
            <select
              value={minAbsences}
              onChange={e => setMinAbsences(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-white focus:outline-none focus:border-[#7c3aed]"
            >
              <option value={1}>1+ Maqnaansho</option>
              <option value={2}>2+ Maqnaansho</option>
              <option value={3}>3+ Maqnaansho (Khatar)</option>
              <option value={5}>5+ Maqnaansho (Aad u daran)</option>
            </select>
          )}
        </div>
      </div>

      {/* 3. INTERVENTION LIST TABLE */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden shadow-xl">
        <div className="p-4 bg-[#0a0a0a] border-b border-[#ffffff10] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            {activeTab === "absentees" && <UserX className="w-4 h-4 text-rose-400" />}
            {activeTab === "tardy" && <Clock className="w-4 h-4 text-amber-400" />}
            {activeTab === "today" && <Calendar className="w-4 h-4 text-[#c4b5fd]" />}
            <span>
              {activeTab === "absentees" ? "Ardayda Maqnaanshaha Badan" : activeTab === "tardy" ? "Ardayda Daaha" : "Ardayda Maanta Maqan ama Daahday"}
            </span>
          </h3>
          <span className="text-xs font-mono text-[#737373]">
            {activeTab === "absentees" ? chronicAbsentees.length : activeTab === "tardy" ? frequentTardy.length : todayAbsentList.length} arday la helay
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0c0c0c] text-[10px] uppercase font-bold tracking-wider text-[#737373] border-b border-[#ffffff08]">
                <th className="px-4 py-3">Ardayga / Student</th>
                <th className="px-4 py-3">Fasalka</th>
                <th className="px-4 py-3 text-center">Maalmaha Maqan</th>
                <th className="px-4 py-3 text-center">Maalmaha Daahay</th>
                <th className="px-4 py-3 text-center">Heerka Joogitaanka</th>
                <th className="px-4 py-3">Taleefanka Waalidka</th>
                <th className="px-4 py-3 text-right">Wargelin Toos ah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff05]">
              {(activeTab === "absentees" ? chronicAbsentees : activeTab === "tardy" ? frequentTardy : todayAbsentList).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#737373]">
                    Ma jiraan arday buuxisa shuruudahan waqtigan.
                  </td>
                </tr>
              ) : (
                (activeTab === "absentees" ? chronicAbsentees : activeTab === "tardy" ? frequentTardy : todayAbsentList).map(m => (
                  <tr key={m.student.id} className="hover:bg-[#ffffff02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{m.student.fullName}</div>
                      <div className="text-[10px] text-[#737373] font-mono">
                        ID: {m.student.id} {m.student.guardianName ? `• Waalid: ${m.student.guardianName}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#a3a3a3] font-medium">
                      {m.student.class}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded-xs ${
                        m.absentCount >= 3 ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" : "text-rose-400"
                      }`}>
                        {m.absentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-amber-400">
                      {m.lateCount}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      <span className={m.rate < 75 ? "text-rose-400" : m.rate < 90 ? "text-amber-400" : "text-emerald-400"}>
                        {m.rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#c4b5fd]">
                      {m.student.guardianPhone || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.student.guardianPhone ? (
                        <button
                          onClick={() => {
                            const statusToAlert = m.todayStatus || (activeTab === "tardy" ? "Late" : "Absent");
                            openWhatsAppAttendanceAlert(
                              m.student,
                              todayStr,
                              statusToAlert,
                              user.schoolName || "Dugsiga Pro 2026",
                              `Fadlan la soo xiriir dugsiga: Ardaygu waxa uu leeyahay ${m.absentCount} maqnaansho.`
                            );
                          }}
                          className="px-3 py-1.5 rounded-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Fariin degdeg ah ugu dir waalidka WhatsApp"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>WhatsApp Xusuusin</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#737373] italic">Taleefan ma jiro</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
