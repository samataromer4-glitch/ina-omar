import React from 'react';
import { Layers, Database, Zap, BarChart3 } from 'lucide-react';

export default function TrustStatement() {
  const valueCards = [
    {
      icon: Layers,
      title: 'One Platform',
      description: 'Bring school operations together in a single unified web environment.'
    },
    {
      icon: Database,
      title: 'Organized Data',
      description: 'Keep important school records, profiles, and historical logs structured.'
    },
    {
      icon: Zap,
      title: 'Faster Operations',
      description: 'Reduce repetitive administrative paperwork and manual data entry.'
    },
    {
      icon: BarChart3,
      title: 'Clear Insights',
      description: 'Use reports and records to understand daily academic and financial activity.'
    }
  ];

  return (
    <section id="trust-statement" className="py-16 md:py-24 bg-[#080a11] border-y border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        <span className="text-xs uppercase tracking-widest text-[#a78bfa] font-bold block mb-3">
          Core Foundation
        </span>
        
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto mb-5 leading-tight">
          Everything Your School Needs. In One Place.
        </h2>
        
        <p className="text-base sm:text-lg text-[#94a3b8] max-w-2xl mx-auto leading-relaxed mb-12">
          DUGSI PRO 2026 brings essential school operations into one organized platform so administrators and staff can manage information, monitor activities, and keep school records structured.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {valueCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-[#0c0f17] border border-white/[0.08] hover:border-[#6366f1]/30 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center text-[#a78bfa] mb-4 group-hover:scale-105 group-hover:bg-[#6366f1]/20 transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
