'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Task, TaskUpdateInput, TaskCompletion, TaskDailyNote } from '@/lib/types/database';
import { EditTaskModal } from '@/components/dashboard/EditTaskModal';
import { ReasonModal } from '@/components/dashboard/ReasonModal';
import { getPriorityColor } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  X,
  Check,
  Edit2,
  Clock,
  CheckCircle2,
  Tag,
  MessageSquareText,
  FastForward,
} from 'lucide-react';
import { getLocalCompletions, saveLocalCompletion, removeLocalCompletion } from '@/lib/localCompletions';
import { getLocalDailyNotes, saveLocalDailyNote, removeLocalDailyNote } from '@/lib/localDailyNotes';

// Helper to format year, month (0-indexed), day into YYYY-MM-DD string
const formatDateStr = (year: number, month: number, day: number): string => {
  const y = year.toString();
  const m = (month + 1).toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper to convert ISO timestamp to local YYYY-MM-DD date string
const toLocalDateString = (isoString?: string | null): string | null => {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper for formatted display date e.g. "August 1, 2026"
const formatDisplayDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('default', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper to compute age in days relative to the clicked date
const getTaskAgeText = (createdAtIso: string, clickedDateStr: string): string => {
  const createdDateStr = toLocalDateString(createdAtIso);
  if (!createdDateStr) return 'Created today';

  const [cy, cm, cd] = clickedDateStr.split('-').map(Number);
  const [ry, rm, rd] = createdDateStr.split('-').map(Number);

  const clickedTime = new Date(cy, cm - 1, cd).getTime();
  const createdTime = new Date(ry, rm - 1, rd).getTime();

  const diffDays = Math.max(0, Math.floor((clickedTime - createdTime) / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return 'Created today';
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} old`;
};

export default function CalendarPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [dailyNotes, setDailyNotes] = useState<TaskDailyNote[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Month navigation state
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Day detail modal state
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lock body scroll on mobile & desktop when Day Summary modal is open
  useEffect(() => {
    if (selectedDateStr) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedDateStr]);

  // Edit task modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Reason modal state
  const [reasonTask, setReasonTask] = useState<Task | null>(null);
  const [reasonMode, setReasonMode] = useState<'note' | 'skip'>('note');
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);

  // Fetch tasks, completions, and daily notes
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
        setDailyNotes([]);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      const { data: tasksData, error: tasksErr } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

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

      // Read local daily notes as base
      const localNotes = getLocalDailyNotes();

      const { data: notesData, error: notesErr } = await supabase
        .from('task_daily_notes')
        .select('*');

      let combinedNotes = [...localNotes];

      if (!notesErr && notesData) {
        const map = new Map<string, TaskDailyNote>();
        localNotes.forEach((n) => map.set(`${n.task_id}_${n.note_date}`, n));
        (notesData as TaskDailyNote[]).forEach((n) =>
          map.set(`${n.task_id}_${n.note_date}`, n)
        );
        combinedNotes = Array.from(map.values());
      }

      setTasks((tasksData as Task[]) || []);
      setCompletions(combinedCompletions);
      setDailyNotes(combinedNotes);
    } catch (err: any) {
      console.error('Error fetching tasks for calendar:', err);
      setError(err?.message || 'Failed to load calendar data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Current year & month helpers
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const now = new Date();
    const todayStr = formatDateStr(now.getFullYear(), now.getMonth(), now.getDate());

    const days = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dateNum = prevMonthLastDay - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dateNum);
      const dateStr = formatDateStr(
        prevDate.getFullYear(),
        prevDate.getMonth(),
        prevDate.getDate()
      );
      days.push({
        dateStr,
        dayNumber: dateNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateStr(currentYear, currentMonth, d);
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding days to fill grid
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let j = 1; j <= remainingCells; j++) {
      const nextDate = new Date(currentYear, currentMonth + 1, j);
      const dateStr = formatDateStr(
        nextDate.getFullYear(),
        nextDate.getMonth(),
        nextDate.getDate()
      );
      days.push({
        dateStr,
        dayNumber: j,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Map of completed task IDs grouped by date
  const completionsByDate = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    completions.forEach((c) => {
      if (!map[c.completed_date]) {
        map[c.completed_date] = new Set();
      }
      map[c.completed_date].add(c.task_id);
    });
    return map;
  }, [completions]);

  // Map of all completion date strings per task_id
  const completionDatesByTaskId = useMemo(() => {
    const map = new Map<string, Set<string>>();
    completions.forEach((c) => {
      if (!map.has(c.task_id)) {
        map.set(c.task_id, new Set());
      }
      map.get(c.task_id)!.add(c.completed_date);
    });
    tasks.forEach((t) => {
      if (t.status === 'done' && t.completed_at) {
        const dStr = toLocalDateString(t.completed_at);
        if (dStr) {
          if (!map.has(t.id)) {
            map.set(t.id, new Set());
          }
          map.get(t.id)!.add(dStr);
        }
      }
    });
    return map;
  }, [completions, tasks]);

  // Map of daily notes key: `${note_date}_${task_id}` -> TaskDailyNote
  const dailyNotesMap = useMemo(() => {
    const map = new Map<string, TaskDailyNote>();
    dailyNotes.forEach((n) => {
      map.set(`${n.note_date}_${n.task_id}`, n);
    });
    return map;
  }, [dailyNotes]);

  // Daily Snapshot calculation using task_completions table and due_date logic
  const getSnapshotForDate = useCallback(
    (targetDateStr: string) => {
      const completedTaskIds = completionsByDate[targetDateStr] || new Set();
      const completedOnDate: Task[] = [];
      const pendingAsOfDate: Task[] = [];

      tasks.forEach((t) => {
        if (t.is_active === false) return;

        // 1) If task was completed on THIS exact date
        const isCompletedOnThisDate = completedTaskIds.has(t.id);
        if (isCompletedOnThisDate) {
          completedOnDate.push(t);
          return;
        }

        // 2) Check if task was completed on any date prior to targetDateStr
        const compDates = completionDatesByTaskId.get(t.id);
        if (compDates) {
          let completedPrior = false;
          for (const dStr of compDates) {
            if (dStr < targetDateStr) {
              completedPrior = true;
              break;
            }
          }
          if (completedPrior) return;
        }

        // 3) Pending classification for targetDateStr
        const createdDateStr = toLocalDateString(t.created_at);

        if (t.due_date) {
          // Tasks WITH a due_date: ONLY show on the calendar day matching its due_date
          if (t.due_date === targetDateStr) {
            pendingAsOfDate.push(t);
          }
        } else {
          // Tasks WITHOUT a due_date: Show on every day from creation date onward until completed
          if (createdDateStr && createdDateStr <= targetDateStr) {
            pendingAsOfDate.push(t);
          }
        }
      });

      return { completedOnDate, pendingAsOfDate };
    },
    [tasks, completionsByDate, completionDatesByTaskId]
  );

  // Modal daily snapshot data
  const selectedSnapshot = useMemo(() => {
    if (!selectedDateStr) return { completedOnDate: [], pendingAsOfDate: [] };
    return getSnapshotForDate(selectedDateStr);
  }, [selectedDateStr, getSnapshotForDate]);

  // Mobile Agenda items for active month
  const mobileMonthDays = useMemo(() => {
    const monthPrefix = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;
    return calendarDays
      .filter((d) => d.dateStr.startsWith(monthPrefix))
      .map((d) => ({
        ...d,
        snapshot: getSnapshotForDate(d.dateStr),
      }))
      .filter(
        (d) => d.snapshot.completedOnDate.length > 0 || d.snapshot.pendingAsOfDate.length > 0
      );
  }, [calendarDays, currentYear, currentMonth, getSnapshotForDate]);

  // Real system date YYYY-MM-DD
  const realTodayStr = useMemo(() => {
    const now = new Date();
    return formatDateStr(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const isSelectedDateToday = selectedDateStr === realTodayStr;
  const isSelectedDatePast = selectedDateStr ? selectedDateStr < realTodayStr : false;
  const isSelectedDateFuture = selectedDateStr ? selectedDateStr > realTodayStr : false;

  // Toggle Task Completion
  const handleToggleComplete = async (task: Task) => {
    if (!selectedDateStr) return;

    const isCompleted = (completionsByDate[selectedDateStr] || new Set()).has(task.id);

    if (isCompleted) {
      const updatedLocal = removeLocalCompletion(task.id, selectedDateStr);
      setCompletions(updatedLocal);

      try {
        const supabase = createClient();
        await supabase
          .from('task_completions')
          .delete()
          .eq('task_id', task.id)
          .eq('completed_date', selectedDateStr);
      } catch (err) {
        // Fallback
      }
    } else {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userId = user?.id || 'local-user';

      const newCompletion: TaskCompletion = {
        id: 'tc-' + Date.now(),
        task_id: task.id,
        user_id: userId,
        completed_date: selectedDateStr,
        completed_at: new Date().toISOString(),
      };

      const updatedLocal = saveLocalCompletion(newCompletion);
      setCompletions(updatedLocal);

      if (user) {
        try {
          const { data, error } = await supabase
            .from('task_completions')
            .upsert([newCompletion], { onConflict: 'task_id,completed_date' })
            .select()
            .maybeSingle();

          if (!error && data) {
            saveLocalCompletion(data as TaskCompletion);
          }
        } catch (err) {
          // Fallback
        }
      }
    }
  };

  // Reason modal handling in Calendar for today's date
  const handleSaveReason = async (taskId: string, reason: string, isSkipped: boolean) => {
    if (!selectedDateStr) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || 'local-user';

    const newNote: TaskDailyNote = {
      id: 'tdn-' + Date.now(),
      task_id: taskId,
      user_id: userId,
      note_date: selectedDateStr,
      reason,
      is_skipped: isSkipped,
      created_at: new Date().toISOString(),
    };

    const updatedLocal = saveLocalDailyNote(newNote);
    setDailyNotes(updatedLocal);

    if (user) {
      try {
        const { data, error } = await supabase
          .from('task_daily_notes')
          .upsert([newNote], { onConflict: 'task_id,note_date' })
          .select()
          .maybeSingle();

        if (!error && data) {
          saveLocalDailyNote(data as TaskDailyNote);
        }
      } catch (err) {
        console.warn('Daily note Supabase sync notice:', err);
      }
    }
  };

  const handleRemoveReason = async (taskId: string) => {
    if (!selectedDateStr) return;

    const updatedLocal = removeLocalDailyNote(taskId, selectedDateStr);
    setDailyNotes(updatedLocal);

    try {
      const supabase = createClient();
      await supabase
        .from('task_daily_notes')
        .delete()
        .eq('task_id', taskId)
        .eq('note_date', selectedDateStr);
    } catch (err) {
      console.warn('Remove daily note Supabase notice:', err);
    }
  };

  // Save Task Edits Handler
  const handleSaveTask = async (taskId: string, updateData: TaskUpdateInput): Promise<boolean> => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? (data as Task) : t))
        );
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err?.message || 'Failed to update task.');
      return false;
    }
  };

  const handleDayClick = (dateStr: string) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/calendar');
      return;
    }
    setSelectedDateStr(dateStr);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--shadow-dark)]/20">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl neu-inset-sm text-[#7C3AED] dark:text-[#8B5CF6]">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
              Calendar View
            </h1>
          </div>
          <p className="text-sm text-[var(--text-main)] opacity-70 font-medium mt-1">
            Daily snapshot of task completions, historical activity, and daily notes.
          </p>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold neu-button neu-focus text-[var(--text-main)]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
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

      {/* Month Navigation Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[var(--bg-base)] neu-raised p-5 rounded-3xl">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-main)]">
            {monthName} {currentYear}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-4 py-2 rounded-2xl neu-button neu-focus text-xs font-bold text-[#7C3AED] dark:text-[#8B5CF6]"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-2xl neu-button neu-focus text-[var(--text-main)]"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-2xl neu-button neu-focus text-[var(--text-main)]"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP CALENDAR MONTH GRID */}
      <div className="hidden md:block bg-[var(--bg-base)] neu-raised rounded-3xl p-6">
        {/* Day Name Header Row */}
        <div className="grid grid-cols-7 gap-3 mb-3 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-2 text-xs font-extrabold uppercase tracking-wider text-[var(--text-main)] opacity-70">
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-3">
          {calendarDays.map((dayCell, idx) => {
            const { completedOnDate, pendingAsOfDate } = getSnapshotForDate(dayCell.dateStr);
            const hasCompleted = completedOnDate.length > 0;
            const hasPending = pendingAsOfDate.length > 0;
            const hasOverdue = pendingAsOfDate.some(
              (t) => t.due_date && t.due_date < realTodayStr
            );

            return (
              <div
                key={`${dayCell.dateStr}-${idx}`}
                onClick={() => handleDayClick(dayCell.dateStr)}
                className={`min-h-[110px] p-2.5 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                  dayCell.isToday
                    ? 'neu-inset border-2 border-[#7C3AED] dark:border-[#8B5CF6]'
                    : hasOverdue
                    ? 'neu-raised hover:neu-raised-lg border-2 border-red-500/40 bg-red-500/5'
                    : dayCell.isCurrentMonth
                    ? 'neu-raised hover:neu-raised-lg'
                    : 'neu-inset-sm opacity-40'
                }`}
              >
                {/* Cell Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-extrabold ${
                      dayCell.isToday
                        ? 'text-[#7C3AED] dark:text-[#8B5CF6] text-sm'
                        : 'text-[var(--text-main)]'
                    }`}
                  >
                    {dayCell.dayNumber}
                  </span>

                  {/* GREEN DOT INDICATOR if any task was completed on this date */}
                  {hasCompleted && (
                    <span
                      className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"
                      title={`${completedOnDate.length} completed on this day`}
                    />
                  )}
                </div>

                {/* Cell Summary Tags */}
                <div className="space-y-1.5 my-1 flex-1 flex flex-col justify-center">
                  {hasCompleted && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 neu-inset-sm">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{completedOnDate.length} done</span>
                    </div>
                  )}

                  {hasPending && (
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold neu-inset-sm ${
                        hasOverdue
                          ? 'text-red-600 dark:text-red-400 bg-red-500/10 font-extrabold border-l-2 border-red-500'
                          : 'text-[var(--text-main)] opacity-80'
                      }`}
                    >
                      {hasOverdue ? (
                        <AlertCircle className="w-3 h-3 text-red-500 shrink-0 animate-pulse" />
                      ) : (
                        <Clock className="w-3 h-3 text-[#7C3AED] dark:text-[#8B5CF6] shrink-0" />
                      )}
                      <span className="truncate">{pendingAsOfDate.length} pending</span>
                    </div>
                  )}

                  {!hasCompleted && !hasPending && (
                    <span className="text-[10px] font-medium text-[var(--text-main)] opacity-30 text-center block">
                      —
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MOBILE AGENDA VIEW */}
      <div className="md:hidden space-y-4">
        <h3 className="text-base font-extrabold text-[var(--text-main)] px-1">
          {monthName} Daily Snapshots
        </h3>

        {mobileMonthDays.length === 0 ? (
          <div className="text-center py-12 p-5 rounded-3xl bg-[var(--bg-base)] neu-raised">
            <CalendarIcon className="w-8 h-8 text-[#7C3AED] dark:text-[#8B5CF6] mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-[var(--text-main)]">No task activity this month</p>
          </div>
        ) : (
          mobileMonthDays.map((dayItem) => {
            const { completedOnDate, pendingAsOfDate } = dayItem.snapshot;
            const hasOverdue = pendingAsOfDate.some(
              (t) => t.due_date && t.due_date < realTodayStr
            );

            return (
              <div
                key={dayItem.dateStr}
                onClick={() => handleDayClick(dayItem.dateStr)}
                className={`p-4 rounded-2xl bg-[var(--bg-base)] transition-all duration-150 cursor-pointer space-y-2 min-h-[52px] neu-focus ${
                  dayItem.isToday
                    ? 'neu-inset border-2 border-[#7C3AED] dark:border-[#8B5CF6]'
                    : hasOverdue
                    ? 'neu-raised border-2 border-red-500/40 bg-red-500/5'
                    : 'neu-raised hover:neu-raised-lg active:neu-inset'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-extrabold ${dayItem.isToday ? 'text-[#7C3AED] dark:text-[#8B5CF6]' : 'text-[var(--text-main)]'}`}>
                      {formatDisplayDate(dayItem.dateStr)}
                    </span>
                    {dayItem.isToday && (
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-[#7C3AED] text-white">
                        TODAY
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    {completedOnDate.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 neu-inset-sm">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {completedOnDate.length} done
                      </span>
                    )}
                    {pendingAsOfDate.length > 0 && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold neu-inset-sm ${
                          hasOverdue
                            ? 'text-red-600 dark:text-red-400 bg-red-500/10 font-extrabold'
                            : 'text-[var(--text-main)] opacity-80'
                        }`}
                      >
                        {hasOverdue ? (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        ) : (
                          <Clock className="w-3 h-3 text-[#7C3AED] dark:text-[#8B5CF6]" />
                        )}
                        {pendingAsOfDate.length} pending
                      </span>
                    )}
                    {completedOnDate.length === 0 && pendingAsOfDate.length === 0 && (
                      <span className="text-[10px] font-medium text-[var(--text-main)] opacity-40">
                        No tasks
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DAY DETAILS MODAL (Daily Snapshot) */}
      {selectedDateStr && isMounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full sm:max-w-lg bg-[var(--bg-base)] neu-raised-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[var(--shadow-dark)]/20 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--text-main)]">
                  {formatDisplayDate(selectedDateStr)} — Daily Summary
                </h3>
                <p className="text-xs font-semibold text-[var(--text-main)] opacity-70 mt-0.5">
                  {selectedSnapshot.completedOnDate.length} completed,{' '}
                  {selectedSnapshot.pendingAsOfDate.length} still pending
                </p>

                {isSelectedDatePast && (
                  <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                    Historical view (read-only)
                  </p>
                )}
                {isSelectedDateFuture && (
                  <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                    Preview — tasks currently pending would appear here if not completed by then
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedDateStr(null)}
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl neu-button neu-focus text-[var(--text-main)]"
                title="Close summary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {selectedSnapshot.completedOnDate.length === 0 &&
                selectedSnapshot.pendingAsOfDate.length === 0 ? (
                <div className="text-center py-10 neu-inset-sm rounded-2xl p-4">
                  <CalendarIcon className="w-8 h-8 text-[var(--text-main)] opacity-40 mx-auto mb-2" />
                  <p className="text-sm font-bold text-[var(--text-main)] opacity-75">
                    No task activity yet on this day
                  </p>
                </div>
              ) : (
                <>
                  {/* SECTION 1: Completed on [date] */}
                  {selectedSnapshot.completedOnDate.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Completed on {formatDisplayDate(selectedDateStr)}</span>
                        <span className="px-2 py-0.5 rounded-lg neu-inset-sm text-[10px]">
                          {selectedSnapshot.completedOnDate.length}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {selectedSnapshot.completedOnDate.map((t) => {
                          const priorityColors = getPriorityColor(t.priority);
                          return (
                            <div
                              key={t.id}
                              className="p-3.5 rounded-2xl bg-[var(--bg-base)] neu-raised flex items-start justify-between gap-3 border-l-4 border-emerald-500"
                            >
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => isSelectedDateToday && handleToggleComplete(t)}
                                  disabled={!isSelectedDateToday}
                                  className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center shrink-0 neu-focus ${isSelectedDateToday
                                      ? 'bg-emerald-500 text-white neu-raised-sm cursor-pointer'
                                      : 'bg-emerald-500/60 text-white/80 cursor-not-allowed opacity-60'
                                    }`}
                                  title={isSelectedDateToday ? 'Toggle completion status' : 'Historical view (read-only)'}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>

                                <div className="min-w-0 flex-1">
                                  <h4 className="text-sm font-extrabold text-[var(--text-main)] line-through opacity-70">
                                    {t.title}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${priorityColors.badge}`}>
                                      {t.priority}
                                    </span>
                                    {t.category && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold neu-inset-sm text-[var(--text-main)]">
                                        <Tag className="w-3 h-3 text-[#7C3AED] dark:text-[#8B5CF6]" />
                                        {t.category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: Still Pending (as of [date]) */}
                  {selectedSnapshot.pendingAsOfDate.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[var(--text-main)] opacity-90 font-extrabold text-xs uppercase tracking-wider">
                        <Clock className="w-4 h-4 text-[#7C3AED] dark:text-[#8B5CF6]" />
                        <span>Still Pending (as of {formatDisplayDate(selectedDateStr)})</span>
                        <span className="px-2 py-0.5 rounded-lg neu-inset-sm text-[10px]">
                          {selectedSnapshot.pendingAsOfDate.length}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {selectedSnapshot.pendingAsOfDate.map((t) => {
                          const priorityColors = getPriorityColor(t.priority);
                          const ageText = getTaskAgeText(t.created_at, selectedDateStr);
                          const note = dailyNotesMap.get(`${selectedDateStr}_${t.id}`);
                          const hasReason = Boolean(note?.reason && note.reason.trim() !== '');
                          const isTaskOverdue = Boolean(t.due_date && t.due_date < realTodayStr);

                          return (
                            <div
                              key={t.id}
                              className={`p-3.5 rounded-2xl bg-[var(--bg-base)] neu-raised flex items-start justify-between gap-3 ${
                                isTaskOverdue ? 'border-l-4 border-red-500' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => isSelectedDateToday && handleToggleComplete(t)}
                                  disabled={!isSelectedDateToday}
                                  className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center shrink-0 neu-focus ${isSelectedDateToday
                                      ? 'neu-inset-sm text-transparent hover:text-emerald-500 cursor-pointer'
                                      : 'neu-inset-sm text-transparent cursor-not-allowed opacity-40'
                                    }`}
                                  title={
                                    isSelectedDateToday
                                      ? 'Mark as completed'
                                      : 'Read-only (editing disabled for non-today dates)'
                                  }
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4
                                      className={`text-sm font-extrabold ${note?.is_skipped
                                          ? 'line-through text-amber-700 dark:text-amber-300 opacity-80'
                                          : 'text-[var(--text-main)]'
                                        }`}
                                    >
                                      {t.title}
                                    </h4>

                                    {isTaskOverdue && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[10px] font-extrabold bg-red-600 text-white neu-raised-sm">
                                        <AlertCircle className="w-3 h-3 animate-pulse" /> Overdue
                                      </span>
                                    )}

                                    {note?.is_skipped && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 neu-inset-sm">
                                        <FastForward className="w-2.5 h-2.5" /> Skipped
                                      </span>
                                    )}
                                  </div>

                                  {/* Reason text display under the task for this date */}
                                  {hasReason && (
                                    <p className="text-xs italic text-[#7C3AED] dark:text-[#8B5CF6] mt-1 font-medium bg-[#7C3AED]/5 dark:bg-[#8B5CF6]/10 p-2 rounded-xl border-l-2 border-[#7C3AED] dark:border-[#8B5CF6]">
                                      Reason: "{note?.reason}"
                                    </p>
                                  )}

                                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${priorityColors.badge}`}>
                                      {t.priority}
                                    </span>
                                    {t.category && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold neu-inset-sm text-[var(--text-main)]">
                                        <Tag className="w-3 h-3 text-[#7C3AED] dark:text-[#8B5CF6]" />
                                        {t.category}
                                      </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-extrabold neu-inset-sm text-[var(--text-main)] opacity-75">
                                      <Clock className="w-2.5 h-2.5 text-[var(--text-main)] opacity-50" />
                                      {ageText}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {!isSelectedDateFuture && (
                                  <button
                                    onClick={() => {
                                      setReasonTask(t);
                                      setReasonMode('note');
                                      setIsReasonModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-xl neu-button neu-focus text-[var(--text-main)] hover:text-[#7C3AED]"
                                    title={`Add/edit reason for ${selectedDateStr}`}
                                  >
                                    <MessageSquareText className="w-3.5 h-3.5 fill-current text-[#7C3AED] dark:text-[#8B5CF6]" />
                                  </button>
                                )}
                                {isSelectedDateToday && (
                                  <button
                                    onClick={() => {
                                      setEditingTask(t);
                                      setIsEditModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-xl neu-button neu-focus text-[var(--text-main)] hover:text-[#7C3AED]"
                                    title="Edit task"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--shadow-dark)]/20 flex justify-end shrink-0 bg-[var(--bg-base)]">
              <button
                onClick={() => setSelectedDateStr(null)}
                className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-2xl neu-button neu-focus text-xs font-extrabold text-[var(--text-main)]"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT TASK MODAL REUSE */}
      <EditTaskModal
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />

      {/* REASON MODAL REUSE */}
      <ReasonModal
        task={reasonTask}
        mode={reasonMode}
        isOpen={isReasonModalOpen}
        existingReason={
          reasonTask && selectedDateStr
            ? dailyNotesMap.get(`${selectedDateStr}_${reasonTask.id}`)?.reason || ''
            : ''
        }
        isSkipped={
          reasonTask && selectedDateStr
            ? Boolean(dailyNotesMap.get(`${selectedDateStr}_${reasonTask.id}`)?.is_skipped)
            : false
        }
        onClose={() => {
          setIsReasonModalOpen(false);
          setReasonTask(null);
        }}
        onSave={handleSaveReason}
        onRemove={handleRemoveReason}
      />
    </div>
  );
}
