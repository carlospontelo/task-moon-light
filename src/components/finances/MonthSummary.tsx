import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, addMonths, getMonthLabel } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';

// Tailwind bg class → hex color mapping
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

const OTHERS_COLOR = '#6b7280';

export function MonthSummary({ selectedMonth, getCategoryBreakdown }: MonthSummaryProps) {
  const { categories, getCategoryByKey } = useSettings();

  const { breakdown, total } = getCategoryBreakdown(selectedMonth);

  // Top 5 categories + others for donut
  const donutData = useMemo(() => {
    const entries = Object.entries(breakdown)
      .filter(([_, d]) => d.amount > 0)
      .sort((a, b) => b[1].amount - a[1].amount);

    const top5 = entries.slice(0, 5);
    const othersAmount = entries.slice(5).reduce((sum, [_, d]) => sum + d.amount, 0);
    const othersPercentage = total > 0 ? Math.round((othersAmount / total) * 100) : 0;

    const result = top5.map(([key, data]) => {
      const cat = getCategoryByKey(key);
      return {
        key,
        name: cat?.label || key,
        icon: cat?.icon || '📦',
        value: data.amount,
        percentage: data.percentage,
        color: getHexColor(cat?.barColor || 'bg-gray-500'),
      };
    });

    if (othersAmount > 0) {
      result.push({
        key: '_others',
        name: 'Outros',
        icon: '📦',
        value: othersAmount,
        percentage: othersPercentage,
        color: OTHERS_COLOR,
      });
    }

    return result;
  }, [breakdown, total, getCategoryByKey]);

  // Top category keys for bar chart consistency
  const topCategoryKeys = useMemo(() => donutData.map((d) => d.key), [donutData]);
  const categoryColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    donutData.forEach((d) => { map[d.key] = d.color; });
    return map;
  }, [donutData]);

  // Last 6 months stacked bar data
  const barData = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      months.push(addMonths(selectedMonth, -i));
    }

    return months.map((m) => {
      const { breakdown: mb } = getCategoryBreakdown(m);
      const entry: Record<string, any> = {
        month: getMonthLabel(m).short,
        rawMonth: m,
      };

      const allEntries = Object.entries(mb).filter(([_, d]) => d.amount > 0);

      // Assign top keys directly, sum rest as _others
      topCategoryKeys.forEach((key) => {
        if (key === '_others') return;
        entry[key] = mb[key]?.amount || 0;
      });

      const othersSum = allEntries
        .filter(([k]) => !topCategoryKeys.includes(k) || k === '_others')
        .reduce((sum, [_, d]) => sum + d.amount, 0);

      if (topCategoryKeys.includes('_others') || othersSum > 0) {
        entry['_others'] = (entry['_others'] || 0) + othersSum;
      }

      return entry;
    });
  }, [selectedMonth, getCategoryBreakdown, topCategoryKeys]);

  const stackKeys = topCategoryKeys.filter((k) => barData.some((d) => (d[k] || 0) > 0));

  const formatCompact = (value: number) => {
    const v = value / 100;
    if (v >= 1000) return `${(v / 1000).toFixed(1).replace('.0', '')}k`;
    return v.toFixed(0);
  };

  // Custom tooltip for bar chart
  const BarTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const monthEntry = barData.find((d) => d.month === label);
    const totalMonth = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);

    return (
      <div className="rounded-lg border px-3 py-2 text-xs" style={{
        background: 'hsl(220, 18%, 12%)',
        borderColor: 'hsl(220, 15%, 18%)',
      }}>
        <p className="font-medium text-foreground mb-1">
          {monthEntry?.rawMonth ? getMonthLabel(monthEntry.rawMonth).full : label}
        </p>
        <p className="text-muted-foreground mb-1.5">Total: {formatCurrency(totalMonth)}</p>
        <div className="space-y-0.5">
          {payload.filter((p: any) => p.value > 0).reverse().map((p: any) => {
            const cat = getCategoryByKey(p.dataKey);
            return (
              <div key={p.dataKey} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
                <span className="text-muted-foreground">
                  {p.dataKey === '_others' ? 'Outros' : cat?.label || p.dataKey}
                </span>
                <span className="ml-auto text-foreground">{formatCurrency(p.value)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (total === 0 && barData.every((d) => stackKeys.every((k) => !d[k]))) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl font-bold text-foreground">{formatCurrency(0)}</p>
        <p className="text-sm text-muted-foreground mt-1">Total do mês</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Donut chart */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                innerRadius="60%"
                outerRadius="85%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {donutData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-foreground leading-tight">
              {formatCurrency(total)}
            </span>
            <span className="text-[10px] text-muted-foreground">Total do mês</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 min-w-0">
          {donutData.map((entry) => (
            <div key={entry.key} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
              <span className="flex-shrink-0">{entry.icon}</span>
              <span className="text-muted-foreground truncate">{entry.name}</span>
              <span className="ml-auto text-foreground whitespace-nowrap font-medium">
                {formatCurrency(entry.value)}
              </span>
              <span className="text-muted-foreground whitespace-nowrap">
                {entry.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Stacked bar chart */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">Evolução por categoria</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} barCategoryGap="20%">
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCompact}
              tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 11 }}
              width={40}
            />
            <Tooltip content={<BarTooltipContent />} cursor={{ fill: 'hsl(220, 15%, 18%)', radius: 4 }} />
            {stackKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={categoryColorMap[key] || OTHERS_COLOR}
                radius={key === stackKeys[stackKeys.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                opacity={0.85}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
