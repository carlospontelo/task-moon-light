import { Expense, formatCurrency } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';
import { CreditCard } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PaymentMethodSummaryProps {
  expenses: Expense[];
}

export function PaymentMethodSummary({ expenses }: PaymentMethodSummaryProps) {
  const { getPaymentMethodByKey } = useSettings();

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by payment method
  const grouped = new Map<string, number>();
  for (const exp of expenses) {
    const key = exp.paymentMethod || '__none__';
    grouped.set(key, (grouped.get(key) || 0) + exp.amount);
  }

  // Sort descending by amount
  const sorted = [...grouped.entries()].sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CreditCard className="h-4 w-4" />
          <span>Por método de pagamento</span>
        </div>
        <p className="text-xs text-muted-foreground text-center py-4">
          Nenhuma despesa neste mês
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <CreditCard className="h-4 w-4" />
        <span>Por método de pagamento</span>
      </div>

      {sorted.map(([key, amount]) => {
        const pm = key !== '__none__' ? getPaymentMethodByKey(key) : null;
        const icon = pm?.icon || '📋';
        const label = pm?.label || 'Sem método';
        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

        return (
          <div
            key={key}
            className="rounded-xl border border-border bg-card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{icon}</span>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(amount)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={percentage} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
