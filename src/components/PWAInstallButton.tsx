import React, { useState } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  className = '', 
  variant = 'compact' 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[#7c3aed]/40 bg-[#7c3aed]/15 text-[#c4b5fd] text-xs font-semibold uppercase tracking-wider hover:bg-[#7c3aed]/30 hover:text-white transition-all shadow-sm ${className}`}
        title="Ku shub Taleefankaaga ama Computer-kaaga (Install App)"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{variant === 'full' ? 'Ku shub Qalabkaaga (Install App)' : 'Install App'}</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[#ffffff15] bg-[#ffffff05] text-[#94a3b8] text-xs font-semibold uppercase tracking-wider hover:bg-[#ffffff10] hover:text-white transition-all ${className}`}
          title="Ku dar iPhone/iPad Home Screen"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#c4b5fd]" />
          <span>{variant === 'full' ? 'Install on iPhone/iPad' : 'Install (iOS)'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-sm bg-[#0f0f0f] border border-[#ffffff15] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#ffffff10]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-sm bg-[#7c3aed]/20 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-[#c4b5fd]" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#f5f5f5]">
                    Ku shub iPhone / iPad
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-sm text-[#737373] hover:text-white hover:bg-[#ffffff10]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Raac talaabooyinkan fudud si aad DUGSI PRO 2026 ugu darto shaashadaada taleefanka (Home Screen):
              </p>

              <ol className="space-y-3 text-xs text-[#e5e5e5]">
                <li className="flex items-start gap-2.5 p-2 rounded-sm bg-[#ffffff05] border border-[#ffffff08]">
                  <Share2 className="w-4 h-4 text-[#7c3aed] shrink-0 mt-0.5" />
                  <span>
                    1. Riix astaanta <strong>Share</strong> (Wadaag) ee hoose ama sare ee Safari browser.
                  </span>
                </li>
                <li className="flex items-start gap-2.5 p-2 rounded-sm bg-[#ffffff05] border border-[#ffffff08]">
                  <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    2. Hoos u deji liiska, kadibna dooro <strong>Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5 p-2 rounded-sm bg-[#ffffff05] border border-[#ffffff08]">
                  <Smartphone className="w-4 h-4 text-[#c4b5fd] shrink-0 mt-0.5" />
                  <span>
                    3. Riix <strong>Add</strong> ee geeska sare. Waxay toos ugu furmaysaa sida App caadi ah!
                  </span>
                </li>
              </ol>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-sm bg-[#e5e5e5] hover:bg-white text-[#0a0a0a] text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Fahmay (Done)
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback desktop install prompt button for Chromium browser if beforeinstallprompt is ready
  return null;
};
