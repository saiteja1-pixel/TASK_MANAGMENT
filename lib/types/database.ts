export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: string | null;
  due_date: string | null; // ISO date string 'YYYY-MM-DD'
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  is_active?: boolean;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completed_date: string; // 'YYYY-MM-DD'
  completed_at: string; // ISO timestamp
}

export interface TaskDailyNote {
  id: string;
  task_id: string;
  user_id: string;
  note_date: string; // 'YYYY-MM-DD'
  reason: string;
  is_skipped?: boolean;
  created_at?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserSettings {
  user_id: string;
  theme: ThemeMode;
  notify_overdue: boolean;
  notify_daily_summary: boolean;
  notify_streak: boolean;
  updated_at?: string;
}

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_id: string | null;
  updated_at?: string;
}

export interface TaskCreateInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string | null;
  due_date?: string | null;
  is_active?: boolean;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  is_active?: boolean;
}

export interface DashboardStats {
  completedToday: number;
  pending: number;
  overdue: number;
  streak?: number;
}
