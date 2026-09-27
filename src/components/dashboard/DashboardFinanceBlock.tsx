import { useState } from 'react';
import { getCurrentMonth, getMonthLabel, addMonths, formatCurrency } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockHeader } from './BlockHeader';

interface Props {
  getCategoryBreakdown: (month: string) => { breakdown: Record<string, { amount: number; percentage: number }>; total: number };
}

export function DashboardFinanceBlock({ getCategoryBreakdown }: Props) {
  const [month, setMonth] = useState(getCurrentMonth());
  const { getCategoryByKey } = useSettings();
  const { breakdown, total } = getCategoryBreakdown(month);
  const label = getMonthLabel(month);

  const sorted = Object.entries(breakdown)
    .filter(([_, d]) => d.amount > 0)
    .sort((a, b) => b[1].percentage - a[1].percentage)
    .slice(0, 6);

  return (
    <div className="h-full flex flex-col">
      <BlockHeader
        label="Gastos do mês"
        action={
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => setMonth(addMonths(month, -1))} aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="num min-w-[72px] text-center text-xs text-muted-foreground">{label.short} {label.year}</span>
            <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => setMonth(addMonths(month, 1))} aria-label="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <p className="num mt-3 mb-5 text-3xl font-medium leading-none text-foreground">{formatCurrency(total)}</p>

      {sorted.length > 0 ? (
        <div className="space-y-4 flex-1">
          <div className="h-2 rounded-full overflow-hidden flex gap-[2px] bg-secondary">
            {sorted.map(([category, data]) => {
              const cat = getCategoryByKey(category);
              return (
                <div
                  key={category}
                  className={`${cat?.barColor || 'bg-gray-500'} transition-all duration-500`}
                  style={{ width: `${data.percentage}%` }}
                />
              );
            })}
          </div>

          <ul className="space-y-2">
            {sorted.map(([category, data]) => {
              const cat = getCategoryByKey(category);
              return (
                <li key={category} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className={`w-2 h-2 shrink-0 rounded-full ${cat?.barColor || 'bg-gray-500'}`} />
                    <span className="truncate text-muted-foreground">{cat?.icon} {cat?.label || category}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="num text-foreground">{formatCurrency(data.amount)}</span>
                    <span className="num w-9 text-right text-xs text-subtle">{data.percentage}%</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-sm font-medium text-foreground">Mês sem gastos</p>
          <p className="mt-1 text-xs text-muted-foreground">Os gastos lançados no Financeiro aparecem aqui por categoria.</p>
        </div>
      )}
    </div>
  );
}
