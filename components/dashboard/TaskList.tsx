'use client';

import React, { useState, useMemo } from 'react';
import { Task, TaskPriority } from '@/lib/types/database';
import { TaskItem } from './TaskItem';
import { isOverdue } from '@/lib/utils';
import { Search, Filter, AlertTriangle, CheckSquare2, CalendarDays } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskList({ tasks, onToggleComplete, onEdit, onDelete }: TaskListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Extract unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [tasks]);

  // Priority weight sorting order
  const priorityWeight: Record<TaskPriority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  // Filter tasks (Active tasks only: status != 'done')
  const activeTasks = useMemo(() => {
    return tasks.filter((task) => task.status !== 'done');
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks by title, description, category..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Category Filter */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div className="space-y-3">
            {overdueTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
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
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold tracking-tight">
              Today&apos;s Active Tasks ({regularTasks.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Sorted by priority & due date
          </span>
        </div>

        {regularTasks.length === 0 && overdueTasks.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <CheckSquare2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              {searchTerm || selectedCategory !== 'all' || selectedPriority !== 'all'
                ? 'No matching tasks found'
                : 'All caught up! 🎉'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchTerm || selectedCategory !== 'all' || selectedPriority !== 'all'
                ? 'Try clearing your search filters to see all active tasks.'
                : 'No pending tasks on your dashboard. Use the quick-add bar above to add a new task.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {regularTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
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
