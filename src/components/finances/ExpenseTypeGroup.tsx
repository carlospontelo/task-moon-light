import { useState } from 'react';
import { Expense, ExpenseType, EXPENSE_TYPE_LABELS, formatCurrency } from '@/types/expense';
import { ExpenseItem } from './ExpenseItem';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpenseTypeGroupProps {
  type: ExpenseType;
  expenses: Expense[];
  total: number;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  isReadOnly?: boolean;
}

export function ExpenseTypeGroup({ 
  type, 
  expenses, 
  total, 
  onEdit, 
  onDelete,
  isReadOnly 
}: ExpenseTypeGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (expenses.length === 0) return null;

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="flex items-center justify-between w-full py-2 px-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
            {EXPENSE_TYPE_LABELS[type]}
          </span>
          <span className="num text-xs text-subtle">
            {expenses.length}
          </span>
        </div>
        <span className={cn('num text-sm text-foreground', !isReadOnly && 'mr-9')}>
          {formatCurrency(total)}
        </span>
      </button>

      <div
        className={cn(
          "space-y-0.5 overflow-hidden transition-all",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {expenses.map((expense) => (
          <ExpenseItem
            key={expense.id}
            expense={expense}
            onEdit={onEdit}
            onDelete={onDelete}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    </div>
  );
}
