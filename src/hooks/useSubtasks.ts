import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
}

export function useSubtasks() {
  const { user } = useAuth();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  const mapRow = (r: any): Subtask => ({
    id: r.id,
    taskId: r.task_id,
    title: r.title,
    completed: r.completed,
    sortOrder: r.sort_order,
  });

  const fetchSubtasks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('subtasks')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order');
    if (data) setSubtasks(data.map(mapRow));
  }, [user]);

  useEffect(() => { fetchSubtasks(); }, [fetchSubtasks]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('subtasks-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks', filter: `user_id=eq.${user.id}` }, () => {
        fetchSubtasks();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchSubtasks]);

  const addSubtask = useCallback(async (taskId: string, title: string) => {
    if (!user) return;
    const taskSubtasks = subtasks.filter(s => s.taskId === taskId);
    const maxOrder = taskSubtasks.length > 0 ? Math.max(...taskSubtasks.map(s => s.sortOrder)) + 1 : 0;
    await supabase.from('subtasks').insert({
      task_id: taskId,
      user_id: user.id,
      title,
      sort_order: maxOrder,
    });
  }, [user, subtasks]);

  const toggleSubtask = useCallback(async (id: string) => {
    const st = subtasks.find(s => s.id === id);
    if (!st) return;
    // Optimistic
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
    await supabase.from('subtasks').update({ completed: !st.completed }).eq('id', id);
  }, [subtasks]);

  const deleteSubtask = useCallback(async (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
    await supabase.from('subtasks').delete().eq('id', id);
  }, []);

  const reorderSubtasks = useCallback(async (taskId: string, orderedIds: string[]) => {
    setSubtasks(prev => {
      const updated = [...prev];
      orderedIds.forEach((id, idx) => {
        const i = updated.findIndex(s => s.id === id);
        if (i !== -1) updated[i] = { ...updated[i], sortOrder: idx };
      });
      return updated;
    });
    for (let i = 0; i < orderedIds.length; i++) {
      await supabase.from('subtasks').update({ sort_order: i }).eq('id', orderedIds[i]);
    }
  }, []);

  const getSubtasksByTaskId = useCallback((taskId: string) => {
    return subtasks.filter(s => s.taskId === taskId).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [subtasks]);

  const getSubtaskProgress = useCallback((taskId: string) => {
    const taskSubs = subtasks.filter(s => s.taskId === taskId);
    return { completed: taskSubs.filter(s => s.completed).length, total: taskSubs.length };
  }, [subtasks]);

  return {
    subtasks, addSubtask, toggleSubtask, deleteSubtask, reorderSubtasks,
    getSubtasksByTaskId, getSubtaskProgress,
  };
}
