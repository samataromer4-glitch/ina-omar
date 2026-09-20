import React from 'react';
import { ArrowRight, GraduationCap } from 'lucide-react';

interface FinalCtaProps {
  onNavigate: (route: 'login' | 'signup' | 'dashboard') => void;
  isAuthenticated: boolean;
}

export default function FinalCta({ onNavigate, isAuthenticated }: FinalCtaProps) {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-[#07090e] via-[#0b0e17] to-[#0e121d] border-t border-white/[0.08]">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-[#6366f1]/15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#a78bfa] mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-600/30">
          <GraduationCap className="w-6 h-6" />
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5 leading-tight">
          Ready to Simplify Your School Management?
        </h2>
        
        <p className="text-base sm:text-lg text-[#94a3b8] max-w-xl mx-auto mb-10 leading-relaxed">
          Bring your school's daily operations together with DUGSI PRO 2026. Manage students, attendance, fees, exams, and reports in one modern platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'signup')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>{isAuthenticated ? 'Open School Dashboard' : 'Get Started'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          {!isAuthenticated && (
            <button
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/15 hover:border-white/30 bg-[#0c0f17] hover:bg-[#161a26] text-white font-bold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer"
            >
              <span>Login</span>
            </button>
          )}
        </div>

      </div>
    </section>
  );
}
