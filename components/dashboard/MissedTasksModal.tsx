'use client';

import React, { useState, useEffect } from 'react';
import { Task } from '@/lib/types/database';
import { getPriorityColor } from '@/lib/utils';
import { X, AlertTriangle, Check, Tag, Clock, HelpCircle } from 'lucide-react';

interface MissedTasksModalProps {
  missedTasks: Task[];
  yesterdayDateStr: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveReasons: (reasonsMap: Map<string, string>) => Promise<void>;
}

// Helper to format YYYY-MM-DD date nicely (e.g., "July 31, 2026")
const formatDisplayDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('default', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export function MissedTasksModal({
  missedTasks,
  yesterdayDateStr,
  isOpen,
  onClose,
  onSaveReasons,
}: MissedTasksModalProps) {
  const [reasonsMap, setReasonsMap] = useState<Record<string, string>>({});
  const [skippedTaskIds, setSkippedTaskIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReasonsMap({});
      setSkippedTaskIds(new Set());
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || missedTasks.length === 0) return null;

  const activeMissedTasks = missedTasks.filter((t) => !skippedTaskIds.has(t.id));

  const handleReasonChange = (taskId: string, text: string) => {
    setReasonsMap((prev) => ({
      ...prev,
      [taskId]: text,
    }));
  };

  const handleSkipTask = (taskId: string) => {
    setSkippedTaskIds((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Map of non-empty reasons to save
    const resultMap = new Map<string, string>();
    activeMissedTasks.forEach((t) => {
      const r = (reasonsMap[t.id] || '').trim();
      if (r) {
        resultMap.set(t.id, r);
      }
    });

    if (resultMap.size === 0 && activeMissedTasks.length > 0) {
      setError('Please write a reason for at least one task or click "Skip for now".');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSaveReasons(resultMap);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save reasons.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl bg-[var(--bg-base)] neu-raised-lg rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--shadow-dark)]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl neu-inset-sm text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[var(--text-main)]">
                Yesterday's Missed Tasks
              </h3>
              <p className="text-xs font-semibold text-[var(--text-main)] opacity-70 mt-0.5">
                Log reasons for incomplete tasks on {formatDisplayDate(yesterdayDateStr)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl neu-button neu-focus text-[var(--text-main)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl neu-inset-sm text-red-600 dark:text-red-400 text-xs font-bold">
              {error}
            </div>
          )}

          {activeMissedTasks.length === 0 ? (
            <div className="text-center py-8 neu-inset-sm rounded-2xl p-4 space-y-2">
              <HelpCircle className="w-8 h-8 text-[var(--text-main)] opacity-40 mx-auto" />
              <p className="text-sm font-bold text-[var(--text-main)]">
                All tasks skipped for now
              </p>
              <p className="text-xs text-[var(--text-main)] opacity-70">
                You can close this modal or return to log reasons later from the Calendar view.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeMissedTasks.map((t) => {
                const priorityColors = getPriorityColor(t.priority);

                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-[var(--bg-base)] neu-raised space-y-3 border-l-4 border-amber-500"
                  >
                    {/* Task Title & Tags Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-extrabold text-[var(--text-main)]">
                          {t.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${priorityColors.badge}`}
                          >
                            {t.priority}
                          </span>
                          {t.category && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold neu-inset-sm text-[var(--text-main)]">
                              <Tag className="w-3 h-3 text-[#7C3AED] dark:text-[#8B5CF6]" />
                              {t.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSkipTask(t.id)}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold neu-button text-[var(--text-main)] opacity-60 hover:opacity-100"
                        title="Skip explaining this task for now"
                      >
                        Skip for now
                      </button>
                    </div>

                    {/* Reason Textarea */}
                    <textarea
                      value={reasonsMap[t.id] || ''}
                      onChange={(e) => handleReasonChange(t.id, e.target.value)}
                      placeholder="Why didn't you complete this yesterday? (e.g. unexpected urgent meeting, personal break, delayed dependencies...)"
                      rows={2}
                      className="w-full p-3 text-xs font-medium rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-main)]/40 focus:outline-none neu-focus resize-none"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[var(--shadow-dark)]/20 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold neu-button neu-focus text-[var(--text-main)] opacity-80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || activeMissedTasks.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold neu-button neu-focus text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Saving Reasons...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save Reasons</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
