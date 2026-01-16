import { useMemo } from 'react';
import { ExpenseCategory, EXPENSE_CATEGORIES, CATEGORY_COLORS, formatCurrency } from '@/types/expense';

interface MonthSummaryProps {
  total: number;
  breakdown: Record<ExpenseCategory, { amount: number; percentage: number }>;
}

export function MonthSummary({ total, breakdown }: MonthSummaryProps) {
  const sortedCategories = useMemo(() => {
    return Object.entries(breakdown)
      .filter(([_, data]) => data.amount > 0)
      .sort((a, b) => b[1].percentage - a[1].percentage)
      .slice(0, 5); // Show top 5 categories
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
      {/* Total */}
      <div className="text-center">
        <p className="text-3xl font-bold text-foreground">{formatCurrency(total)}</p>
        <p className="text-sm text-muted-foreground mt-1">Total do mês</p>
      </div>

      {/* Category breakdown bar */}
      <div className="space-y-3">
        <div className="h-3 rounded-full overflow-hidden flex bg-secondary">
          {sortedCategories.map(([category, data]) => (
            <div
              key={category}
              className={`${CATEGORY_COLORS[category as ExpenseCategory]} transition-all`}
              style={{ width: `${data.percentage}%` }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center">
          {sortedCategories.map(([category, data]) => (
            <div key={category} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[category as ExpenseCategory]}`} />
              <span className="text-xs text-muted-foreground">
                {EXPENSE_CATEGORIES[category as ExpenseCategory].icon}{' '}
                {data.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}