import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, TaskTag } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) { setTasks([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status as TaskStatus,
        tag: (t.tag as TaskTag) || undefined,
        date: t.date,
        createdAt: t.created_at,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (title: string, date: string, tag?: TaskTag) => {
    if (!user) return;
    const { data, error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title,
      status: 'pending',
      tag: tag || null,
      date,
    }).select().single();

    if (!error && data) {
      setTasks((prev) => [{
        id: data.id,
        title: data.title,
        status: data.status as TaskStatus,
        tag: (data.tag as TaskTag) || undefined,
        date: data.date,
        createdAt: data.created_at,
      }, ...prev]);
    }
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    await supabase.from('tasks').update({ status }).eq('id', id);
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  };

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const getTasksByDate = (date: string) => tasks.filter((t) => t.date === date);

  return { tasks, loading, addTask, updateTaskStatus, deleteTask, getTasksByDate };
}
