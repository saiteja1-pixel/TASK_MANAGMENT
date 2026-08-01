'use client';

import React from 'react';
import { HeatmapDay } from '@/lib/analytics';

interface HeatmapProps {
  days: HeatmapDay[];
}

export function Heatmap({ days }: HeatmapProps) {
  // Saturated, distinct purple intensity color scale with defined borders
  const getCellColorClass = (count: number) => {
    if (count === 0) {
      return 'bg-[#D1D5DB] dark:bg-slate-700/60 border border-[#9CA3AF]/60 dark:border-slate-600/70';
    }
    if (count === 1) {
      return 'bg-[#DDD6FE] dark:bg-[#A78BFA]/40 border border-[#C4B5FD] dark:border-[#A78BFA]/60 text-purple-950 dark:text-purple-100';
    }
    if (count === 2) {
      return 'bg-[#C4B5FD] dark:bg-[#8B5CF6]/70 border border-[#A78BFA] dark:border-[#8B5CF6] text-purple-950 dark:text-white';
    }
    if (count === 3) {
      return 'bg-[#8B5CF6] border border-[#7C3AED] text-white shadow-xs';
    }
    return 'bg-[#5B21B6] dark:bg-[#6D28D9] border border-[#4C1D95] text-white shadow-xs';
  };

  return (
    <div className="bg-[var(--bg-base)] neu-raised p-5 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--text-main)]">
            Task Completion Activity
          </h2>
          <p className="text-xs text-[var(--text-main)] opacity-70 font-medium">
            Contribution heatmap over the last 90 days
          </p>
        </div>

        {/* Heatmap Legend matching exact 5-tier color scale */}
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)] opacity-85">
          <span>Less</span>
          <div className="flex gap-1.5 items-center">
            <span
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md bg-[#D1D5DB] dark:bg-slate-700/60 border border-[#9CA3AF]/60 dark:border-slate-600/70 inline-block"
              title="0 tasks completed"
            />
            <span
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md bg-[#DDD6FE] dark:bg-[#A78BFA]/40 border border-[#C4B5FD] dark:border-[#A78BFA]/60 inline-block"
              title="1 task completed"
            />
            <span
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md bg-[#C4B5FD] dark:bg-[#8B5CF6]/70 border border-[#A78BFA] dark:border-[#8B5CF6] inline-block"
              title="2 tasks completed"
            />
            <span
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md bg-[#8B5CF6] border border-[#7C3AED] inline-block"
              title="3 tasks completed"
            />
            <span
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md bg-[#5B21B6] dark:bg-[#6D28D9] border border-[#4C1D95] inline-block"
              title="4+ tasks completed"
            />
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
              className={`group relative w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md transition-all duration-150 hover:scale-110 hover:z-20 ${getCellColorClass(
                day.count
              )}`}
            >
              {/* Tooltip on hover */}
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:block z-30 px-3 py-1.5 rounded-xl bg-[var(--bg-base)] neu-raised-lg text-[var(--text-main)] text-[11px] font-bold whitespace-nowrap animate-fade-in shadow-lg">
                <span>
                  {day.count} {day.count === 1 ? 'task' : 'tasks'} completed on {day.formattedDate}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
