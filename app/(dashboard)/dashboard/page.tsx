'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Task, TaskCreateInput, TaskUpdateInput, DashboardStats } from '@/lib/types/database';
import { QuickAddBar } from '@/components/dashboard/QuickAddBar';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { TaskList } from '@/components/dashboard/TaskList';
import { EditTaskModal } from '@/components/dashboard/EditTaskModal';
import { getTodayString, isOverdue } from '@/lib/utils';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch tasks from Supabase
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTasks((data as Task[]) || []);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err?.message || 'Failed to load tasks from Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Compute Dashboard Stats
  const stats: DashboardStats = useMemo(() => {
    const today = getTodayString();

    let completedToday = 0;
    let pending = 0;
    let overdue = 0;

    tasks.forEach((t) => {
      if (t.status === 'done') {
        if (t.completed_at) {
          const completedDate = new Date(t.completed_at).toISOString().split('T')[0];
          if (completedDate === today) {
            completedToday++;
          }
        }
      } else {
        pending++;
        if (isOverdue(t.due_date, t.status)) {
          overdue++;
        }
      }
    });

    return { completedToday, pending, overdue };
  }, [tasks]);

  // Add Task Handler
  const handleAddTask = async (taskInput: TaskCreateInput): Promise<boolean> => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('User not authenticated.');
        return false;
      }

      const newTaskData = {
        user_id: user.id,
        title: taskInput.title,
        description: taskInput.description || null,
        status: taskInput.status || 'todo',
        priority: taskInput.priority || 'medium',
        category: taskInput.category || null,
        due_date: taskInput.due_date || null,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTaskData])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTasks((prev) => [data as Task, ...prev]);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err?.message || 'Error creating task.');
      return false;
    }
  };

  // Toggle Task Completion Handler
  const handleToggleComplete = async (task: Task) => {
    try {
      const isDone = task.status === 'done';
      const newStatus = isDone ? 'todo' : 'done';
      const newCompletedAt = isDone ? null : new Date().toISOString();

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: newStatus, completed_at: newCompletedAt }
            : t
        )
      );

      const supabase = createClient();
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: newCompletedAt,
        })
        .eq('id', task.id);

      if (error) {
        // Rollback on error
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? task : t))
        );
        throw error;
      }
    } catch (err: any) {
      console.error('Error toggling task status:', err);
      setError(err?.message || 'Failed to update task status.');
    }
  };

  // Open Edit Modal
  const handleEditClick = (task: Task) => {
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
        .single();

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
      // Optimistic update
      const previousTasks = [...tasks];
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      const supabase = createClient();
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);

      if (error) {
        setTasks(previousTasks);
        throw error;
      }
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err?.message || 'Failed to delete task.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Your tasks persist daily until marked complete. Keep focused!
          </p>
        </div>

        <button
          onClick={fetchTasks}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Error Notice if any */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* Quick Add Bar */}
      <QuickAddBar onAddTask={handleAddTask} />

      {/* Tasks List */}
      {loading && tasks.length === 0 ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium">Loading your tasks...</p>
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
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
    </div>
  );
}
