import React from 'react';
import { 
  FileSpreadsheet, 
  FolderLock, 
  CheckCircle, 
  Sparkles, 
  LineChart,
  Clock
} from 'lucide-react';

export default function BenefitsSection() {
  const benefitsList = [
    {
      icon: FileSpreadsheet,
      title: 'Dramatically Less Paperwork',
      desc: 'Replace physical paper binders, lost receipt booklets, and handwritten registers with search-enabled digital records.'
    },
    {
      icon: FolderLock,
      title: 'Centralized Information',
      desc: 'Store enrollment, attendance logs, tuition ledgers, and exam transcripts in one protected institutional repository.'
    },
    {
      icon: CheckCircle,
      title: 'Better Organization',
      desc: 'Ensure every classroom, subject, and student has structured records that remain accessible across academic years.'
    },
    {
      icon: Clock,
      title: 'Easier Administration',
      desc: 'Execute twice-daily attendance in seconds and generate bulk student report cards with zero calculation errors.'
    },
    {
      icon: LineChart,
      title: 'Better Visibility',
      desc: 'Gain instant real-time oversight into tuition collection percentages, daily absentee rates, and term pass percentages.'
    }
  ];

  return (
    <section id="benefits" className="py-20 md:py-28 bg-[#080a11] border-y border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-widest text-[#a78bfa] font-bold block mb-3">
            Practical Value
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Why Schools Use DUGSI PRO 2026
          </h2>
          <p className="text-base sm:text-lg text-[#94a3b8] leading-relaxed">
            Tangible operational improvements that replace administrative friction with modern digital efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefitsList.map((ben, idx) => {
            const Icon = ben.icon;
            return (
              <div 
                key={idx}
                className="p-7 rounded-2xl bg-[#0c0f17] border border-white/[0.08] flex flex-col justify-between hover:border-[#6366f1]/30 transition-all duration-200"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2.5">
                    {ben.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
                    {ben.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
