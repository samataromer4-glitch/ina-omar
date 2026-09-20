import React from 'react';
import { UserPlus, Sliders, CheckSquare, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onNavigate: (route: 'login' | 'signup' | 'dashboard') => void;
  isAuthenticated: boolean;
}

export default function HowItWorks({ onNavigate, isAuthenticated }: HowItWorksProps) {
  const steps = [
    {
      step: '01',
      icon: UserPlus,
      title: 'Create Your Account',
      action: 'Quick Registration',
      description: 'Register your school administrator account with your official school email and secure password.'
    },
    {
      step: '02',
      icon: Sliders,
      title: 'Set Up Your School',
      action: 'Configure Profile',
      description: 'Define your school name, academic year, classroom structures, subject course codes, and grading thresholds.'
    },
    {
      step: '03',
      icon: CheckSquare,
      title: 'Manage Your School',
      action: 'Daily Operations',
      description: 'Enroll students, record twice-daily attendance, log tuition payments, record exam scores, and print official report cards.'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-[#080a11] border-y border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-widest text-[#a78bfa] font-bold block mb-3">
            Onboarding Flow
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Start Managing Your School in Three Steps
          </h2>
          <p className="text-base sm:text-lg text-[#94a3b8] leading-relaxed">
            Transitioning your school records into DUGSI PRO 2026 is fast, intuitive, and designed to eliminate administrative confusion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={idx}
                className="p-8 rounded-2xl bg-[#0c0f17] border border-white/[0.08] hover:border-[#6366f1]/40 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#6366f1]">
                      {step.step}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-[#6366f1]/10 text-[#a78bfa] border border-[#6366f1]/20">
                      {step.action}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white mb-4">
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">
                    {step.title}
                  </h3>

                  <p className="text-sm text-[#94a3b8] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/[0.06] text-xs font-semibold text-[#a78bfa]">
                  Step {idx + 1} of 3
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <button
            onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'signup')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-xl shadow-indigo-600/30 cursor-pointer group"
          >
            <span>{isAuthenticated ? 'Open School Dashboard' : 'Create Your School Account Now'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
}
