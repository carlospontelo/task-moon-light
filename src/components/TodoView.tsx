import { useMemo } from 'react';
import { Task, TaskStatus, TaskTag } from '@/types/task';
import { TaskGroup } from './TaskGroup';
import { AddTaskForm } from './AddTaskForm';
import { Pin, Sun, CalendarDays, Archive, CheckCircle2 } from 'lucide-react';
import { isToday, parseISO, isThisWeek, isBefore, startOfDay } from 'date-fns';

interface TodoViewProps {
  tasks: Task[];
  onAdd: (title: string, date: string, tag?: TaskTag) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
}

export function TodoView({ tasks, onAdd, onUpdateStatus, onTogglePin, onDelete }: TodoViewProps) {
  const inProgressCount = useMemo(() => tasks.filter(t => t.status === 'in_progress').length, [tasks]);

  const groups = useMemo(() => {
    const pinned: Task[] = [];
    const today: Task[] = [];
    const thisWeek: Task[] = [];
    const backlog: Task[] = [];
    const completed: Task[] = [];

    const now = startOfDay(new Date());

    tasks.forEach(task => {
      if (task.status === 'completed') {
        completed.push(task);
        return;
      }

      const taskDate = parseISO(task.date);
      const overdue = isBefore(taskDate, now);

      if (task.pinned) {
        pinned.push(task);
      } else if (isToday(taskDate) || overdue) {
        today.push(task);
      } else if (isThisWeek(taskDate, { weekStartsOn: 1 })) {
        thisWeek.push(task);
      } else {
        backlog.push(task);
      }
    });

    return { pinned, today, thisWeek, backlog, completed };
  }, [tasks]);

  const activeCount = tasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-foreground">Tarefas</h1>
        <p className="text-sm text-muted-foreground">
          {activeCount} {activeCount === 1 ? 'tarefa ativa' : 'tarefas ativas'}
          {inProgressCount > 0 && <span className="text-primary"> • {inProgressCount} em andamento</span>}
        </p>
      </div>

      <AddTaskForm onAdd={onAdd} />

      <div className="space-y-4">
        <TaskGroup
          title="Fixadas"
          icon={<Pin className="h-3.5 w-3.5 text-primary" />}
          tasks={groups.pinned}
          onUpdateStatus={onUpdateStatus}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          inProgressCount={inProgressCount}
        />

        <TaskGroup
          title="Hoje"
          icon={<Sun className="h-3.5 w-3.5 text-amber-400" />}
          tasks={groups.today}
          onUpdateStatus={onUpdateStatus}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          inProgressCount={inProgressCount}
        />

        <TaskGroup
          title="Esta semana"
          icon={<CalendarDays className="h-3.5 w-3.5 text-blue-400" />}
          tasks={groups.thisWeek}
          onUpdateStatus={onUpdateStatus}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          inProgressCount={inProgressCount}
        />

        <TaskGroup
          title="Backlog"
          icon={<Archive className="h-3.5 w-3.5 text-muted-foreground" />}
          tasks={groups.backlog}
          onUpdateStatus={onUpdateStatus}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          inProgressCount={inProgressCount}
        />

        <TaskGroup
          title="Concluídas"
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
          tasks={groups.completed}
          onUpdateStatus={onUpdateStatus}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
          inProgressCount={inProgressCount}
          defaultOpen={false}
          muted
        />
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Nenhuma tarefa ainda</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Adicione sua primeira tarefa acima</p>
        </div>
      )}
    </div>
  );
}
