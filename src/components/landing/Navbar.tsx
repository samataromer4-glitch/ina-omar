import React, { useState } from 'react';
import { GraduationCap, Menu, X, ArrowRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PWAInstallButton } from '../PWAInstallButton';

interface NavbarProps {
  onNavigate: (route: 'login' | 'signup' | 'dashboard') => void;
  isAuthenticated: boolean;
  userEmail?: string;
  onScrollTo: (id: string) => void;
}

export default function Navbar({ onNavigate, isAuthenticated, userEmail, onScrollTo }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    onScrollTo(sectionId);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#07090e]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => handleNavClick('hero')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider text-white">
                DUGSI PRO
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-[#6366f1]/20 text-[#a78bfa] border border-[#6366f1]/30 rounded">
                2026
              </span>
            </div>
            <span className="text-[11px] text-[#94a3b8] font-medium tracking-wide block">
              School Management System
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#94a3b8]">
          <button 
            onClick={() => handleNavClick('hero')} 
            className="hover:text-white transition-colors duration-150 py-1 cursor-pointer"
          >
            Home
          </button>
          <button 
            onClick={() => handleNavClick('features')} 
            className="hover:text-white transition-colors duration-150 py-1 cursor-pointer"
          >
            Features
          </button>
          <button 
            onClick={() => handleNavClick('solutions')} 
            className="hover:text-white transition-colors duration-150 py-1 cursor-pointer"
          >
            Solutions
          </button>
          <button 
            onClick={() => handleNavClick('how-it-works')} 
            className="hover:text-white transition-colors duration-150 py-1 cursor-pointer"
          >
            How It Works
          </button>
          <button 
            onClick={() => handleNavClick('pricing')} 
            className="hover:text-white transition-colors duration-150 py-1 cursor-pointer"
          >
            Pricing
          </button>
          <button 
            onClick={() => handleNavClick('faq')} 
            className="hover:text-white transition-colors duration-150 py-1 cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <PWAInstallButton />
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden xl:flex items-center gap-1.5 text-xs text-[#94a3b8] font-mono px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <User className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span className="max-w-[160px] truncate">{userEmail || 'School Admin'}</span>
              </div>
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-5 py-2.5 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2.5 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/[0.04] text-[#f8fafc] font-medium text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="px-5 py-2.5 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-white font-semibold text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.05] cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-white/[0.08] bg-[#080a11] px-6 py-5 space-y-4 shadow-2xl"
          >
            <div className="flex flex-col space-y-3 text-sm font-medium text-[#94a3b8]">
              <button 
                onClick={() => handleNavClick('hero')} 
                className="text-left py-2 hover:text-white cursor-pointer"
              >
                Home
              </button>
              <button 
                onClick={() => handleNavClick('features')} 
                className="text-left py-2 hover:text-white cursor-pointer"
              >
                Features
              </button>
              <button 
                onClick={() => handleNavClick('solutions')} 
                className="text-left py-2 hover:text-white cursor-pointer"
              >
                Solutions
              </button>
              <button 
                onClick={() => handleNavClick('how-it-works')} 
                className="text-left py-2 hover:text-white cursor-pointer"
              >
                How It Works
              </button>
              <button 
                onClick={() => handleNavClick('pricing')} 
                className="text-left py-2 hover:text-white cursor-pointer"
              >
                Pricing
              </button>
              <button 
                onClick={() => handleNavClick('faq')} 
                className="text-left py-2 hover:text-white cursor-pointer"
              >
                FAQ
              </button>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2.5">
              <PWAInstallButton className="w-full justify-center py-2.5" variant="full" />
              {isAuthenticated ? (
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('dashboard'); }}
                  className="w-full py-3 rounded-lg bg-[#6366f1] text-white font-semibold text-xs uppercase tracking-wider text-center cursor-pointer"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigate('login'); }}
                    className="w-full py-3 rounded-lg border border-white/10 text-white font-medium text-xs uppercase tracking-wider text-center cursor-pointer"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigate('signup'); }}
                    className="w-full py-3 rounded-lg bg-[#6366f1] text-white font-semibold text-xs uppercase tracking-wider text-center cursor-pointer"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
