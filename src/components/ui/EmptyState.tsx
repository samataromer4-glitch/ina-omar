import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'search';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default'
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center max-w-md mx-auto animate-fade-in">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
        variant === 'search' 
          ? 'bg-[#ffffff05] border border-[#ffffff10] text-[#737373]' 
          : 'bg-[#7c3aed]/10 border border-[#7c3aed]/20 text-[#c4b5fd]'
      }`}>
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-base font-bold text-[#f5f5f5] mb-1.5 tracking-tight">
        {title}
      </h3>

      <p className="text-xs text-[#888888] mb-6 leading-relaxed">
        {description}
      </p>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-4 py-2 rounded-sm border border-[#ffffff15] bg-[#ffffff03] hover:bg-[#ffffff08] text-[#d4d4d4] hover:text-white text-xs font-semibold tracking-wide transition-all cursor-pointer"
          >
            {secondaryActionLabel}
          </button>
        )}

        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
