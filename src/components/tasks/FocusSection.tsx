import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { FOCUS_LIMIT } from '@/lib/task-sections';
import type { Task } from '@/types/task';
import { TaskListItem, type TaskActions } from './TaskListItem';

export const FOCUS_DROP_ID = 'focus-zone';

interface FocusSectionProps extends TaskActions {
  tasks: Task[];
  /** A drag is in progress from outside the focus block. */
  isDraggingIn: boolean;
  dragDisabled: boolean;
  today: string;
}

export function FocusSection({ tasks, isDraggingIn, dragDisabled, today, ...actions }: FocusSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: FOCUS_DROP_ID });
  const full = tasks.length >= FOCUS_LIMIT;

  // No focus tasks and nothing being dragged: the block doesn't render at all.
  if (tasks.length === 0 && !isDraggingIn) return null;

  return (
    <section ref={setNodeRef} aria-label="Foco" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">Foco</h2>
        <span className="num text-xs text-subtle">{tasks.length}/{FOCUS_LIMIT}</span>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {tasks.map(task => (
            <TaskListItem key={task.id} task={task} variant="card" dragDisabled={dragDisabled} today={today} {...actions} />
          ))}
          {isDraggingIn && !full && (
            <div
              className={cn(
                'flex min-h-[104px] items-center justify-center rounded-xl border border-dashed px-4 text-center text-xs transition-colors',
                isOver ? 'border-primary text-primary' : 'border-border-strong text-subtle',
              )}
            >
              Solte aqui para focar
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
