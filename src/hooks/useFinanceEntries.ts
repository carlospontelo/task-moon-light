/* @refresh reset */
import { useState, useCallback, useEffect, useRef } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { addMonths } from '@/types/expense';
import {
  FinanceEntry, FinanceEntryKind, FinanceEntryRow, EntryScope, RECURRING_MONTHS,
} from '@/types/financeEntry';

// `finance_entries` isn't in the generated types until the migration runs.
const table = () => (supabase as unknown as SupabaseClient).from('finance_entries');

const mapRow = (r: FinanceEntryRow): FinanceEntry => ({
  id: r.id,
  kind: r.kind,
  description: r.description ?? '',
  amount: r.amount,
  month: r.month,
  recurring: r.recurring,
  seriesId: r.series_id ?? undefined,
  createdAt: new Date(r.created_at),
});

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === 'PGRST205' || error.code === '42P01'
    || /does not exist|could not find the table/i.test(error.message ?? '');
}

const UNAVAILABLE_MESSAGE = 'Entradas e investimentos ficam disponíveis depois da atualização do banco';

export function useFinanceEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  /** null = unknown yet; false = table doesn't exist (pre-migration). */
  const [available, setAvailable] = useState<boolean | null>(null);
  const warned = useRef(false);

  const handleWriteError = useCallback((error: { code?: string; message?: string } | null) => {
    if (!isMissingTable(error)) return;
    setAvailable(false);
    if (!warned.current) {
      warned.current = true;
      toast(UNAVAILABLE_MESSAGE);
    }
  }, []);

  // Fetch once per user. A missing table is expected before the migration: stay silent.
  useEffect(() => {
    if (!user) { setEntries([]); return; }
    let cancelled = false;
    table()
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setAvailable(isMissingTable(error) ? false : true);
          return;
        }
        setAvailable(true);
        setEntries((data as FinanceEntryRow[]).map(mapRow));
      });
    return () => { cancelled = true; };
  }, [user]);

  // Realtime only once we know the table exists.
  useEffect(() => {
    if (!user || available !== true) return;
    const channel = supabase
      .channel('finance-entries-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_entries', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = payload.new as FinanceEntryRow;
          setEntries(prev => (prev.some(e => e.id === row.id) ? prev : [...prev, mapRow(row)]));
        } else if (payload.eventType === 'UPDATE') {
          const row = payload.new as FinanceEntryRow;
          setEntries(prev => prev.map(e => (e.id === row.id ? mapRow(row) : e)));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as Partial<FinanceEntryRow>).id;
          setEntries(prev => prev.filter(e => e.id !== id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, available]);

  const addEntry = useCallback(async (data: {
    kind: FinanceEntryKind; description: string; amount: number; month: string; recurring: boolean;
  }) => {
    if (!user) return;
    const seriesId = data.recurring ? crypto.randomUUID() : null;
    const count = data.recurring ? RECURRING_MONTHS : 1;
    const rows: Omit<FinanceEntryRow, 'created_at'>[] = [];
    for (let i = 0; i < count; i++) {
      rows.push({
        id: crypto.randomUUID(), user_id: user.id, kind: data.kind,
        description: data.description.trim() || null, amount: data.amount,
        month: addMonths(data.month, i), recurring: data.recurring, series_id: seriesId,
      });
    }
    const temps = rows.map(r => mapRow({ ...r, created_at: new Date().toISOString() }));
    setEntries(prev => [...prev, ...temps]);
    const { error } = await table().insert(rows);
    if (error) {
      const ids = new Set(rows.map(r => r.id));
      setEntries(prev => prev.filter(e => !ids.has(e.id)));
      handleWriteError(error);
    }
  }, [user, handleWriteError]);

  const updateEntry = useCallback(async (
    id: string, data: { description: string; amount: number }, scope: EntryScope = 'this',
  ) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    const prev = entries;
    const inScope = (e: FinanceEntry) =>
      e.id === id || (scope === 'from_this' && !!entry.seriesId && e.seriesId === entry.seriesId && e.month >= entry.month);
    setEntries(list => list.map(e => (inScope(e) ? { ...e, ...data } : e)));

    const dbData = { description: data.description.trim() || null, amount: data.amount };
    const { error } = scope === 'from_this' && entry.seriesId
      ? await table().update(dbData).eq('series_id', entry.seriesId).gte('month', entry.month)
      : await table().update(dbData).eq('id', id);
    if (error) { setEntries(prev); handleWriteError(error); }
  }, [entries, handleWriteError]);

  const deleteEntry = useCallback(async (id: string, scope: EntryScope = 'this') => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    const prev = entries;
    setEntries(list => list.filter(e => {
      if (e.id === id) return false;
      if (scope === 'from_this' && entry.seriesId && e.seriesId === entry.seriesId && e.month >= entry.month) return false;
      return true;
    }));

    const { error } = scope === 'from_this' && entry.seriesId
      ? await table().delete().eq('series_id', entry.seriesId).gte('month', entry.month)
      : await table().delete().eq('id', id);
    if (error) { setEntries(prev); handleWriteError(error); }
  }, [entries, handleWriteError]);

  const getEntries = useCallback(
    (kind: FinanceEntryKind, month: string) => entries.filter(e => e.kind === kind && e.month === month),
    [entries],
  );

  const getTotal = useCallback(
    (kind: FinanceEntryKind, month: string) =>
      entries.reduce((sum, e) => (e.kind === kind && e.month === month ? sum + e.amount : sum), 0),
    [entries],
  );

  return { entries, available, addEntry, updateEntry, deleteEntry, getEntries, getTotal };
}

export type FinanceEntriesApi = ReturnType<typeof useFinanceEntries>;
