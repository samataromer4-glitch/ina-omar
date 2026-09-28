import React from "react";
import {
  GraduationCap,
  Users,
  CheckCircle,
  Clock,
  BookOpen,
  Calendar,
  Award,
  ArrowRight,
  ClipboardList,
  Sparkles
} from "lucide-react";
import { AuthUser, Student, SchoolClass, SchoolSubject } from "../types";

interface TeacherDashboardViewProps {
  user: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  subjects: SchoolSubject[];
  onNavigate: (view: string) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  user,
  students = [],
  classes = [],
  subjects = [],
  onNavigate
}) => {
  const assignedClasses = user?.assignedClasses || [];
  const assignedSubjects = user?.assignedSubjects || [];

  // Filter students to teacher's classes
  const myStudents = assignedClasses.length > 0
    ? (students || []).filter(s => s && assignedClasses.includes(s.class))
    : (students || []);

  const myClassesDetails = (classes || []).filter(c => c && assignedClasses.includes(c.className));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-800/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Xafiiska Dijitaalka ah ee Macallinka</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Ku soo dhowow, Macallin {user.name || user.email.split("@")[0]}!
          </h1>

          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Halkan waxaad si toos ah uga maarayn kartaa xaadirinta fasalladaada, gelinta dhibcaha imtixaannada, iyo xogta ardayda laguu xilsaaray.
          </p>

          {/* Assigned Badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {(assignedClasses || []).length > 0 ? (
              (assignedClasses || []).map(cls => (
                <span
                  key={cls}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-purple-500/40 text-xs font-medium text-purple-200 flex items-center gap-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                  Fasalka: {cls}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Ma jiraan fasallo gaar ah oo laguu qoondeeyay</span>
            )}

            {(assignedSubjects || []).map(sub => (
              <span
                key={sub}
                className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-indigo-500/40 text-xs font-medium text-indigo-200 flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Maadada: {sub}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Ardayda Fasalladayda</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{myStudents.length}</div>
          <div className="text-[11px] text-slate-400">Dhammaan ardayda fasallada laguu xilsaaray</div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Fasallada La Igu Aaminay</span>
            <GraduationCap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{assignedClasses.length}</div>
          <div className="text-[11px] text-slate-400">Fasallada firfircoon</div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Maadooyinka Aan Dhigo</span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{assignedSubjects.length}</div>
          <div className="text-[11px] text-slate-400">Koorsooyinka laguu qoondeeyay</div>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Shaqada Maanta</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base sm:text-lg font-bold text-amber-300">
            {new Date().toLocaleDateString("so-SO", { weekday: "long", month: "short", day: "numeric" })}
          </div>
          <div className="text-[11px] text-slate-400">Xaadirinta maanta waa furan tahay</div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Hawlaha Degdegga ah ee Macallinka
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => onNavigate("attendance")}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 hover:bg-slate-850 text-left transition group shadow-md"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="font-semibold text-white text-base flex items-center justify-between">
              <span>Qaad Xaadirinta</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition" />
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Calaamadee imaanshaha, maqnaanshaha ama soo daahidda ardayda fasalladaada.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("exams")}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:bg-slate-850 text-left transition group shadow-md"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <div className="font-semibold text-white text-base flex items-center justify-between">
              <span>Geli Dhibcaha</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Diiwaangeli natiijooyinka imtixaannada maadooyinka aad dhigto.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("students")}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-slate-850 text-left transition group shadow-md"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="font-semibold text-white text-base flex items-center justify-between">
              <span>Ardayda Fasalladayda</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Fiiri profile-yada, xiriirka waalidka iyo xogta ardaydaada.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("timetable")}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500 hover:bg-slate-850 text-left transition group shadow-md"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div className="font-semibold text-white text-base flex items-center justify-between">
              <span>Jadwalka Toddobaadka</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Eeg saacadaha casharradaada iyo xilliyada nasashada ee maalin kasta.
            </p>
          </button>
        </div>
      </div>

      {/* Assigned Classes List */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Fasallada Laguu Xilsaaray</h3>
          </div>
          <span className="text-xs text-slate-400">Isku darka: {assignedClasses.length} fasal</span>
        </div>

        {assignedClasses.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Weli maamulku kuuma xilsaarin fasallo gaar ah. Fadlan la xiriir maamulka dugsiga.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(assignedClasses || []).map(clsName => {
              const clsStudents = (students || []).filter(s => s && s.class === clsName);
              return (
                <div
                  key={clsName}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white text-sm">Fasalka {clsName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{clsStudents.length} Arday</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate("attendance")}
                    className="px-2.5 py-1 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 text-purple-300 rounded-lg text-xs font-medium transition"
                  >
                    Xaadirin
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
