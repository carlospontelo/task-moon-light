import { useState, memo } from 'react';
import { Expense, ExpenseType, getCurrentMonth, getMonthLabel } from '@/types/expense';
import { MonthNavigator } from './MonthNavigator';
import { MonthSummary } from './MonthSummary';
import { ExpenseTypeGroup } from './ExpenseTypeGroup';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseEditDialog } from './ExpenseEditDialog';
import { ExpenseDeleteDialog } from './ExpenseDeleteDialog';
import { Button } from '@/components/ui/button';
import { Plus, Receipt } from 'lucide-react';
import { PaymentMethodSummary } from './PaymentMethodSummary';

interface FinancesViewProps {
  expenses: Expense[];
  addExpense: (data: {
    name: string;
    amount: number;
    category: any;
    type: ExpenseType;
    installmentTotal?: number;
    startMonth: string;
  }) => void;
  updateExpense: (
    expenseId: string,
    data: Partial<Pick<Expense, 'name' | 'amount' | 'category'>>,
    scope: 'this' | 'from_this' | 'all'
  ) => void;
  deleteExpense: (expenseId: string, scope: 'this' | 'from_this' | 'all') => void;
  togglePaid: (expenseId: string, month: string) => void;
  isPaid: (expenseId: string, month: string) => boolean;
  getExpensesByMonthAndType: (month: string, type: ExpenseType) => Expense[];
  getCategoryBreakdown: (month: string) => {
    breakdown: Record<string, { amount: number; percentage: number }>;
    total: number;
  };
  getTypeTotal: (month: string, type: ExpenseType) => number;
}

export const FinancesView = memo(function FinancesView({
  addExpense,
  updateExpense,
  deleteExpense,
  togglePaid,
  getExpensesByMonthAndType,
  getCategoryBreakdown,
  getTypeTotal,
}: FinancesViewProps) {
  const currentMonth = getCurrentMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const { breakdown, total } = getCategoryBreakdown(selectedMonth);
  const isPastMonth = selectedMonth < currentMonth;
  const isFutureMonth = selectedMonth > currentMonth;

  const fixedExpenses = getExpensesByMonthAndType(selectedMonth, 'fixed');
  const installmentExpenses = getExpensesByMonthAndType(selectedMonth, 'installment');
  const singleExpenses = getExpensesByMonthAndType(selectedMonth, 'single');
  const allMonthExpenses = [...fixedExpenses, ...installmentExpenses, ...singleExpenses];

  const hasExpenses = allMonthExpenses.length > 0;

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleDelete = (expense: Expense) => {
    setDeletingExpense(expense);
  };

  const { full: monthLabel } = getMonthLabel(selectedMonth);

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex justify-center">
        <MonthNavigator
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>

      {/* Month Summary */}
      <div className="p-6 rounded-2xl bg-secondary/30 border border-border">
        <MonthSummary selectedMonth={selectedMonth} getCategoryBreakdown={getCategoryBreakdown} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Mobile: Payment methods on top */}
        <div className="lg:hidden">
          {hasExpenses && (
            <div className="p-5 rounded-2xl bg-secondary/30 border border-border">
              <PaymentMethodSummary expenses={allMonthExpenses} onTogglePaid={togglePaid} />
            </div>
          )}
        </div>

        {/* Left: Expense list (~65%) */}
        <div className="lg:col-span-3 space-y-4">
          {hasExpenses ? (
            <>
              <ExpenseTypeGroup
                type="fixed"
                expenses={fixedExpenses}
                total={getTypeTotal(selectedMonth, 'fixed')}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isReadOnly={isPastMonth}
              />
              <ExpenseTypeGroup
                type="installment"
                expenses={installmentExpenses}
                total={getTypeTotal(selectedMonth, 'installment')}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isReadOnly={isPastMonth}
              />
              <ExpenseTypeGroup
                type="single"
                expenses={singleExpenses}
                total={getTypeTotal(selectedMonth, 'single')}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isReadOnly={isPastMonth}
              />

              {!isPastMonth && (
                <div className="flex justify-center pt-4">
                  <Button onClick={() => setFormOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar despesa
                  </Button>
                </div>
              )}

              {isFutureMonth && (
                <p className="text-center text-xs text-muted-foreground">
                  Exibindo despesas comprometidas (fixas e parcelamentos)
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary mx-auto mb-4">
                <Receipt className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-1">Nenhuma despesa em</p>
              <p className="font-medium text-foreground mb-4">{monthLabel}</p>
              {!isPastMonth && (
                <Button onClick={() => setFormOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar despesa
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Right: Payment method summary (~35%), sticky on desktop */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="p-5 rounded-2xl bg-secondary/30 border border-border">
            <PaymentMethodSummary expenses={allMonthExpenses} onTogglePaid={togglePaid} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ExpenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={addExpense}
        initialMonth={selectedMonth}
      />

      <ExpenseEditDialog
        expense={editingExpense}
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
        onSave={updateExpense}
      />

      <ExpenseDeleteDialog
        expense={deletingExpense}
        open={!!deletingExpense}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
        onConfirm={deleteExpense}
      />
    </div>
  );
});
