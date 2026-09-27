import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, Circle, Loader2, CheckCircle2, Play, Pencil, ListChecks } from 'lucide-react';
import { Task, TaskStatus } from '@/types/task';
import { useSettings } from '@/contexts/SettingsContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useSubtasksContext } from '@/contexts/SubtasksContext';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  inProgressCount: number;
}

const STATUS_ICON: Record<TaskStatus, React.ReactNode> = {
  pending: <Circle className="h-4 w-4" />,
  in_progress: <Loader2 className="h-4 w-4 animate-spin" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
};

export function TaskCard({ task, onUpdateStatus, onDelete, onEdit, inProgressCount }: TaskCardProps) {
  const { getTagByKey } = useSettings();
  const { getSubtaskProgress } = useSubtasksContext();
  const tag = task.tag ? getTagByKey(task.tag) : undefined;
  const isInProgress = task.status === 'in_progress';
  const progress = getSubtaskProgress(task.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cycleStatus = () => {
    if (task.status === 'pending') {
      onUpdateStatus(task.id, 'in_progress');
    } else if (task.status === 'in_progress') {
      onUpdateStatus(task.id, 'completed');
    } else {
      onUpdateStatus(task.id, 'pending');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative flex items-start gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-150 cursor-grab active:cursor-grabbing touch-none",
        "border border-border bg-secondary",
        isInProgress && "border-primary/40",
        task.status === 'completed' && "opacity-50",
        isDragging && "opacity-40 border-primary z-50",
        task.status !== 'completed' && "hover:bg-surface-3"
      )}
    >
      {/* Status toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); cycleStatus(); }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Alterar status"
        className={cn(
          "mt-px flex-shrink-0 transition-colors",
          task.status === 'pending' && "text-subtle hover:text-foreground",
          task.status === 'in_progress' && "text-primary",
          task.status === 'completed' && "text-success",
        )}
      >
        {STATUS_ICON[task.status]}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-[13px] text-foreground leading-snug",
          task.status === 'completed' && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
          <div className="flex items-center gap-1 text-subtle">
            <Calendar className="h-3 w-3" strokeWidth={1.5} />
            <span className="num text-[11px]">
              {format(parseISO(task.date), "dd MMM", { locale: ptBR })}
            </span>
          </div>
          {tag && (
            <span className={cn(
              "text-[10px] leading-none px-1.5 py-[3px] rounded-full font-medium",
              tag.bgColor,
              tag.textColor
            )}>
              {tag.label}
            </span>
          )}
          {progress.total > 0 && (
            <span className={cn(
              "num flex items-center gap-1 text-[11px]",
              progress.completed === progress.total ? "text-success" : "text-primary"
            )}>
              <ListChecks className="h-3 w-3" strokeWidth={1.5} />
              {progress.completed}/{progress.total}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 -my-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {task.status === 'pending' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onUpdateStatus(task.id, 'in_progress'); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="h-6 w-6 text-subtle hover:text-primary"
            title="Iniciar"
            aria-label="Iniciar"
          >
            <Play className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="h-6 w-6 text-subtle hover:text-foreground"
          title="Editar"
          aria-label="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="h-6 w-6 text-subtle hover:text-destructive"
          title="Excluir"
          aria-label="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
