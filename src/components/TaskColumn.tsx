import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus, BoardGroup, BOARD_GROUP_LABELS } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Pin, Sun, CalendarDays, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskColumnProps {
  group: BoardGroup;
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  inProgressCount: number;
}

const GROUP_CONFIG: Record<BoardGroup, { icon: React.ReactNode; color: string }> = {
  pinned: { icon: <Pin className="h-3.5 w-3.5" />, color: 'text-primary' },
  today: { icon: <Sun className="h-3.5 w-3.5" />, color: 'text-amber-400' },
  this_week: { icon: <CalendarDays className="h-3.5 w-3.5" />, color: 'text-blue-400' },
  standby: { icon: <Pause className="h-3.5 w-3.5" />, color: 'text-muted-foreground' },
};

export function TaskColumn({ group, tasks, onUpdateStatus, onDelete, onEdit, inProgressCount }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: group });
  const config = GROUP_CONFIG[group];

  // Sort: in_progress first
  const sorted = [...tasks].sort((a, b) => {
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
    return 0;
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border border-border p-3 transition-all duration-200 min-h-[120px] bg-card/30",
        isOver && "border-primary/40 bg-primary/5"
      )}
    >
      <div className={cn("flex items-center gap-2 mb-3", config.color)}>
        {config.icon}
        <h3 className="text-xs font-semibold uppercase tracking-wider">
          {BOARD_GROUP_LABELS[group]}
        </h3>
        <span className="text-[11px] bg-secondary/50 px-1.5 py-0.5 rounded-full font-mono text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={sorted.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1 flex-1">
          {sorted.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdateStatus={onUpdateStatus}
              onDelete={onDelete}
              onEdit={onEdit}
              inProgressCount={inProgressCount}
            />
          ))}
        </div>
      </SortableContext>

      {tasks.length === 0 && (
        <div className="flex items-center justify-center flex-1 min-h-[60px] border border-dashed border-border/50 rounded-lg">
          <p className="text-[11px] text-muted-foreground">Arraste tarefas aqui</p>
        </div>
      )}
    </div>
  );
}
