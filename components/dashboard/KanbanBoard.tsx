'use client';

import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority, TaskDailyNote } from '@/lib/types/database';
import { getPriorityColor, isOverdue, formatDueDate } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  ListTodo,
  Calendar,
  Tag,
  AlertCircle,
  Edit2,
  Trash2,
  Check,
  MessageSquare,
  MessageSquareText,
  FastForward,
} from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  completedTaskIdsToday?: Set<string>;
  dailyNotesMap?: Map<string, TaskDailyNote>;
  onToggleComplete: (task: Task) => Promise<void>;
  onOpenReasonModal?: (task: Task, mode: 'note' | 'skip') => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeClass: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'todo',
    title: 'To Do',
    icon: ListTodo,
    accentColor: '#7C3AED',
    badgeClass: 'text-[#7C3AED] dark:text-[#8B5CF6] neu-inset-sm',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: Clock,
    accentColor: '#2563EB',
    badgeClass: 'text-blue-600 dark:text-blue-400 neu-inset-sm',
  },
  {
    id: 'done',
    title: 'Done',
    icon: CheckCircle2,
    accentColor: '#10B981',
    badgeClass: 'text-emerald-600 dark:text-emerald-400 neu-inset-sm',
  },
];

export function KanbanBoard({
  tasks,
  completedTaskIdsToday,
  dailyNotesMap,
  onToggleComplete,
  onOpenReasonModal,
  onUpdateStatus,
  onEdit,
  onDelete,
}: KanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Group tasks by today's status & completion state
  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };

    tasks.forEach((task) => {
      if (task.is_active === false) return;

      const isCompletedToday = completedTaskIdsToday
        ? completedTaskIdsToday.has(task.id)
        : task.status === 'done';

      if (isCompletedToday) {
        map.done.push(task);
      } else if (task.status === 'in_progress') {
        map.in_progress.push(task);
      } else {
        map.todo.push(task);
      }
    });

    // Priority sort order
    const priorityWeight: Record<TaskPriority, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    const sortFn = (a: Task, b: Task) => {
      const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    };

    map.todo.sort(sortFn);
    map.in_progress.sort(sortFn);
    map.done.sort(sortFn);

    return map;
  }, [tasks, completedTaskIdsToday]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      await onUpdateStatus(taskId, targetStatus);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleCheckboxClick = async (task: Task) => {
    setTogglingId(task.id);
    await onToggleComplete(task);
    setTogglingId(null);
  };

  const handleDeleteClick = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setDeletingId(taskId);
      await onDelete(taskId);
      setDeletingId(null);
    }
  };

  return (
    <div className="flex md:grid md:grid-cols-3 overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 animate-fade-in items-start pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
      {COLUMNS.map((col) => {
        const Icon = col.icon;
        const columnTasks = tasksByStatus[col.id] || [];
        const isHovered = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={(e) => handleDragLeave(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-3xl p-5 bg-[var(--bg-base)] transition-all duration-200 min-h-[450px] md:min-h-[500px] w-[85vw] max-w-[340px] shrink-0 snap-center md:w-auto md:shrink ${
              isHovered
                ? 'neu-inset border-2 border-dashed border-[#7C3AED] ring-2 ring-[#7C3AED]/20 scale-[1.01]'
                : 'neu-raised'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--shadow-dark)]/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl neu-inset-sm flex items-center justify-center text-[var(--text-main)]">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-[var(--text-main)]">
                  {col.title}
                </h3>
              </div>

              <span className={`px-3 py-1 rounded-xl font-extrabold text-xs ${col.badgeClass}`}>
                {columnTasks.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-1 min-h-[200px]">
              {columnTasks.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-center p-4 rounded-2xl neu-inset-sm opacity-60">
                  <p className="text-xs font-bold text-[var(--text-main)]">No tasks here</p>
                  <p className="text-[11px] font-medium text-[var(--text-main)] opacity-70 mt-1">
                    Drag a task or add a new one
                  </p>
                </div>
              ) : (
                columnTasks.map((task) => {
                  const priorityColors = getPriorityColor(task.priority);
                  const isDone = completedTaskIdsToday
                    ? completedTaskIdsToday.has(task.id)
                    : task.status === 'done';
                  const note = dailyNotesMap ? dailyNotesMap.get(task.id) : null;
                  const isSkippedToday = !isDone && Boolean(note?.is_skipped);
                  const hasReason = Boolean(note?.reason && note.reason.trim() !== '');

                  const overdue = isOverdue(task.due_date, isDone ? 'done' : 'todo');
                  const isBeingDragged = draggedTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={`group relative p-4 rounded-2xl bg-[var(--bg-base)] transition-all duration-200 cursor-grab active:cursor-grabbing ${
                        isBeingDragged
                          ? 'opacity-40 neu-inset scale-95'
                          : isSkippedToday
                          ? 'neu-inset border-l-4 border-amber-500 opacity-90'
                          : 'neu-raised hover:neu-raised-lg'
                      }`}
                    >
                      {/* Top Meta Row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {/* Priority Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${priorityColors.badge}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${priorityColors.dot} ${
                              task.priority === 'high' ? 'animate-pulse' : ''
                            }`}
                          />
                          {task.priority}
                        </span>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          {!isDone && onOpenReasonModal && (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenReasonModal(task, 'note')}
                                className={`p-1.5 rounded-xl neu-button neu-focus text-[var(--text-main)] ${
                                  hasReason ? 'text-[#7C3AED] dark:text-[#8B5CF6]' : ''
                                }`}
                                title={hasReason ? 'Edit daily reason' : 'Add reason for today'}
                              >
                                {hasReason ? (
                                  <MessageSquareText className="w-3.5 h-3.5 fill-current" />
                                ) : (
                                  <MessageSquare className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenReasonModal(task, 'skip')}
                                className={`p-1.5 rounded-xl neu-button neu-focus text-[var(--text-main)] ${
                                  isSkippedToday ? 'text-amber-600 dark:text-amber-400' : ''
                                }`}
                                title="Skip task today"
                              >
                                <FastForward className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => onEdit(task)}
                            className="p-1.5 rounded-xl neu-button neu-focus text-[var(--text-main)] hover:text-[#7C3AED] dark:hover:text-[#8B5CF6]"
                            title="Edit task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(task.id)}
                            disabled={deletingId === task.id}
                            className="p-1.5 rounded-xl neu-button neu-focus text-[var(--text-main)] hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Task Title */}
                      <div className="flex items-start gap-2.5 mb-2">
                        <button
                          type="button"
                          onClick={() => handleCheckboxClick(task)}
                          disabled={togglingId === task.id}
                          className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 neu-focus ${
                            isDone
                              ? 'bg-[#16A34A] text-white border-2 border-[#16A34A] shadow-[0_2px_8px_rgba(22,163,74,0.35)]'
                              : isSkippedToday
                              ? 'border-2 border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'border-2 border-[#A3B1C6] dark:border-gray-500 bg-transparent text-transparent hover:border-[#7C3AED]'
                          }`}
                          title={isDone ? 'Mark as pending' : 'Mark as completed'}
                        >
                          {togglingId === task.id ? (
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : isDone ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : null}
                        </button>

                        <h4
                          className={`text-sm font-extrabold leading-snug break-words ${
                            isDone
                              ? 'line-through text-[var(--text-main)] opacity-50'
                              : isSkippedToday
                              ? 'line-through text-amber-700 dark:text-amber-300 opacity-80'
                              : 'text-[var(--text-main)]'
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>

                      {/* Description if present */}
                      {task.description && (
                        <p className="text-xs text-[var(--text-main)] opacity-75 font-medium line-clamp-2 mb-3 ml-7">
                          {task.description}
                        </p>
                      )}

                      {/* Reason snippet if present */}
                      {hasReason && onOpenReasonModal && (
                        <div className="mb-2 ml-7">
                          <button
                            onClick={() => onOpenReasonModal(task, 'note')}
                            className="text-[11px] font-medium text-[#7C3AED] dark:text-[#8B5CF6] italic underline truncate max-w-full block"
                          >
                            Reason: "{note?.reason}"
                          </button>
                        </div>
                      )}

                      {/* Bottom Footer Tags */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--shadow-dark)]/15 ml-7">
                        {/* Skipped Today Badge */}
                        {isSkippedToday && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 neu-inset-sm">
                            <FastForward className="w-3 h-3" /> Skipped
                          </span>
                        )}

                        {/* Overdue Badge */}
                        {!isSkippedToday && overdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-600 text-white neu-raised-sm">
                            <AlertCircle className="w-3 h-3 animate-pulse" /> Overdue
                          </span>
                        )}

                        {/* Category Tag */}
                        {task.category && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold neu-inset-sm text-[var(--text-main)]">
                            <Tag className="w-3 h-3 text-[#7C3AED] dark:text-[#8B5CF6]" />
                            {task.category}
                          </span>
                        )}

                        {/* Due Date */}
                        {task.due_date && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold neu-inset-sm ${
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
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
