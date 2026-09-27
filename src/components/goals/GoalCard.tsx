import { Goal, GOAL_AREA_COLORS, GOAL_AREA_LABELS, GOAL_ENERGY_LABELS, GOAL_TYPE_LABELS, GoalStatus } from '@/types/goal';
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
import { EnergyIcon } from './EnergyIcon';

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
        "group flex flex-col p-5 rounded-xl border bg-card transition-colors duration-150",
        isActive 
          ? "border-border hover:border-border-strong" 
          : "border-border opacity-70"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "text-[15px] font-medium text-foreground truncate",
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
              aria-label="Ações da meta"
              className="-mr-2 -mt-1 text-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 transition-opacity"
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
                  Marcar como concluída
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
              Vincular tarefas
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
      <div className="flex flex-wrap gap-1.5 mb-5">
        <Badge variant="outline" className={cn(areaColors.bg, areaColors.text, "border-none")}>
          {GOAL_AREA_LABELS[goal.area]}
        </Badge>
        <Badge variant="secondary">
          {GOAL_TYPE_LABELS[goal.type]}
        </Badge>
        <Badge variant="secondary">
          <EnergyIcon energy={goal.energy} className="mr-1 h-3 w-3" />
          {GOAL_ENERGY_LABELS[goal.energy]}
        </Badge>
      </div>

      {/* Progress */}
      <div className="mt-auto space-y-2.5">
        <div className="flex items-end justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {linkedTasks.length > 0 
              ? <><span className="num">{completedTasks}/{linkedTasks.length}</span> tarefas</>
              : 'Sem tarefas vinculadas'
            }
          </span>
          <span className="num text-2xl font-medium leading-none text-foreground">{goal.progress}<span className="text-sm text-subtle">%</span></span>
        </div>
        <Progress value={goal.progress} className="h-1" />
      </div>

      {/* Linked Tasks Preview */}
      {linkedTasks.length > 0 && (
        <button
          onClick={onManageLinks}
          className="mt-4 w-full text-left text-xs text-subtle hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Link2 className="h-3 w-3" strokeWidth={1.5} />
          Ver tarefas vinculadas
        </button>
      )}

      {/* Abandon reason */}
      {goal.status === 'abandoned' && goal.abandonReason && (
        <p className="mt-4 text-xs text-muted-foreground border-t border-border pt-3">
          Motivo: {goal.abandonReason}
        </p>
      )}
    </div>
  );
}
