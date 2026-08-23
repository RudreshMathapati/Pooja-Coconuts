import React from 'react';

export const StatCardSkeleton = () => (
  <div className="p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-xl" />
    </div>
    <div className="h-7 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="w-full animate-pulse space-y-3">
    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-full" />
    {Array.from({ length: rows }).map((_, rIdx) => (
      <div key={rIdx} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-full flex items-center px-4 gap-4">
        {Array.from({ length: cols }).map((_, cIdx) => (
          <div key={cIdx} className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
        ))}
      </div>
    ))}
  </div>
);
