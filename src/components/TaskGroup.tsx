import { Task, TaskStatus } from '@/types/task';
import { FocusTaskItem } from './FocusTaskItem';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TaskGroupProps {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
  inProgressCount: number;
  defaultOpen?: boolean;
  muted?: boolean;
  count?: number;
}

export function TaskGroup({
  title, icon, tasks, onUpdateStatus, onTogglePin, onDelete, inProgressCount,
  defaultOpen = true, muted = false, count,
}: TaskGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (tasks.length === 0) return null;

  // Sort: in_progress first within each group
  const sorted = [...tasks].sort((a, b) => {
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
    return a.date.localeCompare(b.date);
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 group">
        <ChevronRight className={cn(
          "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
          open && "rotate-90"
        )} />
        <span className={cn("flex items-center gap-2", muted ? "text-muted-foreground" : "text-foreground")}>
          {icon}
          <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        </span>
        <span className="text-[11px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-full font-mono">
          {count ?? tasks.length}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-0.5 ml-1">
          {sorted.map(task => (
            <FocusTaskItem
              key={task.id}
              task={task}
              onUpdateStatus={onUpdateStatus}
              onTogglePin={onTogglePin}
              onDelete={onDelete}
              inProgressCount={inProgressCount}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
