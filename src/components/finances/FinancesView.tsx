import { useState, memo } from 'react';
import { Expense, ExpenseType, getCurrentMonth, getMonthLabel } from '@/types/expense';
import { MonthNavigator } from './MonthNavigator';
import { MonthSummary } from './MonthSummary';
import { ExpenseTypeGroup } from './ExpenseTypeGroup';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseEditDialog } from './ExpenseEditDialog';
import { ExpenseDeleteDialog } from './ExpenseDeleteDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import type { FinanceEntriesApi } from '@/hooks/useFinanceEntries';
import { FinanceTabs, type FinanceTab } from './FinanceTabs';
import { SummaryTab } from './SummaryTab';
import { EntriesTab } from './EntriesTab';
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
  /** Income and investments (finance_entries). */
  finance: FinanceEntriesApi;
}

export const FinancesView = memo(function FinancesView({
  addExpense,
  updateExpense,
  deleteExpense,
  togglePaid,
  isPaid,
  getExpensesByMonthAndType,
  getCategoryBreakdown,
  getTypeTotal,
  finance,
}: FinancesViewProps) {
  const currentMonth = getCurrentMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [tab, setTab] = useState<FinanceTab>('summary');

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
      <PageHeader
        title="Financeiro"
        description={monthLabel}
        actions={
          <div className="w-full min-w-0 md:w-auto md:max-w-[560px]">
            <MonthNavigator
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </div>
        }
      />

      <FinanceTabs value={tab} onChange={setTab} />

      {tab === 'summary' && (
        <SummaryTab
          month={selectedMonth}
          getCategoryBreakdown={getCategoryBreakdown}
          finance={finance}
          onGoToIncome={() => setTab('income')}
        />
      )}
      {tab === 'income' && <EntriesTab kind="income" month={selectedMonth} finance={finance} />}
      {tab === 'investments' && <EntriesTab kind="investment" month={selectedMonth} finance={finance} />}

      {tab === 'expenses' && (
        <div className="space-y-6">
        {/* Month Summary */}
        {/* relative z-20: the chart tooltip must render above the cards below */}
        <div className="relative z-20 p-5 sm:p-6 rounded-xl bg-card border border-border">
          <MonthSummary selectedMonth={selectedMonth} getCategoryBreakdown={getCategoryBreakdown} />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Mobile: Payment methods on top */}
          <div className="lg:hidden">
            {hasExpenses && (
              <div className="p-5 rounded-xl bg-card border border-border">
                <PaymentMethodSummary expenses={allMonthExpenses} selectedMonth={selectedMonth} isPaid={isPaid} onTogglePaid={togglePaid} />
              </div>
            )}
          </div>

          {/* Left: Expense list (~65%) */}
          <div className="lg:col-span-3 space-y-4 rounded-xl border border-border bg-card p-3 sm:p-4 self-start">
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
                  <div className="flex justify-center border-t border-border pt-4">
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
              <div className="text-center py-12 px-4">
                <p className="text-sm font-medium text-foreground mb-1">Sem despesas em <span className="capitalize">{monthLabel}</span></p>
                <p className="text-sm text-muted-foreground mb-5">
                  {isPastMonth ? 'Nada foi lançado para este mês.' : 'Lance gastos fixos, parcelados ou avulsos para ver o resumo do mês.'}
                </p>
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
            <div className="p-5 rounded-xl bg-card border border-border lg:sticky lg:top-6">
              <PaymentMethodSummary expenses={allMonthExpenses} selectedMonth={selectedMonth} isPaid={isPaid} onTogglePaid={togglePaid} />
            </div>
          </div>
        </div>
        </div>
      )}

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
