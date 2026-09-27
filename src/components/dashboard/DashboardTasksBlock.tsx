import { Task } from '@/types/task';
import { useSettings } from '@/contexts/SettingsContext';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BlockHeader } from './BlockHeader';

interface Props {
  tasks: Task[];
  onUpdateStatus: (id: string, status: 'pending' | 'in_progress' | 'completed') => void;
  onNavigateToTasks: () => void;
}

export function DashboardTasksBlock({ tasks, onUpdateStatus, onNavigateToTasks }: Props) {
  const { getTagByKey } = useSettings();

  // Show in_progress tasks first, then today's pending tasks
  const inProgress = tasks.filter(t => t.status === 'in_progress' && t.boardGroup === 'today');
  const todayPending = tasks.filter(t => t.boardGroup === 'today' && t.status === 'pending');
  const displayTasks = [...inProgress, ...todayPending].slice(0, 7);
  const openCount = inProgress.length + todayPending.length;

  return (
    <div className="h-full flex flex-col">
      <BlockHeader
        label="Tarefas de hoje"
        action={
          <Button variant="secondary" size="icon-sm" onClick={onNavigateToTasks} aria-label="Ver todas as tarefas" title="Ver todas">
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        }
      />

      <div className="mt-3 mb-5 flex items-baseline gap-3">
        <span className="num text-5xl font-medium leading-none text-foreground">{openCount}</span>
        <span className="text-sm text-muted-foreground">
          <span className="num">{todayPending.length}</span> pendentes · <span className="num text-primary">{inProgress.length}</span> em andamento
        </span>
      </div>

      <div className="flex-1 overflow-hidden border-t border-border pt-2">
        {displayTasks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <p className="text-sm font-medium text-foreground">Dia livre</p>
            <p className="mt-1 text-xs text-muted-foreground">Nada marcado para hoje no quadro de tarefas.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onNavigateToTasks}>
              Planejar o dia
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {displayTasks.map(task => {
              const tag = task.tag ? getTagByKey(task.tag) : null;
              const isInProgress = task.status === 'in_progress';
              return (
                <li key={task.id} className="flex items-center gap-3 py-2.5">
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={() => {
                      onUpdateStatus(task.id, task.status === 'completed' ? 'pending' : 'completed');
                    }}
                    className="shrink-0"
                  />
                  <span className={cn(
                    "text-sm flex-1 truncate text-foreground",
                    task.status === 'completed' && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </span>
                  {isInProgress && (
                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                  )}
                  {tag && (
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", tag.bgColor, tag.textColor)}>
                      {tag.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
