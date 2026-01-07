import { useState, useCallback, useMemo } from 'react';
import { Expense, ExpenseType, ExpenseCategory, getCurrentMonth, addMonths } from '@/types/expense';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addExpense = useCallback((
    data: {
      name: string;
      amount: number;
      category: ExpenseCategory;
      type: ExpenseType;
      installmentTotal?: number;
    }
  ) => {
    const currentMonth = getCurrentMonth();
    const baseId = generateId();

    if (data.type === 'single') {
      const newExpense: Expense = {
        id: baseId,
        name: data.name,
        amount: data.amount,
        category: data.category,
        type: 'single',
        month: currentMonth,
        createdAt: new Date(),
      };
      setExpenses(prev => [...prev, newExpense]);
    } else if (data.type === 'fixed') {
      const fixedGroupId = generateId();
      // Create fixed expense for current month and next 12 months
      const newExpenses: Expense[] = [];
      for (let i = 0; i <= 12; i++) {
        newExpenses.push({
          id: generateId(),
          name: data.name,
          amount: data.amount,
          category: data.category,
          type: 'fixed',
          fixedGroupId,
          month: addMonths(currentMonth, i),
          createdAt: new Date(),
        });
      }
      setExpenses(prev => [...prev, ...newExpenses]);
    } else if (data.type === 'installment' && data.installmentTotal) {
      const installmentGroupId = generateId();
      const newExpenses: Expense[] = [];
      for (let i = 0; i < data.installmentTotal; i++) {
        newExpenses.push({
          id: generateId(),
          name: data.name,
          amount: data.amount,
          category: data.category,
          type: 'installment',
          installmentCurrent: i + 1,
          installmentTotal: data.installmentTotal,
          installmentGroupId,
          month: addMonths(currentMonth, i),
          createdAt: new Date(),
        });
      }
      setExpenses(prev => [...prev, ...newExpenses]);
    }
  }, []);

  const updateExpense = useCallback((
    expenseId: string,
    data: Partial<Pick<Expense, 'name' | 'amount' | 'category'>>,
    scope: 'this' | 'from_this' | 'all' = 'this'
  ) => {
    setExpenses(prev => {
      const expense = prev.find(e => e.id === expenseId);
      if (!expense) return prev;

      if (expense.type === 'single' || scope === 'this') {
        return prev.map(e => e.id === expenseId ? { ...e, ...data } : e);
      }

      if (expense.type === 'fixed' && expense.fixedGroupId) {
        if (scope === 'all') {
          return prev.map(e => 
            e.fixedGroupId === expense.fixedGroupId ? { ...e, ...data } : e
          );
        } else {
          // from_this: update this month and future
          return prev.map(e => {
            if (e.fixedGroupId === expense.fixedGroupId && e.month >= expense.month) {
              return { ...e, ...data };
            }
            return e;
          });
        }
      }

      if (expense.type === 'installment' && expense.installmentGroupId) {
        // Only update future installments
        return prev.map(e => {
          if (e.installmentGroupId === expense.installmentGroupId && e.month >= expense.month) {
            return { ...e, ...data };
          }
          return e;
        });
      }

      return prev;
    });
  }, []);

  const deleteExpense = useCallback((
    expenseId: string,
    scope: 'this' | 'from_this' | 'all' = 'this'
  ) => {
    setExpenses(prev => {
      const expense = prev.find(e => e.id === expenseId);
      if (!expense) return prev;

      if (expense.type === 'single' || scope === 'this') {
        return prev.filter(e => e.id !== expenseId);
      }

      if (expense.type === 'fixed' && expense.fixedGroupId) {
        if (scope === 'all') {
          return prev.filter(e => e.fixedGroupId !== expense.fixedGroupId);
        } else {
          // from_this: delete this month and future
          return prev.filter(e => 
            !(e.fixedGroupId === expense.fixedGroupId && e.month >= expense.month)
          );
        }
      }

      if (expense.type === 'installment' && expense.installmentGroupId) {
        // Only delete future installments
        return prev.filter(e => 
          !(e.installmentGroupId === expense.installmentGroupId && e.month >= expense.month)
        );
      }

      return prev;
    });
  }, []);

  const getExpensesByMonth = useCallback((month: string) => {
    return expenses.filter(e => e.month === month);
  }, [expenses]);

  const getExpensesByMonthAndType = useCallback((month: string, type: ExpenseType) => {
    return expenses.filter(e => e.month === month && e.type === type);
  }, [expenses]);

  const getMonthTotal = useCallback((month: string) => {
    return expenses
      .filter(e => e.month === month)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getCategoryBreakdown = useCallback((month: string) => {
    const monthExpenses = expenses.filter(e => e.month === month);
    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const breakdown: Record<ExpenseCategory, { amount: number; percentage: number }> = {} as any;
    
    monthExpenses.forEach(expense => {
      if (!breakdown[expense.category]) {
        breakdown[expense.category] = { amount: 0, percentage: 0 };
      }
      breakdown[expense.category].amount += expense.amount;
    });

    Object.keys(breakdown).forEach(cat => {
      breakdown[cat as ExpenseCategory].percentage = total > 0 
        ? Math.round((breakdown[cat as ExpenseCategory].amount / total) * 100)
        : 0;
    });

    return { breakdown, total };
  }, [expenses]);

  const getTypeTotal = useCallback((month: string, type: ExpenseType) => {
    return expenses
      .filter(e => e.month === month && e.type === type)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  return {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByMonth,
    getExpensesByMonthAndType,
    getMonthTotal,
    getCategoryBreakdown,
    getTypeTotal,
  };
}
