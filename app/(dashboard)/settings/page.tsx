'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme, ThemeMode } from '@/components/ui/ThemeProvider';
import { createClient } from '@/lib/supabase/client';
import { UserSettings, UserProfile, TaskCompletion, TaskDailyNote, Task } from '@/lib/types/database';
import { getLocalCompletions } from '@/lib/localCompletions';
import { getLocalDailyNotes } from '@/lib/localDailyNotes';
import { PRESET_AVATARS, getPresetAvatar, getLocalUserProfile, setLocalUserProfile } from '@/lib/avatars';
import {
  User,
  Palette,
  Lock,
  Bell,
  Download,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

type SettingsTab = 'profile' | 'appearance' | 'password' | 'notifications' | 'export';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export default function SettingsPage() {
  const { themeMode, setThemeMode } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile State
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // User Settings State
  const [userSettings, setUserSettings] = useState<UserSettings>({
    user_id: '',
    theme: themeMode,
    notify_overdue: true,
    notify_daily_summary: false,
    notify_streak: true,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Toast Notification State
  const [toast, setToast] = useState<ToastState | null>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Export Loading States
  const [exportingTasks, setExportingTasks] = useState(false);
  const [exportingHistory, setExportingHistory] = useState(false);

  // Toast trigger helper
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Fetch settings from Supabase
  const loadUserSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setUserSettings(data as UserSettings);
        if (data.theme && data.theme !== themeMode) {
          setThemeMode(data.theme);
        }
      } else {
        // Initialize default user_settings if non-existent
        setUserSettings((prev) => ({
          ...prev,
          user_id: user.id,
          theme: themeMode,
        }));
      }
    } catch (err) {
      console.warn('Load user settings notice:', err);
    } finally {
      setLoadingSettings(false);
    }
  }, [themeMode, setThemeMode]);

  // Fetch profile from Supabase & localStorage
  const loadUserProfile = useCallback(async () => {
    try {
      const local = getLocalUserProfile();
      if (local) {
        setDisplayName(local.display_name || '');
        setBio(local.bio || '');
        setAvatarId(local.avatar_id || null);
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setUserEmail(user.email || null);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setAvatarId(data.avatar_id || null);
        setLocalUserProfile(data as UserProfile);
      }
    } catch (err) {
      console.warn('Load user profile notice:', err);
    }
  }, []);

  useEffect(() => {
    loadUserSettings();
    loadUserProfile();
  }, [loadUserSettings, loadUserProfile]);

  // Handle Preset Avatar Selection (Auto-saves on selection)
  const handleAvatarSelect = async (selectedId: string) => {
    setAvatarId(selectedId);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const updatedProfile: UserProfile = {
        user_id: user?.id || 'guest',
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_id: selectedId,
        updated_at: new Date().toISOString(),
      };

      setLocalUserProfile(updatedProfile);

      if (user) {
        await supabase
          .from('user_profiles')
          .upsert(updatedProfile, { onConflict: 'user_id' });
      }
      showToast('Avatar updated!');
    } catch (err: any) {
      showToast('Avatar updated locally!');
    }
  };

  // Handle Profile Save (Display Name & Bio)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const updatedProfile: UserProfile = {
        user_id: user?.id || 'guest',
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_id: avatarId,
        updated_at: new Date().toISOString(),
      };

      setLocalUserProfile(updatedProfile);

      if (user) {
        const { error } = await supabase
          .from('user_profiles')
          .upsert(updatedProfile, { onConflict: 'user_id' });
        if (error) throw error;
      }
      showToast('Profile updated successfully!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Theme Change
  const handleThemeChange = async (mode: ThemeMode) => {
    setThemeMode(mode);
    setUserSettings((prev) => ({ ...prev, theme: mode }));

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('user_settings').upsert(
          {
            user_id: user.id,
            theme: mode,
            notify_overdue: userSettings.notify_overdue,
            notify_daily_summary: userSettings.notify_daily_summary,
            notify_streak: userSettings.notify_streak,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      }
      showToast('Theme preference updated!');
    } catch (err: any) {
      showToast(err?.message || 'Saved theme locally', 'success');
    }
  };

  // Handle Password Change Form
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    try {
      setUpdatingPassword(true);
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setPasswordSuccess('Your password has been updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully!');
    } catch (err: any) {
      setPasswordError(
        err?.message || 'Failed to update password. Please check your inputs and try again.'
      );
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Handle Notification Toggle Change
  const handleNotificationToggle = async (key: 'notify_overdue' | 'notify_daily_summary' | 'notify_streak') => {
    const updatedValue = !userSettings[key];
    const updatedSettings = { ...userSettings, [key]: updatedValue };
    setUserSettings(updatedSettings);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('user_settings').upsert(
          {
            user_id: user.id,
            theme: userSettings.theme,
            notify_overdue: updatedSettings.notify_overdue,
            notify_daily_summary: updatedSettings.notify_daily_summary,
            notify_streak: updatedSettings.notify_streak,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      }
      showToast('Notification preference saved!');
    } catch (err: any) {
      showToast('Preference saved!', 'success');
    }
  };

  // CSV Helper: escape cell content
  const escapeCsv = (str: string | null | undefined): string => {
    if (str === null || str === undefined) return '""';
    const cleanStr = String(str).replace(/"/g, '""');
    return `"${cleanStr}"`;
  };

  // Export All Tasks as CSV
  const handleExportTasks = async () => {
    try {
      setExportingTasks(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let tasksList: Task[] = [];

      if (user) {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          tasksList = data as Task[];
        }
      }

      if (tasksList.length === 0) {
        // Fallback: fetch active tasks from dashboard endpoint or local
        const { data } = await supabase.from('tasks').select('*');
        tasksList = (data as Task[]) || [];
      }

      // Generate CSV Content
      const headers = ['title', 'description', 'category', 'priority', 'created_at', 'is_active'];
      const rows = tasksList.map((t) => [
        escapeCsv(t.title),
        escapeCsv(t.description),
        escapeCsv(t.category),
        escapeCsv(t.priority),
        escapeCsv(t.created_at),
        escapeCsv(t.is_active !== false ? 'true' : 'false'),
      ]);

      const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      // Trigger File Download
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `taskflow_all_tasks_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Exported all tasks to CSV!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to export tasks', 'error');
    } finally {
      setExportingTasks(false);
    }
  };

  // Export Completion History as CSV
  const handleExportCompletionHistory = async () => {
    try {
      setExportingHistory(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetch tasks to resolve title by id
      const { data: tasksData } = await supabase.from('tasks').select('id, title');
      const taskMap = new Map<string, string>();
      (tasksData || []).forEach((t: any) => taskMap.set(t.id, t.title));

      // Fetch task completions
      const localComps = getLocalCompletions();
      const { data: completionsData } = await supabase.from('task_completions').select('*');

      const combinedCompsMap = new Map<string, TaskCompletion>();
      localComps.forEach((c) => combinedCompsMap.set(`${c.task_id}_${c.completed_date}`, c));
      ((completionsData as TaskCompletion[]) || []).forEach((c) =>
        combinedCompsMap.set(`${c.task_id}_${c.completed_date}`, c)
      );

      // Fetch task daily notes (reasons/skips)
      const localNotes = getLocalDailyNotes();
      const { data: notesData } = await supabase.from('task_daily_notes').select('*');

      const notesMap = new Map<string, TaskDailyNote>();
      localNotes.forEach((n) => notesMap.set(`${n.task_id}_${n.note_date}`, n));
      ((notesData as TaskDailyNote[]) || []).forEach((n) =>
        notesMap.set(`${n.task_id}_${n.note_date}`, n)
      );

      const headers = ['task_title', 'completed_date', 'reason'];
      const rows: string[][] = [];

      // Add completed rows
      combinedCompsMap.forEach((c) => {
        const title = taskMap.get(c.task_id) || 'Task ' + c.task_id;
        const note = notesMap.get(`${c.task_id}_${c.completed_date}`);
        const reason = note?.reason || '';
        rows.push([escapeCsv(title), escapeCsv(c.completed_date), escapeCsv(reason)]);
      });

      // Add uncompleted/skipped notes rows if not already listed
      notesMap.forEach((n) => {
        if (!combinedCompsMap.has(`${n.task_id}_${n.note_date}`)) {
          const title = taskMap.get(n.task_id) || 'Task ' + n.task_id;
          const reasonPrefix = n.is_skipped ? '[SKIPPED] ' : '';
          rows.push([
            escapeCsv(title),
            escapeCsv(n.note_date),
            escapeCsv(reasonPrefix + n.reason),
          ]);
        }
      });

      const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `taskflow_completion_history_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Exported completion history to CSV!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to export history', 'error');
    } finally {
      setExportingHistory(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-xs font-extrabold border transition-all animate-bounce ${toast.type === 'success'
            ? 'bg-[#F0FDF4] border-emerald-500/30 text-gray-800 dark:bg-emerald-600 dark:border-transparent dark:text-white'
            : 'bg-[#FEF2F2] border-red-500/30 text-gray-800 dark:bg-red-600 dark:border-transparent dark:text-white'
            }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0 stroke-[3] text-[#16A34A] dark:text-white" />
          ) : (
            <AlertCircle className="w-4.5 h-4.5 shrink-0 stroke-[3] text-[#DC2626] dark:text-white" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="pb-4 border-b border-[var(--shadow-dark)]/20">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-main)]">
          Settings
        </h1>
        <p className="text-sm text-[var(--text-main)] opacity-70 font-medium mt-1">
          Manage your account preferences, themes, security, and data backup.
        </p>
      </div>

      {/* Sidebar-within-page Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Section Navigation Sidebar */}
        <div className="md:col-span-4 lg:col-span-3 relative w-full">
          {/* Scroll hint gradient fade indicator on mobile */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--bg-base)] to-transparent md:hidden z-10 opacity-80 rounded-r-3xl" />

          <div className="bg-[var(--bg-base)] neu-raised p-2.5 sm:p-3 rounded-3xl flex md:flex-col overflow-x-auto no-scrollbar scroll-smooth gap-2 md:gap-1.5 shrink-0 -mx-1 px-3 py-2.5 sm:mx-0 sm:px-3">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 md:shrink min-h-[44px] transition-all duration-150 neu-focus ${activeTab === 'profile'
                ? 'neu-inset text-[#7C3AED] dark:text-[#8B5CF6] font-extrabold'
                : 'neu-button text-[var(--text-main)] opacity-80 hover:opacity-100'
                }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 md:shrink min-h-[44px] transition-all duration-150 neu-focus ${activeTab === 'appearance'
                ? 'neu-inset text-[#7C3AED] dark:text-[#8B5CF6] font-extrabold'
                : 'neu-button text-[var(--text-main)] opacity-80 hover:opacity-100'
                }`}
            >
              <Palette className="w-4 h-4 shrink-0" />
              <span>Appearance</span>
            </button>

            <button
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 md:shrink min-h-[44px] transition-all duration-150 neu-focus ${activeTab === 'password'
                ? 'neu-inset text-[#7C3AED] dark:text-[#8B5CF6] font-extrabold'
                : 'neu-button text-[var(--text-main)] opacity-80 hover:opacity-100'
                }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>Change Password</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 md:shrink min-h-[44px] transition-all duration-150 neu-focus ${activeTab === 'notifications'
                ? 'neu-inset text-[#7C3AED] dark:text-[#8B5CF6] font-extrabold'
                : 'neu-button text-[var(--text-main)] opacity-80 hover:opacity-100'
                }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>Notifications</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 md:shrink min-h-[44px] transition-all duration-150 neu-focus ${activeTab === 'export'
                ? 'neu-inset text-[#7C3AED] dark:text-[#8B5CF6] font-extrabold'
                : 'neu-button text-[var(--text-main)] opacity-80 hover:opacity-100'
                }`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Data Export</span>
            </button>
          </div>
        </div>

        {/* Right Active Section Content Card */}
        <div className="md:col-span-8 lg:col-span-9 p-6 sm:p-8 rounded-3xl bg-[var(--bg-base)] neu-raised space-y-6">
          {/* SECTION 0 — PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--shadow-dark)]/20">
                <div className="p-2.5 rounded-2xl neu-inset-sm text-[#7C3AED] dark:text-[#8B5CF6]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[var(--text-main)]">
                    Profile
                  </h2>
                  <p className="text-xs text-[var(--text-main)] opacity-70 font-medium mt-0.5">
                    Manage your display name, bio, and avatar
                  </p>
                </div>
              </div>

              {/* Avatar Picker Container */}
              <div className="p-6 rounded-3xl neu-inset-sm space-y-5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[var(--text-main)] opacity-80">
                  Preset Avatar
                </label>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Large Selected Avatar Preview */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full neu-raised flex items-center justify-center p-1">
                      {getPresetAvatar(avatarId) ? (
                        (() => {
                          const preset = getPresetAvatar(avatarId)!;
                          const IconComp = preset.icon;
                          return (
                            <div className={`w-full h-full rounded-full ${preset.bgColor} text-white flex items-center justify-center shadow-inner`}>
                              <IconComp className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]" />
                            </div>
                          );
                        })()
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#7C3AED] text-white font-extrabold text-2xl flex items-center justify-center shadow-inner">
                          {userEmail ? userEmail.substring(0, 2).toUpperCase() : 'TF'}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-extrabold text-[var(--text-main)] opacity-70">
                      {getPresetAvatar(avatarId) ? getPresetAvatar(avatarId)!.name : 'Default Avatar'}
                    </span>
                  </div>

                  {/* Preset Avatar Grid */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-main)] opacity-70 mb-3">
                      Choose an avatar style (saves automatically):
                    </p>
                    <div className="grid grid-cols-5 gap-3">
                      {PRESET_AVATARS.map((avatar) => {
                        const isSelected = avatarId === avatar.id;
                        const IconComp = avatar.icon;
                        return (
                          <button
                            key={avatar.id}
                            type="button"
                            onClick={() => handleAvatarSelect(avatar.id)}
                            title={avatar.name}
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-150 neu-focus ${isSelected
                              ? `ring-4 ring-[#7C3AED] neu-inset-sm scale-105`
                              : `neu-button hover:scale-105`
                              }`}
                          >
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${avatar.bgColor} text-white flex items-center justify-center shadow-sm`}>
                              <IconComp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Name and Bio Form */}
              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                {/* Display Name Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[var(--text-main)]">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                    placeholder="Enter your display name"
                    maxLength={50}
                    className="w-full px-4 py-2.5 text-xs font-medium rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-main)]/40 focus:outline-none neu-focus"
                  />
                </div>

                {/* Bio Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-[var(--text-main)]">
                      Bio
                    </label>
                    <span className="text-[11px] font-bold text-[var(--text-main)] opacity-60">
                      {bio.length}/150
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 150))}
                    placeholder="Tell us a bit about yourself..."
                    maxLength={150}
                    className="w-full px-4 py-2.5 text-xs font-medium rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-main)]/40 focus:outline-none neu-focus resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-extrabold neu-button-primary neu-focus disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Saving Profile...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5] text-white" />
                        <span>Save Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          {/* SECTION 1 — APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--shadow-dark)]/20">
                <div className="p-2.5 rounded-2xl neu-inset-sm text-[#7C3AED] dark:text-[#8B5CF6]">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[var(--text-main)]">
                    Appearance & Theme
                  </h2>
                  <p className="text-xs text-[var(--text-main)] opacity-70 font-medium mt-0.5">
                    Customize how TaskFlow looks across your devices
                  </p>
                </div>
              </div>

              {/* Theme Mode Segmented Control */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-main)] opacity-80">
                  Theme Mode
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1.5 rounded-2xl neu-inset-sm bg-[var(--bg-base)]">
                  {/* Light Segment */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl text-xs font-extrabold transition-all duration-150 neu-focus ${themeMode === 'light'
                      ? 'neu-raised text-[#7C3AED] dark:text-[#8B5CF6]'
                      : 'text-[var(--text-main)] opacity-70 hover:opacity-100'
                      }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Light Mode</span>
                  </button>

                  {/* Dark Segment */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl text-xs font-extrabold transition-all duration-150 neu-focus ${themeMode === 'dark'
                      ? 'neu-raised text-[#7C3AED] dark:text-[#8B5CF6]'
                      : 'text-[var(--text-main)] opacity-70 hover:opacity-100'
                      }`}
                  >
                    <Moon className="w-4 h-4 text-purple-400" />
                    <span>Dark Mode</span>
                  </button>

                  {/* System Segment */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('system')}
                    className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl text-xs font-extrabold transition-all duration-150 neu-focus ${themeMode === 'system'
                      ? 'neu-raised text-[#7C3AED] dark:text-[#8B5CF6]'
                      : 'text-[var(--text-main)] opacity-70 hover:opacity-100'
                      }`}
                  >
                    <Monitor className="w-4 h-4 text-blue-500" />
                    <span>System Sync</span>
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-main)] opacity-60 font-semibold px-1">
                  System mode automatically matches your operating system's light or dark theme settings.
                </p>
              </div>

              {/* Accent Color Note */}
              <div className="p-4 rounded-2xl neu-inset-sm flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[var(--text-main)]">
                    Accent Color: Royal Purple (#7C3AED)
                  </h4>
                  <p className="text-[11px] text-[var(--text-main)] opacity-70 font-medium">
                    TaskFlow uses rich Royal Purple as its signature accent color for optimal focus and neumorphic contrast.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2 — CHANGE PASSWORD */}
          {activeTab === 'password' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--shadow-dark)]/20">
                <div className="p-2.5 rounded-2xl neu-inset-sm text-[#7C3AED] dark:text-[#8B5CF6]">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[var(--text-main)]">
                    Change Password
                  </h2>
                  <p className="text-xs text-[var(--text-main)] opacity-70 font-medium mt-0.5">
                    Update your account password securely
                  </p>
                </div>
              </div>

              {/* Alerts */}
              {passwordError && (
                <div className="p-3.5 rounded-2xl neu-inset-sm text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3.5 rounded-2xl neu-inset-sm text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[var(--text-main)]">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 text-xs font-medium rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-main)]/40 focus:outline-none neu-focus"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[var(--text-main)]">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    className="w-full px-4 py-2.5 text-xs font-medium rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-main)]/40 focus:outline-none neu-focus"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[var(--text-main)]">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Must match new password"
                    required
                    className="w-full px-4 py-2.5 text-xs font-medium rounded-2xl bg-[var(--bg-base)] neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-main)]/40 focus:outline-none neu-focus"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-extrabold neu-button-primary neu-focus disabled:opacity-50"
                  >
                    {updatingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 3 — NOTIFICATION PREFERENCES */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--shadow-dark)]/20">
                <div className="p-2.5 rounded-2xl neu-inset-sm text-[#7C3AED] dark:text-[#8B5CF6]">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[var(--text-main)]">
                    Notification Preferences
                  </h2>
                  <p className="text-xs text-[var(--text-main)] opacity-70 font-medium mt-0.5">
                    Configure your reminder and alert preferences
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-w-lg">
                {/* Overdue Task Reminder Toggle */}
                <div className="p-4 rounded-2xl neu-inset-sm flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-extrabold text-[var(--text-main)]">
                      Remind me about missed tasks from yesterday
                    </h4>
                    <p className="text-[11px] text-[var(--text-main)] opacity-70 font-medium mt-0.5">
                      Show a prompt on the Dashboard if yesterday's tasks were left incomplete without a reason
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNotificationToggle('notify_overdue')}
                    className={`w-12 h-6 rounded-full p-1 transition-all duration-200 shrink-0 neu-focus ${userSettings.notify_overdue
                      ? 'bg-[#7C3AED] shadow-[0_0_12px_rgba(124,58,237,0.45)]'
                      : 'bg-[#B4B9C4] dark:bg-gray-600 shadow-inner'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-md ${userSettings.notify_overdue ? 'translate-x-6' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>

                {/* Daily Summary Toggle */}
                <div className="p-4 rounded-2xl neu-inset-sm flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-extrabold text-[var(--text-main)]">
                      Daily Summary
                    </h4>
                    <p className="text-[11px] text-[var(--text-main)] opacity-70 font-medium mt-0.5">
                      Receive a daily recap of completed and pending tasks
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNotificationToggle('notify_daily_summary')}
                    className={`w-12 h-6 rounded-full p-1 transition-all duration-200 shrink-0 neu-focus ${userSettings.notify_daily_summary
                      ? 'bg-[#7C3AED] shadow-[0_0_12px_rgba(124,58,237,0.45)]'
                      : 'bg-[#B4B9C4] dark:bg-gray-600 shadow-inner'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-md ${userSettings.notify_daily_summary ? 'translate-x-6' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>

                {/* Streak Reminders Toggle */}
                <div className="p-4 rounded-2xl neu-inset-sm flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-extrabold text-[var(--text-main)]">
                      Streak Reminders
                    </h4>
                    <p className="text-[11px] text-[var(--text-main)] opacity-70 font-medium mt-0.5">
                      Get warned before your daily task completion streak breaks
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNotificationToggle('notify_streak')}
                    className={`w-12 h-6 rounded-full p-1 transition-all duration-200 shrink-0 neu-focus ${userSettings.notify_streak
                      ? 'bg-[#7C3AED] shadow-[0_0_12px_rgba(124,58,237,0.45)]'
                      : 'bg-[#B4B9C4] dark:bg-gray-600 shadow-inner'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-md ${userSettings.notify_streak ? 'translate-x-6' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>
              </div>

              {/* Explanatory Footnote Note */}
              <p className="text-xs text-[var(--text-main)] opacity-60 italic font-medium pt-2 border-t border-[var(--shadow-dark)]/20">
                Notification delivery coming soon — your preferences are saved and will apply once enabled.
              </p>
            </div>
          )}

          {/* SECTION 4 — DATA EXPORT / BACKUP */}
          {activeTab === 'export' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--shadow-dark)]/20">
                <div className="p-2.5 rounded-2xl neu-inset-sm text-[#7C3AED] dark:text-[#8B5CF6]">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[var(--text-main)]">
                    Data Export & Backup
                  </h2>
                  <p className="text-xs text-[var(--text-main)] opacity-70 font-medium mt-0.5">
                    Download complete CSV backups of your TaskFlow data
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-w-lg">
                {/* Export All Tasks Button Card */}
                <div className="p-5 rounded-2xl neu-inset-sm space-y-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-[var(--text-main)]">
                      Export All Tasks
                    </h4>
                    <p className="text-[11px] text-[var(--text-main)] opacity-70 font-medium mt-0.5">
                      Generates a CSV file with columns: title, description, category, priority, created_at, is_active.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportTasks}
                    disabled={exportingTasks}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold neu-button-primary neu-focus disabled:opacity-50"
                  >
                    {exportingTasks ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Generating CSV...</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4 text-white" />
                        <span>Export All Tasks as CSV</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Export Completion History Button Card */}
                <div className="p-5 rounded-2xl neu-inset-sm space-y-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-[var(--text-main)]">
                      Export Completion & Reason History
                    </h4>
                    <p className="text-[11px] text-[var(--text-main)] opacity-70 font-medium mt-0.5">
                      Generates a CSV file joining completed dates, task titles, and daily reasons/skip notes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCompletionHistory}
                    disabled={exportingHistory}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold neu-button-primary neu-focus disabled:opacity-50"
                  >
                    {exportingHistory ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Generating History CSV...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-white" />
                        <span>Export Completion History as CSV</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
