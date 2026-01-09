// @refresh reset
import { useState, useEffect, useCallback } from 'react';
import { Goal, GoalStatus, GoalArea, GoalType, GoalEnergy, getCurrentQuarter, MAX_ACTIVE_GOALS } from '@/types/goal';
import { Task } from '@/types/task';

const STORAGE_KEY = 'goals-storage';

export function useGoals(tasks: Task[]) {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  // Calculate progress based on linked tasks
  const calculateProgress = useCallback((linkedTaskIds: string[]): number => {
    if (linkedTaskIds.length === 0) return 0;
    
    const linkedTasks = tasks.filter(task => linkedTaskIds.includes(task.id));
    if (linkedTasks.length === 0) return 0;
    
    const completedTasks = linkedTasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / linkedTasks.length) * 100);
  }, [tasks]);

  // Update all goals progress when tasks change
  useEffect(() => {
    setGoals(prev => prev.map(goal => ({
      ...goal,
      progress: calculateProgress(goal.linkedTaskIds),
    })));
  }, [tasks, calculateProgress]);

  const addGoal = (
    title: string,
    area: GoalArea,
    type: GoalType,
    energy: GoalEnergy,
    quarter: string,
    description?: string
  ): boolean => {
    // Check active goals limit
    const activeGoalsInQuarter = goals.filter(
      g => g.quarter === quarter && g.status === 'active'
    ).length;
    
    if (activeGoalsInQuarter >= MAX_ACTIVE_GOALS) {
      return false;
    }

    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title,
      description,
      quarter,
      status: 'active',
      area,
      type,
      energy,
      linkedTaskIds: [],
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setGoals(prev => [newGoal, ...prev]);
    return true;
  };

  const updateGoalStatus = (id: string, status: GoalStatus, abandonReason?: string) => {
    setGoals(prev =>
      prev.map(goal =>
        goal.id === id
          ? {
              ...goal,
              status,
              abandonReason: status === 'abandoned' ? abandonReason : undefined,
              updatedAt: new Date().toISOString(),
            }
          : goal
      )
    );
  };

  const updateGoal = (
    id: string,
    updates: Partial<Pick<Goal, 'title' | 'description' | 'area' | 'type' | 'energy' | 'quarter'>>
  ) => {
    setGoals(prev =>
      prev.map(goal =>
        goal.id === id
          ? {
              ...goal,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : goal
      )
    );
  };

  const linkTask = (goalId: string, taskId: string) => {
    setGoals(prev =>
      prev.map(goal =>
        goal.id === goalId && !goal.linkedTaskIds.includes(taskId)
          ? {
              ...goal,
              linkedTaskIds: [...goal.linkedTaskIds, taskId],
              updatedAt: new Date().toISOString(),
            }
          : goal
      )
    );
  };

  const unlinkTask = (goalId: string, taskId: string) => {
    setGoals(prev =>
      prev.map(goal =>
        goal.id === goalId
          ? {
              ...goal,
              linkedTaskIds: goal.linkedTaskIds.filter(id => id !== taskId),
              updatedAt: new Date().toISOString(),
            }
          : goal
      )
    );
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  const getGoalsByQuarter = (quarter: string) => {
    return goals.filter(goal => goal.quarter === quarter);
  };

  const getActiveGoalsCount = (quarter: string) => {
    return goals.filter(g => g.quarter === quarter && g.status === 'active').length;
  };

  const migrateGoalToQuarter = (goalId: string, newQuarter: string) => {
    setGoals(prev =>
      prev.map(goal =>
        goal.id === goalId
          ? {
              ...goal,
              quarter: newQuarter,
              updatedAt: new Date().toISOString(),
            }
          : goal
      )
    );
  };

  const getLinkedTasks = (goalId: string): Task[] => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return [];
    return tasks.filter(task => goal.linkedTaskIds.includes(task.id));
  };

  const getUnlinkedTasks = (): Task[] => {
    const allLinkedTaskIds = goals.flatMap(g => g.linkedTaskIds);
    return tasks.filter(task => !allLinkedTaskIds.includes(task.id));
  };

  return {
    goals,
    addGoal,
    updateGoalStatus,
    updateGoal,
    linkTask,
    unlinkTask,
    deleteGoal,
    getGoalsByQuarter,
    getActiveGoalsCount,
    migrateGoalToQuarter,
    getLinkedTasks,
    getUnlinkedTasks,
    calculateProgress,
  };
}
