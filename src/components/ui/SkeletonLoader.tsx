import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 6
}) => {
  return (
    <div className="w-full bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden animate-pulse">
      {/* Table Header */}
      <div className="h-10 bg-[#141414] border-b border-[#ffffff08] flex items-center px-4 gap-4">
        {Array.from({ length: cols }).map((_, idx) => (
          <div
            key={idx}
            className="h-3 bg-[#ffffff10] rounded-xs"
            style={{ width: `${Math.max(60, 100 - idx * 10)}px` }}
          />
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#ffffff05]">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="h-14 flex items-center px-4 gap-4">
            {/* Avatar skeleton */}
            <div className="w-8 h-8 rounded-full bg-[#ffffff08] shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 bg-[#ffffff10] rounded-xs w-1/3" />
              <div className="h-2.5 bg-[#ffffff05] rounded-xs w-1/4" />
            </div>
            {Array.from({ length: cols - 2 }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-3 bg-[#ffffff08] rounded-xs hidden sm:block"
                style={{ width: `${Math.max(40, 80 - cIdx * 12)}px` }}
              />
            ))}
            <div className="h-6 w-16 bg-[#ffffff08] rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const MetricSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-5 rounded-sm bg-[#0f0f0f] border border-[#ffffff10] space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3 w-24 bg-[#ffffff10] rounded-xs" />
            <div className="w-8 h-8 rounded-sm bg-[#ffffff08]" />
          </div>
          <div className="h-7 w-32 bg-[#ffffff15] rounded-xs" />
          <div className="h-3 w-20 bg-[#ffffff08] rounded-xs pt-1" />
        </div>
      ))}
    </div>
  );
};

export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-4 rounded-sm bg-[#0f0f0f] border border-[#ffffff10] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ffffff08]" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 bg-[#ffffff10] rounded-xs w-3/4" />
              <div className="h-2.5 bg-[#ffffff05] rounded-xs w-1/2" />
            </div>
          </div>
          <div className="h-10 bg-[#ffffff05] rounded-xs" />
          <div className="flex justify-between items-center pt-2">
            <div className="h-3 w-16 bg-[#ffffff08] rounded-xs" />
            <div className="h-5 w-14 bg-[#ffffff08] rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};
