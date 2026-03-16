/* @refresh reset */
import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, TaskTag } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const mapRow = (t: any): Task => ({
    id: t.id,
    title: t.title,
    status: t.status as TaskStatus,
    tag: (t.tag as TaskTag) || undefined,
    date: t.date,
    createdAt: t.created_at,
  });

  const fetchTasks = useCallback(async () => {
    if (!user) { setTasks([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setTasks(data.map(mapRow));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Realtime subscription
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

  const addTask = async (title: string, date: string, tag?: TaskTag) => {
    if (!user) return;
    await supabase.from('tasks').insert({
      user_id: user.id, title, status: 'pending', tag: tag || null, date,
    });
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    await supabase.from('tasks').update({ status }).eq('id', id);
  };

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
  };

  const getTasksByDate = (date: string) => tasks.filter((t) => t.date === date);

  return { tasks, loading, addTask, updateTaskStatus, deleteTask, getTasksByDate };
}
