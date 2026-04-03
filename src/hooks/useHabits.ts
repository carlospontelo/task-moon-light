import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Habit {
  id: string;
  name: string;
  sortOrder: number;
}

export interface HabitEntry {
  habitId: string;
  date: string;
  completed: boolean;
}

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);

  const fetchHabits = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order');
    if (data) {
      setHabits(data.map((h: any) => ({ id: h.id, name: h.name, sortOrder: h.sort_order })));
    }
  }, [user]);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('habit_entries')
      .select('*')
      .eq('user_id', user.id);
    if (data) {
      setEntries(data.map((e: any) => ({ habitId: e.habit_id, date: e.date, completed: e.completed })));
    }
  }, [user]);

  useEffect(() => {
    fetchHabits();
    fetchEntries();
  }, [fetchHabits, fetchEntries]);

  // Realtime for entries
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('habit-entries-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_entries', filter: `user_id=eq.${user.id}` }, () => {
        fetchEntries();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchEntries]);

  const addHabit = useCallback(async (name: string) => {
    if (!user) return;
    const maxOrder = habits.length > 0 ? Math.max(...habits.map(h => h.sortOrder)) + 1 : 0;
    await supabase.from('habits').insert({ user_id: user.id, name, sort_order: maxOrder });
    await fetchHabits();
  }, [user, habits, fetchHabits]);

  const deleteHabit = useCallback(async (id: string) => {
    await supabase.from('habits').delete().eq('id', id);
    await fetchHabits();
  }, [fetchHabits]);

  const toggleEntry = useCallback(async (habitId: string, date: string) => {
    if (!user) return;
    const existing = entries.find(e => e.habitId === habitId && e.date === date);
    if (existing) {
      if (existing.completed) {
        await supabase.from('habit_entries').delete().eq('habit_id', habitId).eq('date', date);
      } else {
        await supabase.from('habit_entries').update({ completed: true }).eq('habit_id', habitId).eq('date', date);
      }
    } else {
      await supabase.from('habit_entries').insert({ habit_id: habitId, user_id: user.id, date, completed: true });
    }
    // Optimistic
    setEntries(prev => {
      const filtered = prev.filter(e => !(e.habitId === habitId && e.date === date));
      if (!existing || !existing.completed) {
        filtered.push({ habitId, date, completed: true });
      }
      return filtered;
    });
  }, [user, entries]);

  const isCompleted = useCallback((habitId: string, date: string) => {
    return entries.some(e => e.habitId === habitId && e.date === date && e.completed);
  }, [entries]);

  // Daily completion rate for a given month (for chart)
  const getDailyCompletionRates = useCallback((month: string) => {
    const [year, m] = month.split('-').map(Number);
    const daysInMonth = new Date(year, m, 0).getDate();
    const rates: { day: number; rate: number }[] = [];
    
    if (habits.length === 0) return rates;
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const completedCount = entries.filter(e => e.date === dateStr && e.completed).length;
      rates.push({ day: d, rate: Math.round((completedCount / habits.length) * 100) });
    }
    return rates;
  }, [habits, entries]);

  const getDaysInMonth = useCallback((month: string) => {
    const [year, m] = month.split('-').map(Number);
    return new Date(year, m, 0).getDate();
  }, []);

  const reorderHabits = useCallback(async (reordered: { id: string; sortOrder: number }[]) => {
    setHabits(prev => {
      const updated = [...prev];
      for (const r of reordered) {
        const idx = updated.findIndex(h => h.id === r.id);
        if (idx !== -1) updated[idx] = { ...updated[idx], sortOrder: r.sortOrder };
      }
      return updated.sort((a, b) => a.sortOrder - b.sortOrder);
    });
    for (const r of reordered) {
      await supabase.from('habits').update({ sort_order: r.sortOrder }).eq('id', r.id);
    }
  }, []);

  return {
    habits, entries, addHabit, deleteHabit, toggleEntry, isCompleted,
    getDailyCompletionRates, getDaysInMonth, reorderHabits,
  };
}
