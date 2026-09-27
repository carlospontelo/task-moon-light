import { Goal, getCurrentQuarter, getQuarterLabel } from '@/types/goal';
import { Progress } from '@/components/ui/progress';
import { BlockHeader } from './BlockHeader';

interface Props {
  goals: Goal[];
}

export function DashboardGoalsBlock({ goals }: Props) {
  const quarter = getCurrentQuarter();
  const quarterGoals = goals.filter(g => g.quarter === quarter && g.status === 'active').slice(0, 5);

  return (
    <div className="h-full flex flex-col">
      <BlockHeader
        label="Metas"
        action={<span className="num text-xs text-subtle">{getQuarterLabel(quarter)}</span>}
      />

      <div className="flex-1 mt-4 space-y-4">
        {quarterGoals.length === 0 ? (
          <div>
            <p className="text-sm font-medium text-foreground">Sem metas ativas</p>
            <p className="mt-1 text-xs text-muted-foreground">Crie metas na aba Metas para acompanhar o trimestre aqui.</p>
          </div>
        ) : (
          quarterGoals.map(goal => (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground truncate flex-1">{goal.title}</span>
                <span className="num text-xs text-muted-foreground">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-1" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
