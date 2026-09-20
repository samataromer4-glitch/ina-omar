import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label?: string;
  title?: string;
  value: string | number;
  subValue?: string;
  subtitle?: string;
  context?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'amber' | 'rose' | 'violet' | 'blue' | 'slate' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  onClick?: () => void;
  active?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  title,
  value,
  subValue,
  subtitle,
  context,
  icon: Icon,
  variant = 'slate',
  trend,
  onClick,
  active
}) => {
  const displayLabel = label || title || '';
  const displaySubValue = subValue || subtitle;

  const normalizedVariant = 
    variant === 'success' ? 'emerald' :
    variant === 'warning' ? 'amber' :
    variant === 'danger' ? 'rose' :
    variant === 'info' ? 'blue' :
    variant;

  const colorMap = {
    emerald: {
      border: 'border-emerald-500/30 hover:border-emerald-500/50',
      activeBorder: 'border-emerald-500',
      bg: 'bg-emerald-500/10 text-emerald-400',
      value: 'text-emerald-400'
    },
    amber: {
      border: 'border-amber-500/30 hover:border-amber-500/50',
      activeBorder: 'border-amber-500',
      bg: 'bg-amber-500/10 text-amber-400',
      value: 'text-amber-400'
    },
    rose: {
      border: 'border-rose-500/30 hover:border-rose-500/50',
      activeBorder: 'border-rose-500',
      bg: 'bg-rose-500/10 text-rose-400',
      value: 'text-rose-400'
    },
    violet: {
      border: 'border-[#7c3aed]/30 hover:border-[#7c3aed]/50',
      activeBorder: 'border-[#7c3aed]',
      bg: 'bg-[#7c3aed]/10 text-[#c4b5fd]',
      value: 'text-[#c4b5fd]'
    },
    blue: {
      border: 'border-blue-500/30 hover:border-blue-500/50',
      activeBorder: 'border-blue-500',
      bg: 'bg-blue-500/10 text-blue-400',
      value: 'text-blue-400'
    },
    slate: {
      border: 'border-[#ffffff10] hover:border-[#ffffff20]',
      activeBorder: 'border-white',
      bg: 'bg-[#ffffff08] text-[#a3a3a3]',
      value: 'text-[#f5f5f5]'
    }
  }[normalizedVariant] || {
    border: 'border-[#ffffff10] hover:border-[#ffffff20]',
    activeBorder: 'border-white',
    bg: 'bg-[#ffffff08] text-[#a3a3a3]',
    value: 'text-[#f5f5f5]'
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-sm bg-[#0f0f0f] border transition-all duration-200 ${
        active ? `${colorMap.activeBorder} ring-1 ring-white/10` : colorMap.border
      } ${onClick ? 'cursor-pointer hover:-translate-y-0.5 shadow-sm hover:shadow-md' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888] truncate">
          {displayLabel}
        </span>
        <div className={`p-2 rounded-sm ${colorMap.bg} shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${colorMap.value}`}>
          {value}
        </span>
        {displaySubValue && (
          <span className="text-xs font-mono text-[#737373]">
            {displaySubValue}
          </span>
        )}
      </div>

      {(context || trend) && (
        <div className="mt-2.5 pt-2 border-t border-[#ffffff08] flex items-center justify-between gap-2 text-[11px] text-[#737373] flex-wrap">
          {context && <span className="truncate">{context}</span>}
          {trend && (
            <span
              className={`font-semibold font-mono ${
                trend.direction === 'up'
                  ? 'text-emerald-400'
                  : trend.direction === 'down'
                  ? 'text-rose-400'
                  : 'text-[#a3a3a3]'
              }`}
            >
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '•'} {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
