'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Task, TaskPriority, TaskDailyNote } from '@/lib/types/database';
import { TaskItem } from './TaskItem';
import { isOverdue, getTodayString, toLocalDateString } from '@/lib/utils';
import { Search, AlertTriangle, CheckSquare2, CalendarDays, LogIn } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  completedTaskIdsToday?: Set<string>;
  dailyNotesMap?: Map<string, TaskDailyNote>;
  isAuthenticated?: boolean;
  onToggleComplete: (task: Task) => Promise<void>;
  onOpenReasonModal?: (task: Task, mode: 'note' | 'skip') => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskList({
  tasks,
  completedTaskIdsToday = new Set(),
  dailyNotesMap = new Map(),
  isAuthenticated = false,
  onToggleComplete,
  onOpenReasonModal,
  onEdit,
  onDelete,
}: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Extract unique categories from tasks
  const categories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((task) => {
      if (task.category && task.category.trim() !== '') {
        set.add(task.category);
      }
    });
    return Array.from(set);
  }, [tasks]);

  // Priority weight sorting order
  const priorityWeight: Record<TaskPriority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  // Filter active tasks: is_active !== false AND (no due_date OR due_date === todayStr)
  const activeTasks = useMemo(() => {
    const todayStr = getTodayString();
    return tasks.filter((task) => {
      if (task.is_active === false) return false;
      if (task.due_date) {
        const taskDueDate = toLocalDateString(task.due_date);
        if (taskDueDate !== todayStr) return false;
      }
      return true;
    });
  }, [tasks]);

  // Apply search, category, and priority filters
  const filteredTasks = useMemo(() => {
    return activeTasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (task.category && task.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' || task.category === selectedCategory;

      const matchesPriority =
        selectedPriority === 'all' || task.priority === selectedPriority;

      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [activeTasks, searchTerm, selectedCategory, selectedPriority]);

  // Partition overdue vs non-overdue, then sort by priority high first, then due_date
  const { overdueTasks, regularTasks } = useMemo(() => {
    const overdue: Task[] = [];
    const regular: Task[] = [];

    filteredTasks.forEach((task) => {
      if (isOverdue(task.due_date, task.status)) {
        overdue.push(task);
      } else {
        regular.push(task);
      }
    });

    const sortFn = (a: Task, b: Task) => {
      const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (pDiff !== 0) return pDiff;

      if (a.due_date && b.due_date) {
        return a.due_date.localeCompare(b.due_date);
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    };

    overdue.sort(sortFn);
    regular.sort(sortFn);

    return { overdueTasks: overdue, regularTasks: regular };
  }, [filteredTasks]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--bg-base)] neu-raised p-4 rounded-2xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-main)] opacity-50 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks by title, description, category..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-main)]/50 focus:outline-none neu-focus font-semibold"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {/* Category Filter */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 min-h-[44px] text-xs font-bold rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] focus:outline-none neu-focus"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 min-h-[44px] text-xs font-bold rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] focus:outline-none neu-focus"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* OVERDUE SECTION (if any exist) */}
      {overdueTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Overdue Tasks ({overdueTasks.length})
            </h2>
          </div>
          <div className="space-y-4">
            {overdueTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isCompletedToday={completedTaskIdsToday ? completedTaskIdsToday.has(task.id) : task.status === 'done'}
                dailyNote={dailyNotesMap ? dailyNotesMap.get(task.id) : null}
                onToggleComplete={onToggleComplete}
                onOpenReasonModal={onOpenReasonModal}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* REGULAR / TODAY'S TASKS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-[var(--text-main)]">
            <CalendarDays className="w-5 h-5 text-[#7C3AED] dark:text-[#8B5CF6]" />
            <h2 className="text-base font-bold tracking-tight">
              My Active Tasks ({regularTasks.length})
            </h2>
          </div>
          <span className="text-xs text-[var(--text-main)] opacity-70 font-semibold">
            Sorted by priority & due date
          </span>
        </div>

        {regularTasks.length === 0 && overdueTasks.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-[var(--bg-base)] neu-raised space-y-3">
            <div className="w-12 h-12 rounded-2xl neu-inset-sm text-[#7C3AED] dark:text-[#8B5CF6] flex items-center justify-center mx-auto">
              <CheckSquare2 className="w-6 h-6" />
            </div>

            {!isAuthenticated ? (
              <div className="space-y-3">
                <h3 className="text-lg font-extrabold text-[var(--text-main)]">
                  Sign in to start tracking your tasks
                </h3>
                <p className="text-xs text-[var(--text-main)] opacity-70 max-w-sm mx-auto font-medium">
                  Welcome to TaskFlow! Sign in to create, organize, and track your daily task history seamlessly across all devices.
                </p>
                <div className="pt-2">
                  <Link
                    href="/login?redirect=/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold neu-button-primary neu-focus text-white"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to TaskFlow</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-main)] mb-1">
                  {searchTerm || selectedCategory !== 'all' || selectedPriority !== 'all'
                    ? 'No matching tasks found'
                    : 'All caught up! 🎉'}
                </h3>
                <p className="text-xs text-[var(--text-main)] opacity-70 max-w-sm mx-auto font-medium">
                  {searchTerm || selectedCategory !== 'all' || selectedPriority !== 'all'
                    ? 'Try clearing your search filters to see all active tasks.'
                    : 'No pending tasks on your dashboard. Use the quick-add bar above to add a new task.'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {regularTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isCompletedToday={completedTaskIdsToday ? completedTaskIdsToday.has(task.id) : task.status === 'done'}
                dailyNote={dailyNotesMap ? dailyNotesMap.get(task.id) : null}
                onToggleComplete={onToggleComplete}
                onOpenReasonModal={onOpenReasonModal}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
