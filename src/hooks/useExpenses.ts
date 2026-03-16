import { useState, useCallback, useEffect } from 'react';
import { Expense, ExpenseType, ExpenseCategory, PaymentMethod, addMonths } from '@/types/expense';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const fetchExpenses = useCallback(async () => {
    if (!user) { setExpenses([]); return; }
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExpenses(data.map((e) => ({
        id: e.id,
        name: e.name,
        amount: e.amount,
        category: e.category as ExpenseCategory,
        type: e.type as ExpenseType,
        installmentCurrent: e.installment_current || undefined,
        installmentTotal: e.installment_total || undefined,
        installmentGroupId: e.installment_group_id || undefined,
        fixedGroupId: e.fixed_group_id || undefined,
        month: e.month,
        paymentMethod: (e.payment_method as PaymentMethod) || undefined,
        createdAt: new Date(e.created_at),
      })));
    }
  }, [user]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const generateId = () => crypto.randomUUID();

  const addExpense = useCallback(async (data: {
    name: string; amount: number; category: ExpenseCategory; type: ExpenseType;
    installmentTotal?: number; startMonth: string; paymentMethod?: PaymentMethod;
  }) => {
    if (!user) return;
    const startMonth = data.startMonth;

    if (data.type === 'single') {
      const { data: row, error } = await supabase.from('expenses').insert({
        user_id: user.id, name: data.name, amount: data.amount, category: data.category,
        type: 'single', month: startMonth, payment_method: data.paymentMethod || null,
      }).select().single();
      if (!error && row) await fetchExpenses();
    } else if (data.type === 'fixed') {
      const fixedGroupId = generateId();
      const rows = [];
      for (let i = 0; i <= 12; i++) {
        rows.push({
          user_id: user.id, name: data.name, amount: data.amount, category: data.category,
          type: 'fixed', fixed_group_id: fixedGroupId, month: addMonths(startMonth, i),
          payment_method: data.paymentMethod || null,
        });
      }
      await supabase.from('expenses').insert(rows);
      await fetchExpenses();
    } else if (data.type === 'installment' && data.installmentTotal) {
      const installmentGroupId = generateId();
      const rows = [];
      for (let i = 0; i < data.installmentTotal; i++) {
        rows.push({
          user_id: user.id, name: data.name, amount: data.amount, category: data.category,
          type: 'installment', installment_current: i + 1, installment_total: data.installmentTotal,
          installment_group_id: installmentGroupId, month: addMonths(startMonth, i),
          payment_method: data.paymentMethod || null,
        });
      }
      await supabase.from('expenses').insert(rows);
      await fetchExpenses();
    }
  }, [user, fetchExpenses]);

  const updateExpense = useCallback(async (
    expenseId: string,
    data: Partial<Pick<Expense, 'name' | 'amount' | 'category' | 'paymentMethod'>>,
    scope: 'this' | 'from_this' | 'all' = 'this'
  ) => {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.amount !== undefined) dbData.amount = data.amount;
    if (data.category !== undefined) dbData.category = data.category;
    if (data.paymentMethod !== undefined) dbData.payment_method = data.paymentMethod || null;

    if (expense.type === 'single' || scope === 'this') {
      await supabase.from('expenses').update(dbData).eq('id', expenseId);
    } else if (expense.type === 'fixed' && expense.fixedGroupId) {
      if (scope === 'all') {
        await supabase.from('expenses').update(dbData).eq('fixed_group_id', expense.fixedGroupId);
      } else {
        await supabase.from('expenses').update(dbData)
          .eq('fixed_group_id', expense.fixedGroupId).gte('month', expense.month);
      }
    } else if (expense.type === 'installment' && expense.installmentGroupId) {
      await supabase.from('expenses').update(dbData)
        .eq('installment_group_id', expense.installmentGroupId).gte('month', expense.month);
    }
    await fetchExpenses();
  }, [expenses, fetchExpenses]);

  const deleteExpense = useCallback(async (
    expenseId: string, scope: 'this' | 'from_this' | 'all' = 'this'
  ) => {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    if (expense.type === 'single' || scope === 'this') {
      await supabase.from('expenses').delete().eq('id', expenseId);
    } else if (expense.type === 'fixed' && expense.fixedGroupId) {
      if (scope === 'all') {
        await supabase.from('expenses').delete().eq('fixed_group_id', expense.fixedGroupId);
      } else {
        await supabase.from('expenses').delete()
          .eq('fixed_group_id', expense.fixedGroupId).gte('month', expense.month);
      }
    } else if (expense.type === 'installment' && expense.installmentGroupId) {
      await supabase.from('expenses').delete()
        .eq('installment_group_id', expense.installmentGroupId).gte('month', expense.month);
    }
    await fetchExpenses();
  }, [expenses, fetchExpenses]);

  const getExpensesByMonthAndType = useCallback((month: string, type: ExpenseType) => {
    return expenses.filter((e) => e.month === month && e.type === type);
  }, [expenses]);

  const getCategoryBreakdown = useCallback((month: string) => {
    const monthExpenses = expenses.filter((e) => e.month === month);
    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const breakdown: Record<ExpenseCategory, { amount: number; percentage: number }> = {} as any;
    monthExpenses.forEach((e) => {
      if (!breakdown[e.category]) breakdown[e.category] = { amount: 0, percentage: 0 };
      breakdown[e.category].amount += e.amount;
    });
    Object.keys(breakdown).forEach((cat) => {
      breakdown[cat as ExpenseCategory].percentage = total > 0
        ? Math.round((breakdown[cat as ExpenseCategory].amount / total) * 100) : 0;
    });
    return { breakdown, total };
  }, [expenses]);

  const getTypeTotal = useCallback((month: string, type: ExpenseType) => {
    return expenses.filter((e) => e.month === month && e.type === type).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  return {
    expenses, addExpense, updateExpense, deleteExpense,
    getExpensesByMonthAndType, getCategoryBreakdown, getTypeTotal,
  };
}
