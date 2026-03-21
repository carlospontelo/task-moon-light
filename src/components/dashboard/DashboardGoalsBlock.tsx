import { Goal, getCurrentQuarter, getQuarterLabel, GOAL_AREA_COLORS, GoalArea } from '@/types/goal';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Props {
  goals: Goal[];
}

export function DashboardGoalsBlock({ goals }: Props) {
  const quarter = getCurrentQuarter();
  const quarterGoals = goals.filter(g => g.quarter === quarter && g.status === 'active').slice(0, 5);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Metas</h3>
        <span className="text-xs text-muted-foreground font-mono">{getQuarterLabel(quarter)}</span>
      </div>

      <div className="flex-1 space-y-3">
        {quarterGoals.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Nenhuma meta ativa</p>
          </div>
        ) : (
          quarterGoals.map(goal => {
            const areaColors = GOAL_AREA_COLORS[goal.area as GoalArea];
            return (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground truncate flex-1">{goal.title}</span>
                  <span className={cn("text-xs font-medium ml-2", areaColors?.text || 'text-muted-foreground')}>
                    {goal.progress}%
                  </span>
                </div>
                <Progress value={goal.progress} className="h-1.5" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
