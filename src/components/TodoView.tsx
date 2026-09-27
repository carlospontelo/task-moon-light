import { useMemo, useState, memo } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Task, TaskStatus, BoardGroup } from '@/types/task';
import { TaskColumn } from './TaskColumn';
import { TaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';
import { EditTaskDialog } from './EditTaskDialog';
import { PageHeader } from './layout/PageHeader';
import { ChevronRight } from 'lucide-react';

interface TodoViewProps {
  tasks: Task[];
  onAdd: (title: string, options?: { date?: string; tag?: string; boardGroup?: BoardGroup }) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTask: (id: string, updates: { date?: string; tag?: string | null; boardGroup?: BoardGroup }) => void;
  onMoveTask: (id: string, group: BoardGroup) => void;
  onDelete: (id: string) => void;
  onReorderTasks: (reordered: { id: string; sortOrder: number }[]) => void;
}

const GROUPS: BoardGroup[] = ['pinned', 'today', 'this_week', 'standby'];

export const TodoView = memo(function TodoView({ tasks, onAdd, onUpdateStatus, onUpdateTask, onMoveTask, onDelete, onReorderTasks }: TodoViewProps) {
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
    // Sort each group by sortOrder
    for (const key of Object.keys(groups) as BoardGroup[]) {
      groups[key].sort((a, b) => a.sortOrder - b.sortOrder);
    }
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
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Dropped on a column header
    if (GROUPS.includes(overId as BoardGroup)) {
      if (task.boardGroup !== overId) {
        onMoveTask(taskId, overId as BoardGroup);
      }
      return;
    }

    // Dropped on another task
    const overTask = tasks.find(t => t.id === overId);
    if (!overTask) return;

    if (task.boardGroup !== overTask.boardGroup) {
      // Move to different column
      onMoveTask(taskId, overTask.boardGroup);
    } else {
      // Reorder within same column
      const group = task.boardGroup;
      const groupTasks = [...tasksByGroup[group]];
      const oldIndex = groupTasks.findIndex(t => t.id === taskId);
      const newIndex = groupTasks.findIndex(t => t.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(groupTasks, oldIndex, newIndex);
        const updates = reordered.map((t, i) => ({ id: t.id, sortOrder: i }));
        onReorderTasks(updates);
      }
    }
  };

  const activeCount = activeTasks.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tarefas"
        description={
          <>
            <span className="num">{activeCount}</span> {activeCount === 1 ? 'tarefa ativa' : 'tarefas ativas'}
            {inProgressCount > 0 && <> · <span className="num text-primary">{inProgressCount}</span> em andamento</>}
          </>
        }
      />

      <div className="rounded-xl border border-border bg-card p-4">
        <AddTaskForm onAdd={onAdd} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
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
            <div className="bg-surface-3 border border-primary rounded-lg px-3 py-2.5">
              <p className="text-sm text-foreground">{activeTask.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Completed tasks - today only */}
      {completedTodayTasks.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer list-none text-xs text-muted-foreground uppercase tracking-[0.06em] font-medium py-2 select-none [&::-webkit-details-marker]:hidden">
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
            Concluídas hoje
            <span className="num text-subtle">
              {completedTodayTasks.length}
            </span>
          </summary>
          <div className="mt-1 divide-y divide-border rounded-xl border border-border bg-card">
            {completedTodayTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-success text-sm" aria-hidden>✓</span>
                <p className="text-sm line-through text-subtle">{task.title}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm font-medium text-foreground">Quadro vazio</p>
          <p className="text-sm text-muted-foreground mt-1">Escreva a primeira tarefa no campo acima e escolha em qual coluna ela entra.</p>
        </div>
      )}

      <EditTaskDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
        onSave={(id, updates) => {
          const { status, ...rest } = updates;
          onUpdateTask(id, rest);
          if (status) onUpdateStatus(id, status);
        }}
      />
    </div>
  );
});
