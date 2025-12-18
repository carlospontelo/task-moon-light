import { useMemo } from 'react';
import { Task, TaskStatus, TaskTag } from '@/types/task';
import { TaskItem } from './TaskItem';
import { AddTaskForm } from './AddTaskForm';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface TodoViewProps {
  tasks: Task[];
  onAdd: (title: string, date: string, tag?: TaskTag) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

export function TodoView({ tasks, onAdd, onUpdateStatus, onDelete }: TodoViewProps) {
  const { pending, inProgress, completed } = useMemo(() => {
    const pending: Task[] = [];
    const inProgress: Task[] = [];
    const completed: Task[] = [];

    tasks.forEach((task) => {
      switch (task.status) {
        case 'pending':
          pending.push(task);
          break;
        case 'in_progress':
          inProgress.push(task);
          break;
        case 'completed':
          completed.push(task);
          break;
      }
    });

    // Sort by date
    pending.sort((a, b) => a.date.localeCompare(b.date));
    inProgress.sort((a, b) => a.date.localeCompare(b.date));
    completed.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return { pending, inProgress, completed };
  }, [tasks]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">Tarefas</h1>
      </div>

      {/* Add Task */}
      <AddTaskForm onAdd={onAdd} />

      {/* In Progress Tasks */}
      {inProgress.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Clock className="h-4 w-4" />
            <h2 className="text-sm font-medium uppercase tracking-wider">
              Em Andamento ({inProgress.length})
            </h2>
          </div>
          <div className="space-y-3">
            {inProgress.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdateStatus={onUpdateStatus}
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
                onUpdateStatus={onUpdateStatus}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed Tasks */}
      {completed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
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
                onUpdateStatus={onUpdateStatus}
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
