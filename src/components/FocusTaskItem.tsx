import { Button } from '@/components/ui/button';
import { Trash2, Calendar, Circle, Loader2, CheckCircle2, Pin, PinOff, Play, AlertTriangle } from 'lucide-react';
import { Task, TaskStatus } from '@/types/task';
import { useSettings } from '@/contexts/SettingsContext';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FocusTaskItemProps {
  task: Task;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
  inProgressCount: number;
}

const STATUS_ICON: Record<TaskStatus, React.ReactNode> = {
  pending: <Circle className="h-4 w-4" />,
  in_progress: <Loader2 className="h-4 w-4 animate-spin" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
};

export function FocusTaskItem({ task, onUpdateStatus, onTogglePin, onDelete, inProgressCount }: FocusTaskItemProps) {
  const { getTagByKey } = useSettings();
  const tag = task.tag ? getTagByKey(task.tag) : undefined;
  const isOverdue = isBefore(parseISO(task.date), startOfDay(new Date())) && task.status !== 'completed';
  const isInProgress = task.status === 'in_progress';

  const cycleStatus = () => {
    if (task.status === 'pending') {
      if (inProgressCount >= 3) {
        onUpdateStatus(task.id, 'completed');
      } else {
        onUpdateStatus(task.id, 'in_progress');
      }
    } else if (task.status === 'in_progress') {
      onUpdateStatus(task.id, 'completed');
    } else {
      onUpdateStatus(task.id, 'pending');
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
        "border border-transparent",
        isInProgress && "bg-primary/5 border-primary/20",
        task.status === 'completed' && "opacity-50",
        !isInProgress && task.status !== 'completed' && "hover:bg-secondary/50"
      )}
    >
      {/* Status toggle */}
      <button
        onClick={cycleStatus}
        className={cn(
          "flex-shrink-0 transition-colors",
          task.status === 'pending' && "text-muted-foreground hover:text-foreground",
          task.status === 'in_progress' && "text-primary",
          task.status === 'completed' && "text-emerald-400",
        )}
      >
        {STATUS_ICON[task.status]}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm text-foreground leading-tight",
          task.status === 'completed' && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className={cn(
            "flex items-center gap-1",
            isOverdue ? "text-destructive" : "text-muted-foreground"
          )}>
            {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
            <span className="text-[11px] font-mono">
              {format(parseISO(task.date), "dd MMM", { locale: ptBR })}
            </span>
          </div>
          {tag && (
            <span className={cn(
              "text-[11px] px-1.5 py-0.5 rounded-full font-medium",
              tag.bgColor,
              tag.textColor
            )}>
              {tag.label}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.status === 'pending' && inProgressCount < 3 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onUpdateStatus(task.id, 'in_progress')}
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            title="Iniciar"
          >
            <Play className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onTogglePin(task.id, !task.pinned)}
          className={cn(
            "h-7 w-7 transition-colors",
            task.pinned ? "text-primary opacity-100" : "text-muted-foreground hover:text-foreground"
          )}
          title={task.pinned ? "Desafixar" : "Fixar"}
        >
          {task.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task.id)}
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
