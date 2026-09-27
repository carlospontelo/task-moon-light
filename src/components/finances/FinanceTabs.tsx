import { cn } from '@/lib/utils';

export type FinanceTab = 'summary' | 'expenses' | 'income' | 'investments';

const TABS: { id: FinanceTab; label: string }[] = [
  { id: 'summary', label: 'Resumo' },
  { id: 'expenses', label: 'Gastos' },
  { id: 'income', label: 'Entradas' },
  { id: 'investments', label: 'Investimentos' },
];

interface FinanceTabsProps {
  value: FinanceTab;
  onChange: (tab: FinanceTab) => void;
}

export function FinanceTabs({ value, onChange }: FinanceTabsProps) {
  return (
    // Scrolls horizontally on narrow screens instead of wrapping.
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      <div role="tablist" aria-label="Seções do financeiro" className="inline-flex gap-1 rounded-lg border border-border bg-card p-1">
        {TABS.map(tab => {
          const selected = value === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={cn(
                'h-9 shrink-0 whitespace-nowrap rounded-md px-4 text-sm transition-colors',
                selected ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
