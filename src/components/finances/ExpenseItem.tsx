import { Expense, formatCurrency } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  isReadOnly?: boolean;
}

export function ExpenseItem({ expense, onEdit, onDelete, isReadOnly }: ExpenseItemProps) {
  const { getCategoryByKey, getPaymentMethodByKey } = useSettings();
  const category = getCategoryByKey(expense.category);
  const pm = expense.paymentMethod ? getPaymentMethodByKey(expense.paymentMethod) : undefined;

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-lg hover:bg-secondary group transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary group-hover:bg-surface-3 text-base">{category?.icon || '📦'}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {expense.name}
            {expense.type === 'installment' && expense.installmentCurrent && expense.installmentTotal && (
              <span className="num text-subtle font-normal ml-1.5 text-xs">
                {expense.installmentCurrent}/{expense.installmentTotal}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span>{category?.label || expense.category}</span>
            {pm && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-3 text-[10px] font-medium">
                {pm.icon} {pm.label}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="num text-sm text-foreground">
          {formatCurrency(expense.amount)}
        </span>

        {!isReadOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon-sm"
                aria-label="Ações da despesa"
                className="text-subtle opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(expense)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(expense)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
