import React from 'react';

export type StatusType = 
  | 'active' 
  | 'inactive' 
  | 'archived' 
  | 'paid' 
  | 'partial' 
  | 'pending' 
  | 'unpaid' 
  | 'overdue' 
  | 'refunded' 
  | 'cancelled';

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md'
}) => {
  const norm = (status || '').toLowerCase().trim();

  let config = {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
    display: label || status
  };

  switch (norm) {
    case 'active':
    case 'paid':
      config = {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        dot: 'bg-emerald-400',
        display: label || (norm === 'active' ? 'Active' : 'Paid')
      };
      break;

    case 'partial':
    case 'partially paid':
      config = {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        dot: 'bg-amber-400',
        display: label || 'Partial'
      };
      break;

    case 'overdue':
      config = {
        bg: 'bg-rose-500/15',
        border: 'border-rose-500/30',
        text: 'text-rose-400',
        dot: 'bg-rose-400',
        display: label || 'Overdue'
      };
      break;

    case 'pending':
    case 'unpaid':
      config = {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        dot: 'bg-blue-400',
        display: label || (norm === 'pending' ? 'Pending' : 'Unpaid')
      };
      break;

    case 'inactive':
      config = {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-400/90',
        dot: 'bg-amber-400/80',
        display: label || 'Inactive'
      };
      break;

    case 'archived':
      config = {
        bg: 'bg-[#ffffff08]',
        border: 'border-[#ffffff15]',
        text: 'text-[#888888]',
        dot: 'bg-[#737373]',
        display: label || 'Archived'
      };
      break;

    case 'refunded':
      config = {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        dot: 'bg-purple-400',
        display: label || 'Refunded'
      };
      break;

    case 'cancelled':
      config = {
        bg: 'bg-rose-950/40',
        border: 'border-rose-900/30',
        text: 'text-rose-400',
        dot: 'bg-rose-500',
        display: label || 'Cancelled'
      };
      break;
  }

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[10px]' 
    : 'px-2.5 py-1 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium border ${config.bg} ${config.border} ${config.text} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className="capitalize">{config.display}</span>
    </span>
  );
};
