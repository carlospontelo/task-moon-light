import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus, STATUS_LABELS } from '@/types/task';
import { DraggableTaskItem } from './DraggableTaskItem';
import { Circle, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onDelete: (id: string) => void;
}

const STATUS_CONFIG: Record<TaskStatus, { icon: React.ReactNode; color: string; bgColor: string }> = {
  pending: { 
    icon: <Circle className="h-4 w-4" />, 
    color: 'text-foreground',
    bgColor: 'bg-muted/30'
  },
  in_progress: { 
    icon: <Clock className="h-4 w-4" />, 
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10'
  },
  completed: { 
    icon: <CheckCircle2 className="h-4 w-4" />, 
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10'
  },
};

export function StatusColumn({ status, tasks, onDelete }: StatusColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = STATUS_CONFIG[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 rounded-xl border border-border p-4 transition-all duration-200 min-h-[200px]",
        config.bgColor,
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      <div className={cn("flex items-center gap-2 mb-4", config.color)}>
        {config.icon}
        <h2 className="text-sm font-medium uppercase tracking-wider">
          {STATUS_LABELS[status]}
        </h2>
        <span className="text-xs bg-background/50 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((task) => (
            <DraggableTaskItem
              key={task.id}
              task={task}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>

      {tasks.length === 0 && (
        <div className="flex items-center justify-center h-20 border-2 border-dashed border-border/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            Arraste tarefas aqui
          </p>
        </div>
      )}
    </div>
  );
}
