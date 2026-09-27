import { useMemo } from 'react';
import NumberFlow from '@number-flow/react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PieChart, type PieSlice } from '@/components/spectrumui/charts/pie-chart';
import { CHART, CHART_TOOLTIP_CLASS } from '@/lib/chart-theme';
import { cn } from '@/lib/utils';
import { addMonths, formatCurrency, getMonthLabel } from '@/types/expense';
import type { FinanceEntriesApi } from '@/hooks/useFinanceEntries';
import { HatchFill } from './HatchPattern';

// Fixed colors for the Summary tab only.
export const SUMMARY_COLORS = {
  income: '#5FD08A',
  expenses: '#F0506E',
  invested: '#7AA2F7',
  left: '#FF5B1F',
} as const;

const BRL = { style: 'currency', currency: 'BRL' } as const;
const LABEL = 'text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground';

type Breakdown = (month: string) => { total: number };

export interface MonthTotals {
  income: number;
  expenses: number;
  invested: number;
  left: number;
}

export function monthTotals(month: string, getCategoryBreakdown: Breakdown, finance: FinanceEntriesApi): MonthTotals {
  const income = finance.getTotal('income', month);
  const expenses = getCategoryBreakdown(month).total;
  const invested = finance.getTotal('investment', month);
  return { income, expenses, invested, left: income - expenses - invested };
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function Swatch({ color, hatched, id }: { color: string; hatched?: boolean; id: string }) {
  if (hatched) {
    return (
      <span className="relative inline-block h-2.5 w-2.5 shrink-0 overflow-hidden rounded-[3px]">
        <HatchFill id={id} color={color} className="absolute inset-0" />
      </span>
    );
  }
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: color }} />;
}

/* ---------- Numbers ---------- */

interface SummaryNumbersProps {
  totals: MonthTotals;
  compact?: boolean;
  /** Shows an "Adicionar entrada" link under the Entrou card. */
  onAddIncome?: () => void;
  /** Without income, Sobrou shows "—" instead of a negative value. */
  dashWhenNoIncome?: boolean;
}

export function SummaryNumbers({ totals, compact = false, onAddIncome, dashWhenNoIncome = false }: SummaryNumbersProps) {
  const noIncome = dashWhenNoIncome && totals.income === 0;
  const negative = !noIncome && totals.left < 0;
  const items = [
    { key: 'income', label: 'Entrou', value: totals.income, color: SUMMARY_COLORS.income },
    { key: 'expenses', label: 'Gastos', value: totals.expenses, color: SUMMARY_COLORS.expenses },
    { key: 'invested', label: 'Investido', value: totals.invested, color: SUMMARY_COLORS.invested },
    { key: 'left', label: 'Sobrou', value: totals.left, color: noIncome ? 'hsl(var(--subtle))' : negative ? SUMMARY_COLORS.expenses : SUMMARY_COLORS.left },
  ];

  return (
    <div className={cn('grid grid-cols-2 gap-3', !compact && 'lg:grid-cols-4')}>
      {items.map(item => {
        const isLeft = item.key === 'left';
        const hatched = isLeft && !negative && !noIncome;
        return (
          <div
            key={item.key}
            className={cn(
              'relative overflow-hidden rounded-xl border',
              compact ? 'bg-secondary' : 'bg-card',
              compact ? 'p-3.5' : 'p-4 sm:p-5',
              isLeft && negative ? 'border-destructive/40' : 'border-border',
            )}
          >
            {hatched && (
              // Stripes = money without a destination yet.
              <HatchFill id={`left-card-${compact ? 'c' : 'f'}`} color={SUMMARY_COLORS.left} className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5" />
            )}
            <p className={cn('flex items-center gap-2', compact ? 'text-[11px] text-muted-foreground' : LABEL)}>
              <Swatch id={`sw-${item.key}-${compact ? 'c' : 'f'}`} color={item.color} hatched={hatched} />
              {item.label}
            </p>
            {isLeft && noIncome ? (
              <p className={cn('num mt-2 font-medium text-subtle', compact ? 'text-lg' : 'text-lg sm:text-2xl xl:text-3xl')} aria-label="Sem entradas">—</p>
            ) : (
              <NumberFlow
                value={item.value / 100}
                format={BRL}
                locales="pt-BR"
                className={cn(
                  'num mt-2 font-medium',
                  compact ? 'text-lg' : 'text-lg sm:text-2xl xl:text-3xl',
                  isLeft && negative ? 'text-destructive' : 'text-foreground',
                )}
              />
            )}
            {item.key === 'income' && onAddIncome && (
              <button
                type="button"
                onClick={onAddIncome}
                className="mt-1 block text-xs text-subtle underline-offset-2 transition-colors hover:text-foreground hover:underline"
              >
                Adicionar entrada
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Tab ---------- */

interface SummaryTabProps {
  month: string;
  getCategoryBreakdown: Breakdown;
  finance: FinanceEntriesApi;
  onGoToIncome: () => void;
}

export function SummaryTab({ month, getCategoryBreakdown, finance, onGoToIncome }: SummaryTabProps) {
  const totals = monthTotals(month, getCategoryBreakdown, finance);
  const hasIncome = totals.income > 0;
  const negative = hasIncome && totals.left < 0;
  const totalOut = totals.expenses + totals.invested;
  // Without income, percentages are relative to what went out.
  const pctBase = hasIncome ? totals.income : totalOut;

  const slices: PieSlice[] = useMemo(() => {
    const s: PieSlice[] = [
      { key: 'expenses', name: 'Gastos', value: totals.expenses, color: SUMMARY_COLORS.expenses },
      { key: 'invested', name: 'Investido', value: totals.invested, color: SUMMARY_COLORS.invested },
    ];
    if (hasIncome && totals.left > 0) s.push({ key: 'left', name: 'Sobrou', value: totals.left, color: SUMMARY_COLORS.left, hatched: true });
    return s.filter(x => x.value > 0);
  }, [totals.expenses, totals.invested, totals.left, hasIncome]);

  const history = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const m = addMonths(month, i - 5);
      const t = monthTotals(m, getCategoryBreakdown, finance);
      return { month: m, label: getMonthLabel(m).short, ...t };
    });
  }, [month, getCategoryBreakdown, finance]);

  return (
    <div className="space-y-4">
      <SummaryNumbers totals={totals} onAddIncome={onGoToIncome} dashWhenNoIncome />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Where the money went */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className={LABEL}>Para onde foi o dinheiro</h2>
          <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row xl:flex-col xl:items-stretch">
            <PieChart
              data={slices}
              className="h-[160px] w-[160px] shrink-0 xl:mx-auto"
              formatValue={formatCurrency}
              center={
                <>
                  <span className="text-[11px] text-subtle">{hasIncome ? 'Entrou' : 'Saiu'}</span>
                  <span className="num text-sm text-foreground">{formatCurrency(hasIncome ? totals.income : totalOut)}</span>
                </>
              }
            />
            <ul className="w-full min-w-0 flex-1 space-y-3">
              {[
                { key: 'expenses', name: 'Gastos', value: totals.expenses, color: SUMMARY_COLORS.expenses },
                { key: 'invested', name: 'Investido', value: totals.invested, color: SUMMARY_COLORS.invested },
                ...(!hasIncome || negative ? [] : [{ key: 'left', name: 'Sobrou', value: totals.left, color: SUMMARY_COLORS.left, hatched: true }]),
              ].map(row => (
                <li key={row.key} className="flex min-w-0 items-center gap-2.5 text-sm">
                  <Swatch id={`legend-${row.key}`} color={row.color} hatched={'hatched' in row && row.hatched} />
                  <span className="min-w-0 truncate text-muted-foreground">{row.name}</span>
                  <span className="num ml-auto shrink-0 whitespace-nowrap text-foreground">{formatCurrency(row.value)}</span>
                  <span className="num w-9 shrink-0 text-right text-subtle">{pct(row.value, pctBase)}%</span>
                </li>
              ))}
            </ul>
          </div>
          {!hasIncome && (
            <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
              Nenhuma entrada lançada neste mês
            </p>
          )}
          {negative && (
            <p className="mt-5 border-t border-border pt-4 text-sm text-destructive">
              Você gastou <span className="num">{formatCurrency(-totals.left)}</span> a mais do que entrou
            </p>
          )}
        </section>

        {/* Last 6 months */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className={LABEL}>Últimos 6 meses</h2>
            <ul className="flex gap-4 text-xs text-muted-foreground">
              {([['Entrou', SUMMARY_COLORS.income], ['Gastos', SUMMARY_COLORS.expenses], ['Investido', SUMMARY_COLORS.invested]] as const).map(([name, color]) => (
                <li key={name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-[2px]" style={{ background: color }} />
                  {name}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history} barCategoryGap="22%" barGap={2} margin={{ top: 4, right: 0, bottom: 0, left: -8 }}>
                <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="2 4" />
                <XAxis dataKey="label" tick={CHART.tick} tickLine={false} axisLine={false} />
                <YAxis
                  tick={CHART.tick}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tickFormatter={(v: number) => (v >= 100000 ? `${Math.round(v / 100000)}k` : String(Math.round(v / 100)))}
                />
                <Tooltip
                  cursor={{ fill: CHART.cursor, radius: 4 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as (typeof history)[number];
                    return (
                      <div className={CHART_TOOLTIP_CLASS}>
                        <p className="mb-1.5 font-medium text-foreground">{getMonthLabel(d.month).full}</p>
                        {([['Entrou', d.income, SUMMARY_COLORS.income], ['Gastos', d.expenses, SUMMARY_COLORS.expenses], ['Investido', d.invested, SUMMARY_COLORS.invested]] as const).map(([n, v, c]) => (
                          <p key={n} className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-[2px]" style={{ background: c }} />
                            <span className="text-muted-foreground">{n}</span>
                            <span className="num ml-auto pl-4 text-foreground">{formatCurrency(v)}</span>
                          </p>
                        ))}
                        <p className="mt-1.5 flex border-t border-border pt-1.5">
                          <span className="text-muted-foreground">Sobrou</span>
                          <span className={cn('num ml-auto pl-4', d.left < 0 ? 'text-destructive' : 'text-primary')}>{formatCurrency(d.left)}</span>
                        </p>
                      </div>
                    );
                  }}
                />
                {(['income', 'expenses', 'invested'] as const).map(key => (
                  <Bar key={key} dataKey={key} radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false}>
                    {history.map(d => (
                      // Highlight variant: selected month solid, others dimmed.
                      <Cell key={d.month} fill={SUMMARY_COLORS[key]} fillOpacity={d.month === month ? 1 : 0.28} />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
