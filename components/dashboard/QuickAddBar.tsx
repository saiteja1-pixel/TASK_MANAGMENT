'use client';

import React, { useState } from 'react';
import { TaskPriority, TaskCreateInput } from '@/lib/types/database';
import { Plus, Calendar, Tag, AlertCircle, ChevronDown, ChevronUp, CornerDownLeft } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setError(null);
    setLoading(true);

    const success = await onAddTask({
      title: title.trim(),
      priority,
      category: category.trim() || null,
      due_date: dueDate || null,
      status: 'todo',
    });

    setLoading(false);

    if (success) {
      setTitle('');
      setCategory('');
      setDueDate('');
      setPriority('medium');
      setShowOptions(false);
    } else {
      setError('Failed to create task. Please try again.');
    }
  };

  return (
    <div className="mb-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900/90 rounded-2xl shadow-md shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800/80 p-4 transition-all duration-200 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task title... (press Enter ↵)"
            disabled={loading}
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium focus:outline-none text-base"
          />

          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-400">
            <CornerDownLeft className="w-3 h-3" />
            <span>ENTER</span>
          </div>

          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 text-xs font-bold"
          >
            <span>Options</span>
            {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-md shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>Add Task</span>
            )}
          </button>
        </div>

        {/* Expandable Options Drawer */}
        {showOptions && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
            {/* Priority Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Priority Level
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
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                        isSelected
                          ? `${colors.badge} ring-2 ring-indigo-500/30`
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Category / Tag
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Work, Personal"
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Due Date Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
}
