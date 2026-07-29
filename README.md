# TaskFlow 🚀

A modern, persistent task management web application built with **Next.js 14 (App Router)**, **Supabase (Auth + PostgreSQL)**, and **Tailwind CSS**.

---

## 🌟 Core Concept — Persistent Tasks

Tasks in TaskFlow are **NOT** reset daily. A task added today remains visible on your dashboard every day until you mark it complete, edit it, or delete it. Completed tasks are stored in the database for future analytics.

---

## ✨ Features

- 🔐 **Authentication**: Supabase email/password login and signup with protected routes.
- ⚡ **Quick-Add Bar**: Instant task creation with title input (default priority `medium`, status `todo`).
- 📋 **Today's Active Tasks**: Shows all active tasks (`status != 'done'`), sorted by priority (`high` $\rightarrow$ `medium` $\rightarrow$ `low`) and due date.
- 🚨 **Overdue Task Warnings**: Overdue tasks (`due_date < today` and `status != 'done'`) highlighted with warning badges at top.
- ✏️ **Full Task CRUD**: Interactive check-to-complete, edit modal (title, description, status, priority, category, due date), and delete.
- 📊 **Dashboard Stats**: Real-time counter of tasks completed today, pending tasks, and overdue items.
- 🌙 **Dark Mode Toggle**: Persistent theme setting saved in `localStorage`.
- 📱 **Mobile Responsive**: Adaptive layout for desktop, tablet, and mobile viewports.

---

## 🛠️ Supabase Setup & Database Schema

1. Create a project at [Supabase](https://supabase.com).
2. Go to **SQL Editor** in your Supabase Dashboard and run the following script:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexing for user tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON public.tasks(user_id, due_date);

-- Trigger for auto-updating updated_at column
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE USING (auth.uid() = user_id);
```

---

## 🔑 Environment Variables Setup

Create a `.env.local` file in the root directory (refer to `.env.local.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

Get these credentials from: **Supabase Dashboard $\rightarrow$ Project Settings $\rightarrow$ API**.

---

## 🚀 Running Locally

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
.
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard/
│   │   ├── EditTaskModal.tsx
│   │   ├── QuickAddBar.tsx
│   │   ├── StatsBar.tsx
│   │   ├── TaskItem.tsx
│   │   └── TaskList.tsx
│   ├── layout/
│   │   ├── Footer.tsx
│   │   └── Navbar.tsx
│   └── ui/
│       └── ThemeProvider.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── middleware.ts
│   │   └── server.ts
│   ├── types/
│   │   └── database.ts
│   └── utils.ts
├── middleware.ts
├── supabase_schema.sql
├── .env.local.example
└── README.md
```
