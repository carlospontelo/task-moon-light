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
        className="flex items-center justify-between w-full py-2 px-1 hover:bg-secondary/50 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-semibold text-foreground">
            {EXPENSE_TYPE_LABELS[type]}
          </span>
          <span className="text-xs text-muted-foreground">
            ({expenses.length})
          </span>
        </div>
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(total)}
        </span>
      </button>

      <div
        className={cn(
          "pl-2 space-y-0.5 overflow-hidden transition-all",
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
