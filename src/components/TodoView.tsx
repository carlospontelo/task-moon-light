import { useMemo, useState, memo } from 'react';
import {
  DndContext, DragEndEvent, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Task, TaskStatus, BoardGroup } from '@/types/task';
import { EditTaskDialog } from './EditTaskDialog';
import { PageHeader } from './layout/PageHeader';
import { KanbanColumn } from './tasks/KanbanColumn';
import { TaskKanbanCard } from './tasks/TaskKanbanCard';
import { ProgressPanel } from './tasks/ProgressPanel';
import { NewTaskDialog } from './tasks/NewTaskDialog';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { completedToday, logStatusChange } from '@/lib/task-stats';
import { cn } from '@/lib/utils';

interface TodoViewProps {
  tasks: Task[];
  onAdd: (title: string, options?: { date?: string; tag?: string; boardGroup?: BoardGroup }) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTask: (id: string, updates: { date?: string; tag?: string | null; boardGroup?: BoardGroup }) => void;
  onMoveTask: (id: string, group: BoardGroup) => void;
  onDelete: (id: string) => void;
  onReorderTasks: (reordered: { id: string; sortOrder: number }[]) => void;
  /** `completed_at` exists in the DB (after the migration). */
  hasCompletionTracking?: boolean;
}

const COLUMNS: { status: TaskStatus; title: string; short: string; empty: string }[] = [
  { status: 'pending', title: 'A fazer', short: 'A fazer', empty: 'Nenhuma tarefa a fazer' },
  { status: 'in_progress', title: 'Em andamento', short: 'Em andamento', empty: 'Arraste uma tarefa para começar' },
  { status: 'completed', title: 'Concluídas hoje', short: 'Concluídas', empty: 'Nada concluído hoje ainda' },
];

const bySortOrder = (a: Task, b: Task) => a.sortOrder - b.sortOrder;

export const TodoView = memo(function TodoView({
  tasks, onAdd, onUpdateStatus, onUpdateTask, onDelete, onReorderTasks, hasCompletionTracking = false,
}: TodoViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileColumn, setMobileColumn] = useState<TaskStatus>('pending');
  const isMobile = useIsMobile();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columns = useMemo(() => {
    const doneToday = completedToday(tasks).sort(bySortOrder);
    return {
      pending: tasks.filter(t => t.status === 'pending').sort(bySortOrder),
      in_progress: tasks.filter(t => t.status === 'in_progress').sort(bySortOrder),
      completed: doneToday,
    } satisfies Record<TaskStatus, Task[]>;
  }, [tasks]);

  const setStatus = (id: string, status: TaskStatus) => {
    logStatusChange(id, status);
    onUpdateStatus(id, status);
  };

  const columnOf = (id: string): TaskStatus | null => {
    if (id.startsWith('column:')) return id.slice('column:'.length) as TaskStatus;
    return tasks.find(t => t.id === id)?.status ?? null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const overId = over.id as string;
    const from = columnOf(taskId);
    const to = columnOf(overId);
    if (!from || !to) return;

    if (from !== to) {
      setStatus(taskId, to);
      return;
    }

    const list = columns[from];
    const oldIndex = list.findIndex(t => t.id === taskId);
    const newIndex = list.findIndex(t => t.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    onReorderTasks(arrayMove(list, oldIndex, newIndex).map((t, i) => ({ id: t.id, sortOrder: i })));
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;
  const visibleColumns = isMobile ? COLUMNS.filter(c => c.status === mobileColumn) : COLUMNS;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tarefas"
        actions={
          <Button onClick={() => setNewOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova tarefa
          </Button>
        }
      />

      {/* Compact progress strip below the desktop breakpoint */}
      <div className="lg:hidden">
        <ProgressPanel
          variant="strip"
          tasks={tasks}
          completedTodayCount={columns.completed.length}
          hasTracking={hasCompletionTracking}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-3">
          {isMobile && (
            <div role="tablist" aria-label="Colunas" className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-card p-1">
              {COLUMNS.map(c => {
                const selected = mobileColumn === c.status;
                return (
                  <button
                    key={c.status}
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setMobileColumn(c.status)}
                    className={cn(
                      'flex h-9 items-center justify-center gap-1.5 rounded-md text-xs transition-colors',
                      selected ? 'bg-secondary text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {c.short}
                    <span className="num text-subtle">{columns[c.status].length}</span>
                  </button>
                );
              })}
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <div className={cn('grid gap-3', !isMobile && 'grid-cols-3')}>
              {visibleColumns.map(c => (
                <KanbanColumn
                  key={c.status}
                  status={c.status}
                  title={c.title}
                  tasks={columns[c.status]}
                  emptyText={isMobile && c.status === 'in_progress' ? 'Nenhuma tarefa em andamento' : c.empty}
                  dragDisabled={isMobile}
                  hideHeader={isMobile}
                  onSetStatus={setStatus}
                  onEdit={setEditingTask}
                  onDelete={onDelete}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? (
                <TaskKanbanCard task={activeTask} overlay onSetStatus={() => {}} onEdit={() => {}} onDelete={() => {}} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        <aside className="hidden lg:block">
          <div className="lg:sticky lg:top-6">
            <ProgressPanel
              tasks={tasks}
              completedTodayCount={columns.completed.length}
              hasTracking={hasCompletionTracking}
            />
          </div>
        </aside>
      </div>

      <NewTaskDialog open={newOpen} onOpenChange={setNewOpen} onAdd={onAdd} />

      <EditTaskDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
        onSave={(id, updates) => {
          const { status, ...rest } = updates;
          onUpdateTask(id, rest);
          const current = tasks.find(t => t.id === id)?.status;
          if (status && status !== current) setStatus(id, status);
        }}
      />
    </div>
  );
});
