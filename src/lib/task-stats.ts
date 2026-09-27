import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import type { Task, TaskStatus } from '@/types/task';

const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');
export const todayKey = () => dayKey(new Date());

/* ---------- Due dates ---------- */

/**
 * `date` is NOT NULL and defaults to the creation day, so a date equal to the
 * creation day is not a real deadline and isn't shown.
 */
export function createdDayKey(task: Task): string {
  try {
    return dayKey(parseISO(task.createdAt));
  } catch {
    return task.date;
  }
}

export const hasDueDate = (task: Task) => task.date !== createdDayKey(task);

export const isOverdue = (task: Task, today = todayKey()) =>
  task.status !== 'completed' && hasDueDate(task) && task.date < today;

/* ---------- Temporary completion log (until `completed_at` exists) ---------- */

const LOG_KEY = 'task-completions-v1';

function readLog(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '{}');
  } catch {
    return {};
  }
}

/** Records UI completions per browser. Only used while the DB has no `completed_at`. */
export function logStatusChange(id: string, status: TaskStatus) {
  try {
    const log = readLog();
    if (status === 'completed') log[id] = todayKey();
    else delete log[id];
    // Keep the log small: drop entries older than today.
    const today = todayKey();
    for (const k of Object.keys(log)) if (log[k] !== today) delete log[k];
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  } catch {
    // Storage unavailable — the column just stays empty until the migration runs.
  }
}

/** Local day a task was completed, or null if unknown / not completed. */
export function completionDay(task: Task, log = readLog()): string | null {
  if (task.status !== 'completed') return null;
  if (task.completedAt) return dayKey(parseISO(task.completedAt));
  if (task.completedAt === undefined) return log[task.id] ?? null;
  return null;
}

export function completedToday(tasks: Task[], today = todayKey()): Task[] {
  const log = readLog();
  return tasks.filter(t => completionDay(t, log) === today);
}

/* ---------- Progress stats (need `completed_at`) ---------- */

function countsByDay(tasks: Task[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    if (t.status !== 'completed' || !t.completedAt) continue;
    const k = dayKey(parseISO(t.completedAt));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

export interface ProgressStats {
  today: number;
  /** Rounded daily average of the 7 days before today; null when there's no history. */
  average: number | null;
  streak: number;
  week: { key: string; label: string; count: number; isToday: boolean }[];
  weekTotal: number;
}

const WEEKDAY_LABELS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

export function computeProgress(tasks: Task[], now = new Date()): ProgressStats {
  const counts = countsByDay(tasks);
  const today = dayKey(now);
  const get = (d: Date) => counts.get(dayKey(d)) ?? 0;

  // Average over the previous 7 days, only if any completion exists before today.
  const hasHistory = [...counts.keys()].some(k => k < today);
  let sum = 0;
  for (let i = 1; i <= 7; i++) sum += get(addDays(now, -i));
  const average = hasHistory ? Math.round(sum / 7) : null;

  // Streak: consecutive days with ≥1 completion, ending today or yesterday.
  let cursor = get(now) > 0 ? now : addDays(now, -1);
  let streak = 0;
  while (get(cursor) > 0) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const week = WEEKDAY_LABELS.map((label, i) => {
    const d = addDays(monday, i);
    const key = dayKey(d);
    return { key, label, count: get(d), isToday: key === today };
  });

  return {
    today: get(now),
    average,
    streak,
    week,
    weekTotal: week.reduce((s, d) => s + d.count, 0),
  };
}

export function averageMessage(today: number, average: number | null): string {
  if (average === null) return 'Primeiro dia registrado';
  const diff = today - average;
  if (diff > 0) return `+${diff} acima da sua média`;
  if (diff === 0) return 'Na sua média';
  return `Faltam ${-diff} para sua média`;
}
