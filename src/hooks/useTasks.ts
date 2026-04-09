/* @refresh reset */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskStatus, BoardGroup } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfDay } from 'date-fns';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const cleanupDone = useRef(false);

  const mapRow = (t: any): Task => ({
    id: t.id,
    title: t.title,
    status: t.status as TaskStatus,
    tag: t.tag || undefined,
    date: t.date,
    createdAt: t.created_at,
    pinned: t.pinned ?? false,
    boardGroup: (t.board_group as BoardGroup) || 'today',
    sortOrder: t.sort_order ?? 0,
  });

  // Cleanup runs once on mount
  useEffect(() => {
    if (!user || cleanupDone.current) return;
    cleanupDone.current = true;
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
    supabase.from('tasks').delete().eq('user_id', user.id).eq('status', 'completed').lt('date', today).then();
  }, [user]);

  const fetchTasks = useCallback(async () => {
    if (!user) { setTasks([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) setTasks(data.map(mapRow));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Realtime — skip if optimistic state already matches
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks((prev) => {
            if (prev.some((t) => t.id === (payload.new as any).id)) {
              // Replace temp/optimistic entry with real data
              return prev.map(t => t.id === (payload.new as any).id ? mapRow(payload.new) : t);
            }
            return [mapRow(payload.new), ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setTasks((prev) => prev.map((t) => t.id === (payload.new as any).id ? mapRow(payload.new) : t));
        } else if (payload.eventType === 'DELETE') {
          setTasks((prev) => prev.filter((t) => t.id !== (payload.old as any).id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addTask = useCallback(async (title: string, options?: { date?: string; tag?: string; boardGroup?: BoardGroup }) => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const group = options?.boardGroup || 'today';
    const tagValue = options?.tag && options.tag.trim() !== '' ? options.tag : undefined;
    const tempId = crypto.randomUUID();
    const tempTask: Task = {
      id: tempId, title, status: 'pending', tag: tagValue,
      date: options?.date || today, createdAt: new Date().toISOString(),
      pinned: group === 'pinned', boardGroup: group, sortOrder: 0,
    };
    // Optimistic
    setTasks(prev => [tempTask, ...prev]);
    const { error } = await supabase.from('tasks').insert({
      id: tempId, user_id: user.id, title, status: 'pending', tag: tagValue || null,
      date: options?.date || today, pinned: group === 'pinned', board_group: group,
    });
    if (error) {
      console.error('[addTask] Insert failed:', error.message);
      setTasks(prev => prev.filter(t => t.id !== tempId));
    }
  }, [user]);

  const updateTaskStatus = useCallback(async (id: string, status: TaskStatus) => {
    setTasks(prev => {
      const rollback = prev;
      const updated = prev.map(t => t.id === id ? { ...t, status } : t);
      supabase.from('tasks').update({ status }).eq('id', id).then(({ error }) => {
        if (error) setTasks(rollback);
      });
      return updated;
    });
  }, []);

  const updateTask = useCallback(async (id: string, updates: { date?: string; tag?: string | null; boardGroup?: BoardGroup }) => {
    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.tag !== undefined) dbUpdates.tag = updates.tag === '' ? null : updates.tag;
    if (updates.boardGroup !== undefined) {
      dbUpdates.board_group = updates.boardGroup;
      dbUpdates.pinned = updates.boardGroup === 'pinned';
    }
    // Optimistic
    setTasks(prev => {
      const rollback = prev;
      const updated: Task[] = prev.map(t => {
        if (t.id !== id) return t;
        return { ...t, ...updates, tag: updates.tag === '' ? undefined : (updates.tag ?? t.tag), pinned: updates.boardGroup ? updates.boardGroup === 'pinned' : t.pinned } as Task;
      });
      supabase.from('tasks').update(dbUpdates).eq('id', id).then(({ error }) => {
        if (error) setTasks(rollback);
      });
      return updated;
    });
  }, []);

  const moveTask = useCallback(async (id: string, boardGroup: BoardGroup) => {
    const pinned = boardGroup === 'pinned';
    setTasks(prev => {
      const rollback = prev;
      const updated = prev.map(t => t.id === id ? { ...t, boardGroup, pinned } : t);
      supabase.from('tasks').update({ board_group: boardGroup, pinned }).eq('id', id).then(({ error }) => {
        if (error) setTasks(rollback);
      });
      return updated;
    });
  }, []);

  const togglePin = useCallback(async (id: string, pinned: boolean) => {
    const boardGroup: BoardGroup = pinned ? 'pinned' : 'today';
    setTasks(prev => {
      const rollback = prev;
      const updated = prev.map(t => t.id === id ? { ...t, pinned, boardGroup } : t);
      supabase.from('tasks').update({ pinned, board_group: boardGroup }).eq('id', id).then(({ error }) => {
        if (error) setTasks(rollback);
      });
      return updated;
    });
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => {
      const rollback = prev;
      const updated = prev.filter(t => t.id !== id);
      supabase.from('tasks').delete().eq('id', id).then(({ error }) => {
        if (error) setTasks(rollback);
      });
      return updated;
    });
  }, []);

  const getTasksByDate = useCallback((date: string) => tasks.filter((t) => t.date === date), [tasks]);

  const reorderTasks = useCallback(async (reorderedTasks: { id: string; sortOrder: number }[]) => {
    setTasks(prev => {
      const updated = [...prev];
      for (const rt of reorderedTasks) {
        const idx = updated.findIndex(t => t.id === rt.id);
        if (idx !== -1) updated[idx] = { ...updated[idx], sortOrder: rt.sortOrder };
      }
      return updated;
    });
    for (const rt of reorderedTasks) {
      await supabase.from('tasks').update({ sort_order: rt.sortOrder }).eq('id', rt.id);
    }
  }, []);

  return { tasks, loading, addTask, updateTaskStatus, updateTask, moveTask, togglePin, deleteTask, getTasksByDate, reorderTasks };
}
