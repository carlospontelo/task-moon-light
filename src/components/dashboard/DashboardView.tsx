import { memo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task } from '@/types/task';
import { Goal } from '@/types/goal';
import { PageHeader } from '@/components/layout/PageHeader';
import type { FinanceEntriesApi } from '@/hooks/useFinanceEntries';
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
  finance: FinanceEntriesApi;
  onNavigateToFinances: () => void;
  tasksLoading?: boolean;
}

const BLOCK = 'rounded-xl border border-border bg-card p-5 sm:p-6';

export const DashboardView = memo(function DashboardView({ tasks, goals, onUpdateTaskStatus, onNavigateToTasks, getCategoryBreakdown, finance, onNavigateToFinances, tasksLoading = false }: Props) {
  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={<span className="first-letter:uppercase inline-block">{todayLabel}</span>}
      />

      {/* Primary block (tasks) larger; finance + goals stacked beside it */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className={`${BLOCK} lg:col-span-7 min-h-[420px]`}>
          <DashboardTasksBlock
            tasks={tasks}
            onUpdateStatus={onUpdateTaskStatus}
            onNavigateToTasks={onNavigateToTasks}
            loading={tasksLoading}
          />
        </section>
        <div className="grid grid-cols-1 gap-4 lg:col-span-5">
          <section className={BLOCK}>
            <DashboardFinanceBlock getCategoryBreakdown={getCategoryBreakdown} finance={finance} onNavigateToFinances={onNavigateToFinances} />
          </section>
          <section className={BLOCK}>
            <DashboardGoalsBlock goals={goals} />
          </section>
        </div>
      </div>

      <section className={BLOCK}>
        <DashboardHabitsBlock />
      </section>
    </div>
  );
});
