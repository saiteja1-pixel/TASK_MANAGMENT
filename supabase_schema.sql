-- TaskFlow Database Schema for Supabase PostgreSQL

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Tasks table (Permanent Task List)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT,
  due_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Ensure is_active exists if table already existed
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Indexes for tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON public.tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_active ON public.tasks(user_id, is_active);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS) on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
CREATE POLICY "Users can create their own tasks"
  ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE USING (auth.uid() = user_id);


-- Create Task Completions table (Daily Recurring Checklist Records)
CREATE TABLE IF NOT EXISTS public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_task_completed_date UNIQUE (task_id, completed_date)
);

-- Index for task completions querying
CREATE INDEX IF NOT EXISTS idx_task_completions_user_date ON public.task_completions(user_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_date ON public.task_completions(task_id, completed_date);

-- Enable RLS on task_completions
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their task completions" ON public.task_completions;
CREATE POLICY "Users can view their task completions"
  ON public.task_completions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their task completions" ON public.task_completions;
CREATE POLICY "Users can insert their task completions"
  ON public.task_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their task completions" ON public.task_completions;
CREATE POLICY "Users can update their task completions"
  ON public.task_completions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their task completions" ON public.task_completions;
CREATE POLICY "Users can delete their task completions"
  ON public.task_completions FOR DELETE USING (auth.uid() = user_id);

-- Migration for existing data: Migrate completed tasks into task_completions
INSERT INTO public.task_completions (task_id, user_id, completed_date, completed_at)
SELECT id, user_id, DATE(completed_at), completed_at
FROM public.tasks
WHERE completed_at IS NOT NULL
ON CONFLICT (task_id, completed_date) DO NOTHING;

-- Reset tasks to active
UPDATE public.tasks SET is_active = true WHERE is_active IS FALSE;

-- Create Task Daily Notes table (Reasons for uncompleted/skipped tasks on a given day)
CREATE TABLE IF NOT EXISTS public.task_daily_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,
  reason TEXT NOT NULL,
  is_skipped BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_task_note_date UNIQUE (task_id, note_date)
);

-- Index for task daily notes querying
CREATE INDEX IF NOT EXISTS idx_task_daily_notes_user_date ON public.task_daily_notes(user_id, note_date);
CREATE INDEX IF NOT EXISTS idx_task_daily_notes_task_date ON public.task_daily_notes(task_id, note_date);

-- Enable RLS on task_daily_notes
ALTER TABLE public.task_daily_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their task daily notes" ON public.task_daily_notes;
CREATE POLICY "Users can view their task daily notes"
  ON public.task_daily_notes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their task daily notes" ON public.task_daily_notes;
CREATE POLICY "Users can insert their task daily notes"
  ON public.task_daily_notes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their task daily notes" ON public.task_daily_notes;
CREATE POLICY "Users can update their task daily notes"
  ON public.task_daily_notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their task daily notes" ON public.task_daily_notes;
CREATE POLICY "Users can delete their task daily notes"
  ON public.task_daily_notes FOR DELETE USING (auth.uid() = user_id);

-- Create User Settings table (Preferences for Theme, Notifications, etc.)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  notify_overdue BOOLEAN NOT NULL DEFAULT true,
  notify_daily_summary BOOLEAN NOT NULL DEFAULT false,
  notify_streak BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their user_settings" ON public.user_settings;
CREATE POLICY "Users can view their user_settings"
  ON public.user_settings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their user_settings" ON public.user_settings;
CREATE POLICY "Users can insert their user_settings"
  ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their user_settings" ON public.user_settings;
CREATE POLICY "Users can update their user_settings"
  ON public.user_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their user_settings" ON public.user_settings;
CREATE POLICY "Users can delete their user_settings"
  ON public.user_settings FOR DELETE USING (auth.uid() = user_id);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NULL,
  bio TEXT NULL,
  avatar_id TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their user_profiles" ON public.user_profiles;
CREATE POLICY "Users can view their user_profiles"
  ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their user_profiles" ON public.user_profiles;
CREATE POLICY "Users can insert their user_profiles"
  ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their user_profiles" ON public.user_profiles;
CREATE POLICY "Users can update their user_profiles"
  ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their user_profiles" ON public.user_profiles;
CREATE POLICY "Users can delete their user_profiles"
  ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);

-- Trigger to auto-create user profile on signup (Email & OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


