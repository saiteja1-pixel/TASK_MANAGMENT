'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Task, TaskCompletion } from '@/lib/types/database';
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
  PieChart,
  LogIn,
} from 'lucide-react';

import { getLocalCompletions } from '@/lib/localCompletions';

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks and task completions from Supabase & local storage
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setTasks([]);
        setCompletions([]);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      const { data: tasksData, error: tasksErr } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (tasksErr) throw tasksErr;

      const localComps = getLocalCompletions();

      const { data: completionsData, error: completionsErr } = await supabase
        .from('task_completions')
        .select('*');

      let combinedCompletions = [...localComps];

      if (!completionsErr && completionsData) {
        const map = new Map<string, TaskCompletion>();
        localComps.forEach((c) => map.set(`${c.task_id}_${c.completed_date}`, c));
        (completionsData as TaskCompletion[]).forEach((c) =>
          map.set(`${c.task_id}_${c.completed_date}`, c)
        );
        combinedCompletions = Array.from(map.values());
      }

      setTasks((tasksData as Task[]) || []);
      setCompletions(combinedCompletions);
    } catch (err: any) {
      console.error('Error loading analytics tasks:', err);
      setError(err?.message || 'Failed to load task analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived Analytics Data
  const stats = useMemo(() => calculateAnalyticsStats(tasks, completions), [tasks, completions]);
  const trendData = useMemo(() => get14DaysActivity(tasks, completions), [tasks, completions]);
  const categoryData = useMemo(() => getCategoryBreakdown(tasks), [tasks]);
  const priorityData = useMemo(() => getPriorityDistribution(tasks), [tasks]);
  const heatmapDays = useMemo(() => get90DaysHeatmap(tasks, completions), [tasks, completions]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--shadow-dark)]/20">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl neu-inset-sm text-[#7C3AED] dark:text-[#8B5CF6]">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
              Productivity Analytics
            </h1>
          </div>
          <p className="text-sm text-[var(--text-main)] opacity-70 font-medium mt-1">
            Real-time trends, completion velocity, category breakdowns, and streak history.
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold neu-button neu-focus text-[var(--text-main)] self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl neu-inset-sm text-red-600 dark:text-red-400 text-sm flex items-center justify-between gap-3 font-semibold">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-3xl bg-[var(--bg-base)] neu-inset animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 rounded-3xl bg-[var(--bg-base)] neu-inset animate-pulse" />
            <div className="h-72 rounded-3xl bg-[var(--bg-base)] neu-inset animate-pulse" />
          </div>
        </div>
      ) : tasks.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-6 text-center max-w-md mx-auto bg-[var(--bg-base)] neu-raised rounded-3xl space-y-4">
          <div className="w-14 h-14 rounded-2xl neu-inset-sm text-[#7C3AED] dark:text-[#8B5CF6] flex items-center justify-center mx-auto">
            <PieChart className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-extrabold text-[var(--text-main)]">
            No Task Data Available Yet
          </h2>

          {!isAuthenticated ? (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-main)] opacity-70 leading-relaxed font-medium">
                Sign in to see your productivity analytics
              </p>
              <div className="pt-2">
                <Link
                  href="/login?redirect=/analytics"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold neu-button-primary neu-focus text-white"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-main)] opacity-70 leading-relaxed font-medium">
              Start creating and completing tasks on your dashboard to unlock productivity insights, completion rate trends, and streak heatmaps!
            </p>
          )}
        </div>
      ) : (
        <>
          {/* SECTION 1: TOP STATS ROW (4 CARDS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Created */}
            <div className="p-6 rounded-3xl bg-[var(--bg-base)] neu-raised flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70">
                  Total Created
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[var(--text-main)]">
                    {stats.totalCreated}
                  </span>
                  <span className="text-xs text-[var(--text-main)] opacity-60 font-semibold">tasks</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl neu-inset-sm text-[#7C3AED] dark:text-[#8B5CF6] flex items-center justify-center">
                <ListTodo className="w-6 h-6" />
              </div>
            </div>

            {/* Total Completed */}
            <div className="p-6 rounded-3xl bg-[var(--bg-base)] neu-raised flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70">
                  Total Completed
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {stats.totalCompleted}
                  </span>
                  <span className="text-xs text-emerald-600/80 font-semibold">resolved</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl neu-inset-sm text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* Completion Rate */}
            <div className="p-6 rounded-3xl bg-[var(--bg-base)] neu-raised flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70">
                  Completion Rate
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#7C3AED] dark:text-[#8B5CF6]">
                    {stats.completionRate}%
                  </span>
                  <span className="text-xs text-[#7C3AED] font-semibold">efficiency</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl neu-inset-sm text-[#7C3AED] dark:text-[#8B5CF6] flex items-center justify-center">
                <Percent className="w-6 h-6" />
              </div>
            </div>

            {/* Current Streak */}
            <div className="p-6 rounded-3xl bg-[var(--bg-base)] neu-raised flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70">
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
              <div className="w-12 h-12 rounded-2xl neu-inset-sm text-amber-500 flex items-center justify-center">
                <Flame className="w-6 h-6 animate-bounce" />
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
