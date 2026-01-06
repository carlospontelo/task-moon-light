import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Task, TAG_COLORS, TAG_LABELS, STATUS_LABELS } from '@/types/task';
import { Goal } from '@/types/goal';
import { cn } from '@/lib/utils';
import { Link2, Unlink } from 'lucide-react';

interface LinkTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
  linkedTasks: Task[];
  unlinkedTasks: Task[];
  onLink: (taskId: string) => void;
  onUnlink: (taskId: string) => void;
}

export function LinkTasksDialog({
  open,
  onOpenChange,
  goal,
  linkedTasks,
  unlinkedTasks,
  onLink,
  onUnlink,
}: LinkTasksDialogProps) {
  const [showLinked, setShowLinked] = useState(true);

  const TaskRow = ({ task, isLinked }: { task: Task; isLinked: boolean }) => {
    const tagColors = task.tag ? TAG_COLORS[task.tag] : null;
    
    return (
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-all",
          isLinked 
            ? "bg-primary/5 border-primary/20" 
            : "bg-card border-border hover:border-primary/30"
        )}
      >
        <Checkbox
          checked={isLinked}
          onCheckedChange={() => {
            if (isLinked) {
              onUnlink(task.id);
            } else {
              onLink(task.id);
            }
          }}
        />
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm truncate",
            task.status === 'completed' && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {STATUS_LABELS[task.status]}
            </span>
            {task.tag && tagColors && (
              <span className={cn("text-xs px-1.5 py-0.5 rounded", tagColors.bg, tagColors.text)}>
                {TAG_LABELS[task.tag]}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            if (isLinked) {
              onUnlink(task.id);
            } else {
              onLink(task.id);
            }
          }}
          className="flex-shrink-0"
        >
          {isLinked ? (
            <Unlink className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Link2 className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vincular Tarefas</DialogTitle>
          <DialogDescription>
            Conecte tarefas do To-Do à meta "{goal.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b border-border pb-3">
          <Button
            variant={showLinked ? "default" : "outline"}
            size="sm"
            onClick={() => setShowLinked(true)}
          >
            Vinculadas ({linkedTasks.length})
          </Button>
          <Button
            variant={!showLinked ? "default" : "outline"}
            size="sm"
            onClick={() => setShowLinked(false)}
          >
            Disponíveis ({unlinkedTasks.length})
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {showLinked ? (
            linkedTasks.length > 0 ? (
              linkedTasks.map(task => (
                <TaskRow key={task.id} task={task} isLinked={true} />
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhuma tarefa vinculada ainda
              </p>
            )
          ) : (
            unlinkedTasks.length > 0 ? (
              unlinkedTasks.map(task => (
                <TaskRow key={task.id} task={task} isLinked={false} />
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">
                Todas as tarefas já estão vinculadas a metas
              </p>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
