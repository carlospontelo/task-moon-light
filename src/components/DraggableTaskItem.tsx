import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, GripVertical } from 'lucide-react';
import { Task } from '@/types/task';
import { useSettings } from '@/contexts/SettingsContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DraggableTaskItemProps {
  task: Task;
  onDelete: (id: string) => void;
}

export function DraggableTaskItem({ task, onDelete }: DraggableTaskItemProps) {
  const { getTagByKey } = useSettings();
  const tag = task.tag ? getTagByKey(task.tag) : undefined;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-xl bg-card border border-border",
        "transition-all duration-200 hover:border-primary/30 hover:bg-card/80",
        isDragging && "opacity-50 shadow-lg shadow-primary/20 border-primary/50",
        task.status === 'completed' && "opacity-60"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm text-foreground transition-all duration-200",
            task.status === 'completed' && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
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
