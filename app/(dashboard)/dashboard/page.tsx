'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Task,
  TaskStatus,
  TaskCreateInput,
  TaskUpdateInput,
  DashboardStats,
  TaskCompletion,
  TaskDailyNote,
  UserSettings,
  UserProfile,
} from '@/lib/types/database';
import { getLocalUserProfile } from '@/lib/avatars';
import { getLocalCompletions, saveLocalCompletion, removeLocalCompletion } from '@/lib/localCompletions';
import { getLocalDailyNotes, saveLocalDailyNote, removeLocalDailyNote } from '@/lib/localDailyNotes';
import { QuickAddBar } from '@/components/dashboard/QuickAddBar';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { TaskList } from '@/components/dashboard/TaskList';
import { KanbanBoard } from '@/components/dashboard/KanbanBoard';
import { EditTaskModal } from '@/components/dashboard/EditTaskModal';
import { ReasonModal } from '@/components/dashboard/ReasonModal';
import { MissedTasksBanner } from '@/components/dashboard/MissedTasksBanner';
import { MissedTasksModal } from '@/components/dashboard/MissedTasksModal';
import { isOverdue } from '@/lib/utils';
import { RefreshCw, AlertCircle, List, Kanban } from 'lucide-react';

type ViewMode = 'list' | 'kanban';

// Helper to get local date string YYYY-MM-DD
const getTodayDateStr = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper to get yesterday's date string YYYY-MM-DD
const getYesterdayDateStr = (): string => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper for formatting arbitrary date to YYYY-MM-DD
const formatDateStr = (year: number, month: number, day: number): string => {
  const y = year.toString();
  const m = (month + 1).toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper to calculate consecutive day streak ending today or yesterday
const calculateStreak = (completions: TaskCompletion[]): number => {
  const datesSet = new Set(completions.map((c) => c.completed_date));
  if (datesSet.size === 0) return 0;

  const now = new Date();
  let checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let streak = 0;
  let dateStr = formatDateStr(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());

  if (!datesSet.has(dateStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
    dateStr = formatDateStr(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
    if (!datesSet.has(dateStr)) {
      return 0;
    }
  }

  while (datesSet.has(dateStr)) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
    dateStr = formatDateStr(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
  }

  return streak;
};

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [dailyNotes, setDailyNotes] = useState<TaskDailyNote[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Edit Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Reason Modal State
  const [reasonTask, setReasonTask] = useState<Task | null>(null);
  const [reasonMode, setReasonMode] = useState<'note' | 'skip'>('note');
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);

  // Missed Tasks Reminder State
  const [dismissedMissedBanner, setDismissedMissedBanner] = useState(false);
  const [isMissedModalOpen, setIsMissedModalOpen] = useState(false);

  // Dates
  const todayStr = useMemo(() => getTodayDateStr(), []);
  const yesterdayStr = useMemo(() => getYesterdayDateStr(), []);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load persistent view mode from localStorage and user profile
  useEffect(() => {
    const savedView = localStorage.getItem('taskflow_dashboard_view') as ViewMode | null;
    if (savedView === 'list' || savedView === 'kanban') {
      setViewMode(savedView);
    }

    const localProfile = getLocalUserProfile();
    if (localProfile) setUserProfile(localProfile);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle()
          .then(({ data: profileData }) => {
            if (profileData) setUserProfile(profileData as UserProfile);
          });
      }
    });

    const handleProfileUpdated = () => {
      const updated = getLocalUserProfile();
      if (updated) setUserProfile(updated);
    };

    window.addEventListener('taskflow_profile_updated', handleProfileUpdated);
    return () => window.removeEventListener('taskflow_profile_updated', handleProfileUpdated);
  }, []);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('taskflow_dashboard_view', mode);
  };

  // Fetch tasks, completions, daily notes, and user settings
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Logged-out preview mode: Skip Supabase data queries
        setIsAuthenticated(false);
        setTasks([]);
        setCompletions([]);
        setDailyNotes([]);
        setUserSettings(null);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Fetch active tasks for logged-in user
      const { data: tasksData, error: tasksErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('[Dashboard Diagnostics] Logged in User ID:', user.id);

      // Read local storage completions for current user only
      const rawLocalRaw = typeof window !== 'undefined' ? localStorage.getItem('taskflow_local_completions') : null;
      const localComps = getLocalCompletions(user.id);
      console.log('[Dashboard Diagnostics] Raw localStorage taskflow_local_completions:', rawLocalRaw);
      console.log('[Dashboard Diagnostics] Filtered localComps for current user:', localComps);

      // Fetch completions from Supabase scoped to user_id
      const { data: completionsData, error: completionsErr } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', user.id);

      console.log('[Dashboard Diagnostics] Supabase completionsData:', completionsData, 'Error:', completionsErr);

      let combinedCompletions = [...localComps];

      if (!completionsErr && completionsData) {
        const map = new Map<string, TaskCompletion>();
        localComps.forEach((c) => map.set(`${c.task_id}_${c.completed_date}`, c));
        (completionsData as TaskCompletion[]).forEach((c) =>
          map.set(`${c.task_id}_${c.completed_date}`, c)
        );
        combinedCompletions = Array.from(map.values());
      }

      console.log('[Dashboard Diagnostics] Final combinedCompletions:', combinedCompletions);

      // Read local storage daily notes for current user only
      const localNotes = getLocalDailyNotes(user.id);

      // Fetch task daily notes from Supabase scoped to user_id
      const { data: notesData, error: notesErr } = await supabase
        .from('task_daily_notes')
        .select('*')
        .eq('user_id', user.id);

      let combinedNotes = [...localNotes];

      if (!notesErr && notesData) {
        const map = new Map<string, TaskDailyNote>();
        localNotes.forEach((n) => map.set(`${n.task_id}_${n.note_date}`, n));
        (notesData as TaskDailyNote[]).forEach((n) =>
          map.set(`${n.task_id}_${n.note_date}`, n)
        );
        combinedNotes = Array.from(map.values());
      }

      // Fetch user settings (.maybeSingle to prevent 406 error if row doesn't exist yet)
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsData) {
        setUserSettings(settingsData as UserSettings);
      }

      setTasks((tasksData as Task[]) || []);
      setCompletions(combinedCompletions);
      setDailyNotes(combinedNotes);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err?.message || 'Failed to load tasks from Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set of task IDs completed TODAY
  const completedTaskIdsToday = useMemo(() => {
    const set = new Set<string>();
    completions.forEach((c) => {
      if (c.completed_date === todayStr) {
        set.add(c.task_id);
      }
    });
    return set;
  }, [completions, todayStr]);

  // Daily notes map for TODAY: taskId -> TaskDailyNote
  const dailyNotesMapToday = useMemo(() => {
    const map = new Map<string, TaskDailyNote>();
    dailyNotes.forEach((n) => {
      if (n.note_date === todayStr) {
        map.set(n.task_id, n);
      }
    });
    return map;
  }, [dailyNotes, todayStr]);

  // Filter tasks that were missed yesterday (created <= yesterday, not completed yesterday, no daily note for yesterday)
  const yesterdayMissedTasks = useMemo(() => {
    if (!isAuthenticated) return [];
    if (userSettings && userSettings.notify_overdue === false) return [];

    const completedYesterdaySet = new Set<string>();
    completions.forEach((c) => {
      if (c.completed_date === yesterdayStr) {
        completedYesterdaySet.add(c.task_id);
      }
    });

    const notesYesterdaySet = new Set<string>();
    dailyNotes.forEach((n) => {
      if (n.note_date === yesterdayStr) {
        notesYesterdaySet.add(n.task_id);
      }
    });

    return tasks.filter((t) => {
      if (t.is_active === false) return false;
      if (t.due_date && t.due_date > yesterdayStr) return false;

      const createdDateStr = t.created_at ? t.created_at.split('T')[0] : null;
      if (createdDateStr && createdDateStr > yesterdayStr) {
        return false;
      }

      const isCompletedYesterday = completedYesterdaySet.has(t.id);
      const hasNoteYesterday = notesYesterdaySet.has(t.id);

      return !isCompletedYesterday && !hasNoteYesterday;
    });
  }, [isAuthenticated, tasks, completions, dailyNotes, yesterdayStr, userSettings]);

  // Compute Dashboard Stats
  const stats: DashboardStats = useMemo(() => {
    if (!isAuthenticated) {
      return { completedToday: 0, pending: 0, overdue: 0, streak: 0 };
    }

    const completedToday = completions.filter((c) => c.completed_date === todayStr).length;

    // Filter active tasks visible on today's dashboard (no due_date OR due_date <= todayStr)
    const visibleActiveTasks = tasks.filter((t) => {
      if (t.is_active === false) return false;
      if (t.due_date && t.due_date > todayStr) return false;
      return true;
    });

    const pending = visibleActiveTasks.filter((t) => !completedTaskIdsToday.has(t.id)).length;
    const streak = calculateStreak(completions);

    let overdue = 0;
    visibleActiveTasks.forEach((t) => {
      if (!completedTaskIdsToday.has(t.id) && isOverdue(t.due_date, 'todo')) {
        overdue++;
      }
    });

    return { completedToday, pending, overdue, streak };
  }, [isAuthenticated, tasks, completions, todayStr, completedTaskIdsToday]);

  // Add Task Handler - Redirects to /login if unauthenticated
  const handleAddTask = async (taskInput: TaskCreateInput): Promise<boolean> => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/dashboard');
      return true;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login?redirect=/dashboard');
        return true;
      }

      const newTaskData = {
        user_id: user.id,
        title: taskInput.title,
        description: taskInput.description || null,
        status: taskInput.status || 'todo',
        priority: taskInput.priority || 'medium',
        category: taskInput.category || null,
        due_date: taskInput.due_date || null,
        is_active: true,
      };

      let taskToSet: Task | null = null;

      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert([newTaskData])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '42703' || insertError.message?.includes('is_active')) {
          const { is_active, ...dataWithoutIsActive } = newTaskData;
          const { data: retryData, error: retryError } = await supabase
            .from('tasks')
            .insert([dataWithoutIsActive])
            .select()
            .single();

          if (!retryError && retryData) {
            taskToSet = retryData as Task;
          }
        }
      } else if (data) {
        taskToSet = data as Task;
      }

      // Fallback: Always ensure task is added optimistically if DB error or schema mismatch
      if (!taskToSet) {
        taskToSet = {
          id: 'task-local-' + Date.now(),
          user_id: user.id,
          title: taskInput.title,
          description: taskInput.description || null,
          status: taskInput.status || 'todo',
          priority: taskInput.priority || 'medium',
          category: taskInput.category || null,
          due_date: taskInput.due_date || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Task;
      }

      setTasks((prev) => [taskToSet!, ...prev]);
      setError(null);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Unexpected error creating task.');
      return false;
    }
  };

  // Toggle Task Completion for TODAY
  const handleToggleComplete = async (task: Task) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    const isCompleted = completedTaskIdsToday.has(task.id);

    if (isCompleted) {
      const updatedLocal = removeLocalCompletion(task.id, todayStr);
      setCompletions(updatedLocal);

      try {
        const supabase = createClient();
        await supabase
          .from('task_completions')
          .delete()
          .eq('task_id', task.id)
          .eq('completed_date', todayStr);
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
        completed_date: todayStr,
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
            .single();

          if (!error && data) {
            saveLocalCompletion(data as TaskCompletion);
          }
        } catch (err) {
          // Fallback
        }
      }
    }
  };

  // Status update handler for Kanban
  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (newStatus === 'done') {
      if (!completedTaskIdsToday.has(taskId)) {
        await handleToggleComplete(task);
      }
    } else {
      if (completedTaskIdsToday.has(taskId)) {
        await handleToggleComplete(task);
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      try {
        const supabase = createClient();
        await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
      } catch (err) {
        console.error('Error updating task status:', err);
      }
    }
  };

  // Reason modal openers & handlers for TODAY
  const handleOpenReasonModal = (task: Task, mode: 'note' | 'skip') => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/dashboard');
      return;
    }
    setReasonTask(task);
    setReasonMode(mode);
    setIsReasonModalOpen(true);
  };

  const handleSaveReason = async (taskId: string, reason: string, isSkipped: boolean) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || 'local-user';

    const newNote: TaskDailyNote = {
      id: 'tdn-' + Date.now(),
      task_id: taskId,
      user_id: userId,
      note_date: todayStr,
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
          .single();

        if (!error && data) {
          saveLocalDailyNote(data as TaskDailyNote);
        }
      } catch (err) {
        console.warn('Daily note Supabase sync notice:', err);
      }
    }
  };

  // Handler for bulk saving yesterday's missed task reasons
  const handleSaveMissedReasons = async (reasonsMap: Map<string, string>) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id || 'local-user';
    const notesToSave: TaskDailyNote[] = [];

    reasonsMap.forEach((reason, taskId) => {
      const newNote: TaskDailyNote = {
        id: 'tdn-' + Date.now() + '-' + taskId.slice(0, 4),
        task_id: taskId,
        user_id: userId,
        note_date: yesterdayStr,
        reason,
        is_skipped: true,
        created_at: new Date().toISOString(),
      };
      notesToSave.push(newNote);
    });

    if (notesToSave.length === 0) return;

    let updatedList = [...dailyNotes];
    notesToSave.forEach((n) => {
      updatedList = saveLocalDailyNote(n);
    });
    setDailyNotes(updatedList);

    if (user) {
      try {
        await supabase
          .from('task_daily_notes')
          .upsert(notesToSave, { onConflict: 'task_id,note_date' });
      } catch (err) {
        console.warn('Missed notes Supabase sync notice:', err);
      }
    }
  };

  const handleRemoveReason = async (taskId: string) => {
    const updatedLocal = removeLocalDailyNote(taskId, todayStr);
    setDailyNotes(updatedLocal);

    try {
      const supabase = createClient();
      await supabase
        .from('task_daily_notes')
        .delete()
        .eq('task_id', taskId)
        .eq('note_date', todayStr);
    } catch (err) {
      console.warn('Remove daily note Supabase notice:', err);
    }
  };

  // Open Edit Modal
  const handleEditClick = (task: Task) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/dashboard');
      return;
    }
    setEditingTask(task);
    setIsModalOpen(true);
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

  // Delete Task Handler
  const handleDeleteTask = async (taskId: string) => {
    try {
      const previousTasks = [...tasks];
      const previousCompletions = [...completions];
      const previousNotes = [...dailyNotes];

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setCompletions((prev) => prev.filter((c) => c.task_id !== taskId));
      setDailyNotes((prev) => prev.filter((n) => n.task_id !== taskId));
      removeLocalCompletion(taskId, todayStr);
      removeLocalDailyNote(taskId, todayStr);

      const supabase = createClient();
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);

      if (error) {
        setTasks(previousTasks);
        setCompletions(previousCompletions);
        setDailyNotes(previousNotes);
        throw error;
      }
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err?.message || 'Failed to delete task.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--shadow-dark)]/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--text-main)] opacity-70 font-medium mt-1">
            {userProfile?.display_name ? `Welcome back, ${userProfile.display_name}! ` : ''}These tasks stay on your list until you complete, edit, or delete them.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl neu-inset-sm">
            <button
              onClick={() => handleViewChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition neu-focus ${viewMode === 'list'
                  ? 'neu-raised text-[#7C3AED] dark:text-[#8B5CF6]'
                  : 'text-[var(--text-main)] opacity-70 hover:opacity-100'
                }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => handleViewChange('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition neu-focus ${viewMode === 'kanban'
                  ? 'neu-raised text-[#7C3AED] dark:text-[#8B5CF6]'
                  : 'text-[var(--text-main)] opacity-70 hover:opacity-100'
                }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold neu-button neu-focus text-[var(--text-main)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Missed Tasks Warning Banner (if yesterday has uncompleted, unexplained tasks) */}
      {!dismissedMissedBanner && yesterdayMissedTasks.length > 0 && (
        <MissedTasksBanner
          missedTasks={yesterdayMissedTasks}
          onOpenModal={() => setIsMissedModalOpen(true)}
          onDismiss={() => setDismissedMissedBanner(true)}
        />
      )}

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl neu-inset-sm text-red-600 dark:text-red-400 text-sm flex items-center justify-between gap-3 font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* Quick Add Bar */}
      <QuickAddBar onAddTask={handleAddTask} />

      {/* Content Area: List View vs Kanban View */}
      {loading ? (
        <div className="py-16 text-center text-[var(--text-main)] opacity-70">
          <div className="w-8 h-8 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-bold">Loading dashboard preview...</p>
        </div>
      ) : viewMode === 'list' ? (
        <TaskList
          tasks={tasks}
          completedTaskIdsToday={completedTaskIdsToday}
          dailyNotesMap={dailyNotesMapToday}
          isAuthenticated={isAuthenticated}
          onToggleComplete={handleToggleComplete}
          onOpenReasonModal={handleOpenReasonModal}
          onEdit={handleEditClick}
          onDelete={handleDeleteTask}
        />
      ) : (
        <KanbanBoard
          tasks={tasks}
          completedTaskIdsToday={completedTaskIdsToday}
          dailyNotesMap={dailyNotesMapToday}
          onToggleComplete={handleToggleComplete}
          onOpenReasonModal={handleOpenReasonModal}
          onUpdateStatus={handleUpdateTaskStatus}
          onEdit={handleEditClick}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Edit Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />

      {/* Reason / Skip Modal for Today */}
      <ReasonModal
        task={reasonTask}
        mode={reasonMode}
        isOpen={isReasonModalOpen}
        existingReason={reasonTask ? dailyNotesMapToday.get(reasonTask.id)?.reason || '' : ''}
        isSkipped={reasonTask ? Boolean(dailyNotesMapToday.get(reasonTask.id)?.is_skipped) : false}
        onClose={() => {
          setIsReasonModalOpen(false);
          setReasonTask(null);
        }}
        onSave={handleSaveReason}
        onRemove={handleRemoveReason}
      />

      {/* Missed Tasks Modal for Yesterday */}
      <MissedTasksModal
        missedTasks={yesterdayMissedTasks}
        yesterdayDateStr={yesterdayStr}
        isOpen={isMissedModalOpen}
        onClose={() => setIsMissedModalOpen(false)}
        onSaveReasons={handleSaveMissedReasons}
      />
    </div>
  );
}
