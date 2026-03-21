import { Task } from '@/types/task';
import { Goal } from '@/types/goal';
import { DashboardTasksBlock } from './DashboardTasksBlock';
import { DashboardFinanceBlock } from './DashboardFinanceBlock';
import { DashboardGoalsBlock } from './DashboardGoalsBlock';
import { DashboardHabitsBlock } from './DashboardHabitsBlock';

interface Props {
  tasks: Task[];
  goals: Goal[];
  onUpdateTaskStatus: (id: string, status: 'pending' | 'in_progress' | 'completed') => void;
  onNavigateToTasks: () => void;
  getCategoryBreakdown: (month: string) => { breakdown: Record<string, { amount: number; percentage: number }>; total: number };
}

export function DashboardView({ tasks, goals, onUpdateTaskStatus, onNavigateToTasks, getCategoryBreakdown }: Props) {
  return (
    <div className="space-y-4">
      {/* Row 1: Tasks + Finances (main blocks) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-300 min-h-[360px]">
          <DashboardTasksBlock
            tasks={tasks}
            onUpdateStatus={onUpdateTaskStatus}
            onNavigateToTasks={onNavigateToTasks}
          />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-300 min-h-[360px]">
          <DashboardFinanceBlock getCategoryBreakdown={getCategoryBreakdown} />
        </div>
      </div>

      {/* Row 2: Goals (compact) */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
        <DashboardGoalsBlock goals={goals} />
      </div>

      {/* Row 3: Habits (full width) */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
        <DashboardHabitsBlock />
      </div>
    </div>
  );
}
