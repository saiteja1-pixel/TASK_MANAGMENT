'use client';

import React, { useState } from 'react';
import { TaskPriority, TaskCreateInput } from '@/lib/types/database';
import { Plus, Calendar, Tag, AlertCircle, ChevronDown, ChevronUp, CornerDownLeft, X } from 'lucide-react';
import { getPriorityColor } from '@/lib/utils';

interface QuickAddBarProps {
  onAddTask: (taskInput: TaskCreateInput) => Promise<boolean>;
}

export function QuickAddBar({ onAddTask }: QuickAddBarProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle || loading) return;

    setError(null);
    setLoading(true);

    try {
      console.log('[QuickAddBar] Submitting new task payload:', {
        title: trimmedTitle,
        priority,
        category: category.trim() || null,
        due_date: dueDate || null,
        status: 'todo',
      });

      const success = await onAddTask({
        title: trimmedTitle,
        priority,
        category: category.trim() || null,
        due_date: dueDate || null,
        status: 'todo',
      });

      if (success) {
        console.log('[QuickAddBar] Task created successfully. Resetting input form.');
        setTitle('');
        setCategory('');
        setDueDate('');
        setPriority('medium');
        setShowOptions(false);
      } else {
        console.error('[QuickAddBar] Task creation returned false.');
        setError('Failed to create task. Please check your connection or auth state.');
      }
    } catch (err: any) {
      console.error('[QuickAddBar] Unexpected error during submit:', err);
      setError(err?.message || 'An unexpected error occurred while creating the task.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (title.trim() && !loading) {
        handleSubmit(e);
      }
    }
  };

  return (
    <div className="mb-8">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--bg-base)] neu-inset rounded-2xl p-4 sm:p-5 transition-all duration-200"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <div className="w-10 h-10 rounded-2xl neu-raised-sm text-[#7C3AED] dark:text-[#8B5CF6] flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a new task title..."
              disabled={loading}
              className="w-full min-w-0 bg-transparent text-[var(--text-main)] placeholder-[var(--text-main)]/50 font-semibold text-sm sm:text-base focus:outline-none"
            />
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-raised-sm text-[10px] font-mono font-bold text-[var(--text-main)] opacity-70">
            <CornerDownLeft className="w-3 h-3" />
            <span>ENTER</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="px-3.5 py-2.5 min-h-[44px] text-[var(--text-main)] rounded-2xl neu-button neu-focus flex items-center gap-1 text-xs font-bold"
            >
              <span>Options</span>
              {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !title.trim()}
              className="px-5 py-2.5 min-h-[44px] rounded-2xl neu-button-primary neu-focus font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Add Task</span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Options Drawer */}
        {showOptions && (
          <div className="mt-5 pt-5 border-t border-[var(--shadow-dark)]/20 grid grid-cols-1 sm:grid-cols-3 gap-5 animate-fade-in">
            {/* Priority Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70 mb-2">
                Priority Level
              </label>
              <div className="flex items-center gap-2">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => {
                  const colors = getPriorityColor(p);
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all neu-focus ${
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

            {/* Category Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70 mb-2">
                Category / Tag
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-[var(--text-main)] opacity-50 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Work, Personal"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs font-semibold rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-main)]/50 focus:outline-none neu-focus"
                />
              </div>
            </div>

            {/* Due Date Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-main)] opacity-70 mb-2">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[var(--text-main)] opacity-50 absolute left-3.5 top-3" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs font-semibold rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] focus:outline-none neu-focus"
                />
              </div>
            </div>
          </div>
        )}

        {/* User-facing error message alert */}
        {error && (
          <div className="mt-4 p-3.5 rounded-2xl neu-inset-sm text-xs text-red-600 dark:text-red-400 flex items-center justify-between gap-2 font-bold animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
