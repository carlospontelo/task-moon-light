import { Expense, EXPENSE_CATEGORIES, PAYMENT_METHODS, PaymentMethod, formatCurrency } from '@/types/expense';
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
  const category = EXPENSE_CATEGORIES[expense.category];

  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary/50 group transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-lg shrink-0">{category.icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {expense.name}
            {expense.type === 'installment' && expense.installmentCurrent && expense.installmentTotal && (
              <span className="text-muted-foreground font-normal ml-1.5">
                {expense.installmentCurrent}/{expense.installmentTotal}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span>{category.label}</span>
            {expense.paymentMethod && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary text-[10px] font-medium">
                {PAYMENT_METHODS[expense.paymentMethod].icon} {PAYMENT_METHODS[expense.paymentMethod].label}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(expense.amount)}
        </span>

        {!isReadOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
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
