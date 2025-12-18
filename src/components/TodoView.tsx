import { useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { Task, TaskStatus, TaskTag } from '@/types/task';
import { StatusColumn } from './StatusColumn';
import { AddTaskForm } from './AddTaskForm';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface TodoViewProps {
  tasks: Task[];
  onAdd: (title: string, date: string, tag?: TaskTag) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

const STATUSES: TaskStatus[] = ['pending', 'in_progress', 'completed'];

export function TodoView({ tasks, onAdd, onUpdateStatus, onDelete }: TodoViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      pending: [],
      in_progress: [],
      completed: [],
    };

    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    // Sort each group by date
    Object.keys(grouped).forEach((status) => {
      grouped[status as TaskStatus].sort((a, b) => a.date.localeCompare(b.date));
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a status column
    if (STATUSES.includes(overId as TaskStatus)) {
      onUpdateStatus(taskId, overId as TaskStatus);
      return;
    }

    // Check if dropped on another task
    const overTask = tasks.find(t => t.id === overId);
    if (overTask) {
      onUpdateStatus(taskId, overTask.status);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // If dragging over a column, update status
    if (STATUSES.includes(overId as TaskStatus)) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== overId) {
        onUpdateStatus(taskId, overId as TaskStatus);
      }
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Tarefas</h1>
        <p className="text-sm text-muted-foreground">Arraste as tarefas entre as colunas para mudar o status</p>
      </div>

      {/* Add Task */}
      <AddTaskForm onAdd={onAdd} />

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col gap-4">
          {STATUSES.map((status) => (
            <StatusColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onDelete={onDelete}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="p-3 rounded-xl bg-card border border-primary/50 shadow-lg shadow-primary/20">
              <p className="text-sm text-foreground">{activeTask.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Nenhuma tarefa ainda</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Adicione sua primeira tarefa acima
          </p>
        </div>
      )}
    </div>
  );
}
