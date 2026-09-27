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

const ICON = { className: 'h-3.5 w-3.5', strokeWidth: 1.5 };

const GROUP_CONFIG: Record<BoardGroup, { icon: React.ReactNode }> = {
  pinned: { icon: <Pin {...ICON} /> },
  today: { icon: <Sun {...ICON} /> },
  this_week: { icon: <CalendarDays {...ICON} /> },
  standby: { icon: <Pause {...ICON} /> },
};

export function TaskColumn({ group, tasks, onUpdateStatus, onDelete, onEdit, inProgressCount }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: group });
  const config = GROUP_CONFIG[group];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border border-border p-2 transition-colors duration-150 min-h-[140px] bg-card",
        isOver && "border-primary/60"
      )}
    >
      <div className="flex items-center gap-2 px-2 pt-1 pb-2.5 text-muted-foreground">
        {config.icon}
        <h3 className="text-xs font-medium uppercase tracking-[0.06em]">
          {BOARD_GROUP_LABELS[group]}
        </h3>
        <span className="num ml-auto text-xs text-subtle">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5 flex-1">
          {tasks.map((task) => (
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
        <div className="flex items-center justify-center flex-1 min-h-[64px] border border-dashed border-border-strong rounded-lg">
          <p className="text-xs text-subtle">Arraste tarefas para cá</p>
        </div>
      )}
    </div>
  );
}
