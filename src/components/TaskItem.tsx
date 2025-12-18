import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar } from 'lucide-react';
import { Task } from '@/types/task';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl bg-card border border-border",
        "transition-all duration-300 hover:border-primary/30 hover:bg-card/80",
        "animate-slide-up"
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
      />
      
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-foreground transition-all duration-200",
            task.completed && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">
            {format(parseISO(task.date), "dd MMM", { locale: ptBR })}
          </span>
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
