import { useState } from 'react';
import { getCurrentMonth, getMonthLabel, addMonths, formatCurrency } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Financeiro</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonth(addMonths(month, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[80px] text-center">{label.short} {label.year}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="text-center mb-4">
        <p className="text-3xl font-bold text-foreground transition-all duration-300">{formatCurrency(total)}</p>
        <p className="text-xs text-muted-foreground mt-1">Total do mês</p>
      </div>

      {sorted.length > 0 && (
        <div className="space-y-3 flex-1">
          <div className="h-2.5 rounded-full overflow-hidden flex bg-secondary">
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

          <div className="space-y-2">
            {sorted.map(([category, data]) => {
              const cat = getCategoryByKey(category);
              return (
                <div key={category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${cat?.barColor || 'bg-gray-500'}`} />
                    <span className="text-muted-foreground">{cat?.icon} {cat?.label || category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">{formatCurrency(data.amount)}</span>
                    <span className="text-muted-foreground text-xs">{data.percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sorted.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Sem despesas neste mês</p>
        </div>
      )}
    </div>
  );
}
