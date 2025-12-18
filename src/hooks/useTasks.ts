import { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskTag } from '@/types/task';

const STORAGE_KEY = 'tasks-storage';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old tasks with 'completed' field to new 'status' field
      return parsed.map((task: any) => ({
        ...task,
        status: task.status || (task.completed ? 'completed' : 'pending'),
      }));
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (title: string, date: string, tag?: TaskTag) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      status: 'pending',
      tag,
      date,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, status } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const getTasksByDate = (date: string) => {
    return tasks.filter((task) => task.date === date);
  };

  return {
    tasks,
    addTask,
    updateTaskStatus,
    deleteTask,
    getTasksByDate,
  };
}
