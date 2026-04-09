/* @refresh reset */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Goal, GoalStatus, GoalArea, GoalType, GoalEnergy, MAX_ACTIVE_GOALS } from '@/types/goal';
import { Task } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useGoals(tasks: Task[]) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);

  const mapRow = (g: any): Goal => ({
    id: g.id,
    title: g.title,
    description: g.description || undefined,
    quarter: g.quarter,
    status: g.status as GoalStatus,
    area: g.area as GoalArea,
    type: g.type as GoalType,
    energy: g.energy as GoalEnergy,
    linkedTaskIds: (g.linked_task_ids || []) as string[],
    progress: g.progress || 0,
    abandonReason: g.abandon_reason || undefined,
    createdAt: g.created_at,
    updatedAt: g.updated_at,
  });

  const fetchGoals = useCallback(async () => {
    if (!user) { setGoals([]); return; }
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setGoals(data.map(mapRow));
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('goals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setGoals((prev) => {
            if (prev.some((g) => g.id === (payload.new as any).id)) return prev;
            return [mapRow(payload.new), ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setGoals((prev) => prev.map((g) => g.id === (payload.new as any).id ? mapRow(payload.new) : g));
        } else if (payload.eventType === 'DELETE') {
          setGoals((prev) => prev.filter((g) => g.id !== (payload.old as any).id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Use useMemo instead of useEffect+setState to avoid extra render cycle
  const goalsWithProgress = useMemo(() => {
    if (goals.length === 0) return goals;
    const allLinkedIds = new Set(goals.flatMap(g => g.linkedTaskIds));
    if (allLinkedIds.size === 0) return goals;
    // Only recalculate if any linked task exists
    const taskMap = new Map(tasks.filter(t => allLinkedIds.has(t.id)).map(t => [t.id, t]));
    if (taskMap.size === 0) return goals;
    return goals.map(g => {
      if (g.linkedTaskIds.length === 0) return g;
      const linked = g.linkedTaskIds.map(id => taskMap.get(id)).filter(Boolean);
      if (linked.length === 0) return g;
      const progress = Math.round((linked.filter(t => t!.status === 'completed').length / linked.length) * 100);
      return progress !== g.progress ? { ...g, progress } : g;
    });
  }, [goals, tasks]);

  const addGoal = async (
    title: string, area: GoalArea, type: GoalType, energy: GoalEnergy, quarter: string, description?: string
  ): Promise<boolean> => {
    if (!user) return false;
    const activeCount = goalsWithProgress.filter((g) => g.quarter === quarter && g.status === 'active').length;
    if (activeCount >= MAX_ACTIVE_GOALS) return false;

    const { error } = await supabase.from('goals').insert({
      user_id: user.id, title, description: description || null, quarter, status: 'active',
      area, type, energy, linked_task_ids: [], progress: 0,
    });
    return !error;
  };

  const updateGoalStatus = async (id: string, status: GoalStatus, abandonReason?: string) => {
    const updates: any = { status };
    if (status === 'abandoned') updates.abandon_reason = abandonReason;
    else updates.abandon_reason = null;
    await supabase.from('goals').update(updates).eq('id', id);
  };

  const updateGoal = async (
    id: string, updates: Partial<Pick<Goal, 'title' | 'description' | 'area' | 'type' | 'energy' | 'quarter'>>
  ) => {
    await supabase.from('goals').update(updates).eq('id', id);
  };

  const linkTask = async (goalId: string, taskId: string) => {
    const goal = goalsWithProgress.find((g) => g.id === goalId);
    if (!goal || goal.linkedTaskIds.includes(taskId)) return;
    const newIds = [...goal.linkedTaskIds, taskId];
    await supabase.from('goals').update({ linked_task_ids: newIds }).eq('id', goalId);
  };

  const unlinkTask = async (goalId: string, taskId: string) => {
    const goal = goalsWithProgress.find((g) => g.id === goalId);
    if (!goal) return;
    const newIds = goal.linkedTaskIds.filter((id) => id !== taskId);
    await supabase.from('goals').update({ linked_task_ids: newIds }).eq('id', goalId);
  };

  const deleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
  };

  const getActiveGoalsCount = (quarter: string) => goalsWithProgress.filter((g) => g.quarter === quarter && g.status === 'active').length;

  const getLinkedTasks = (goalId: string): Task[] => {
    const goal = goalsWithProgress.find((g) => g.id === goalId);
    if (!goal) return [];
    return tasks.filter((t) => goal.linkedTaskIds.includes(t.id));
  };

  const getUnlinkedTasks = (): Task[] => {
    const allLinked = goalsWithProgress.flatMap((g) => g.linkedTaskIds);
    return tasks.filter((t) => !allLinked.includes(t.id));
  };

  const calculateProgress = useCallback((linkedTaskIds: string[]): number => {
    if (linkedTaskIds.length === 0) return 0;
    const linked = tasks.filter((t) => linkedTaskIds.includes(t.id));
    if (linked.length === 0) return 0;
    return Math.round((linked.filter((t) => t.status === 'completed').length / linked.length) * 100);
  }, [tasks]);

  return {
    goals: goalsWithProgress, addGoal, updateGoalStatus, updateGoal, linkTask, unlinkTask, deleteGoal,
    getActiveGoalsCount, getLinkedTasks, getUnlinkedTasks, calculateProgress,
  };
}
