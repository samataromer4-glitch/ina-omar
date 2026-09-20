import React from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Users, 
  DollarSign, 
  Calendar, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp,
  Download
} from 'lucide-react';

interface HeroProps {
  onNavigate: (route: 'login' | 'signup' | 'dashboard') => void;
  isAuthenticated: boolean;
}

export default function Hero({ onNavigate, isAuthenticated }: HeroProps) {
  return (
    <section id="hero" className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[340px] bg-[#6366f1]/15 blur-[140px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/25 text-[#a78bfa] text-xs font-semibold tracking-wide mb-8">
          <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
          <span>Modern School Management Made Simple</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.08] mb-6">
          Run Your School Smarter with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] via-[#6366f1] to-[#38bdf8]">
            DUGSI PRO 2026
          </span>
        </h1>

        {/* Supporting message */}
        <p className="text-base sm:text-lg md:text-xl text-[#94a3b8] max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          One modern platform to manage your school's students, attendance, fees, exams, results, staff, and daily operations.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'signup')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          {!isAuthenticated && (
            <button
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/15 hover:border-white/30 bg-[#0e111a]/90 hover:bg-[#161a26] text-white font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Login</span>
            </button>
          )}
        </div>

        {/* Polished Visual Dashboard Preview Mockup */}
        <div className="relative max-w-5xl mx-auto rounded-2xl border border-white/[0.1] bg-[#0c0f17] shadow-2xl overflow-hidden text-left">
          
          {/* Top Window Chrome */}
          <div className="px-4 py-3 bg-[#080a11] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="ml-3 text-xs font-mono text-[#64748b] hidden sm:inline">
                dugsipro.edu/dashboard • Term 1 Academic Cycle
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live System Online</span>
            </div>
          </div>

          {/* Real Operational Preview Content */}
          <div className="p-5 md:p-8 bg-[#090c14] space-y-6">
            
            {/* Top Stat Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                <div className="flex items-center justify-between text-[#94a3b8] mb-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold">Total Students</span>
                  <Users className="w-4 h-4 text-[#a78bfa]" />
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold text-white">428</span>
                  <span className="text-[11px] text-emerald-400 font-semibold">100% Enrolled</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                <div className="flex items-center justify-between text-[#94a3b8] mb-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold">Tuition Collected</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold text-white">$18,450</span>
                  <span className="text-[11px] text-emerald-400 font-semibold">88% Paid</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                <div className="flex items-center justify-between text-[#94a3b8] mb-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold">Attendance Rate</span>
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold text-white">94.8%</span>
                  <span className="text-[11px] text-blue-400 font-semibold">Today</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                <div className="flex items-center justify-between text-[#94a3b8] mb-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold">Average Exam Score</span>
                  <Award className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-bold text-white">86.2%</span>
                  <span className="text-[11px] text-purple-400 font-semibold">Term 1</span>
                </div>
              </div>
            </div>

            {/* Split Operational View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Recent Student Roster Snippet */}
              <div className="lg:col-span-2 p-5 rounded-xl bg-[#111622] border border-white/[0.06]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-white">
                    Active Student Directory
                  </h4>
                  <span className="text-xs text-[#94a3b8]">Verified School Database</span>
                </div>
                
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#6366f1]/20 text-[#a78bfa] flex items-center justify-center font-bold">
                        MC
                      </div>
                      <div>
                        <span className="font-semibold text-white block">Maxamed Cali Jaamac</span>
                        <span className="text-[#64748b] text-[11px]">Fasalka 4A • Phone: 252615123456</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      Paid • Active
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                        CA
                      </div>
                      <div>
                        <span className="font-semibold text-white block">Caasho Axmed Nuur</span>
                        <span className="text-[#64748b] text-[11px]">Fasalka 3B • Phone: 252615654321</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      Paid • Active
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                        CX
                      </div>
                      <div>
                        <span className="font-semibold text-white block">Cabdiraxmaan Xasan Faarax</span>
                        <span className="text-[#64748b] text-[11px]">Fasalka 4A • Phone: 252615998877</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      Balance Due
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Operational Status */}
              <div className="p-5 rounded-xl bg-[#111622] border border-white/[0.06] flex flex-col justify-between">
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-white mb-3">
                    Daily Roll Call Summary
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94a3b8]">Morning Session</span>
                      <span className="text-emerald-400 font-bold">398 / 428 Present (93%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '93%' }}></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[#94a3b8]">Afternoon Session</span>
                      <span className="text-emerald-400 font-bold">406 / 428 Present (95%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#94a3b8]">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    School ID Isolated
                  </span>
                  <span className="font-mono text-[10px]">Academic Year 2025/2026</span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
