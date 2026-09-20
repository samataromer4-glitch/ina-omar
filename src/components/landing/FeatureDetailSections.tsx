import React from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Award, 
  UserCheck, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  Upload, 
  Search, 
  ArrowRight,
  Clock
} from 'lucide-react';

interface FeatureDetailSectionsProps {
  onNavigate: (route: 'login' | 'signup' | 'dashboard') => void;
  isAuthenticated: boolean;
}

export default function FeatureDetailSections({ onNavigate, isAuthenticated }: FeatureDetailSectionsProps) {
  return (
    <div className="space-y-24 py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* 09. STUDENTS MANAGEMENT */}
      <section id="students-management" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6366f1]/10 text-[#a78bfa] text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>09 • Student Administration</span>
          </div>
          
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Centralized Student Records
          </h3>
          
          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
            Maintain complete student profiles in one secure directory. Track full legal names, assigned classroom, gender, guardian telephone numbers, and enrollment statuses.
          </p>

          <div className="space-y-2.5 pt-1 text-xs sm:text-sm text-[#cbd5e1]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant search across name, phone number, and classroom</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Bulk Excel spreadsheet import with downloadable template</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>One-click printable student directory PDF with class breakdown</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#0c0f17] border border-white/[0.08] shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Student Profile Card</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400">Status: Active</span>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#6366f1]/20 text-[#a78bfa] flex items-center justify-center font-bold text-base">
                MC
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-white truncate block">Maxamed Cali Jaamac</span>
                <span className="text-xs text-[#94a3b8]">Class: Fasalka 4A • Gender: Male</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-[#94a3b8]">Guardian Phone</span>
                <span className="text-xs font-bold text-white block">+252 61 5123456</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[#64748b] block text-[10px] uppercase">Tuition State</span>
                <span className="text-emerald-400 font-semibold">March 2026 Paid</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[#64748b] block text-[10px] uppercase">Attendance</span>
                <span className="text-blue-400 font-semibold">96% Present Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. ATTENDANCE */}
      <section id="attendance-management" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 lg:order-2 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>10 • Daily Operations</span>
          </div>
          
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Simple Attendance Management
          </h3>
          
          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
            Record classroom attendance twice daily with designated sessions for Subaxdii (Before Break) and Galabtii (After Break). Eliminate cumbersome paper sheets with one-click verification.
          </p>

          <div className="space-y-2.5 pt-1 text-xs sm:text-sm text-[#cbd5e1]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Multi-session roll call: Before Break and After Break</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>One-click "Mark All Present" button for rapid roll completion</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Official printable attendance statements formatted for inspection</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 lg:order-1 p-6 rounded-2xl bg-[#0c0f17] border border-white/[0.08] shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Session Roll Call Sheet</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400">Before Break</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs">
              <span className="font-semibold text-white">1. Maxamed Cali Jaamac</span>
              <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">PRESENT</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs">
              <span className="font-semibold text-white">2. Caasho Axmed Nuur</span>
              <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">PRESENT</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs">
              <span className="font-semibold text-white">3. Cabdiraxmaan Xasan Faarax</span>
              <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">ABSENT</span>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FEES & PAYMENTS */}
      <section id="fees-management" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>11 • Institutional Finance</span>
          </div>
          
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Keep School Finances Organized
          </h3>
          
          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
            Eliminate revenue leakage and billing confusion. Generate monthly student fee records, log payments with historical audit stamps, and track outstanding balances clearly.
          </p>

          <div className="space-y-2.5 pt-1 text-xs sm:text-sm text-[#cbd5e1]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Full audit history: tracks payment date, action, and amount collected</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Status flags for Paid, Partial payment, and Unpaid tuition</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Downloadable official PDF financial statements for auditors</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#0c0f17] border border-white/[0.08] shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Tuition Invoice & Audit Log</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400">USD ($)</span>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white font-semibold">Student: Maxamed Cali Jaamac</span>
              <span className="text-[#94a3b8]">Month: March 2026</span>
            </div>
            <div className="flex justify-between text-xs py-2 border-y border-white/[0.06]">
              <span className="text-[#94a3b8]">Tuition Fee: $50.00</span>
              <span className="text-emerald-400 font-bold">Collected: $50.00 (Balance: $0.00)</span>
            </div>
            <div className="text-[11px] text-[#64748b] space-y-1">
              <div className="flex justify-between">
                <span>[Payment Audit] $50.00 logged</span>
                <span className="font-mono">2026-03-02 09:14</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. EXAMS & RESULTS */}
      <section id="exams-management" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 lg:order-2 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>12 • Academic Evaluation</span>
          </div>
          
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Manage Exams & Results with Confidence
          </h3>
          
          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
            Record term examination scores per subject. The system automatically computes grade percentages and assigns letter grades (Grade A, B, C, D, or Fail) based on institutional pass thresholds.
          </p>

          <div className="space-y-2.5 pt-1 text-xs sm:text-sm text-[#cbd5e1]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Automated grade letters based on customizable threshold percentages</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Student report card generation with teacher remarks and letterhead</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Term rankings and pass rate summaries for academic staff</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 lg:order-1 p-6 rounded-2xl bg-[#0c0f17] border border-white/[0.08] shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Exam Grading Matrix</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400">Term 1 Final</span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Mathematics (Fasalka 4A)</span>
                <span className="text-[11px] text-[#64748b]">Max Marks: 100</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-emerald-400 font-bold">94 / 100</span>
                <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Grade A</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Science (Fasalka 4A)</span>
                <span className="text-[11px] text-[#64748b]">Max Marks: 100</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-emerald-400 font-bold">88 / 100</span>
                <span className="ml-2 px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 text-[10px] font-bold">Grade B</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 13 to 16: TEACHERS, CLASSES, REPORTS & PERMISSIONS GRID */}
      <div className="pt-10 border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest text-[#a78bfa] font-bold block mb-3">
            Institutional Administration
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Complete Operational Modules
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 13. Teachers & Staff */}
          <div className="p-6 rounded-2xl bg-[#0c0f17] border border-white/[0.08] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 text-[#a78bfa] flex items-center justify-center mb-4">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-mono text-[#64748b] block mb-1">Module 13</span>
              <h4 className="text-base font-bold text-white mb-2">Teachers & Staff</h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
                Manage your school team. Maintain teacher profiles, assign designated class teachers, and allocate subject instructors.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-[11px] text-[#cbd5e1] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Class master allocation</span>
            </div>
          </div>

          {/* 14. Classes & Subjects */}
          <div className="p-6 rounded-2xl bg-[#0c0f17] border border-white/[0.08] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-mono text-[#64748b] block mb-1">Module 14</span>
              <h4 className="text-base font-bold text-white mb-2">Classes & Subjects</h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
                Organize your academic structure. Manage classrooms, room numbers, class capacities, course codes, and curriculum levels.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-[11px] text-[#cbd5e1] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Unique course codes</span>
            </div>
          </div>

          {/* 15. Reports & Analytics */}
          <div className="p-6 rounded-2xl bg-[#0c0f17] border border-white/[0.08] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-mono text-[#64748b] block mb-1">Module 15</span>
              <h4 className="text-base font-bold text-white mb-2">Reports & Analytics</h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
                Turn school records into actionable clarity. Export PDF student directories, attendance rosters, and financial audit reports.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-[11px] text-[#cbd5e1] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Official PDF exports</span>
            </div>
          </div>

          {/* 16. Roles & Permissions */}
          <div className="p-6 rounded-2xl bg-[#0c0f17] border border-white/[0.08] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-mono text-[#64748b] block mb-1">Module 16</span>
              <h4 className="text-base font-bold text-white mb-2">Roles & Data Isolation</h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
                The right access for every user. Strict multi-tenant security ensures your school's database is completely isolated from other institutions.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-[11px] text-[#cbd5e1] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>School ID isolation</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
