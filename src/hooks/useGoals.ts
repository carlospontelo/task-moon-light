import { useState, useEffect, useCallback } from 'react';
import { Goal, GoalStatus, GoalArea, GoalType, GoalEnergy, MAX_ACTIVE_GOALS } from '@/types/goal';
import { Task } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useGoals(tasks: Task[]) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);

  const fetchGoals = useCallback(async () => {
    if (!user) { setGoals([]); return; }
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGoals(data.map((g) => ({
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
      })));
    }
  }, [user]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const calculateProgress = useCallback((linkedTaskIds: string[]): number => {
    if (linkedTaskIds.length === 0) return 0;
    const linked = tasks.filter((t) => linkedTaskIds.includes(t.id));
    if (linked.length === 0) return 0;
    return Math.round((linked.filter((t) => t.status === 'completed').length / linked.length) * 100);
  }, [tasks]);

  // Update progress when tasks change
  useEffect(() => {
    setGoals((prev) => prev.map((g) => ({ ...g, progress: calculateProgress(g.linkedTaskIds) })));
  }, [tasks, calculateProgress]);

  const addGoal = async (
    title: string, area: GoalArea, type: GoalType, energy: GoalEnergy, quarter: string, description?: string
  ): Promise<boolean> => {
    if (!user) return false;
    const activeCount = goals.filter((g) => g.quarter === quarter && g.status === 'active').length;
    if (activeCount >= MAX_ACTIVE_GOALS) return false;

    const { data, error } = await supabase.from('goals').insert({
      user_id: user.id, title, description: description || null, quarter, status: 'active',
      area, type, energy, linked_task_ids: [], progress: 0,
    }).select().single();

    if (!error && data) {
      setGoals((prev) => [{
        id: data.id, title: data.title, description: data.description || undefined,
        quarter: data.quarter, status: data.status as GoalStatus, area: data.area as GoalArea,
        type: data.type as GoalType, energy: data.energy as GoalEnergy,
        linkedTaskIds: [], progress: 0, createdAt: data.created_at, updatedAt: data.updated_at,
      }, ...prev]);
      return true;
    }
    return false;
  };

  const updateGoalStatus = async (id: string, status: GoalStatus, abandonReason?: string) => {
    const updates: any = { status };
    if (status === 'abandoned') updates.abandon_reason = abandonReason;
    else updates.abandon_reason = null;
    await supabase.from('goals').update(updates).eq('id', id);
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, status, abandonReason: updates.abandon_reason || undefined } : g));
  };

  const updateGoal = async (
    id: string, updates: Partial<Pick<Goal, 'title' | 'description' | 'area' | 'type' | 'energy' | 'quarter'>>
  ) => {
    await supabase.from('goals').update(updates).eq('id', id);
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g));
  };

  const linkTask = async (goalId: string, taskId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || goal.linkedTaskIds.includes(taskId)) return;
    const newIds = [...goal.linkedTaskIds, taskId];
    await supabase.from('goals').update({ linked_task_ids: newIds }).eq('id', goalId);
    setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, linkedTaskIds: newIds } : g));
  };

  const unlinkTask = async (goalId: string, taskId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const newIds = goal.linkedTaskIds.filter((id) => id !== taskId);
    await supabase.from('goals').update({ linked_task_ids: newIds }).eq('id', goalId);
    setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, linkedTaskIds: newIds } : g));
  };

  const deleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const getActiveGoalsCount = (quarter: string) => goals.filter((g) => g.quarter === quarter && g.status === 'active').length;

  const getLinkedTasks = (goalId: string): Task[] => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return [];
    return tasks.filter((t) => goal.linkedTaskIds.includes(t.id));
  };

  const getUnlinkedTasks = (): Task[] => {
    const allLinked = goals.flatMap((g) => g.linkedTaskIds);
    return tasks.filter((t) => !allLinked.includes(t.id));
  };

  return {
    goals, addGoal, updateGoalStatus, updateGoal, linkTask, unlinkTask, deleteGoal,
    getActiveGoalsCount, getLinkedTasks, getUnlinkedTasks, calculateProgress,
  };
}
