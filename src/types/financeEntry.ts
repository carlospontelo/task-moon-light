// Local types for `finance_entries` (not yet in the generated Supabase types).
export type FinanceEntryKind = 'income' | 'investment';

export interface FinanceEntryRow {
  id: string;
  user_id: string;
  kind: FinanceEntryKind;
  description: string | null;
  amount: number; // cents
  month: string; // "2024-12", same format as expenses
  recurring: boolean;
  series_id: string | null;
  created_at: string;
}

export interface FinanceEntry {
  id: string;
  kind: FinanceEntryKind;
  description: string;
  amount: number; // cents
  month: string;
  recurring: boolean;
  seriesId?: string;
  createdAt: Date;
}

export type EntryScope = 'this' | 'from_this';

/** Recurring entries are replicated like fixed expenses: start month + 12. */
export const RECURRING_MONTHS = 13;
