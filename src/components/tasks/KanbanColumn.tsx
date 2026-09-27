import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types/task';
import { TaskKanbanCard } from './TaskKanbanCard';

const columnDropId = (status: TaskStatus) => `column:${status}`;

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  emptyText: string;
  dragDisabled: boolean;
  onSetStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  /** Mobile shows the column name in the segmented control instead. */
  hideHeader?: boolean;
}

export function KanbanColumn({
  status, title, tasks, emptyText, dragDisabled, onSetStatus, onEdit, onDelete, hideHeader,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDropId(status) });

  return (
    <section
      ref={setNodeRef}
      aria-label={title}
      className={cn(
        'flex min-h-[200px] flex-col rounded-xl border border-border bg-card p-2 transition-colors duration-150',
        isOver && 'border-primary/60',
      )}
    >
      {!hideHeader && (
        <header className="flex items-center justify-between px-2 pb-2.5 pt-1">
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">{title}</h2>
          <span className="num text-xs text-subtle">{tasks.length}</span>
        </header>
      )}

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {tasks.map(task => (
            <TaskKanbanCard
              key={task.id}
              task={task}
              onSetStatus={onSetStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              dragDisabled={dragDisabled}
            />
          ))}
        </div>
      </SortableContext>

      {tasks.length === 0 && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border-strong px-3 py-6 text-center">
          <p className="text-xs text-subtle">{emptyText}</p>
        </div>
      )}
    </section>
  );
}
