import React from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export interface FilterChip {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  activeFilterChips?: FilterChip[];
  onClearAllFilters?: () => void;
  onToggleFilterDrawer?: () => void;
  filterDrawerOpen?: boolean;
  activeFiltersCount?: number;
  totalResultsCount?: number;
  filteredResultsCount?: number;
  resultLabel?: string;
  sortOptions?: { label: string; value: string }[];
  currentSort?: string;
  onSortChange?: (value: string) => void;
  children?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  activeFilterChips = [],
  onClearAllFilters,
  onToggleFilterDrawer,
  filterDrawerOpen,
  activeFiltersCount = 0,
  totalResultsCount,
  filteredResultsCount,
  resultLabel = 'records',
  sortOptions,
  currentSort,
  onSortChange,
  children
}) => {
  return (
    <div className="space-y-2.5">
      {/* Search Input and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2.5 bg-[#0f0f0f] border border-[#ffffff15] focus:border-[#7c3aed] rounded-sm text-xs text-[#f5f5f5] placeholder-[#737373] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white p-0.5 rounded-sm"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Tools: Filter button, Sort, Children */}
        <div className="flex items-center gap-2 flex-wrap">
          {onToggleFilterDrawer && (
            <button
              onClick={onToggleFilterDrawer}
              className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-sm border text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                filterDrawerOpen || activeFiltersCount > 0
                  ? 'bg-[#7c3aed]/15 border-[#7c3aed]/40 text-[#c4b5fd]'
                  : 'bg-[#0f0f0f] border-[#ffffff15] text-[#d4d4d4] hover:bg-[#ffffff05]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#7c3aed] text-white text-[10px] font-mono flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}

          {sortOptions && sortOptions.length > 0 && onSortChange && (
            <div className="relative inline-flex items-center">
              <select
                value={currentSort}
                onChange={(e) => onSortChange(e.target.value)}
                className="bg-[#0f0f0f] border border-[#ffffff15] text-[#d4d4d4] text-xs font-medium py-2.5 pl-3 pr-8 rounded-sm focus:outline-none focus:border-[#7c3aed] appearance-none cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Sort: {opt.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown className="w-3 h-3 text-[#737373] absolute right-2.5 pointer-events-none" />
            </div>
          )}

          {children}
        </div>
      </div>

      {/* Active Filter Chips & Results Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilterChips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#ffffff08] border border-[#ffffff15] text-[#e5e5e5] text-[11px] font-medium"
            >
              <span className="text-[#888888]">{chip.label}:</span>
              <span className="font-semibold text-[#f5f5f5]">{chip.value}</span>
              <button
                onClick={chip.onRemove}
                className="text-[#737373] hover:text-white p-0.5 ml-0.5"
                title={`Remove ${chip.label} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {activeFilterChips.length > 0 && onClearAllFilters && (
            <button
              onClick={onClearAllFilters}
              className="text-[11px] text-[#737373] hover:text-rose-400 underline decoration-dotted ml-1 transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Results Counter */}
        {filteredResultsCount !== undefined && totalResultsCount !== undefined && (
          <div className="text-[11px] font-mono text-[#737373]">
            Showing <span className="text-[#e5e5e5] font-semibold">{filteredResultsCount}</span> of{' '}
            <span className="text-[#a3a3a3]">{totalResultsCount}</span> {resultLabel}
          </div>
        )}
      </div>
    </div>
  );
};
