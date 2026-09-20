import React from 'react';
import { 
  Building2, 
  GraduationCap, 
  BookOpen, 
  DollarSign, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface ProductOverviewProps {
  onNavigate: (route: 'login' | 'signup' | 'dashboard') => void;
  isAuthenticated: boolean;
}

export default function ProductOverview({ onNavigate, isAuthenticated }: ProductOverviewProps) {
  return (
    <section id="solutions" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Architectural Explanation */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#a78bfa] text-xs font-semibold tracking-wide">
            <Building2 className="w-3.5 h-3.5" />
            <span>Integrated School Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Designed for the Entire School Ecosystem
          </h2>

          <p className="text-base text-[#94a3b8] leading-relaxed">
            School administration involves multiple teams working simultaneously. DUGSI PRO 2026 coordinates registrars, academic heads, class teachers, and bursars in a synchronized environment with multi-tenant data separation.
          </p>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Administration & Governance</h4>
                <p className="text-xs text-[#94a3b8] leading-relaxed">Oversee overall enrollment numbers, class capacities, system configurations, and grading boundaries.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-[#a78bfa] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Academic Faculty & Teaching Staff</h4>
                <p className="text-xs text-[#94a3b8] leading-relaxed">Execute twice-daily student attendance sessions, manage subject curriculum, and log exam scores per term.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Finance & Billing Operations</h4>
                <p className="text-xs text-[#94a3b8] leading-relaxed">Issue monthly invoices, collect payments, maintain audit receipts, and export verified financial statements.</p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'signup')}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a78bfa] hover:text-white transition-colors cursor-pointer group"
            >
              <span>{isAuthenticated ? 'Open School Portal' : 'Start with DUGSI PRO 2026'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Column: Visual Diagram */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-[#0c0f17] border border-white/[0.08] relative">
          
          <div className="text-xs font-mono uppercase tracking-wider text-[#64748b] mb-6 flex items-center justify-between">
            <span>Synchronized Data Hub</span>
            <span className="text-emerald-400">Zero Duplication</span>
          </div>

          <div className="space-y-4">
            {/* Center School Identity */}
            <div className="p-4 rounded-xl bg-[#161a26] border border-[#6366f1]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#6366f1] flex items-center justify-center text-white font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">School Master Database</span>
                  <span className="text-xs text-[#94a3b8]">Verified School ID: isolated tenant storage</span>
                </div>
              </div>
              <span className="px-2 py-1 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Core Engine
              </span>
            </div>

            {/* Connecting Nodes */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                  <Users className="w-3.5 h-3.5 text-[#a78bfa]" />
                  <span>Student Directory</span>
                </div>
                <p className="text-[11px] text-[#94a3b8]">Single source of truth for student roster, status & photos</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>Curriculum & Exams</span>
                </div>
                <p className="text-[11px] text-[#94a3b8]">Classes, assigned teachers, exams & automatic grading</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tuition Ledger</span>
                </div>
                <p className="text-[11px] text-[#94a3b8]">Monthly invoice statuses, payment logs & receipts</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Official Reports</span>
                </div>
                <p className="text-[11px] text-[#94a3b8]">Report cards, attendance statements & PDF exports</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#64748b]">
            <span>Continuous synchronization</span>
            <span className="font-mono">Web-First Cloud & Local</span>
          </div>

        </div>

      </div>
    </section>
  );
}
