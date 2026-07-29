'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Task } from '@/lib/types/database';
import {
  calculateAnalyticsStats,
  get14DaysActivity,
  getCategoryBreakdown,
  getPriorityDistribution,
  get90DaysHeatmap,
} from '@/lib/analytics';
import { Heatmap } from '@/components/analytics/Heatmap';
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts';
import {
  BarChart3,
  CheckCircle2,
  ListTodo,
  Flame,
  Percent,
  RefreshCw,
  AlertCircle,
  Sparkles,
  PieChart,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks from Supabase
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      setTasks((data as Task[]) || []);
    } catch (err: any) {
      console.error('Error loading analytics tasks:', err);
      setError(err?.message || 'Failed to load task analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Derived Analytics Data
  const stats = useMemo(() => calculateAnalyticsStats(tasks), [tasks]);
  const trendData = useMemo(() => get14DaysActivity(tasks), [tasks]);
  const categoryData = useMemo(() => getCategoryBreakdown(tasks), [tasks]);
  const priorityData = useMemo(() => getPriorityDistribution(tasks), [tasks]);
  const heatmapDays = useMemo(() => get90DaysHeatmap(tasks), [tasks]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Productivity Analytics
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time trends, completion velocity, category breakdowns, and streak history.
          </p>
        </div>

        <button
          onClick={fetchTasks}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && tasks.length === 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-3xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 rounded-3xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse" />
            <div className="h-72 rounded-3xl bg-slate-200/60 dark:bg-slate-800/50 animate-pulse" />
          </div>
        </div>
      ) : tasks.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-6 text-center max-w-md mx-auto bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto mb-4">
            <PieChart className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            No Task Data Available Yet
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            Start creating and completing tasks on your dashboard to unlock productivity insights, completion rate trends, and streak heatmaps!
          </p>
        </div>
      ) : (
        <>
          {/* SECTION 1: TOP STATS ROW (4 CARDS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Created */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Total Created
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {stats.totalCreated}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">tasks</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ListTodo className="w-5 h-5" />
              </div>
            </div>

            {/* Total Completed */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Total Completed
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {stats.totalCompleted}
                  </span>
                  <span className="text-xs text-emerald-600/80 font-medium">resolved</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Completion Rate */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Completion Rate
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    {stats.completionRate}%
                  </span>
                  <span className="text-xs text-indigo-500 font-medium">efficiency</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
            </div>

            {/* Current Streak */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Daily Streak
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-500">
                    {stats.currentStreak}
                  </span>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                    {stats.currentStreak === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                <Flame className="w-5 h-5 animate-bounce" />
              </div>
            </div>
          </div>

          {/* SECTIONS 2, 3, 4, 5: CHARTS GRID */}
          <AnalyticsCharts
            trendData={trendData}
            categoryData={categoryData}
            priorityData={priorityData}
          />

          {/* SECTION 6: 90-DAY CONTRIBUTION HEATMAP */}
          <Heatmap days={heatmapDays} />
        </>
      )}
    </div>
  );
}
