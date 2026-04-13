/* @refresh reset */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Expense, ExpenseType, addMonths } from '@/types/expense';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MasterExpense extends Expense {
  isVirtual?: boolean;
  masterExpenseId?: string;
}

interface ExpensePayment {
  id: string;
  expense_id: string;
  month: string;
}

export function useExpenses() {
  const { user } = useAuth();
  const [rawExpenses, setRawExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<ExpensePayment[]>([]);

  const mapRow = (e: any): Expense => ({
    id: e.id,
    name: e.name,
    amount: e.amount,
    category: e.category,
    type: e.type as ExpenseType,
    installmentCurrent: e.installment_current || undefined,
    installmentTotal: e.installment_total || undefined,
    installmentGroupId: e.installment_group_id || undefined,
    fixedGroupId: e.fixed_group_id || undefined,
    month: e.month,
    paymentMethod: e.payment_method || undefined,
    paid: false, // Legacy field, no longer used
    createdAt: new Date(e.created_at),
  });

  const fetchExpenses = useCallback(async () => {
    if (!user) { setRawExpenses([]); return; }
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setRawExpenses(data.map(mapRow));
  }, [user]);

  const fetchPayments = useCallback(async () => {
    if (!user) { setPayments([]); return; }
    const { data, error } = await supabase
      .from('expense_payments')
      .select('id, expense_id, month')
      .eq('user_id', user.id);

    if (!error && data) setPayments(data);
  }, [user]);

  useEffect(() => { fetchExpenses(); fetchPayments(); }, [fetchExpenses, fetchPayments]);

  // Realtime for expenses
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('expenses-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRawExpenses((prev) => {
            if (prev.some((e) => e.id === (payload.new as any).id)) return prev;
            return [mapRow(payload.new), ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setRawExpenses((prev) => prev.map((e) => e.id === (payload.new as any).id ? mapRow(payload.new) : e));
        } else if (payload.eventType === 'DELETE') {
          setRawExpenses((prev) => prev.filter((e) => e.id !== (payload.old as any).id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Realtime for expense_payments
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('expense-payments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_payments', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const p = payload.new as any;
          setPayments((prev) => {
            if (prev.some((x) => x.id === p.id)) return prev;
            return [...prev, { id: p.id, expense_id: p.expense_id, month: p.month }];
          });
        } else if (payload.eventType === 'DELETE') {
          setPayments((prev) => prev.filter((x) => x.id !== (payload.old as any).id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const expenses: MasterExpense[] = useMemo(() => {
    const result: MasterExpense[] = [];
    for (const exp of rawExpenses) {
      if (exp.type === 'installment' && exp.installmentTotal && exp.installmentTotal > 1) {
        for (let i = 0; i < exp.installmentTotal; i++) {
          result.push({
            ...exp,
            id: i === 0 ? exp.id : `${exp.id}_virtual_${i + 1}`,
            month: addMonths(exp.month, i),
            installmentCurrent: i + 1,
            isVirtual: i > 0,
            masterExpenseId: exp.id,
          });
        }
      } else {
        result.push(exp);
      }
    }
    return result;
  }, [rawExpenses]);

  // Payment lookup set for O(1) checks
  const paymentSet = useMemo(() => {
    const set = new Set<string>();
    for (const p of payments) {
      set.add(`${p.expense_id}::${p.month}`);
    }
    return set;
  }, [payments]);

  const isPaid = useCallback((expenseId: string, month: string): boolean => {
    const realId = expenseId.includes('_virtual_') ? expenseId.split('_virtual_')[0] : expenseId;
    return paymentSet.has(`${realId}::${month}`);
  }, [paymentSet]);

  const addExpense = useCallback(async (data: {
    name: string; amount: number; category: string; type: ExpenseType;
    installmentTotal?: number; startMonth: string; paymentMethod?: string;
  }) => {
    if (!user) return;
    if (data.type === 'single') {
      const tempId = crypto.randomUUID();
      const temp: Expense = {
        id: tempId, name: data.name, amount: data.amount, category: data.category,
        type: 'single', month: data.startMonth, paymentMethod: data.paymentMethod,
        paid: false, createdAt: new Date(),
      };
      setRawExpenses(prev => [temp, ...prev]);
      const { error } = await supabase.from('expenses').insert({
        id: tempId, user_id: user.id, name: data.name, amount: data.amount, category: data.category,
        type: 'single', month: data.startMonth, payment_method: data.paymentMethod || null,
      });
      if (error) setRawExpenses(prev => prev.filter(e => e.id !== tempId));
    } else if (data.type === 'fixed') {
      const fixedGroupId = crypto.randomUUID();
      const rows = [];
      const temps: Expense[] = [];
      for (let i = 0; i <= 12; i++) {
        const id = crypto.randomUUID();
        temps.push({
          id, name: data.name, amount: data.amount, category: data.category,
          type: 'fixed', fixedGroupId, month: addMonths(data.startMonth, i),
          paymentMethod: data.paymentMethod, paid: false, createdAt: new Date(),
        });
        rows.push({
          id, user_id: user.id, name: data.name, amount: data.amount, category: data.category,
          type: 'fixed', fixed_group_id: fixedGroupId, month: addMonths(data.startMonth, i),
          payment_method: data.paymentMethod || null,
        });
      }
      setRawExpenses(prev => [...temps, ...prev]);
      const { error } = await supabase.from('expenses').insert(rows);
      if (error) {
        const ids = new Set(temps.map(t => t.id));
        setRawExpenses(prev => prev.filter(e => !ids.has(e.id)));
      }
    } else if (data.type === 'installment' && data.installmentTotal) {
      const tempId = crypto.randomUUID();
      const temp: Expense = {
        id: tempId, name: data.name, amount: data.amount, category: data.category,
        type: 'installment', installmentCurrent: 1, installmentTotal: data.installmentTotal,
        installmentGroupId: crypto.randomUUID(), month: data.startMonth,
        paymentMethod: data.paymentMethod, paid: false, createdAt: new Date(),
      };
      setRawExpenses(prev => [temp, ...prev]);
      const { error } = await supabase.from('expenses').insert({
        id: tempId, user_id: user.id, name: data.name, amount: data.amount, category: data.category,
        type: 'installment', installment_current: 1, installment_total: data.installmentTotal,
        installment_group_id: temp.installmentGroupId, month: data.startMonth,
        payment_method: data.paymentMethod || null,
      });
      if (error) setRawExpenses(prev => prev.filter(e => e.id !== tempId));
    }
  }, [user]);

  const updateExpense = useCallback(async (
    expenseId: string,
    data: Partial<Pick<Expense, 'name' | 'amount' | 'category' | 'paymentMethod'>>,
    scope: 'this' | 'from_this' | 'all' = 'this'
  ) => {
    const realId = expenseId.includes('_virtual_') ? expenseId.split('_virtual_')[0] : expenseId;
    const expense = rawExpenses.find((e) => e.id === realId) || expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.amount !== undefined) dbData.amount = data.amount;
    if (data.category !== undefined) dbData.category = data.category;
    if (data.paymentMethod !== undefined) dbData.payment_method = data.paymentMethod || null;

    const prev = rawExpenses;
    if (expense.type === 'installment' || expense.type === 'single' || scope === 'this') {
      setRawExpenses(r => r.map(e => e.id === realId ? { ...e, ...data } : e));
    } else if (expense.type === 'fixed' && expense.fixedGroupId) {
      setRawExpenses(r => r.map(e => {
        if (e.fixedGroupId !== expense.fixedGroupId) return e;
        if (scope === 'all' || e.month >= expense.month) return { ...e, ...data };
        return e;
      }));
    }

    let error: any;
    if (expense.type === 'installment') {
      ({ error } = await supabase.from('expenses').update(dbData).eq('id', realId));
    } else if (expense.type === 'single' || scope === 'this') {
      ({ error } = await supabase.from('expenses').update(dbData).eq('id', expenseId));
    } else if (expense.type === 'fixed' && expense.fixedGroupId) {
      if (scope === 'all') {
        ({ error } = await supabase.from('expenses').update(dbData).eq('fixed_group_id', expense.fixedGroupId));
      } else {
        ({ error } = await supabase.from('expenses').update(dbData).eq('fixed_group_id', expense.fixedGroupId).gte('month', expense.month));
      }
    }
    if (error) setRawExpenses(prev);
  }, [rawExpenses, expenses]);

  const deleteExpense = useCallback(async (
    expenseId: string, scope: 'this' | 'from_this' | 'all' = 'this'
  ) => {
    const realId = expenseId.includes('_virtual_') ? expenseId.split('_virtual_')[0] : expenseId;
    const expense = rawExpenses.find((e) => e.id === realId) || expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    const prev = rawExpenses;
    if (expense.type === 'installment' || expense.type === 'single' || scope === 'this') {
      setRawExpenses(r => r.filter(e => e.id !== realId));
    } else if (expense.type === 'fixed' && expense.fixedGroupId) {
      setRawExpenses(r => r.filter(e => {
        if (e.fixedGroupId !== expense.fixedGroupId) return true;
        if (scope === 'all') return false;
        return e.month < expense.month;
      }));
    }

    let error: any;
    if (expense.type === 'installment') {
      ({ error } = await supabase.from('expenses').delete().eq('id', realId));
    } else if (expense.type === 'single' || scope === 'this') {
      ({ error } = await supabase.from('expenses').delete().eq('id', expenseId));
    } else if (expense.type === 'fixed' && expense.fixedGroupId) {
      if (scope === 'all') {
        ({ error } = await supabase.from('expenses').delete().eq('fixed_group_id', expense.fixedGroupId));
      } else {
        ({ error } = await supabase.from('expenses').delete().eq('fixed_group_id', expense.fixedGroupId).gte('month', expense.month));
      }
    }
    if (error) setRawExpenses(prev);
  }, [rawExpenses, expenses]);

  const getExpensesByMonthAndType = useCallback((month: string, type: ExpenseType) => {
    return expenses.filter((e) => e.month === month && e.type === type);
  }, [expenses]);

  const getCategoryBreakdown = useCallback((month: string) => {
    const monthExpenses = expenses.filter((e) => e.month === month);
    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const breakdown: Record<string, { amount: number; percentage: number }> = {};
    monthExpenses.forEach((e) => {
      if (!breakdown[e.category]) breakdown[e.category] = { amount: 0, percentage: 0 };
      breakdown[e.category].amount += e.amount;
    });
    Object.keys(breakdown).forEach((cat) => {
      breakdown[cat].percentage = total > 0 ? Math.round((breakdown[cat].amount / total) * 100) : 0;
    });
    return { breakdown, total };
  }, [expenses]);

  const getTypeTotal = useCallback((month: string, type: ExpenseType) => {
    return expenses.filter((e) => e.month === month && e.type === type).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const togglePaid = useCallback(async (expenseId: string, month: string) => {
    if (!user) return;
    const realId = expenseId.includes('_virtual_') ? expenseId.split('_virtual_')[0] : expenseId;
    const key = `${realId}::${month}`;
    const currentlyPaid = paymentSet.has(key);
    const existingPayment = payments.find(p => p.expense_id === realId && p.month === month);

    if (currentlyPaid && existingPayment) {
      // Optimistic: remove
      setPayments(prev => prev.filter(p => p.id !== existingPayment.id));
      const { error } = await supabase.from('expense_payments').delete().eq('id', existingPayment.id);
      if (error) setPayments(prev => [...prev, existingPayment]);
    } else {
      // Optimistic: add
      const tempId = crypto.randomUUID();
      const tempPayment = { id: tempId, expense_id: realId, month };
      setPayments(prev => [...prev, tempPayment]);
      const { error } = await supabase.from('expense_payments').insert({
        id: tempId, expense_id: realId, user_id: user.id, month,
      });
      if (error) setPayments(prev => prev.filter(p => p.id !== tempId));
    }
  }, [user, paymentSet, payments]);

  return {
    expenses, addExpense, updateExpense, deleteExpense, togglePaid, isPaid,
    getExpensesByMonthAndType, getCategoryBreakdown, getTypeTotal,
  };
}
