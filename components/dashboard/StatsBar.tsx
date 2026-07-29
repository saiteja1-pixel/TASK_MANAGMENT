'use client';

import React from 'react';
import { DashboardStats } from '@/lib/types/database';
import { CheckCircle2, Clock, AlertTriangle, Sparkles, TrendingUp, Calendar } from 'lucide-react';

interface StatsBarProps {
  stats: DashboardStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {/* Pending Tasks Card */}
      <div className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800/80 transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Pending Tasks</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {stats.pending}
              </span>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                Active
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Completed Today Card */}
      <div className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800/80 transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Completed Today</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {stats.completedToday}
              </span>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Done
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Overdue Tasks Card */}
      <div
        className={`group relative p-5 rounded-2xl border shadow-xs transition-all duration-200 ${
          stats.overdue > 0
            ? 'bg-gradient-to-br from-red-50/80 to-white dark:from-red-950/30 dark:to-slate-900 border-red-200/90 dark:border-red-800/80 hover:shadow-md'
            : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 hover:shadow-md'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>Overdue Tasks</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-extrabold tracking-tight ${
                  stats.overdue > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {stats.overdue}
              </span>
              {stats.overdue > 0 && (
                <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/80 px-2 py-0.5 rounded-md animate-pulse">
                  Urgent
                </span>
              )}
            </div>
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-xs ${
              stats.overdue > 0
                ? 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
