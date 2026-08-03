'use client';

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: React.ReactNode;
  taskTitle?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  icon?: 'trash' | 'warning';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete this task?',
  message,
  taskTitle,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isLoading = false,
  icon = 'trash',
}: ConfirmationModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const bodyText = message ? (
    message
  ) : taskTitle ? (
    <>
      This action cannot be undone. <span className="font-bold text-[var(--text-main)]">&apos;{taskTitle}&apos;</span> will be permanently removed.
    </>
  ) : (
    'This action cannot be undone. This item will be permanently removed.'
  );

  const IconComponent = icon === 'trash' ? Trash2 : AlertTriangle;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={() => {
        if (!isLoading) onClose();
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[var(--bg-base)] neu-raised-lg rounded-3xl overflow-hidden p-6 space-y-5 animate-fade-in"
      >
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 neu-inset-sm flex items-center justify-center shrink-0">
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[var(--text-main)]">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-2xl neu-button neu-focus text-[var(--text-main)] opacity-70 hover:opacity-100 disabled:opacity-30 transition-opacity"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <p className="text-sm font-medium text-[var(--text-main)] opacity-80 leading-relaxed pl-0.5">
          {bodyText}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold neu-button neu-focus text-[var(--text-main)] opacity-80 hover:opacity-100 disabled:opacity-50 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold neu-focus text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 shadow-md transition-all flex items-center gap-2"
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
