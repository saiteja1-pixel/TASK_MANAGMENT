import { Task, TaskCompletion } from './types/database';

export interface AnalyticsStats {
  totalCreated: number;
  totalCompleted: number;
  completionRate: number;
  currentStreak: number;
}

export interface DayActivityData {
  dateStr: string; // YYYY-MM-DD
  label: string;   // MMM DD
  created: number;
  completed: number;
}

export interface CategoryData {
  name: string;
  count: number;
  percentage: number;
}

export interface PriorityData {
  priority: string;
  name: string;
  count: number;
  color: string;
}

export interface HeatmapDay {
  dateStr: string;
  formattedDate: string;
  count: number;
  dayOfWeek: number; // 0-6 (Sun-Sat)
}

export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateAnalyticsStats(tasks: Task[], completions: TaskCompletion[] = []): AnalyticsStats {
  const activeTasks = tasks.filter((t) => t.is_active !== false);
  const totalCreated = activeTasks.length;
  const totalCompleted = completions.length;
  const completionRate = totalCreated > 0 ? Math.round((totalCompleted / (totalCreated + totalCompleted)) * 100) : 0;

  // Streak calculation based on task_completions completed_date
  const completedDatesSet = new Set<string>();
  completions.forEach((c) => {
    if (c.completed_date) {
      completedDatesSet.add(c.completed_date);
    }
  });

  const today = new Date();
  const todayStr = formatDateToYYYYMMDD(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateToYYYYMMDD(yesterday);

  let currentStreak = 0;
  let checkDate = new Date();

  if (completedDatesSet.has(todayStr)) {
    checkDate = today;
  } else if (completedDatesSet.has(yesterdayStr)) {
    checkDate = yesterday;
  } else {
    return { totalCreated, totalCompleted, completionRate, currentStreak: 0 };
  }

  while (true) {
    const dStr = formatDateToYYYYMMDD(checkDate);
    if (completedDatesSet.has(dStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    totalCreated,
    totalCompleted,
    completionRate,
    currentStreak,
  };
}

export function get14DaysActivity(tasks: Task[], completions: TaskCompletion[] = []): DayActivityData[] {
  const result: DayActivityData[] = [];
  const today = new Date();

  // Create map for created and completed counts
  const createdMap = new Map<string, number>();
  const completedMap = new Map<string, number>();

  tasks.forEach((t) => {
    if (t.created_at) {
      const dStr = formatDateToYYYYMMDD(new Date(t.created_at));
      createdMap.set(dStr, (createdMap.get(dStr) || 0) + 1);
    }
  });

  completions.forEach((c) => {
    if (c.completed_date) {
      completedMap.set(c.completed_date, (completedMap.get(c.completed_date) || 0) + 1);
    }
  });

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateToYYYYMMDD(d);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    result.push({
      dateStr,
      label,
      created: createdMap.get(dateStr) || 0,
      completed: completedMap.get(dateStr) || 0,
    });
  }

  return result;
}

export function getCategoryBreakdown(tasks: Task[]): CategoryData[] {
  const activeTasks = tasks.filter((t) => t.is_active !== false);
  const categoryCounts = new Map<string, number>();
  const total = activeTasks.length;

  activeTasks.forEach((t) => {
    const cat = t.category && t.category.trim() !== '' ? t.category.trim() : 'Uncategorized';
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  });

  const result: CategoryData[] = [];
  categoryCounts.forEach((count, name) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    result.push({ name, count, percentage });
  });

  return result.sort((a, b) => b.count - a.count);
}

export function getPriorityDistribution(tasks: Task[]): PriorityData[] {
  const activeTasks = tasks.filter((t) => t.is_active !== false);
  const counts = { high: 0, medium: 0, low: 0 };

  activeTasks.forEach((t) => {
    if (t.priority in counts) {
      counts[t.priority as keyof typeof counts]++;
    }
  });

  return [
    { priority: 'high', name: 'High Priority', count: counts.high, color: '#EF4444' },
    { priority: 'medium', name: 'Medium Priority', count: counts.medium, color: '#F59E0B' },
    { priority: 'low', name: 'Low Priority', count: counts.low, color: '#10B981' },
  ];
}

export function get90DaysHeatmap(tasks: Task[], completions: TaskCompletion[] = []): HeatmapDay[] {
  const completedMap = new Map<string, number>();

  completions.forEach((c) => {
    if (c.completed_date) {
      completedMap.set(c.completed_date, (completedMap.get(c.completed_date) || 0) + 1);
    }
  });

  const result: HeatmapDay[] = [];
  const today = new Date();

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateToYYYYMMDD(d);
    const formattedDate = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    result.push({
      dateStr,
      formattedDate,
      count: completedMap.get(dateStr) || 0,
      dayOfWeek: d.getDay(),
    });
  }

  return result;
}
