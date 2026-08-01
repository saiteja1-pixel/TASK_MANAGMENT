'use client';

import React from 'react';
import { Task } from '@/lib/types/database';
import { AlertTriangle, X, MessageSquarePlus } from 'lucide-react';

interface MissedTasksBannerProps {
  missedTasks: Task[];
  onOpenModal: () => void;
  onDismiss: () => void;
}

export function MissedTasksBanner({ missedTasks, onOpenModal, onDismiss }: MissedTasksBannerProps) {
  if (!missedTasks || missedTasks.length === 0) return null;

  const isSingle = missedTasks.length === 1;
  const singleTitle = isSingle ? missedTasks[0].title : '';

  return (
    <div className="p-4 rounded-3xl bg-[var(--bg-base)] neu-raised border-l-4 border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-2xl neu-inset-sm text-amber-500 shrink-0">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-[var(--text-main)]">
            {isSingle
              ? `You didn't complete "${singleTitle}" yesterday — want to say why?`
              : `You missed ${missedTasks.length} tasks yesterday. Want to note why?`}
          </h4>
          <p className="text-xs font-semibold text-[var(--text-main)] opacity-70 mt-0.5">
            Log a quick reason so your daily task history remains clear and organized.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        <button
          onClick={onOpenModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold neu-button neu-focus text-amber-800 dark:text-amber-300 bg-amber-500/20 hover:bg-amber-500/30"
        >
          <MessageSquarePlus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Add Reason</span>
        </button>
        <button
          onClick={onDismiss}
          className="p-2 rounded-2xl neu-button neu-focus text-[var(--text-main)] opacity-70 hover:opacity-100"
          title="Dismiss for this session"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
