import { TaskDailyNote } from './types/database';

const LOCAL_STORAGE_KEY = 'taskflow_local_daily_notes';

export function getLocalDailyNotes(currentUserId?: string | null): TaskDailyNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list: TaskDailyNote[] = raw ? JSON.parse(raw) : [];
    if (currentUserId) {
      return list.filter((n) => n.user_id === currentUserId);
    }
    return list;
  } catch (err) {
    console.error('Error reading local daily notes:', err);
    return [];
  }
}

export function saveLocalDailyNote(note: TaskDailyNote): TaskDailyNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getLocalDailyNotes();
    const filtered = current.filter(
      (n) => !(n.task_id === note.task_id && n.note_date === note.note_date)
    );
    const updated = [...filtered, note];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving local daily note:', err);
    return [];
  }
}

export function removeLocalDailyNote(taskId: string, dateStr: string): TaskDailyNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getLocalDailyNotes();
    const updated = current.filter(
      (n) => !(n.task_id === taskId && n.note_date === dateStr)
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error removing local daily note:', err);
    return [];
  }
}
