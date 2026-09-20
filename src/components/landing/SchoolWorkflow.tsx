import React from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  DollarSign, 
  Award, 
  FileText, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function SchoolWorkflow() {
  const workflowNodes = [
    {
      id: 1,
      icon: Users,
      name: 'Students',
      desc: 'Enrollment & profiles'
    },
    {
      id: 2,
      icon: BookOpen,
      name: 'Classes',
      desc: 'Grade & room mapping'
    },
    {
      id: 3,
      icon: Calendar,
      name: 'Attendance',
      desc: 'Twice daily roll call'
    },
    {
      id: 4,
      icon: DollarSign,
      name: 'Fees',
      desc: 'Invoices & payments'
    },
    {
      id: 5,
      icon: Award,
      name: 'Exams',
      desc: 'Term score capture'
    },
    {
      id: 6,
      icon: Award,
      name: 'Results',
      desc: 'Automated grades'
    },
    {
      id: 7,
      icon: FileText,
      name: 'Reports',
      desc: 'Official PDF cards'
    }
  ];

  return (
    <section id="workflow" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div className="text-center max-w-3xl mx-auto mb-14">
        <span className="text-xs uppercase tracking-widest text-[#a78bfa] font-bold block mb-3">
          Seamless Data Flow
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          The School Operating Workflow
        </h2>
        <p className="text-base sm:text-lg text-[#94a3b8] leading-relaxed">
          Information entered once powers every downstream module. When a student is enrolled in a class, their name instantly appears in roll call sheets, tuition billing ledgers, and exam rosters.
        </p>
      </div>

      {/* Horizontal Pipeline (Responsive) */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0c0f17] border border-white/[0.08] shadow-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 relative">
          {workflowNodes.map((node, index) => {
            const Icon = node.icon;
            const isLast = index === workflowNodes.length - 1;
            return (
              <div key={node.id} className="flex flex-col items-center text-center group">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover:border-[#6366f1]/50 group-hover:bg-[#6366f1]/10 text-[#a78bfa] flex items-center justify-center mb-3 transition-all duration-200">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white mb-1">
                  {node.name}
                </span>
                <span className="text-[11px] text-[#64748b] leading-tight">
                  {node.desc}
                </span>
                
                {/* Arrow indicator for desktop */}
                {!isLast && (
                  <div className="hidden lg:block absolute top-6 translate-x-12 text-white/20">
                    {/* Visual spacer */}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pipeline connecting bar description */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-[#94a3b8] gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Zero manual re-entry between modules</span>
          </div>
          <span className="font-mono text-[11px] text-[#64748b]">
            Continuous institutional synchronization
          </span>
        </div>
      </div>

    </section>
  );
}
