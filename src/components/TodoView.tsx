import { useMemo, useState } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { Task, TaskStatus, BoardGroup } from '@/types/task';
import { TaskColumn } from './TaskColumn';
import { TaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';
import { EditTaskDialog } from './EditTaskDialog';

interface TodoViewProps {
  tasks: Task[];
  onAdd: (title: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTask: (id: string, updates: { date?: string; tag?: string | null }) => void;
  onMoveTask: (id: string, group: BoardGroup) => void;
  onDelete: (id: string) => void;
}

const GROUPS: BoardGroup[] = ['pinned', 'today', 'this_week', 'standby'];

export function TodoView({ tasks, onAdd, onUpdateStatus, onUpdateTask, onMoveTask, onDelete }: TodoViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'completed'), [tasks]);
  const completedTodayTasks = useMemo(() => tasks.filter(t => t.status === 'completed'), [tasks]);
  const inProgressCount = useMemo(() => tasks.filter(t => t.status === 'in_progress').length, [tasks]);

  const tasksByGroup = useMemo(() => {
    const groups: Record<BoardGroup, Task[]> = { pinned: [], today: [], this_week: [], standby: [] };
    activeTasks.forEach(task => {
      const group = task.boardGroup || 'today';
      if (groups[group]) groups[group].push(task);
    });
    return groups;
  }, [activeTasks]);

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    if (GROUPS.includes(overId as BoardGroup)) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.boardGroup !== overId) {
        onMoveTask(taskId, overId as BoardGroup);
      }
      return;
    }

    // Dropped on another task — find which column that task belongs to
    const overTask = tasks.find(t => t.id === overId);
    if (overTask) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.boardGroup !== overTask.boardGroup) {
        onMoveTask(taskId, overTask.boardGroup);
      }
    }
  };

  const activeCount = activeTasks.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-foreground">Tarefas</h1>
        <p className="text-sm text-muted-foreground">
          {activeCount} {activeCount === 1 ? 'tarefa ativa' : 'tarefas ativas'}
          {inProgressCount > 0 && <span className="text-primary"> • {inProgressCount} em andamento</span>}
        </p>
      </div>

      <AddTaskForm onAdd={onAdd} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GROUPS.map(group => (
            <TaskColumn
              key={group}
              group={group}
              tasks={tasksByGroup[group]}
              onUpdateStatus={onUpdateStatus}
              onDelete={onDelete}
              onEdit={setEditingTask}
              inProgressCount={inProgressCount}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="bg-card border border-primary/30 rounded-lg px-3 py-2.5 shadow-xl shadow-primary/10">
              <p className="text-sm text-foreground">{activeTask.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Completed tasks - today only */}
      {completedTodayTasks.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground uppercase tracking-wider font-semibold py-2 select-none">
            <span className="transition-transform group-open:rotate-90">▶</span>
            Concluídas hoje
            <span className="bg-secondary/50 px-1.5 py-0.5 rounded-full font-mono">
              {completedTodayTasks.length}
            </span>
          </summary>
          <div className="space-y-1 mt-2 opacity-50">
            {completedTodayTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 px-3 py-2 rounded-lg">
                <span className="text-emerald-400">✓</span>
                <p className="text-sm line-through text-muted-foreground">{task.title}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Nenhuma tarefa ainda</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Adicione sua primeira tarefa acima</p>
        </div>
      )}

      <EditTaskDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
        onSave={onUpdateTask}
      />
    </div>
  );
}
