import { format, parseISO } from 'date-fns';
import type { Task } from '@/types/task';

export const FOCUS_LIMIT = 3;
export const FOCUS_LIMIT_MESSAGE = `Foco tem no máximo ${FOCUS_LIMIT} tarefas`;

export type DueState = 'none' | 'overdue' | 'today' | 'upcoming';

export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Local calendar day the task was created on (yyyy-MM-dd). */
export function createdDayKey(task: Task): string {
  try {
    return format(parseISO(task.createdAt), 'yyyy-MM-dd');
  } catch {
    return task.date;
  }
}

/**
 * `date` is NOT NULL and defaults to the creation day, so a task whose date equals
 * its creation day is treated as having no due date.
 */
export function hasDueDate(task: Task): boolean {
  return task.date !== createdDayKey(task);
}

export function getDueState(task: Task, today = todayKey()): DueState {
  if (!hasDueDate(task)) return 'none';
  if (task.date < today) return 'overdue';
  if (task.date > today) return 'upcoming';
  return 'today';
}

export const isFocus = (t: Task) => t.boardGroup === 'pinned' || t.pinned;
export const isSomeday = (t: Task) => t.boardGroup === 'standby' && !t.pinned;

const bySortOrder = (a: Task, b: Task) => a.sortOrder - b.sortOrder;
const byDateThenOrder = (a: Task, b: Task) => a.date.localeCompare(b.date) || a.sortOrder - b.sortOrder;

export interface TaskSections {
  /** Up to FOCUS_LIMIT focus tasks, by sort order. */
  focus: Task[];
  /** Past-due tasks, oldest first. */
  overdue: Task[];
  /** Tasks due today or without a due date — the default list. */
  main: Task[];
  /** Future-dated tasks, soonest first. */
  upcoming: Task[];
  someday: Task[];
  completed: Task[];
}

export function classifyTasks(tasks: Task[], today = todayKey()): TaskSections {
  const completed: Task[] = [];
  const someday: Task[] = [];
  const focusAll: Task[] = [];
  const rest: Task[] = [];

  for (const t of tasks) {
    if (t.status === 'completed') completed.push(t);
    else if (isSomeday(t)) someday.push(t);
    else if (isFocus(t)) focusAll.push(t);
    else rest.push(t);
  }

  // Array.prototype.sort is stable, so ties keep the fetch order (sort_order, created_at desc).
  focusAll.sort(bySortOrder);
  const focus = focusAll.slice(0, FOCUS_LIMIT);
  // Focus overflow (legacy data with > 3 pinned) shows in the list without touching the DB.
  rest.push(...focusAll.slice(FOCUS_LIMIT));

  const overdue: Task[] = [];
  const main: Task[] = [];
  const upcoming: Task[] = [];
  for (const t of rest) {
    const due = getDueState(t, today);
    if (due === 'overdue') overdue.push(t);
    else if (due === 'upcoming') upcoming.push(t);
    else main.push(t);
  }

  return {
    focus,
    overdue: overdue.sort(byDateThenOrder),
    main: main.sort(bySortOrder),
    upcoming: upcoming.sort(byDateThenOrder),
    someday: someday.sort(bySortOrder),
    completed: completed.sort(bySortOrder),
  };
}
