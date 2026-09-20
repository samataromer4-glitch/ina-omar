import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Award, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  Database,
  CheckCircle2,
  Download,
  Upload,
  UserCheck
} from 'lucide-react';

export default function FeaturesOverview() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'academic' | 'administration' | 'financial' | 'reporting'>('all');

  const categories = [
    { id: 'all' as const, label: 'All Modules' },
    { id: 'academic' as const, label: 'Academic Management' },
    { id: 'administration' as const, label: 'Administration' },
    { id: 'financial' as const, label: 'Financial Management' },
    { id: 'reporting' as const, label: 'Reporting & Analytics' },
  ];

  const featuresList = [
    {
      category: 'academic',
      icon: Users,
      title: 'Student Directory & Profiles',
      description: 'Manage verified student profiles with photos, assigned class, gender, guardian telephone contacts, and active status tracking.',
      badge: 'Core Module',
      highlights: ['Student ID auto-generation', 'Class assignment', 'Guardian phone directory', 'Active / Inactive filters']
    },
    {
      category: 'academic',
      icon: BookOpen,
      title: 'Classes & Classrooms',
      description: 'Structure academic grades and classrooms, assign designated head teachers, manage room numbers, and track class capacities.',
      badge: 'Academic Structure',
      highlights: ['Classroom directory', 'Designated class teachers', 'Room assignment', 'Student enrollment counts']
    },
    {
      category: 'academic',
      icon: BookOpen,
      title: 'Subjects & Curriculum',
      description: 'Define course subjects, assign unique subject codes, map subjects to grade levels, and assign instructors.',
      badge: 'Curriculum',
      highlights: ['Course code catalog', 'Instructor mapping', 'Class-level curriculum', 'Organized schedule']
    },
    {
      category: 'academic',
      icon: Award,
      title: 'Exams & Automated Grading',
      description: 'Record term examination marks per subject. Automatically calculate percentages and map letter grades (A, B, C, D, Fail) to customizable thresholds.',
      badge: 'Automated Evaluation',
      highlights: ['Term 1, Term 2 & Midterms', 'Pass/Fail threshold controls', 'A, B, C, D letter grading', 'Subject rank calculation']
    },
    {
      category: 'administration',
      icon: Calendar,
      title: 'Multi-Session Attendance Roll Call',
      description: 'Take student attendance for both morning (Before Break) and afternoon (After Break) sessions. Features one-click "Mark All Present" and absentee tracking.',
      badge: 'Daily Operations',
      highlights: ['Before & After Break sessions', 'One-click "Mark All Present"', 'Present, Absent, Late & Excused', 'Historical roll-call logs']
    },
    {
      category: 'administration',
      icon: UserCheck,
      title: 'Teachers & Academic Staff',
      description: 'Organize teaching instructors, assign subjects and classrooms, and maintain clear records of educational staff.',
      badge: 'Faculty Management',
      highlights: ['Assigned subject teachers', 'Class master oversight', 'Staff coordination', 'Role-based visibility']
    },
    {
      category: 'administration',
      icon: Upload,
      title: 'Bulk Excel Student Import',
      description: 'Quickly onboard hundreds of students using a pre-formatted Excel template. Upload spreadsheet data directly into your school directory.',
      badge: 'Time-Saving Import',
      highlights: ['Downloadable XLSX template', 'Instant field parsing', 'Bulk enrollment', 'Validation warnings']
    },
    {
      category: 'financial',
      icon: DollarSign,
      title: 'Tuition Fees & Invoicing',
      description: 'Generate monthly student invoices in your chosen currency (USD, etc.). Track paid amounts, partial payments, and outstanding balances.',
      badge: 'Financial Control',
      highlights: ['Monthly billing records', 'Paid, Partial & Unpaid statuses', 'Custom currency settings', 'Outstanding balance alerts']
    },
    {
      category: 'financial',
      icon: Database,
      title: 'Payment Audit Trail & Receipts',
      description: 'Maintain detailed history logs for every fee transaction, recording the action, exact timestamp, and amount received.',
      badge: 'Audit Trail',
      highlights: ['Transaction history logs', 'Payment timeline', 'Financial ledger', 'Zero duplicate payments']
    },
    {
      category: 'reporting',
      icon: FileText,
      title: 'Student Report Cards (PDF)',
      description: 'Generate comprehensive official report cards displaying student grades per subject, overall percentage, pass status, and teacher remarks.',
      badge: 'Export Ready',
      highlights: ['Individual student transcripts', 'Automated percentage math', 'Principal remarks field', 'Printable PDF format']
    },
    {
      category: 'reporting',
      icon: Download,
      title: 'Official Attendance Statements',
      description: 'Download verified PDF attendance rosters summarizing present, absent, and excused sessions for classroom inspection.',
      badge: 'Official Documentation',
      highlights: ['Class-level roll sheets', 'Session percentage stats', 'Official letterhead layout', 'PDF generation']
    },
    {
      category: 'reporting',
      icon: ShieldCheck,
      title: 'System Data Backup & JSON Export',
      description: 'Safely export your entire school dataset into standard JSON format with a single click, ensuring your institutional data remains backed up.',
      badge: 'Data Security',
      highlights: ['One-click JSON backup', 'Local & cloud resilience', 'Multi-tenant isolation', 'Offline-friendly fallback']
    }
  ];

  const filteredFeatures = selectedCategory === 'all' 
    ? featuresList 
    : featuresList.filter(f => f.category === selectedCategory);

  return (
    <section id="features" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs uppercase tracking-widest text-[#a78bfa] font-bold block mb-3">
          Comprehensive Feature Set
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Powerful School Management Tools
        </h2>
        <p className="text-base sm:text-lg text-[#94a3b8] leading-relaxed">
          Every tool inside DUGSI PRO 2026 corresponds to real functional workflows built to manage students, academic progress, and institutional records.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center justify-center gap-2 flex-wrap mb-12">
        {categories.map(cat => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-[#0c0f17] text-[#94a3b8] hover:text-white border border-white/[0.08] hover:bg-[#161a26]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div 
              key={idx}
              className="p-6 rounded-2xl bg-[#0c0f17] border border-white/[0.08] hover:border-[#6366f1]/40 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 flex items-center justify-center text-[#a78bfa] group-hover:scale-105 group-hover:bg-[#6366f1]/20 transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold uppercase px-2.5 py-1 rounded bg-white/[0.04] text-[#94a3b8] border border-white/[0.08]">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  {feat.title}
                </h3>
                
                <p className="text-xs text-[#94a3b8] leading-relaxed mb-6">
                  {feat.description}
                </p>
              </div>

              {/* Highlights List */}
              <div className="space-y-2 pt-4 border-t border-white/[0.06]">
                {feat.highlights.map((h, hIdx) => (
                  <div key={hIdx} className="flex items-center gap-2 text-xs text-[#cbd5e1]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}
