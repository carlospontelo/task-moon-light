/* @refresh reset */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Expense, ExpenseType, addMonths } from '@/types/expense';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MasterExpense extends Expense {
  isVirtual?: boolean;
  masterExpenseId?: string;
}

export function useExpenses() {
  const { user } = useAuth();
  const [rawExpenses, setRawExpenses] = useState<Expense[]>([]);

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
    paid: e.paid ?? false,
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

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

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

    // Optimistic for raw expenses
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
    // Optimistic delete
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

  const togglePaid = useCallback(async (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;
    const realId = expenseId.includes('_virtual_') ? expenseId.split('_virtual_')[0] : expenseId;
    const prev = rawExpenses;
    setRawExpenses(r => r.map(e => e.id === realId ? { ...e, paid: !expense.paid } : e));
    const { error } = await supabase.from('expenses').update({ paid: !expense.paid } as any).eq('id', realId);
    if (error) setRawExpenses(prev);
  }, [expenses, rawExpenses]);

  return {
    expenses, addExpense, updateExpense, deleteExpense, togglePaid,
    getExpensesByMonthAndType, getCategoryBreakdown, getTypeTotal,
  };
}
