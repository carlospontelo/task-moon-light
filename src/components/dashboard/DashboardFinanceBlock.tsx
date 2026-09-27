import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentMonth, getMonthLabel } from '@/types/expense';
import type { FinanceEntriesApi } from '@/hooks/useFinanceEntries';
import { SummaryNumbers, monthTotals } from '@/components/finances/SummaryTab';
import { BlockHeader } from './BlockHeader';

interface Props {
  getCategoryBreakdown: (month: string) => { breakdown: Record<string, { amount: number; percentage: number }>; total: number };
  finance: FinanceEntriesApi;
  onNavigateToFinances: () => void;
}

export function DashboardFinanceBlock({ getCategoryBreakdown, finance, onNavigateToFinances }: Props) {
  const month = getCurrentMonth();
  const totals = monthTotals(month, getCategoryBreakdown, finance);
  const label = getMonthLabel(month);

  return (
    <div className="h-full flex flex-col">
      <BlockHeader
        label={`Financeiro · ${label.short} ${label.year}`}
        action={
          <Button variant="secondary" size="icon-sm" onClick={onNavigateToFinances} aria-label="Abrir Financeiro" title="Abrir Financeiro">
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        }
      />
      <div className="mt-4">
        <SummaryNumbers totals={totals} compact />
      </div>
    </div>
  );
}
