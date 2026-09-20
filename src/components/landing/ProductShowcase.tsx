import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  DollarSign, 
  Award, 
  FileText, 
  Settings as SettingsIcon,
  Download,
  Upload,
  Search,
  CheckCircle2,
  Clock,
  BookOpen,
  Filter,
  ShieldCheck
} from 'lucide-react';

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'attendance' | 'fees' | 'exams' | 'reports' | 'classes' | 'settings'>('dashboard');

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'students' as const, label: 'Students', icon: Users },
    { id: 'attendance' as const, label: 'Attendance', icon: Calendar },
    { id: 'fees' as const, label: 'Fees & Finance', icon: DollarSign },
    { id: 'exams' as const, label: 'Exams & Grades', icon: Award },
    { id: 'reports' as const, label: 'Reports', icon: FileText },
    { id: 'classes' as const, label: 'Classes & Subjects', icon: BookOpen },
    { id: 'settings' as const, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <section id="preview" className="py-20 md:py-28 bg-[#080a11] border-y border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest text-[#a78bfa] font-bold block mb-3">
            Product Showcase
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Explore DUGSI PRO 2026
          </h2>
          <p className="text-base sm:text-lg text-[#94a3b8] leading-relaxed">
            Click through real application screens to see how our clean, high-contrast operational views streamline daily school management.
          </p>
        </div>

        {/* Tab Buttons Bar */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-[#0c0f17] text-[#94a3b8] hover:text-white border border-white/[0.08] hover:bg-[#161a26]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mockup Frame */}
        <div className="rounded-2xl border border-white/[0.1] bg-[#0c0f17] shadow-2xl overflow-hidden text-left">
          
          {/* Chrome Top Bar */}
          <div className="px-5 py-3.5 bg-[#07090e] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="ml-3 text-xs font-mono text-[#64748b]">
                dugsipro.edu/app/{activeTab}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#94a3b8]">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="hidden sm:inline">DUGSI PRO 2026 — Verified School System</span>
            </div>
          </div>

          {/* Screen Content */}
          <div className="p-6 md:p-8 bg-[#090c14] min-h-[460px]">
            
            {/* 1. DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                    <span className="text-[11px] uppercase tracking-wider text-[#94a3b8] font-bold block mb-1">
                      Active Enrollment
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl md:text-3xl font-bold text-white">428</span>
                      <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        100% Active
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                    <span className="text-[11px] uppercase tracking-wider text-[#94a3b8] font-bold block mb-1">
                      Tuition Revenue
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl md:text-3xl font-bold text-white">$18,450</span>
                      <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        88% Collected
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                    <span className="text-[11px] uppercase tracking-wider text-[#94a3b8] font-bold block mb-1">
                      Today's Roll Call
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl md:text-3xl font-bold text-white">94.8%</span>
                      <span className="text-xs text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-full">
                        Morning & Afternoon
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                    <span className="text-[11px] uppercase tracking-wider text-[#94a3b8] font-bold block mb-1">
                      Term 1 Pass Rate
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl md:text-3xl font-bold text-white">89.2%</span>
                      <span className="text-xs text-purple-400 font-semibold bg-purple-500/10 px-2 py-0.5 rounded-full">
                        Passing Threshold
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 p-5 rounded-xl bg-[#111622] border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs uppercase tracking-wider font-bold text-white">
                        Monthly Tuition Invoices & Collections
                      </h4>
                      <span className="text-xs text-[#94a3b8] font-mono">Cycle 2025/2026</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-white">January</span>
                          <span className="text-emerald-400">$3,400 / $3,800 (89%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '89%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-white">February</span>
                          <span className="text-emerald-400">$3,650 / $3,950 (92%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-white">March</span>
                          <span className="text-amber-400">$2,900 / $3,900 (74%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: '74%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-[#111622] border border-white/[0.06] flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-bold text-white mb-3">
                        Operational Quick Links
                      </h4>
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs">
                          <span className="text-white">Student Directory PDF</span>
                          <Download className="w-3.5 h-3.5 text-[#a78bfa]" />
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs">
                          <span className="text-white">Take Roll Call</span>
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between text-xs">
                          <span className="text-white">Create Fee Invoice</span>
                          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-white/[0.06] text-[11px] text-[#94a3b8]">
                      Database: <span className="text-emerald-400 font-mono">Isolated School Cloud</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. STUDENTS TAB */}
            {activeTab === 'students' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <h4 className="text-base font-bold text-white">Student Enrollment & Directory</h4>
                    <p className="text-xs text-[#94a3b8]">Filter, search, add, edit, and bulk-import students via Excel template</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/30 text-xs font-semibold text-[#a78bfa]">
                      Export PDF
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-white">
                      Import Excel
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[#94a3b8] uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3">Gender</th>
                        <th className="py-2.5 px-3">Guardian Phone</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      <tr>
                        <td className="py-3 px-3 font-semibold text-white">Maxamed Cali Jaamac</td>
                        <td className="py-3 px-3 text-[#94a3b8]">Fasalka 4A</td>
                        <td className="py-3 px-3 text-[#94a3b8]">Male</td>
                        <td className="py-3 px-3 font-mono text-[#94a3b8]">252615123456</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-semibold text-white">Caasho Axmed Nuur</td>
                        <td className="py-3 px-3 text-[#94a3b8]">Fasalka 3B</td>
                        <td className="py-3 px-3 text-[#94a3b8]">Female</td>
                        <td className="py-3 px-3 font-mono text-[#94a3b8]">252615654321</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-semibold text-white">Cabdiraxmaan Xasan Faarax</td>
                        <td className="py-3 px-3 text-[#94a3b8]">Fasalka 4A</td>
                        <td className="py-3 px-3 text-[#94a3b8]">Male</td>
                        <td className="py-3 px-3 font-mono text-[#94a3b8]">252615998877</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. ATTENDANCE TAB */}
            {activeTab === 'attendance' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <h4 className="text-base font-bold text-white">Multi-Session Roll Call Sheet</h4>
                    <p className="text-xs text-[#94a3b8]">Session Selection: Morning (Before Break) & Afternoon (After Break)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      Mark All Present
                    </span>
                    <span className="px-2.5 py-1 rounded bg-[#6366f1]/20 border border-[#6366f1]/30 text-[#a78bfa] text-xs font-semibold">
                      Print Statement
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-[#111622] border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-[#94a3b8]">Present</span>
                    <span className="text-xl font-bold text-emerald-400 block mt-1">32</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#111622] border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-[#94a3b8]">Absent</span>
                    <span className="text-xl font-bold text-rose-400 block mt-1">2</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#111622] border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-[#94a3b8]">Late</span>
                    <span className="text-xl font-bold text-amber-400 block mt-1">1</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#111622] border border-white/[0.06]">
                    <span className="text-[10px] uppercase font-bold text-[#94a3b8]">Excused</span>
                    <span className="text-xl font-bold text-blue-400 block mt-1">1</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#111622] border border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">Maxamed Cali Jaamac</span>
                    <span className="text-[#94a3b8]">Fasalka 4A</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="px-2 py-1 rounded bg-emerald-500 text-white font-bold text-[10px]">Present</span>
                    <span className="px-2 py-1 rounded bg-white/[0.04] text-[#94a3b8] text-[10px]">Absent</span>
                    <span className="px-2 py-1 rounded bg-white/[0.04] text-[#94a3b8] text-[10px]">Late</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. FEES TAB */}
            {activeTab === 'fees' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <h4 className="text-base font-bold text-white">Student Tuition Invoicing & Finance</h4>
                    <p className="text-xs text-[#94a3b8]">Monthly student billing ledger with paid, partial, and unpaid balance audit logs</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    Export Financial Statement PDF
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[#94a3b8] uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-3">Month</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Paid</th>
                        <th className="py-2.5 px-3">Balance</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      <tr>
                        <td className="py-3 px-3 font-semibold text-white">Maxamed Cali Jaamac</td>
                        <td className="py-3 px-3 text-[#94a3b8]">March 2026</td>
                        <td className="py-3 px-3 font-mono text-white">$50.00</td>
                        <td className="py-3 px-3 font-mono text-emerald-400">$50.00</td>
                        <td className="py-3 px-3 font-mono text-[#94a3b8]">$0.00</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            PAID
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-semibold text-white">Caasho Axmed Nuur</td>
                        <td className="py-3 px-3 text-[#94a3b8]">March 2026</td>
                        <td className="py-3 px-3 font-mono text-white">$50.00</td>
                        <td className="py-3 px-3 font-mono text-amber-400">$25.00</td>
                        <td className="py-3 px-3 font-mono text-amber-400">$25.00</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            PARTIAL
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. EXAMS TAB */}
            {activeTab === 'exams' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <h4 className="text-base font-bold text-white">Examinations & Score Entry</h4>
                    <p className="text-xs text-[#94a3b8]">Grade thresholds: Grade A (90%+), B (80%+), C (70%+), D (60%+), Fail</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/30 text-[#a78bfa] text-xs font-bold">
                    Term 1 Results
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                    <span className="text-xs font-bold text-white">Mathematics</span>
                    <span className="text-[11px] text-[#94a3b8] block mb-2">Fasalka 4A — Term 1</span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94a3b8]">Marks: 94 / 100</span>
                      <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400">Grade A</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                    <span className="text-xs font-bold text-white">English Language</span>
                    <span className="text-[11px] text-[#94a3b8] block mb-2">Fasalka 4A — Term 1</span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94a3b8]">Marks: 86 / 100</span>
                      <span className="px-2 py-0.5 rounded font-bold bg-teal-500/20 text-teal-400">Grade B</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                    <span className="text-xs font-bold text-white">Islamic Studies</span>
                    <span className="text-[11px] text-[#94a3b8] block mb-2">Fasalka 4A — Term 1</span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94a3b8]">Marks: 98 / 100</span>
                      <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400">Grade A</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. REPORTS TAB */}
            {activeTab === 'reports' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <h4 className="text-base font-bold text-white">Student Report Cards & Academic Transcripts</h4>
                    <p className="text-xs text-[#94a3b8]">Official student report card generation with remarks and letterhead</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-[#6366f1] text-white text-xs font-bold flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report Card PDF</span>
                  </span>
                </div>

                <div className="p-5 rounded-xl bg-[#111622] border border-white/[0.06]">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                    <div>
                      <h5 className="text-sm font-bold text-white">Maxamed Cali Jaamac</h5>
                      <span className="text-xs text-[#94a3b8]">Student ID: std-2026-041 • Class: Fasalka 4A</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded">
                        Overall: 92.6% (Passed)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#94a3b8] italic">
                    Teacher Remarks: "Aad iyo Aad u Fiican (Outstanding Performance). Demonstrates exemplary leadership and academic consistency."
                  </p>
                </div>
              </div>
            )}

            {/* 7. CLASSES & SUBJECTS TAB */}
            {activeTab === 'classes' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <h4 className="text-base font-bold text-white">Classes & Academic Subjects</h4>
                    <p className="text-xs text-[#94a3b8]">Classroom assignments, designated room numbers, and subject course codes</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs font-semibold">
                    Manage Curriculum
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-bold text-white">Fasalka 4A</h5>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Room 104</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] mb-2">Head Teacher: Macallin Maxamed Cusmaan</p>
                    <span className="text-[11px] text-[#64748b]">Enrolled: 36 Students</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-bold text-white">Fasalka 3B</h5>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Room 102</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] mb-2">Head Teacher: Macallimad Maryan Jaamac</p>
                    <span className="text-[11px] text-[#64748b]">Enrolled: 32 Students</span>
                  </div>
                </div>
              </div>
            )}

            {/* 8. SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div>
                    <h4 className="text-base font-bold text-white">System Settings & Data Governance</h4>
                    <p className="text-xs text-[#94a3b8]">Institutional branding, currency choices, grading pass thresholds, and data backup</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/30 text-[#a78bfa] text-xs font-bold">
                    One-Click JSON Export
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                    <span className="text-[#94a3b8] block mb-1">School Name</span>
                    <span className="font-bold text-white">Dugsiga Pro 2026</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                    <span className="text-[#94a3b8] block mb-1">Tuition Currency</span>
                    <span className="font-bold text-white">USD ($)</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#111622] border border-white/[0.06]">
                    <span className="text-[#94a3b8] block mb-1">Pass Mark Threshold</span>
                    <span className="font-bold text-white">60% Minimum</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
