'use client';

import React, { useState, useEffect } from 'react';
import { Task } from '@/lib/types/database';
import { X, MessageSquare, FastForward, Trash2 } from 'lucide-react';

interface ReasonModalProps {
  task: Task | null;
  existingReason?: string;
  isSkipped?: boolean;
  mode: 'note' | 'skip';
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, reason: string, isSkipped: boolean) => Promise<void>;
  onRemove?: (taskId: string) => Promise<void>;
}

export function ReasonModal({
  task,
  existingReason = '',
  isSkipped = false,
  mode,
  isOpen,
  onClose,
  onSave,
  onRemove,
}: ReasonModalProps) {
  const [reasonText, setReasonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReasonText(existingReason);
      setError(null);
    }
  }, [isOpen, existingReason]);

  if (!isOpen || !task) return null;

  const isSkipMode = mode === 'skip';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reasonText.trim();

    if (isSkipMode && !trimmed) {
      setError('A reason is required when skipping a task for today.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(task.id, trimmed, isSkipMode || isSkipped);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save reason.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveReason = async () => {
    if (!onRemove) return;
    try {
      setDeleting(true);
      await onRemove(task.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove reason.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-[var(--bg-base)] neu-raised-lg rounded-3xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--shadow-dark)]/20">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl neu-inset-sm ${
                isSkipMode ? 'text-amber-500' : 'text-[#7C3AED] dark:text-[#8B5CF6]'
              }`}
            >
              {isSkipMode ? <FastForward className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--text-main)]">
                {isSkipMode ? 'Skip Task Today' : 'Daily Reason'}
              </h3>
              <p className="text-xs text-[var(--text-main)] opacity-70 font-semibold truncate max-w-[240px]">
                {task.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl neu-button neu-focus text-[var(--text-main)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt title */}
        <p className="text-sm font-extrabold text-[var(--text-main)]">
          {isSkipMode ? 'Why are you skipping this task today?' : "Why haven't you done this today?"}
        </p>

        {error && (
          <div className="p-3 rounded-xl neu-inset-sm text-red-600 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={reasonText}
            onChange={(e) => {
              setReasonText(e.target.value);
              if (error) setError(null);
            }}
            placeholder={
              isSkipMode
                ? 'e.g., Doctor appointment, resting today, prioritizing project urgent deadline...'
                : 'Write an optional note or reason...'
            }
            rows={3}
            className="w-full p-3.5 text-xs font-medium rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-main)]/40 focus:outline-none neu-focus resize-none"
            autoFocus
          />

          <div className="flex items-center justify-between gap-3 pt-2">
            {existingReason && onRemove ? (
              <button
                type="button"
                onClick={handleRemoveReason}
                disabled={deleting || saving}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold neu-button text-red-600 dark:text-red-400 hover:opacity-80 disabled:opacity-50"
                title="Remove reason"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-2xl text-xs font-bold neu-button neu-focus text-[var(--text-main)] opacity-80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`px-4 py-2 rounded-2xl text-xs font-bold neu-button neu-focus text-white ${
                  isSkipMode
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-[#7C3AED] hover:bg-[#6D28D9] dark:bg-[#8B5CF6]'
                }`}
              >
                {saving ? 'Saving...' : isSkipMode ? 'Skip Task' : 'Save Reason'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
