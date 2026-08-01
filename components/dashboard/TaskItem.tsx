'use client';

import React, { useState } from 'react';
import { Task, TaskDailyNote } from '@/lib/types/database';
import { getPriorityColor, isOverdue, formatDueDate } from '@/lib/utils';
import {
  Check,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  AlertCircle,
  Clock,
  MessageSquare,
  MessageSquareText,
  FastForward,
} from 'lucide-react';

interface TaskItemProps {
  task: Task;
  isCompletedToday?: boolean;
  dailyNote?: TaskDailyNote | null;
  onToggleComplete: (task: Task) => Promise<void>;
  onOpenReasonModal?: (task: Task, mode: 'note' | 'skip') => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskItem({
  task,
  isCompletedToday,
  dailyNote,
  onToggleComplete,
  onOpenReasonModal,
  onEdit,
  onDelete,
}: TaskItemProps) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const priorityColors = getPriorityColor(task.priority);
  const isDone = isCompletedToday !== undefined ? isCompletedToday : task.status === 'done';
  const isSkippedToday = !isDone && Boolean(dailyNote?.is_skipped);
  const hasReason = Boolean(dailyNote?.reason && dailyNote.reason.trim() !== '');

  const overdue = isOverdue(task.due_date, isDone ? 'done' : 'todo');

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
      className={`group relative p-4 sm:p-5 rounded-2xl bg-[var(--bg-base)] transition-all duration-200 ${
        isDone
          ? 'neu-inset opacity-75'
          : isSkippedToday
          ? 'neu-inset border-l-4 border-amber-500 opacity-90'
          : overdue
          ? 'neu-raised hover:neu-raised-lg border-l-4 border-red-500'
          : 'neu-raised hover:neu-raised-lg'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleCheckboxClick}
          disabled={toggling || deleting}
          className={`mt-0.5 w-6 h-6 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 neu-focus ${
            isDone
              ? 'bg-[#16A34A] text-white border-2 border-[#16A34A] shadow-[0_2px_8px_rgba(22,163,74,0.35)]'
              : isSkippedToday
              ? 'border-2 border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
              : 'border-2 border-[#A3B1C6] dark:border-gray-500 bg-transparent text-transparent hover:border-[#7C3AED] hover:bg-[#7C3AED]/10'
          }`}
          title={isDone ? 'Mark as pending' : 'Mark as completed'}
        >
          {toggling ? (
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : isDone ? (
            <Check className="w-4 h-4 stroke-[3] animate-fade-in" />
          ) : null}
        </button>

        {/* Task Title & Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3
              className={`text-base font-extrabold leading-snug break-words ${
                isDone
                  ? 'line-through text-[var(--text-main)] opacity-50'
                  : isSkippedToday
                  ? 'line-through text-amber-700 dark:text-amber-300 opacity-80'
                  : 'text-[var(--text-main)]'
              }`}
            >
              {task.title}
            </h3>

            {/* Skipped Today Badge */}
            {isSkippedToday && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[11px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 neu-inset-sm">
                <FastForward className="w-3 h-3" /> Skipped Today
              </span>
            )}

            {/* Overdue Badge */}
            {!isSkippedToday && overdue && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[11px] font-bold bg-red-600 text-white neu-raised-sm">
                <AlertCircle className="w-3 h-3 animate-pulse" /> Overdue
              </span>
            )}

            {/* Small Reason Pill next to title if reason exists */}
            {hasReason && onOpenReasonModal && (
              <button
                onClick={() => onOpenReasonModal(task, 'note')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[11px] font-semibold neu-inset-sm text-[#7C3AED] dark:text-[#8B5CF6] hover:underline"
                title={`Reason: "${dailyNote?.reason}" (Click to edit)`}
              >
                <MessageSquareText className="w-3 h-3 fill-current shrink-0" />
                <span className="max-w-[150px] truncate">{dailyNote?.reason}</span>
              </button>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-[var(--text-main)] opacity-80 line-clamp-2 mb-2 font-medium">
              {task.description}
            </p>
          )}

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${priorityColors.badge}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${priorityColors.dot} ${
                  task.priority === 'high' ? 'animate-pulse' : ''
                }`}
              ></span>
              {task.priority} priority
            </span>

            {/* In Progress Status */}
            {task.status === 'in_progress' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[10px] font-bold bg-blue-600 text-white neu-raised-sm">
                <Clock className="w-3 h-3 text-white" /> In Progress
              </span>
            )}

            {/* Category Tag */}
            {task.category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-semibold neu-inset-sm text-[var(--text-main)]">
                <Tag className="w-3 h-3 text-[#7C3AED] dark:text-[#8B5CF6]" />
                {task.category}
              </span>
            )}

            {/* Due Date */}
            {task.due_date && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-semibold neu-inset-sm ${
                  overdue && !isDone
                    ? 'text-red-600 dark:text-red-400 font-extrabold'
                    : 'text-[var(--text-main)] opacity-80'
                }`}
              >
                <Calendar className="w-3 h-3 text-[var(--text-main)] opacity-60" />
                {formatDueDate(task.due_date)}
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Icons */}
        <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {/* Add / Edit Reason Button for pending tasks */}
          {!isDone && onOpenReasonModal && (
            <>
              <button
                onClick={() => onOpenReasonModal(task, 'note')}
                className={`p-2 rounded-xl neu-button neu-focus text-[var(--text-main)] ${
                  hasReason
                    ? 'text-[#7C3AED] dark:text-[#8B5CF6]'
                    : 'hover:text-[#7C3AED] dark:hover:text-[#8B5CF6]'
                }`}
                title={hasReason ? 'Edit daily reason' : 'Add reason for today'}
              >
                {hasReason ? (
                  <MessageSquareText className="w-4 h-4 fill-current" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
              </button>

              {/* Skip Today Button */}
              <button
                onClick={() => onOpenReasonModal(task, 'skip')}
                className={`p-2 rounded-xl neu-button neu-focus text-[var(--text-main)] ${
                  isSkippedToday
                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                    : 'hover:text-amber-600 dark:hover:text-amber-400'
                }`}
                title="Skip task today (requires reason)"
              >
                <FastForward className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => onEdit(task)}
            className="p-2 rounded-xl neu-button neu-focus text-[var(--text-main)] hover:text-[#7C3AED] dark:hover:text-[#8B5CF6]"
            title="Edit task"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={deleting}
            className="p-2 rounded-xl neu-button neu-focus text-[var(--text-main)] hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
