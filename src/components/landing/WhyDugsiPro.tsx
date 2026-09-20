import React from 'react';
import { 
  Check, 
  Sparkles, 
  LayoutDashboard, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  Sliders
} from 'lucide-react';

export default function WhyDugsiPro() {
  const pillars = [
    {
      title: 'Simple',
      desc: 'Clean, clutter-free interfaces that teachers and administrators can master within 15 minutes without complicated technical training.'
    },
    {
      title: 'Organized',
      desc: 'A unified structural hierarchy where students belong to classes, classes have designated head teachers, and subjects map to grade levels.'
    },
    {
      title: 'Modern',
      desc: 'Built on high-performance web standards with high-contrast typography, fast data loading, and instant PDF report rendering.'
    },
    {
      title: 'Accessible',
      desc: 'Fully responsive experience accessible on school office desktop computers, laptops, administrative tablets, and mobile devices.'
    },
    {
      title: 'Practical',
      desc: 'Eliminates unnecessary bloat. Every button, table, and modal addresses a direct daily task faced by school staff.'
    },
    {
      title: 'Workflow-Aligned',
      desc: 'Directly mirrors real academic cycles: enrollment, twice-daily roll calls (Before & After Break), monthly billing, and term report cards.'
    }
  ];

  return (
    <section id="why-dugsi-pro" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs uppercase tracking-widest text-[#a78bfa] font-bold block mb-3">
          Product Philosophy
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Built for Modern School Management
        </h2>
        <p className="text-base sm:text-lg text-[#94a3b8] leading-relaxed">
          DUGSI PRO 2026 is engineered specifically for primary, secondary, and community schools seeking dependable administrative control without unnecessary complexity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pillars.map((pillar, idx) => (
          <div 
            key={idx}
            className="p-7 rounded-2xl bg-[#0c0f17] border border-white/[0.08] hover:border-[#6366f1]/30 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#6366f1]/10 text-[#a78bfa] flex items-center justify-center font-bold text-xs">
                {idx + 1}
              </div>
              <h3 className="text-lg font-bold text-white">
                {pillar.title}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
              {pillar.desc}
            </p>
          </div>
        ))}
      </div>

    </section>
  );
}
