import { TaskCompletion } from './types/database';

const LOCAL_STORAGE_KEY = 'taskflow_local_completions';

export function getLocalCompletions(currentUserId?: string | null): TaskCompletion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list: TaskCompletion[] = raw ? JSON.parse(raw) : [];
    if (currentUserId) {
      return list.filter((c) => c.user_id === currentUserId);
    }
    return list;
  } catch (err) {
    console.error('Error reading local completions:', err);
    return [];
  }
}

export function saveLocalCompletion(completion: TaskCompletion): TaskCompletion[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getLocalCompletions();
    const filtered = current.filter(
      (c) => !(c.task_id === completion.task_id && c.completed_date === completion.completed_date)
    );
    const updated = [...filtered, completion];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving local completion:', err);
    return [];
  }
}

export function removeLocalCompletion(taskId: string, dateStr: string): TaskCompletion[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getLocalCompletions();
    const updated = current.filter(
      (c) => !(c.task_id === taskId && c.completed_date === dateStr)
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error removing local completion:', err);
    return [];
  }
}

export function clearLocalUserData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem('taskflow_local_daily_notes');
    localStorage.removeItem('taskflow_user_profile');
  } catch (err) {
    console.error('Error clearing local user data:', err);
  }
}
