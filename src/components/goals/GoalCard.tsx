import { Goal, GOAL_AREA_COLORS, GOAL_AREA_LABELS, GOAL_ENERGY_ICONS, GOAL_ENERGY_LABELS, GOAL_TYPE_LABELS, GoalStatus } from '@/types/goal';
import { Task } from '@/types/task';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pause, Play, CheckCircle2, XCircle, Link2, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: Goal;
  linkedTasks: Task[];
  onStatusChange: (status: GoalStatus, reason?: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onManageLinks: () => void;
}

export function GoalCard({ 
  goal, 
  linkedTasks, 
  onStatusChange, 
  onEdit, 
  onDelete,
  onManageLinks 
}: GoalCardProps) {
  const areaColors = GOAL_AREA_COLORS[goal.area];
  const completedTasks = linkedTasks.filter(t => t.status === 'completed').length;
  const isActive = goal.status === 'active';

  return (
    <div 
      className={cn(
        "group p-4 rounded-xl border transition-all duration-200",
        isActive 
          ? "bg-card border-border hover:border-primary/30" 
          : "bg-card/50 border-border/50 opacity-80"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-medium text-foreground truncate",
            !isActive && "text-muted-foreground"
          )}>
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {goal.description}
            </p>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {goal.status === 'active' && (
              <DropdownMenuItem onClick={() => onStatusChange('paused')}>
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </DropdownMenuItem>
            )}
            {goal.status === 'paused' && (
              <DropdownMenuItem onClick={() => onStatusChange('active')}>
                <Play className="h-4 w-4 mr-2" />
                Reativar
              </DropdownMenuItem>
            )}
            {(goal.status === 'active' || goal.status === 'paused') && (
              <>
                <DropdownMenuItem onClick={() => onStatusChange('completed')}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Concluída
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('abandoned')}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Abandonar
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onManageLinks}>
              <Link2 className="h-4 w-4 mr-2" />
              Vincular Tarefas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant="outline" className={cn(areaColors.bg, areaColors.text, "border-none text-xs")}>
          {GOAL_AREA_LABELS[goal.area]}
        </Badge>
        <Badge variant="outline" className="bg-secondary/50 text-muted-foreground border-none text-xs">
          {GOAL_TYPE_LABELS[goal.type]}
        </Badge>
        <Badge variant="outline" className="bg-secondary/50 text-muted-foreground border-none text-xs">
          {GOAL_ENERGY_ICONS[goal.energy]} {GOAL_ENERGY_LABELS[goal.energy]}
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {linkedTasks.length > 0 
              ? `${completedTasks}/${linkedTasks.length} tarefas`
              : 'Sem tarefas vinculadas'
            }
          </span>
          <span className="text-foreground font-mono">{goal.progress}%</span>
        </div>
        <Progress value={goal.progress} className="h-1.5" />
      </div>

      {/* Linked Tasks Preview */}
      {linkedTasks.length > 0 && (
        <button
          onClick={onManageLinks}
          className="mt-3 w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Link2 className="h-3 w-3" />
          Ver tarefas vinculadas →
        </button>
      )}

      {/* Abandon reason */}
      {goal.status === 'abandoned' && goal.abandonReason && (
        <p className="mt-3 text-xs text-muted-foreground italic border-t border-border/50 pt-2">
          Motivo: {goal.abandonReason}
        </p>
      )}
    </div>
  );
}
