import { useEffect, useMemo, useRef, useState } from 'react';
import { Flame } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { CHART, CHART_TOOLTIP_CLASS } from '@/lib/chart-theme';
import { averageMessage, computeProgress } from '@/lib/task-stats';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

interface ProgressPanelProps {
  tasks: Task[];
  completedTodayCount: number;
  /** `completed_at` is available: show average, streak and week. */
  hasTracking: boolean;
  variant?: 'panel' | 'strip';
}

/** Big mono number that scales briefly when it goes up. */
function BumpNumber({ value, className }: { value: number; className?: string }) {
  const prev = useRef(value);
  const [bumpKey, setBumpKey] = useState(0);

  useEffect(() => {
    if (value > prev.current) setBumpKey(k => k + 1);
    prev.current = value;
  }, [value]);

  return (
    <span key={bumpKey} className={cn('num inline-block origin-left', bumpKey > 0 && 'animate-bump', className)}>
      {value}
    </span>
  );
}

const LABEL = 'text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground';

export function ProgressPanel({ tasks, completedTodayCount, hasTracking, variant = 'panel' }: ProgressPanelProps) {
  const stats = useMemo(() => (hasTracking ? computeProgress(tasks) : null), [tasks, hasTracking]);

  if (variant === 'strip') {
    return (
      <div className={cn('grid divide-x divide-border rounded-xl border border-border bg-card', stats ? 'grid-cols-3' : 'grid-cols-1')}>
        <div className="px-4 py-3">
          <p className="text-[11px] text-muted-foreground">Hoje</p>
          <BumpNumber value={completedTodayCount} className="mt-0.5 text-xl font-medium text-foreground" />
        </div>
        {stats && (
          <>
            <div className="px-4 py-3">
              <p className="text-[11px] text-muted-foreground">Sequência</p>
              <p className="mt-0.5 flex items-center gap-1 text-xl font-medium text-foreground">
                <Flame className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden />
                <span className="num">{stats.streak}</span>
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[11px] text-muted-foreground">Semana</p>
              <p className="num mt-0.5 text-xl font-medium text-foreground">{stats.weekTotal}</p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className={LABEL}>Concluídas hoje</h2>
        <BumpNumber value={completedTodayCount} className="mt-3 text-5xl font-medium leading-none text-foreground" />
        {stats && (
          <p className="mt-3 text-sm text-muted-foreground">{averageMessage(completedTodayCount, stats.average)}</p>
        )}
      </section>

      {stats && (
        <>
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className={LABEL}>Sequência</h2>
            {stats.streak > 0 ? (
              <p className="mt-3 flex items-center gap-2 text-2xl font-medium text-foreground">
                <Flame className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
                <span><span className="num">{stats.streak}</span> {stats.streak === 1 ? 'dia' : 'dias'}</span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Conclua uma tarefa para começar</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className={LABEL}>Esta semana</h2>
            <div className="mt-3 h-[112px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.week} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="22%">
                  <XAxis dataKey="label" tick={CHART.tick} tickLine={false} axisLine={false} interval={0} />
                  <Tooltip
                    cursor={{ fill: CHART.cursor, radius: 4 }}
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className={CHART_TOOLTIP_CLASS}>
                          <p className="num text-base text-foreground">{payload[0].value as number}</p>
                          <p className="text-subtle">{(payload[0].value as number) === 1 ? 'concluída' : 'concluídas'}</p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="count" radius={[4, 4, 4, 4]} minPointSize={3} isAnimationActive={false}>
                    {stats.week.map(d => (
                      <Cell key={d.key} fill={d.isToday ? CHART.barAccent : 'hsl(var(--border))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="num text-foreground">{stats.weekTotal}</span> {stats.weekTotal === 1 ? 'concluída' : 'concluídas'} na semana
            </p>
          </section>
        </>
      )}
    </div>
  );
}
