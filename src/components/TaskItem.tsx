import { Button } from '@/components/ui/button';
import { Trash2, Calendar, Circle, Clock, CheckCircle2 } from 'lucide-react';
import { Task, TaskStatus, STATUS_LABELS } from '@/types/task';
import { useSettings } from '@/contexts/SettingsContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskItemProps {
  task: Task;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  pending: <Circle className="h-4 w-4" />,
  in_progress: <Clock className="h-4 w-4" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'text-muted-foreground hover:text-foreground',
  in_progress: 'text-amber-400 hover:text-amber-300',
  completed: 'text-emerald-400 hover:text-emerald-300',
};

export function TaskItem({ task, onUpdateStatus, onDelete }: TaskItemProps) {
  const { getTagByKey } = useSettings();
  const tag = task.tag ? getTagByKey(task.tag) : undefined;

  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl bg-card border border-border",
        "transition-all duration-300 hover:border-primary/30 hover:bg-card/80",
        "animate-slide-up",
        task.status === 'completed' && "opacity-60"
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(STATUS_COLORS[task.status], "transition-colors")}
          >
            {STATUS_ICONS[task.status]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map((status) => (
            <DropdownMenuItem
              key={status}
              onClick={() => onUpdateStatus(task.id, status)}
              className={cn(
                "flex items-center gap-2",
                task.status === status && "bg-muted"
              )}
            >
              <span className={STATUS_COLORS[status]}>{STATUS_ICONS[status]}</span>
              {STATUS_LABELS[status]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-foreground transition-all duration-200",
            task.status === 'completed' && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">
              {format(parseISO(task.date), "dd MMM", { locale: ptBR })}
            </span>
          </div>
          {tag && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              tag.bgColor,
              tag.textColor
            )}>
              {tag.label}
            </span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
