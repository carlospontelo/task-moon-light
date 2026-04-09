import { useState } from 'react';
import { Expense, formatCurrency } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';
import { CreditCard, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { PaymentMethodDetailDialog } from './PaymentMethodDetailDialog';

interface PaymentMethodSummaryProps {
  expenses: Expense[];
  onTogglePaid?: (expenseId: string) => void;
}

export function PaymentMethodSummary({ expenses, onTogglePaid }: PaymentMethodSummaryProps) {
  const { getPaymentMethodByKey } = useSettings();
  const [detailMethod, setDetailMethod] = useState<{ key: string; expenses: Expense[] } | null>(null);

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group expenses by payment method
  const groupedExpenses = new Map<string, Expense[]>();
  for (const exp of expenses) {
    const key = exp.paymentMethod || '__none__';
    if (!groupedExpenses.has(key)) groupedExpenses.set(key, []);
    groupedExpenses.get(key)!.push(exp);
  }

  // Sort by total amount descending
  const sorted = [...groupedExpenses.entries()].sort((a, b) => {
    const totalA = a[1].reduce((s, e) => s + e.amount, 0);
    const totalB = b[1].reduce((s, e) => s + e.amount, 0);
    return totalB - totalA;
  });

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

      {sorted.map(([key, methodExpenses]) => {
        const pm = key !== '__none__' ? getPaymentMethodByKey(key) : null;
        const icon = pm?.icon || '📋';
        const label = pm?.label || 'Sem método';
        const amount = methodExpenses.reduce((s, e) => s + e.amount, 0);
        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
        const requiresManual = pm?.requiresManualPayment ?? false;
        const paidCount = methodExpenses.filter(e => e.paid).length;

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

            {requiresManual && onTogglePaid && (
              <div className="pt-1 space-y-1.5">
                <p className="text-[10px] text-muted-foreground">
                  {paidCount} de {methodExpenses.length} pagas
                </p>
                {methodExpenses.map(exp => (
                  <div
                    key={exp.id}
                    className={cn(
                      "flex items-center gap-2 py-1 px-1 rounded-md transition-opacity",
                      exp.paid && "opacity-50"
                    )}
                  >
                    <Checkbox
                      checked={exp.paid}
                      onCheckedChange={() => onTogglePaid(exp.id)}
                      className="h-3.5 w-3.5"
                    />
                    <span className={cn(
                      "text-xs flex-1 truncate text-foreground",
                      exp.paid && "line-through"
                    )}>
                      {exp.name}
                    </span>
                    <span className={cn(
                      "text-xs text-muted-foreground",
                      exp.paid && "line-through"
                    )}>
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!requiresManual && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setDetailMethod({ key, expenses: methodExpenses })}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  Ver detalhes
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      <PaymentMethodDetailDialog
        open={!!detailMethod}
        onOpenChange={(open) => !open && setDetailMethod(null)}
        methodKey={detailMethod?.key || ''}
        expenses={detailMethod?.expenses || []}
        totalMonth={totalAmount}
      />
    </div>
  );
}
