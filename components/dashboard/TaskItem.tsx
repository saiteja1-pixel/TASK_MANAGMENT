'use client';

import React, { useState } from 'react';
import { Task } from '@/lib/types/database';
import { getPriorityColor, isOverdue, formatDueDate } from '@/lib/utils';
import { Check, Edit2, Trash2, Calendar, Tag, AlertCircle, Clock } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskItem({ task, onToggleComplete, onEdit, onDelete }: TaskItemProps) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const priorityColors = getPriorityColor(task.priority);
  const overdue = isOverdue(task.due_date, task.status);
  const isDone = task.status === 'done';

  const handleCheckboxClick = async () => {
    setToggling(true);
    await onToggleComplete(task);
    setToggling(false);
  };

  const handleDeleteClick = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      setDeleting(true);
      await onDelete(task.id);
      setDeleting(false);
    }
  };

  return (
    <div
      className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
        isDone
          ? 'bg-slate-50/70 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/50 opacity-75'
          : overdue
          ? 'bg-gradient-to-r from-red-50/50 via-white to-white dark:from-red-950/20 dark:via-slate-900 dark:to-slate-900 border-red-200 dark:border-red-800/80 shadow-xs'
          : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/60'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleCheckboxClick}
          disabled={toggling || deleting}
          className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            isDone
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-slate-950'
          }`}
          title={isDone ? 'Mark as pending' : 'Mark as completed'}
        >
          {toggling ? (
            <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          ) : isDone ? (
            <Check className="w-3.5 h-3.5 stroke-[3] animate-fade-in" />
          ) : null}
        </button>

        {/* Task Title & Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3
              className={`text-base font-bold leading-snug break-words ${
                isDone
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {task.title}
            </h3>

            {/* Overdue Badge */}
            {overdue && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-3 h-3 animate-pulse" /> Overdue
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 font-normal">
              {task.description}
            </p>
          )}

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${priorityColors.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityColors.dot} ${task.priority === 'high' ? 'animate-pulse' : ''}`}></span>
              {task.priority} priority
            </span>

            {/* In Progress Status */}
            {task.status === 'in_progress' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Clock className="w-3 h-3 text-blue-500" /> In Progress
              </span>
            )}

            {/* Category Tag */}
            {task.category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                <Tag className="w-3 h-3 text-slate-400" />
                {task.category}
              </span>
            )}

            {/* Due Date */}
            {task.due_date && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  overdue
                    ? 'text-red-600 dark:text-red-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Calendar className="w-3 h-3" />
                {formatDueDate(task.due_date)}
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Icons */}
        <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => onEdit(task)}
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Edit task"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={deleting}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition duration-150 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
