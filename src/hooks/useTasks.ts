/* @refresh reset */
import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, BoardGroup } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfDay, isBefore, parseISO } from 'date-fns';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const mapRow = (t: any): Task => ({
    id: t.id,
    title: t.title,
    status: t.status as TaskStatus,
    tag: t.tag || undefined,
    date: t.date,
    createdAt: t.created_at,
    pinned: t.pinned ?? false,
    boardGroup: (t.board_group as BoardGroup) || 'today',
  });

  // Auto-cleanup: delete completed tasks from previous days
  const cleanupCompletedTasks = useCallback(async () => {
    if (!user) return;
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
    await supabase
      .from('tasks')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .lt('date', today);
  }, [user]);

  const fetchTasks = useCallback(async () => {
    if (!user) { setTasks([]); setLoading(false); return; }
    
    // Cleanup old completed tasks first
    await cleanupCompletedTasks();
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setTasks(data.map(mapRow));
    setLoading(false);
  }, [user, cleanupCompletedTasks]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks((prev) => {
            if (prev.some((t) => t.id === (payload.new as any).id)) return prev;
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

  const addTask = async (title: string, options?: { date?: string; tag?: string; boardGroup?: BoardGroup }) => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const group = options?.boardGroup || 'today';
    await supabase.from('tasks').insert({
      user_id: user.id, title, status: 'pending', tag: options?.tag || null,
      date: options?.date || today, pinned: group === 'pinned', board_group: group,
    });
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    await supabase.from('tasks').update({ status }).eq('id', id);
  };

  const updateTask = async (id: string, updates: { date?: string; tag?: string | null; boardGroup?: BoardGroup }) => {
    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.tag !== undefined) dbUpdates.tag = updates.tag;
    if (updates.boardGroup !== undefined) {
      dbUpdates.board_group = updates.boardGroup;
      dbUpdates.pinned = updates.boardGroup === 'pinned';
    }
    await supabase.from('tasks').update(dbUpdates).eq('id', id);
  };

  const moveTask = async (id: string, boardGroup: BoardGroup) => {
    const pinned = boardGroup === 'pinned';
    await supabase.from('tasks').update({ board_group: boardGroup, pinned }).eq('id', id);
  };

  const togglePin = async (id: string, pinned: boolean) => {
    const boardGroup = pinned ? 'pinned' : 'today';
    await supabase.from('tasks').update({ pinned, board_group: boardGroup }).eq('id', id);
  };

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
  };

  const getTasksByDate = (date: string) => tasks.filter((t) => t.date === date);

  return { tasks, loading, addTask, updateTaskStatus, updateTask, moveTask, togglePin, deleteTask, getTasksByDate };
}
