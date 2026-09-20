import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export interface ActionButton {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  title?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: ActionButton;
  secondaryActions?: ActionButton[];
  badge?: string;
  badgeVariant?: 'emerald' | 'amber' | 'violet' | 'blue' | 'slate';
  badgeColor?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  subtitle,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  badge,
  badgeVariant = 'violet',
  badgeColor,
  children
}) => {
  const displayDescription = description || subtitle;

  const defaultBadgeClasses = {
    emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    violet: 'bg-[#7c3aed]/15 border-[#7c3aed]/30 text-[#c4b5fd]',
    blue: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
    slate: 'bg-slate-500/15 border-slate-500/30 text-slate-400'
  }[badgeVariant];

  const badgeClasses = badgeColor || defaultBadgeClasses;

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-[#ffffff10]">
      <div className="space-y-1">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#737373] mb-1">
            {breadcrumbs.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-[#525252]" />}
                {item.onClick && !item.active ? (
                  <button
                    onClick={item.onClick}
                    className="hover:text-[#e5e5e5] transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className={item.active ? 'text-[#e5e5e5] font-semibold' : ''}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title & Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f5f5f5]">
            {title}
          </h1>
          {badge && (
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${badgeClasses}`}>
              {badge}
            </span>
          )}
        </div>

        {/* Contextual Description */}
        {displayDescription && (
          <p className="text-xs sm:text-sm text-[#a3a3a3] max-w-2xl leading-relaxed">
            {displayDescription}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {secondaryActions?.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={action.onClick}
              disabled={action.disabled}
              title={action.title}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-sm border border-[#ffffff15] bg-[#ffffff03] hover:bg-[#ffffff08] text-[#d4d4d4] hover:text-white text-xs font-semibold tracking-wide transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-98"
            >
              {Icon && <Icon className="w-4 h-4 text-[#a3a3a3]" />}
              <span>{action.label}</span>
            </button>
          );
        })}

        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            title={primaryAction.title}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-98 ${
              primaryAction.variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
            }`}
          >
            {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
            <span>{primaryAction.label}</span>
          </button>
        )}

        {children}
      </div>
    </div>
  );
};
