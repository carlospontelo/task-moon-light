import { Task } from '@/types/task';
import { useSettings } from '@/contexts/SettingsContext';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpRight, Star } from 'lucide-react';
import { classifyTasks, getDueState, todayKey } from '@/lib/task-sections';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

  // Same sections as the Tasks tab: focus, then overdue, then the default list.
  const today = todayKey();
  const { focus, overdue, main, upcoming } = classifyTasks(tasks, today);
  const focusIds = new Set(focus.map(t => t.id));
  const displayTasks = [...focus, ...overdue, ...main].slice(0, 7);
  const openCount = focus.length + overdue.length + main.length + upcoming.length;
  const inProgressCount = [...focus, ...overdue, ...main, ...upcoming].filter(t => t.status === 'in_progress').length;

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
        <span className="num text-5xl font-medium leading-none text-foreground">{openCount}</span>
        <span className="text-sm text-muted-foreground">
          pendentes{inProgressCount > 0 && <> · <span className="num text-primary">{inProgressCount}</span> em andamento</>}
          {overdue.length > 0 && <> · <span className="num text-destructive">{overdue.length}</span> atrasadas</>}
        </span>
      </div>

      <div className="flex-1 overflow-hidden border-t border-border pt-2">
        {displayTasks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <p className="text-sm font-medium text-foreground">Nada pendente</p>
            <p className="mt-1 text-xs text-muted-foreground">Sua lista de tarefas está vazia.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onNavigateToTasks}>
              Planejar o dia
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {displayTasks.map(task => {
              const tag = task.tag ? getTagByKey(task.tag) : null;
              const isInProgress = task.status === 'in_progress';
              const due = getDueState(task, today);
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
                    {isInProgress && (
                      <span className="mr-2 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-primary align-middle" aria-label="Em andamento" />
                    )}
                    {task.title}
                  </span>
                  {focusIds.has(task.id) && (
                    <Star className="h-3.5 w-3.5 shrink-0 fill-current text-primary" strokeWidth={1.5} aria-label="Em foco" />
                  )}
                  {due === 'overdue' && (
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
