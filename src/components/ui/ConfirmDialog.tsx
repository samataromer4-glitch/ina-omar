import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  consequences?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  consequences,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const config = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      btn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
    },
    primary: {
      icon: Info,
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
    }
  }[variant];

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#0f0f0f] border border-[#ffffff15] rounded-sm p-6 space-y-4 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 ${config.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#f5f5f5] tracking-tight">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-[#737373] hover:text-white p-1 rounded-sm transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#a3a3a3] leading-relaxed">
          {message}
        </p>

        {consequences && (
          <div className="p-3 rounded-sm bg-[#ffffff05] border border-[#ffffff08] text-[11px] text-[#737373] space-y-1">
            <span className="font-semibold uppercase tracking-wider text-[#a3a3a3] block">
              Notice:
            </span>
            <p>{consequences}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-sm border border-[#ffffff15] bg-[#ffffff03] hover:bg-[#ffffff08] text-[#d4d4d4] text-xs font-semibold tracking-wide transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50 ${config.btn}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
