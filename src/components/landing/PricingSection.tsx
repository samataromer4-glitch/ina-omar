import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  onNavigate: (route: 'login' | 'signup' | 'dashboard') => void;
  isAuthenticated: boolean;
}

export default function PricingSection({ onNavigate, isAuthenticated }: PricingSectionProps) {
  const pricingTiers = [
    {
      name: 'Starter School',
      target: 'Primary & Community Schools',
      description: 'Essential digital tools to organize students, class attendance, and tuition collection.',
      features: [
        'Complete Student Directory & Profiles',
        'Classes & Classroom Management',
        'Multi-Session Attendance Roll Call',
        'Tuition Billing & Payment Audit Logs',
        'Excel Student Roster Import',
        'Printable Student Directory PDF'
      ],
      popular: false,
      ctaText: 'Get Started with Starter'
    },
    {
      name: 'Professional School',
      target: 'Growing Primary & Secondary Schools',
      description: 'Comprehensive academic management including examinations, automated grading, and report cards.',
      features: [
        'All Starter School Features',
        'Subjects & Curriculum Course Codes',
        'Exams & Automated Grading Matrix',
        'Custom Pass/Fail Threshold Controls',
        'Official Student Report Cards (PDF)',
        'Attendance Statements & Financial Ledger',
        'One-Click System JSON Backup'
      ],
      popular: true,
      ctaText: 'Get Started with Professional'
    },
    {
      name: 'Campus / Institution',
      target: 'Multi-Branch & Large Educational Networks',
      description: 'Full institutional deployment with custom branding, advanced reporting, and priority support.',
      features: [
        'All Professional School Features',
        'Multi-Campus Data Coordination',
        'Custom Academic Cycle & Currency Setup',
        'Official School Letterhead Reports',
        'Staff Role Administration',
        'Dedicated Onboarding Assistance'
      ],
      popular: false,
      ctaText: 'Get Started with Institution'
    }
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-[#080a11] border-y border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-widest text-[#a78bfa] font-bold block mb-3">
            Predictable Access
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Simple Plans for Different School Needs
          </h2>
          <p className="text-base sm:text-lg text-[#94a3b8] leading-relaxed">
            Flexible software tiers configured to support the scale and academic requirements of your educational institution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-2xl flex flex-col justify-between relative ${
                tier.popular
                  ? 'bg-[#0c0f17] border-2 border-[#6366f1] shadow-2xl shadow-indigo-600/15'
                  : 'bg-[#0c0f17] border border-white/[0.08]'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#6366f1] text-white text-[10px] uppercase font-extrabold tracking-widest shadow-md">
                  Most Popular
                </div>
              )}

              <div>
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-white">
                    {tier.name}
                  </h3>
                  <span className="text-xs text-[#a78bfa] font-semibold block mt-1">
                    {tier.target}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed mb-6">
                  {tier.description}
                </p>

                <div className="space-y-3 pt-4 border-t border-white/[0.06] mb-8">
                  {tier.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-[#f8fafc]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'signup')}
                className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 text-center cursor-pointer ${
                  tier.popular
                    ? 'bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-lg shadow-indigo-600/30'
                    : 'border border-white/15 hover:border-white/30 bg-white/[0.04] hover:bg-white/[0.08] text-white'
                }`}
              >
                {isAuthenticated ? 'Open in Dashboard' : tier.ctaText}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-xs text-[#94a3b8]">
          <span>Have institutional questions or multi-campus licensing inquiries? </span>
          <button 
            onClick={() => onNavigate('signup')} 
            className="text-[#a78bfa] hover:underline font-semibold cursor-pointer"
          >
            Create an account to begin
          </button>
        </div>

      </div>
    </section>
  );
}
