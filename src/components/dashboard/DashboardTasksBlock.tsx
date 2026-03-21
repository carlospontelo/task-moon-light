import { Task } from '@/types/task';
import { useSettings } from '@/contexts/SettingsContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Tarefas de Hoje</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {inProgress.length} em andamento · {todayPending.length} pendentes
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onNavigateToTasks} className="text-muted-foreground hover:text-foreground gap-1">
          Ver todas <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 space-y-1.5 overflow-hidden">
        {displayTasks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Nenhuma tarefa para hoje 🎉</p>
          </div>
        ) : (
          displayTasks.map(task => {
            const tag = task.tag ? getTagByKey(task.tag) : null;
            const isInProgress = task.status === 'in_progress';
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 hover:bg-secondary/50 group",
                  isInProgress && "bg-primary/5 border border-primary/10"
                )}
              >
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={() => {
                    onUpdateStatus(task.id, task.status === 'completed' ? 'pending' : 'completed');
                  }}
                  className="shrink-0"
                />
                <span className={cn(
                  "text-sm flex-1 truncate",
                  task.status === 'completed' && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </span>
                {isInProgress && (
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                )}
                {tag && (
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", tag.bgColor, tag.textColor)}>
                    {tag.label}
                  </Badge>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
