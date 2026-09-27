import { useCallback, useMemo } from 'react';
import { BarChart, Bar, Rectangle, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, type RectangleProps } from 'recharts';
import { PieChart } from '@/components/spectrumui/charts/pie-chart';
import { formatCurrency, addMonths, getMonthLabel } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';
import { CHART, CHART_TOOLTIP_CLASS } from '@/lib/chart-theme';

const TAILWIND_COLOR_MAP: Record<string, string> = {
  'bg-blue-500': '#3b82f6',
  'bg-orange-500': '#f97316',
  'bg-cyan-500': '#06b6d4',
  'bg-pink-500': '#ec4899',
  'bg-red-500': '#ef4444',
  'bg-slate-500': '#64748b',
  'bg-purple-500': '#a855f7',
  'bg-amber-500': '#f59e0b',
  'bg-emerald-500': '#10b981',
  'bg-gray-500': '#6b7280',
  'bg-green-500': '#22c55e',
  'bg-yellow-500': '#eab308',
  'bg-indigo-500': '#6366f1',
  'bg-teal-500': '#14b8a6',
  'bg-rose-500': '#f43f5e',
  'bg-lime-500': '#84cc16',
  'bg-sky-500': '#0ea5e9',
  'bg-violet-500': '#8b5cf6',
  'bg-fuchsia-500': '#d946ef',
};

function getHexColor(barColor: string): string {
  return TAILWIND_COLOR_MAP[barColor] || '#6b7280';
}

interface MonthSummaryProps {
  selectedMonth: string;
  getCategoryBreakdown: (month: string) => {
    breakdown: Record<string, { amount: number; percentage: number }>;
    total: number;
  };
}

const FALLBACK_COLOR = getHexColor('bg-gray-500');

interface MonthRow {
  month: string;
  rawMonth: string;
  total: number;
  [categoryKey: string]: number | string;
}

export function MonthSummary({ selectedMonth, getCategoryBreakdown }: MonthSummaryProps) {
  const { categories, getCategoryByKey } = useSettings();

  const { breakdown, total } = getCategoryBreakdown(selectedMonth);

  const categoryInfo = useCallback((key: string) => {
    const cat = getCategoryByKey(key);
    return {
      name: cat?.label || key,
      icon: cat?.icon || '📦',
      color: cat ? getHexColor(cat.barColor) : FALLBACK_COLOR,
    };
  }, [getCategoryByKey]);

  // Donut + legend: every category with spending this month, largest first. No grouping.
  const donutData = useMemo(() => {
    return Object.entries(breakdown)
      .filter(([, d]) => d.amount > 0)
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([key, data]) => ({ key, value: data.amount, percentage: data.percentage, ...categoryInfo(key) }));
  }, [breakdown, categoryInfo]);

  // Last 6 months: one row per month with every category amount.
  const barData = useMemo<MonthRow[]>(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const m = addMonths(selectedMonth, i - 5);
      const { breakdown: mb, total: monthTotal } = getCategoryBreakdown(m);
      const row: MonthRow = { month: getMonthLabel(m).short, rawMonth: m, total: monthTotal };
      for (const [key, d] of Object.entries(mb)) if (d.amount > 0) row[key] = d.amount;
      return row;
    });
  }, [selectedMonth, getCategoryBreakdown]);

  // Fixed stacking order = category order in Settings, so segments don't move between months.
  // Categories no longer in Settings (but with spending) go last.
  const stackKeys = useMemo(() => {
    const used = new Set<string>();
    barData.forEach(row => Object.keys(row).forEach(k => {
      if (k !== 'month' && k !== 'rawMonth' && k !== 'total') used.add(k);
    }));
    const ordered = categories.map(c => c.key).filter(k => used.has(k));
    const unknown = [...used].filter(k => !ordered.includes(k)).sort();
    return [...ordered, ...unknown];
  }, [barData, categories]);

  // Only the top visible segment of each column gets rounded corners.
  const topKeyByMonth = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    barData.forEach(row => {
      map[row.rawMonth] = [...stackKeys].reverse().find(k => Number(row[k] ?? 0) > 0);
    });
    return map;
  }, [barData, stackKeys]);

  const formatCompact = (value: number) => {
    const v = value / 100;
    if (v >= 1000) return `${(v / 1000).toFixed(1).replace('.0', '')}k`;
    return v.toFixed(0);
  };

  const BarTooltipContent = ({ active, label }: { active?: boolean; label?: string }) => {
    if (!active) return null;
    const row = barData.find((d) => d.month === label);
    if (!row) return null;
    const items = stackKeys
      .map(key => ({ key, value: Number(row[key] ?? 0), ...categoryInfo(key) }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return (
      <div className={CHART_TOOLTIP_CLASS}>
        <p className="font-medium text-foreground mb-1">{getMonthLabel(row.rawMonth).full}</p>
        <p className="num text-base text-foreground mb-2">{formatCurrency(row.total)}</p>
        {items.length === 0 ? (
          <p className="text-subtle">Sem gastos</p>
        ) : (
          <div className="space-y-1">
            {items.map(item => (
              <div key={item.key} className="flex items-center gap-1.5">
                <div className="w-2 h-2 shrink-0 rounded-full" style={{ background: item.color }} />
                <span className="shrink-0">{item.icon}</span>
                <span className="text-muted-foreground">{item.name}</span>
                <span className="num ml-auto pl-4 text-foreground">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (total === 0 && stackKeys.length === 0) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">Total do mês</p>
        <p className="num mt-2 text-4xl font-medium text-foreground">{formatCurrency(0)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">Total do mês</p>
        <p className="num mt-2 text-4xl font-medium leading-none text-foreground">{formatCurrency(total)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
        {/* Left: Donut chart */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Each slice keeps its category color (barColor from settings). */}
          <PieChart
            className="h-[180px] w-[180px] flex-shrink-0"
            data={donutData.map((d) => ({ key: d.key, name: d.name, value: d.value, color: d.color }))}
            formatValue={formatCurrency}
          />

          {/* Legend */}
          <div className="flex flex-col gap-2 min-w-0 w-full">
            {donutData.map((entry) => (
              <div key={entry.key} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                <span className="flex-shrink-0">{entry.icon}</span>
                <span className="text-muted-foreground truncate">{entry.name}</span>
                <span className="num ml-auto text-foreground whitespace-nowrap">
                  {formatCurrency(entry.value)}
                </span>
                <span className="num w-9 text-right text-subtle whitespace-nowrap">
                  {entry.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Stacked bar chart */}
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground mb-4">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barCategoryGap="24%" maxBarSize={32}>
              <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="2 4" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={CHART.tick}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={formatCompact}
                tick={CHART.tick}
                width={40}
              />
              <Tooltip content={<BarTooltipContent />} cursor={{ fill: CHART.cursor, radius: 4 }} />
              {stackKeys.map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={categoryInfo(key).color}
                  opacity={0.85}
                  isAnimationActive={false}
                  shape={(props: RectangleProps & { payload?: MonthRow }) => (
                    <Rectangle
                      {...props}
                      radius={props.payload && topKeyByMonth[props.payload.rawMonth] === key ? [4, 4, 0, 0] : 0}
                    />
                  )}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
