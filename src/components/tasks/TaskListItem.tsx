import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Archive, ArchiveRestore, ListChecks, MoreHorizontal, Pause, Pencil, Play, Star, StarOff, Trash2,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSettings } from '@/contexts/SettingsContext';
import { useSubtasksContext } from '@/contexts/SubtasksContext';
import { getDueState, isFocus, isSomeday } from '@/lib/task-sections';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types/task';

export interface TaskActions {
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onToggleFocus: (task: Task) => void;
  onToggleSomeday: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

interface TaskListItemProps extends TaskActions {
  task: Task;
  variant?: 'row' | 'card';
  /** Sortable id namespace isn't needed: task ids are unique across sections. */
  dragDisabled?: boolean;
  today: string;
}

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

export function TaskListItem({
  task, variant = 'row', dragDisabled, today,
  onUpdateStatus, onToggleFocus, onToggleSomeday, onEdit, onDelete,
}: TaskListItemProps) {
  const { getTagByKey } = useSettings();
  const { getSubtaskProgress } = useSubtasksContext();
  const tag = task.tag ? getTagByKey(task.tag) : undefined;
  const progress = getSubtaskProgress(task.id);

  const completed = task.status === 'completed';
  const inProgress = task.status === 'in_progress';
  const focused = isFocus(task) && !completed;
  const someday = isSomeday(task);
  const due = getDueState(task, today);

  // Only pointer listeners: the row must not become role="button", since it contains buttons.
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
    disabled: dragDisabled || completed,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const draggable = !dragDisabled && !completed;
  const isCard = variant === 'card';

  const dateLabel =
    due === 'none' ? null
    : due === 'today' ? 'hoje'
    : format(parseISO(task.date), 'dd MMM', { locale: ptBR });

  const hasMeta = Boolean(inProgress || tag || progress.total > 0 || dateLabel);
  const meta = hasMeta ? (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-2.5 gap-y-1">
      {inProgress && !completed && (
        <span className="hidden text-[11px] text-primary sm:inline">em andamento</span>
      )}
      {tag && (
        <span className={cn('rounded-full px-1.5 py-[3px] text-[10px] font-medium leading-none', tag.bgColor, tag.textColor)}>
          {tag.label}
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
      {dateLabel && (
        <span className={cn(
          'num text-[11px]',
          due === 'overdue' && !completed ? 'text-destructive' : 'text-subtle',
        )}>
          {dateLabel}
        </span>
      )}
    </div>
  ) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? listeners : {})}
      className={cn(
        'group relative flex gap-3 transition-colors duration-150',
        isCard
          ? 'flex-col justify-between rounded-xl sm:min-h-[104px] border border-border bg-card p-4 hover:border-border-strong'
          : 'items-center rounded-lg px-2 py-2 hover:bg-secondary',
        draggable && 'cursor-grab active:cursor-grabbing touch-none',
        isDragging && 'z-50 opacity-40',
      )}
    >
      <div className={cn('flex min-w-0 flex-1 gap-3', isCard ? 'items-start' : 'items-center')}>
        <Checkbox
          checked={completed}
          onCheckedChange={() => onUpdateStatus(task.id, completed ? 'pending' : 'completed')}
          onPointerDown={stop}
          aria-label={completed ? 'Marcar como pendente' : 'Concluir tarefa'}
          className={cn('shrink-0', isCard && 'mt-0.5')}
        />

        <button
          type="button"
          onClick={() => onEdit(task)}
          onPointerDown={draggable ? undefined : stop}
          className={cn(
            'min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:underline',
            isCard ? 'text-[15px] leading-snug' : 'truncate text-sm',
            completed ? 'text-subtle line-through' : 'text-foreground',
          )}
        >
          {inProgress && (
            <span className="mr-2 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-primary align-middle" aria-hidden />
          )}
          {task.title}
        </button>

        {!isCard && meta}

        <div className="flex shrink-0 items-center gap-0.5" onPointerDown={stop}>
          {!completed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onToggleFocus(task)}
              aria-label={focused ? 'Tirar do foco' : 'Focar'}
              title={focused ? 'Tirar do foco' : 'Focar'}
              className={cn(
                'hidden h-7 w-7 md:inline-flex',
                focused ? 'text-primary' : 'text-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-foreground',
              )}
            >
              <Star className={cn('h-3.5 w-3.5', focused && 'fill-current')} strokeWidth={1.5} />
            </Button>
          )}
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
              {!completed && (
                <>
                  <DropdownMenuItem onSelect={() => onUpdateStatus(task.id, inProgress ? 'pending' : 'in_progress')}>
                    {inProgress ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {inProgress ? 'Pausar' : 'Marcar em andamento'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onToggleFocus(task)}>
                    {focused ? <StarOff className="mr-2 h-4 w-4" /> : <Star className="mr-2 h-4 w-4" />}
                    {focused ? 'Tirar do foco' : 'Focar'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onToggleSomeday(task)}>
                    {someday ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
                    {someday ? 'Voltar para a lista' : 'Mover para Algum dia'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
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
      </div>

      {isCard && meta && (
        <div className="flex items-center gap-2 pl-8">
          {meta}
        </div>
      )}
    </div>
  );
}
