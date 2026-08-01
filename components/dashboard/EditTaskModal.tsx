'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus, TaskUpdateInput } from '@/lib/types/database';
import { X, Calendar, Tag, AlertCircle, FileText } from 'lucide-react';
import { getPriorityColor } from '@/lib/utils';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updateData: TaskUpdateInput) => Promise<boolean>;
}

export function EditTaskModal({ task, isOpen, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'todo');
      setPriority(task.priority || 'medium');
      setCategory(task.category || '');
      setDueDate(task.due_date || '');
      setError(null);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    const updateData: TaskUpdateInput = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      category: category.trim() || null,
      due_date: dueDate || null,
    };

    if (status === 'done' && task.status !== 'done') {
      updateData.completed_at = new Date().toISOString();
    } else if (status !== 'done' && task.status === 'done') {
      updateData.completed_at = null;
    }

    const success = await onSave(task.id, updateData);
    setLoading(false);

    if (success) {
      onClose();
    } else {
      setError('Failed to update task.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-[var(--bg-base)] neu-raised-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--shadow-dark)]/20 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-[var(--text-main)]">Edit Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl neu-button neu-focus text-[var(--text-main)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-4 rounded-2xl neu-inset-sm text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] focus:outline-none neu-focus text-sm font-semibold"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70 mb-2 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add optional notes or acceptance criteria..."
              className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-main)]/50 focus:outline-none neu-focus text-sm font-medium"
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] focus:outline-none neu-focus text-sm font-semibold"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Completed (Done)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70 mb-2">
                Priority
              </label>
              <div className="flex items-center gap-1.5">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => {
                  const colors = getPriorityColor(p);
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2.5 px-1.5 rounded-2xl text-xs font-bold capitalize transition neu-focus ${
                        isSelected
                          ? `${colors.badge} neu-inset-sm font-extrabold`
                          : 'neu-button text-[var(--text-main)]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Category & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70 mb-2 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Work, Personal"
                className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] focus:outline-none neu-focus text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70 mb-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] focus:outline-none neu-focus text-sm font-semibold"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-5 border-t border-[var(--shadow-dark)]/20 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl neu-button neu-focus font-bold text-sm text-[var(--text-main)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-2xl neu-button-primary neu-focus font-bold text-sm disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
