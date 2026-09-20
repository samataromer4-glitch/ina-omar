import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface AnnouncementBarProps {
  onNavigate: (route: 'login' | 'signup' | 'dashboard') => void;
  isAuthenticated: boolean;
}

export default function AnnouncementBar({ onNavigate, isAuthenticated }: AnnouncementBarProps) {
  return (
    <div id="announcement-bar" className="w-full bg-[#0c0f17] border-b border-white/[0.08] py-2 px-4 text-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center text-[#94a3b8]">
        <span className="inline-flex items-center gap-1.5 font-medium text-white">
          <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
          <span className="font-semibold">DUGSI PRO 2026</span>
        </span>
        <span className="text-white/20 hidden sm:inline">•</span>
        <span className="hidden sm:inline">Modern School Management Made Simple</span>
        <button
          onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'signup')}
          className="inline-flex items-center gap-1 text-[#a78bfa] hover:text-white font-semibold ml-1.5 transition-colors group cursor-pointer"
        >
          <span>{isAuthenticated ? 'Open Dashboard' : 'Explore Platform'}</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
