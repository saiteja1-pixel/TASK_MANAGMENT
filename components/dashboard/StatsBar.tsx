'use client';

import React from 'react';
import { DashboardStats } from '@/lib/types/database';
import { CheckCircle2, Clock, AlertTriangle, Sparkles } from 'lucide-react';

interface StatsBarProps {
  stats: DashboardStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      {/* Pending Tasks Card */}
      <div className="group relative p-6 rounded-2xl bg-[var(--bg-base)] neu-raised transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70">
              <Clock className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#8B5CF6]" />
              <span>Pending Tasks</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
                {stats.pending}
              </span>
              <span className="text-xs font-bold text-[#7C3AED] dark:text-[#8B5CF6] neu-inset-sm px-2.5 py-1 rounded-xl">
                Active
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl neu-inset-sm text-[#7C3AED] dark:text-[#8B5CF6] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Completed Today Card */}
      <div className="group relative p-6 rounded-2xl bg-[var(--bg-base)] neu-raised transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Completed Today</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {stats.completedToday}
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 neu-inset-sm px-2.5 py-1 rounded-xl flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Done
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl neu-inset-sm text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Overdue Tasks Card */}
      <div className="group relative p-6 rounded-2xl bg-[var(--bg-base)] neu-raised transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>Overdue Tasks</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-extrabold tracking-tight ${
                  stats.overdue > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-[var(--text-main)]'
                }`}
              >
                {stats.overdue}
              </span>
              {stats.overdue > 0 && (
                <span className="text-xs font-bold text-red-600 dark:text-red-400 neu-inset-sm px-2.5 py-1 rounded-xl animate-pulse">
                  Urgent
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl neu-inset-sm text-red-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
