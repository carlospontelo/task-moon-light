import { useMemo } from 'react';
import { Task } from '@/types/task';
import { TaskItem } from './TaskItem';
import { AddTaskForm } from './AddTaskForm';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface TodoViewProps {
  tasks: Task[];
  onAdd: (title: string, date: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoView({ tasks, onAdd, onToggle, onDelete }: TodoViewProps) {
  const { pending, completed, overdue } = useMemo(() => {
    const pending: Task[] = [];
    const completed: Task[] = [];
    const overdue: Task[] = [];

    tasks.forEach((task) => {
      if (task.completed) {
        completed.push(task);
      } else if (isPast(parseISO(task.date)) && !isToday(parseISO(task.date))) {
        overdue.push(task);
      } else {
        pending.push(task);
      }
    });

    // Sort by date
    pending.sort((a, b) => a.date.localeCompare(b.date));
    overdue.sort((a, b) => a.date.localeCompare(b.date));
    completed.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return { pending, completed, overdue };
  }, [tasks]);

  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Tarefas</h1>
        <p className="text-muted-foreground font-mono text-sm capitalize">{today}</p>
      </div>

      {/* Add Task */}
      <AddTaskForm onAdd={onAdd} />

      {/* Overdue Tasks */}
      {overdue.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-destructive">
            <Clock className="h-4 w-4" />
            <h2 className="text-sm font-medium uppercase tracking-wider">
              Atrasadas ({overdue.length})
            </h2>
          </div>
          <div className="space-y-3">
            {overdue.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Pending Tasks */}
      {pending.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <Circle className="h-4 w-4" />
            <h2 className="text-sm font-medium uppercase tracking-wider">
              Pendentes ({pending.length})
            </h2>
          </div>
          <div className="space-y-3">
            {pending.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed Tasks */}
      {completed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <h2 className="text-sm font-medium uppercase tracking-wider">
              Concluídas ({completed.length})
            </h2>
          </div>
          <div className="space-y-3">
            {completed.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Nenhuma tarefa ainda</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Adicione sua primeira tarefa acima
          </p>
        </div>
      )}
    </div>
  );
}
