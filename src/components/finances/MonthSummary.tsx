import { useMemo } from 'react';
import { formatCurrency } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';

interface MonthSummaryProps {
  total: number;
  breakdown: Record<ExpenseCategory, { amount: number; percentage: number }>;
}

export function MonthSummary({ total, breakdown }: MonthSummaryProps) {
  const { getCategoryByKey } = useSettings();

  const sortedCategories = useMemo(() => {
    return Object.entries(breakdown)
      .filter(([_, data]) => data.amount > 0)
      .sort((a, b) => b[1].percentage - a[1].percentage)
      .slice(0, 5);
  }, [breakdown]);

  if (total === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl font-bold text-foreground">{formatCurrency(0)}</p>
        <p className="text-sm text-muted-foreground mt-1">Total do mês</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-3xl font-bold text-foreground">{formatCurrency(total)}</p>
        <p className="text-sm text-muted-foreground mt-1">Total do mês</p>
      </div>

      <div className="space-y-3">
        <div className="h-3 rounded-full overflow-hidden flex bg-secondary">
          {sortedCategories.map(([category, data]) => {
            const cat = getCategoryByKey(category);
            return (
              <div
                key={category}
                className={`${cat?.barColor || 'bg-gray-500'} transition-all`}
                style={{ width: `${data.percentage}%` }}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {sortedCategories.map(([category, data]) => {
            const cat = getCategoryByKey(category);
            return (
              <div key={category} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${cat?.barColor || 'bg-gray-500'}`} />
                <span className="text-xs text-muted-foreground">
                  {cat?.icon || '📦'} {data.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
