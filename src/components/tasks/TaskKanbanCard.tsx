import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Circle, CircleCheck, ListChecks, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSettings } from '@/contexts/SettingsContext';
import { useSubtasksContext } from '@/contexts/SubtasksContext';
import { hasDueDate, isOverdue } from '@/lib/task-stats';
import { cn } from '@/lib/utils';
import { STATUS_LABELS, type Task, type TaskStatus } from '@/types/task';

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
};

const MENU_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Mover para A fazer' },
  { value: 'in_progress', label: 'Mover para Em andamento' },
  { value: 'completed', label: 'Concluir' },
];

interface TaskKanbanCardProps {
  task: Task;
  onSetStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  dragDisabled?: boolean;
  /** Rendered inside DragOverlay: no sortable wiring, no menu. */
  overlay?: boolean;
}

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

export function TaskKanbanCard({ task, onSetStatus, onEdit, onDelete, dragDisabled, overlay }: TaskKanbanCardProps) {
  const { getTagByKey } = useSettings();
  const { getSubtaskProgress } = useSubtasksContext();
  const tag = task.tag ? getTagByKey(task.tag) : undefined;
  const progress = getSubtaskProgress(task.id);
  const completed = task.status === 'completed';
  const inProgress = task.status === 'in_progress';

  // Only pointer listeners: the card must not become role="button", it contains buttons.
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
    disabled: dragDisabled || overlay,
  });
  const draggable = !dragDisabled && !overlay;

  const showDate = hasDueDate(task);
  const overdue = isOverdue(task);
  const hasMeta = inProgress || tag || progress.total > 0 || showDate;

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : { transform: CSS.Transform.toString(transform), transition }}
      {...(draggable ? listeners : {})}
      onClick={() => onEdit(task)}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-secondary px-3 py-2.5 transition-colors duration-150 hover:bg-surface-3',
        inProgress && 'before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-primary',
        draggable && 'touch-none active:cursor-grabbing',
        isDragging && 'opacity-40',
        overlay && 'border-primary bg-surface-3',
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={(e) => { stop(e); onSetStatus(task.id, NEXT_STATUS[task.status]); }}
          onPointerDown={stop}
          aria-label={`Status: ${STATUS_LABELS[task.status]}. Alterar status`}
          title="Alterar status"
          className={cn(
            'mt-px shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            completed ? 'text-success' : inProgress ? 'text-primary' : 'text-subtle hover:text-foreground',
          )}
        >
          {completed ? <CircleCheck className="h-4 w-4" strokeWidth={1.75} />
            : inProgress ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" strokeWidth={1.75} />
            : <Circle className="h-4 w-4" strokeWidth={1.5} />}
        </button>

        <button
          type="button"
          onClick={(e) => { stop(e); onEdit(task); }}
          className={cn(
            'min-w-0 flex-1 text-left text-[13px] leading-snug focus-visible:outline-none focus-visible:underline',
            completed ? 'text-muted-foreground line-through decoration-subtle' : 'text-foreground',
          )}
        >
          {task.title}
        </button>

        {!overlay && (
          <div onClick={stop} onPointerDown={stop} className="-my-1 -mr-1.5 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Ações da tarefa"
                  className="h-7 w-7 text-subtle hover:text-foreground md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 md:data-[state=open]:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {MENU_STATUSES.filter(s => s.value !== task.status).map(s => (
                  <DropdownMenuItem key={s.value} onSelect={() => onSetStatus(task.id, s.value)}>
                    {s.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onEdit(task)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDelete(task.id)} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {hasMeta && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 pl-[26px]">
          {inProgress && <span className="text-[11px] text-primary-soft-foreground">Em andamento</span>}
          {tag && (
            <span className={cn('rounded-full px-1.5 py-[3px] text-[10px] font-medium leading-none', tag.bgColor, tag.textColor)}>
              {tag.label}
            </span>
          )}
          {showDate && (
            <span className={cn('num text-[11px]', overdue ? 'text-destructive' : 'text-subtle')}>
              {format(parseISO(task.date), 'dd MMM', { locale: ptBR })}
            </span>
          )}
          {progress.total > 0 && (
            <span className={cn(
              'num flex items-center gap-1 text-[11px]',
              progress.completed === progress.total ? 'text-success' : 'text-muted-foreground',
            )}>
              <ListChecks className="h-3 w-3" strokeWidth={1.5} />
              {progress.completed}/{progress.total}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
