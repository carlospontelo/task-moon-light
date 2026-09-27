import { Task } from '@/types/task';
import { useSettings } from '@/contexts/SettingsContext';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { completedToday, isOverdue, logStatusChange } from '@/lib/task-stats';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BlockHeader } from './BlockHeader';

interface Props {
  tasks: Task[];
  onUpdateStatus: (id: string, status: 'pending' | 'in_progress' | 'completed') => void;
  onNavigateToTasks: () => void;
  loading?: boolean;
}

export function DashboardTasksBlock({ tasks, onUpdateStatus, onNavigateToTasks, loading = false }: Props) {
  const { getTagByKey } = useSettings();

  // Same columns as the Tasks tab: "Em andamento" first, then "A fazer".
  const bySortOrder = (a: Task, b: Task) => a.sortOrder - b.sortOrder;
  const inProgress = tasks.filter(t => t.status === 'in_progress').sort(bySortOrder);
  const todo = tasks.filter(t => t.status === 'pending').sort(bySortOrder);
  const displayTasks = [...inProgress, ...todo].slice(0, 7);
  const doneToday = completedToday(tasks).length;

  const setStatus = (id: string, status: 'pending' | 'in_progress' | 'completed') => {
    logStatusChange(id, status);
    onUpdateStatus(id, status);
  };

  return (
    <div className="h-full flex flex-col">
      <BlockHeader
        label="Tarefas"
        action={
          <Button variant="secondary" size="icon-sm" onClick={onNavigateToTasks} aria-label="Ver todas as tarefas" title="Ver todas">
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        }
      />

      <div className="mt-3 mb-5 flex items-baseline gap-3">
        <span className="num text-5xl font-medium leading-none text-foreground">{loading ? '–' : doneToday}</span>
        {/* Each segment wraps as a unit; orange only when something is actually in progress. */}
        <span className={cn('text-sm text-muted-foreground', loading && 'invisible')}>
          <span className="whitespace-nowrap">{doneToday === 1 ? 'concluída hoje' : 'concluídas hoje'}</span>
          {' · '}
          <span className="whitespace-nowrap">
            <span className={cn('num', inProgress.length > 0 && 'text-primary')}>{inProgress.length}</span> em andamento
          </span>
          {' · '}
          <span className="whitespace-nowrap"><span className="num">{todo.length}</span> a fazer</span>
        </span>
      </div>

      <div className="flex-1 overflow-hidden border-t border-border pt-2">
        {loading && tasks.length === 0 ? (
          <ul className="divide-y divide-border" aria-busy="true" aria-label="Carregando tarefas">
            {[0.7, 0.5, 0.6, 0.4].map((w, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3" style={{ width: `${w * 100}%` }} />
              </li>
            ))}
          </ul>
        ) : displayTasks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <p className="text-sm font-medium text-foreground">Nada pendente</p>
            <p className="mt-1 text-xs text-muted-foreground">Crie uma tarefa na aba Tarefas.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onNavigateToTasks}>
              Abrir Tarefas
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
                      setStatus(task.id, task.status === 'completed' ? 'pending' : 'completed');
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
                    <Loader2 className="h-3.5 w-3.5 text-primary motion-safe:animate-spin shrink-0" aria-label="Em andamento" />
                  )}
                  {isOverdue(task) && (
                    <span className="num shrink-0 text-[11px] text-destructive">
                      {format(parseISO(task.date), 'dd MMM', { locale: ptBR })}
                    </span>
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
