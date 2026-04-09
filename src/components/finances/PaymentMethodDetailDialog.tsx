import { Expense, formatCurrency, EXPENSE_TYPE_LABELS } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface PaymentMethodDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  methodKey: string;
  expenses: Expense[];
  totalMonth: number;
}

export function PaymentMethodDetailDialog({
  open,
  onOpenChange,
  methodKey,
  expenses,
  totalMonth,
}: PaymentMethodDetailDialogProps) {
  const { getPaymentMethodByKey, getCategoryByKey } = useSettings();

  const pm = methodKey !== '__none__' ? getPaymentMethodByKey(methodKey) : null;
  const icon = pm?.icon || '📋';
  const label = pm?.label || 'Sem método';
  const amount = expenses.reduce((s, e) => s + e.amount, 0);
  const percentage = totalMonth > 0 ? (amount / totalMonth) * 100 : 0;

  const sorted = [...expenses].sort((a, b) => b.amount - a.amount);

  function getTypeBadge(exp: Expense) {
    if (exp.type === 'fixed') return 'Fixa';
    if (exp.type === 'installment')
      return `Parcela ${exp.installmentCurrent || '?'}/${exp.installmentTotal || '?'}`;
    return 'Única';
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
            <span className="font-semibold text-foreground">{formatCurrency(amount)}</span>
            <span>·</span>
            <span>{percentage.toFixed(0)}% do mês</span>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma despesa com este método
            </p>
          ) : (
            sorted.map((exp, i) => {
              const cat = getCategoryByKey(exp.category);
              return (
                <div
                  key={exp.id}
                  className={`flex items-center gap-3 py-3 px-2 rounded-md hover:bg-secondary/30 transition-colors ${
                    i < sorted.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
                  <span className="text-base shrink-0">{cat?.icon || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{exp.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{cat?.label || exp.category}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                        {getTypeBadge(exp)}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground shrink-0">
                    {formatCurrency(exp.amount)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {sorted.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-border text-sm text-muted-foreground">
            <span>{sorted.length} despesa{sorted.length !== 1 ? 's' : ''}</span>
            <span className="font-semibold text-foreground">{formatCurrency(amount)}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
