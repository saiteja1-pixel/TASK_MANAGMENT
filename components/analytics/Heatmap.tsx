'use client';

import React from 'react';
import { HeatmapDay } from '@/lib/analytics';

interface HeatmapProps {
  days: HeatmapDay[];
}

export function Heatmap({ days }: HeatmapProps) {
  // Color scale for completed count
  const getCellColorClass = (count: number) => {
    if (count === 0) {
      return 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800';
    }
    if (count === 1) {
      return 'bg-indigo-300 dark:bg-indigo-900 border border-indigo-400/40 dark:border-indigo-800';
    }
    if (count === 2) {
      return 'bg-indigo-500 dark:bg-indigo-700 border border-indigo-600/40 dark:border-indigo-600';
    }
    if (count === 3) {
      return 'bg-indigo-600 dark:bg-indigo-500 border border-indigo-700/40 dark:border-indigo-400';
    }
    return 'bg-violet-700 dark:bg-violet-400 border border-violet-800/40 dark:border-violet-300';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-slate-900/90 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Task Completion Activity
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            GitHub-style contribution heatmap over the last 90 days
          </p>
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Less</span>
          <div className="flex gap-1">
            <span className="w-3 h-3 rounded-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800 inline-block" />
            <span className="w-3 h-3 rounded-xs bg-indigo-300 dark:bg-indigo-900 inline-block" />
            <span className="w-3 h-3 rounded-xs bg-indigo-500 dark:bg-indigo-700 inline-block" />
            <span className="w-3 h-3 rounded-xs bg-indigo-600 dark:bg-indigo-500 inline-block" />
            <span className="w-3 h-3 rounded-xs bg-violet-700 dark:bg-violet-400 inline-block" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Grid container */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-max">
          {days.map((day) => (
            <div
              key={day.dateStr}
              className={`group relative w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-xs transition-all duration-150 hover:ring-2 hover:ring-indigo-500 ${getCellColorClass(
                day.count
              )}`}
            >
              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-semibold whitespace-nowrap shadow-lg animate-fade-in">
                <span>
                  {day.count} {day.count === 1 ? 'task' : 'tasks'} completed on {day.formattedDate}
                </span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
