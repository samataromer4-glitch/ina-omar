import React from 'react';
import { GraduationCap, ShieldCheck, ArrowRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: 'login' | 'signup' | 'dashboard') => void;
  isAuthenticated: boolean;
  onScrollTo: (id: string) => void;
}

export default function Footer({ onNavigate, isAuthenticated, onScrollTo }: FooterProps) {
  return (
    <footer className="border-t border-white/[0.08] bg-[#05070c] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center text-white">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-wider text-white">
                DUGSI PRO 2026
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              School Management Made Simple. A modern, centralized platform for primary, secondary, and community schools.
            </p>
            <div className="pt-2 text-[11px] text-[#64748b]">
              Enterprise-grade multi-tenant architecture with school-level data isolation.
            </div>
          </div>

          {/* Product & Solutions */}
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-white block mb-4">
              Platform Modules
            </span>
            <ul className="space-y-2 text-xs text-[#94a3b8]">
              <li>
                <button onClick={() => onScrollTo('hero')} className="hover:text-white cursor-pointer">
                  Platform Overview
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('features')} className="hover:text-white cursor-pointer">
                  Core Modules
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('preview')} className="hover:text-white cursor-pointer">
                  Live System Preview
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('students-management')} className="hover:text-white cursor-pointer">
                  Student Directory
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('attendance-management')} className="hover:text-white cursor-pointer">
                  Multi-Session Attendance
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('fees-management')} className="hover:text-white cursor-pointer">
                  Tuition Invoicing
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('exams-management')} className="hover:text-white cursor-pointer">
                  Exams & Automated Grading
                </button>
              </li>
            </ul>
          </div>

          {/* Institutional Navigation */}
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-white block mb-4">
              Institutional Navigation
            </span>
            <ul className="space-y-2 text-xs text-[#94a3b8]">
              <li>
                <button onClick={() => onScrollTo('how-it-works')} className="hover:text-white cursor-pointer">
                  How It Works (3 Steps)
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('workflow')} className="hover:text-white cursor-pointer">
                  School Operating Workflow
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('benefits')} className="hover:text-white cursor-pointer">
                  Practical Benefits
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('why-dugsi-pro')} className="hover:text-white cursor-pointer">
                  Why DUGSI PRO 2026
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('pricing')} className="hover:text-white cursor-pointer">
                  Pricing Tiers
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('faq')} className="hover:text-white cursor-pointer">
                  Frequently Asked Questions
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Access & System Status */}
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-white block mb-4">
              Direct Access
            </span>
            <ul className="space-y-2.5 text-xs text-[#94a3b8] mb-6">
              {isAuthenticated ? (
                <li>
                  <button 
                    onClick={() => onNavigate('dashboard')} 
                    className="inline-flex items-center gap-1.5 text-[#a78bfa] hover:text-white font-bold cursor-pointer"
                  >
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </li>
              ) : (
                <>
                  <li>
                    <button onClick={() => onNavigate('login')} className="hover:text-white cursor-pointer">
                      Login to Existing Account
                    </button>
                  </li>
                  <li>
                    <button onClick={() => onNavigate('signup')} className="hover:text-white font-semibold text-[#a78bfa] cursor-pointer">
                      Get Started (New School)
                    </button>
                  </li>
                </>
              )}
            </ul>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-white font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>System Status: Online</span>
              </div>
              <div className="font-mono text-[10px] text-[#64748b]">
                Platform Build: v2026.1-prod<br />
                Multi-Tenant School ID Security Active
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748b]">
          <p>&copy; {new Date().getFullYear()} DUGSI PRO 2026. All rights reserved.</p>
          <p className="font-mono text-[11px]">Empowering smarter educational management</p>
        </div>
      </div>
    </footer>
  );
}
