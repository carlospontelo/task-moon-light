import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function DataSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const exportBackup = async () => {
    if (!user) return;
    const backup: Record<string, unknown> = { exportedAt: new Date().toISOString(), version: '3.0' };

    const [tasks, goals, expenses, habits, habitEntries, customTags, customCategories, customPaymentMethods, userPreferences] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('expenses').select('*').eq('user_id', user.id),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('habit_entries').select('*').eq('user_id', user.id),
      supabase.from('custom_tags').select('*').eq('user_id', user.id),
      supabase.from('custom_categories').select('*').eq('user_id', user.id),
      supabase.from('custom_payment_methods').select('*').eq('user_id', user.id),
      supabase.from('user_preferences').select('*').eq('user_id', user.id),
    ]);

    backup.tasks = tasks.data || [];
    backup.goals = goals.data || [];
    backup.expenses = expenses.data || [];
    backup.habits = habits.data || [];
    backup.habit_entries = habitEntries.data || [];
    backup.custom_tags = customTags.data || [];
    backup.custom_categories = customCategories.data || [];
    backup.custom_payment_methods = customPaymentMethods.data || [];
    backup.user_preferences = userPreferences.data || [];

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Backup exportado', description: 'Arquivo JSON salvo com sucesso.' });
  };

  const importBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setImporting(true);

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      // Tasks
      if (backup.tasks?.length) {
        const { data: existing } = await supabase.from('tasks').select('title, date').eq('user_id', user.id);
        const existingSet = new Set((existing || []).map((t: any) => `${t.title}|${t.date}`));
        const newTasks = backup.tasks
          .filter((t: any) => !existingSet.has(`${t.title}|${t.date}`))
          .map((t: any) => ({
            user_id: user.id, title: t.title, status: t.status || 'pending',
            tag: t.tag || null, date: t.date,
            created_at: t.createdAt || t.created_at || new Date().toISOString(),
          }));
        if (newTasks.length) await supabase.from('tasks').insert(newTasks);
      }

      // Goals
      if (backup.goals?.length) {
        const { data: existing } = await supabase.from('goals').select('title, quarter').eq('user_id', user.id);
        const existingSet = new Set((existing || []).map((g: any) => `${g.title}|${g.quarter}`));
        const newGoals = backup.goals
          .filter((g: any) => !existingSet.has(`${g.title}|${g.quarter}`))
          .map((g: any) => ({
            user_id: user.id, title: g.title, description: g.description || null,
            quarter: g.quarter, status: g.status || 'active', area: g.area, type: g.type,
            energy: g.energy, linked_task_ids: [], progress: 0,
            abandon_reason: g.abandonReason || g.abandon_reason || null,
          }));
        if (newGoals.length) await supabase.from('goals').insert(newGoals);
      }

      // Expenses
      if (backup.expenses?.length) {
        const { data: existing } = await supabase.from('expenses').select('name, month, amount').eq('user_id', user.id);
        const existingSet = new Set((existing || []).map((e: any) => `${e.name}|${e.month}|${e.amount}`));
        const newExpenses = backup.expenses
          .filter((e: any) => !existingSet.has(`${e.name}|${e.month}|${e.amount}`))
          .map((e: any) => ({
            user_id: user.id, name: e.name, amount: e.amount, category: e.category,
            type: e.type, installment_current: e.installmentCurrent || e.installment_current || null,
            installment_total: e.installmentTotal || e.installment_total || null,
            installment_group_id: e.installmentGroupId || e.installment_group_id || null,
            fixed_group_id: e.fixedGroupId || e.fixed_group_id || null,
            month: e.month, payment_method: e.paymentMethod || e.payment_method || null,
          }));
        if (newExpenses.length) await supabase.from('expenses').insert(newExpenses);
      }

      // Habits + Habit Entries
      if (backup.habits?.length) {
        const { data: existingHabits } = await supabase.from('habits').select('id, name').eq('user_id', user.id);
        const existingNameMap = new Map((existingHabits || []).map((h: any) => [h.name, h.id]));

        const oldIdToNewId: Record<string, string> = {};

        // Map existing habits
        for (const h of backup.habits) {
          if (existingNameMap.has(h.name)) {
            oldIdToNewId[h.id] = existingNameMap.get(h.name)!;
          }
        }

        // Insert new habits
        const newHabits = backup.habits.filter((h: any) => !existingNameMap.has(h.name));
        if (newHabits.length) {
          const toInsert = newHabits.map((h: any) => ({
            user_id: user.id,
            name: h.name,
            sort_order: h.sort_order ?? 0,
            created_at: h.created_at || new Date().toISOString(),
          }));
          const { data: inserted } = await supabase.from('habits').insert(toInsert).select('id, name');
          if (inserted) {
            const insertedMap = new Map(inserted.map((i: any) => [i.name, i.id]));
            for (const h of newHabits) {
              const newId = insertedMap.get(h.name);
              if (newId) oldIdToNewId[h.id] = newId;
            }
          }
        }

        // Import habit entries
        if (backup.habit_entries?.length) {
          const allNewHabitIds = Object.values(oldIdToNewId);
          const { data: existingEntries } = await supabase
            .from('habit_entries')
            .select('habit_id, date')
            .eq('user_id', user.id)
            .in('habit_id', allNewHabitIds);
          const existingEntrySet = new Set((existingEntries || []).map((e: any) => `${e.habit_id}|${e.date}`));

          const newEntries = backup.habit_entries
            .filter((e: any) => {
              const newHabitId = oldIdToNewId[e.habit_id];
              return newHabitId && !existingEntrySet.has(`${newHabitId}|${e.date}`);
            })
            .map((e: any) => ({
              user_id: user.id,
              habit_id: oldIdToNewId[e.habit_id],
              date: e.date,
              completed: e.completed ?? false,
              created_at: e.created_at || new Date().toISOString(),
            }));
          if (newEntries.length) await supabase.from('habit_entries').insert(newEntries);
        }
      }

      // Custom Tags
      if (backup.custom_tags?.length) {
        const { data: existing } = await supabase.from('custom_tags').select('key').eq('user_id', user.id);
        const existingSet = new Set((existing || []).map((t: any) => t.key));
        const newTags = backup.custom_tags
          .filter((t: any) => !existingSet.has(t.key))
          .map((t: any) => ({
            user_id: user.id, key: t.key, label: t.label,
            bg_color: t.bg_color || 'bg-blue-500/20',
            text_color: t.text_color || 'text-blue-400',
            sort_order: t.sort_order ?? 0,
          }));
        if (newTags.length) await supabase.from('custom_tags').insert(newTags);
      }

      // Custom Categories
      if (backup.custom_categories?.length) {
        const { data: existing } = await supabase.from('custom_categories').select('key').eq('user_id', user.id);
        const existingSet = new Set((existing || []).map((c: any) => c.key));
        const newCats = backup.custom_categories
          .filter((c: any) => !existingSet.has(c.key))
          .map((c: any) => ({
            user_id: user.id, key: c.key, label: c.label,
            icon: c.icon || '📦', bar_color: c.bar_color || 'bg-gray-500',
          }));
        if (newCats.length) await supabase.from('custom_categories').insert(newCats);
      }

      // Custom Payment Methods
      if (backup.custom_payment_methods?.length) {
        const { data: existing } = await supabase.from('custom_payment_methods').select('key').eq('user_id', user.id);
        const existingSet = new Set((existing || []).map((p: any) => p.key));
        const newMethods = backup.custom_payment_methods
          .filter((p: any) => !existingSet.has(p.key))
          .map((p: any) => ({
            user_id: user.id, key: p.key, label: p.label,
            icon: p.icon || '💰',
            requires_manual_payment: p.requires_manual_payment ?? false,
          }));
        if (newMethods.length) await supabase.from('custom_payment_methods').insert(newMethods);
      }

      // User Preferences (upsert - only import if none exist)
      if (backup.user_preferences?.length) {
        const { data: existing } = await supabase.from('user_preferences').select('id').eq('user_id', user.id);
        if (!existing?.length) {
          const pref = backup.user_preferences[0];
          await supabase.from('user_preferences').insert({
            user_id: user.id,
            currency: pref.currency || 'BRL',
            week_start_day: pref.week_start_day ?? 0,
            default_task_status: pref.default_task_status || 'pending',
          });
        }
      }

      toast({ title: 'Importação concluída', description: 'Dados restaurados com sucesso.' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast({ title: 'Erro na importação', description: err.message, variant: 'destructive' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Importar / Exportar Dados</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Faça backup ou restaure seus dados</p>
      </div>

      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Exportar backup</p>
            <p className="text-xs text-muted-foreground">Baixe todos os seus dados em formato JSON</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportBackup} className="gap-2">
            <Download className="h-4 w-4" /> Exportar JSON
          </Button>
        </div>

        <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Importar backup</p>
            <p className="text-xs text-muted-foreground">Restaure dados a partir de um arquivo JSON. Registros duplicados serão ignorados.</p>
          </div>
          <input ref={fileInputRef} type="file" accept=".json" onChange={importBackup} className="hidden" />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2" disabled={importing}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {importing ? 'Importando...' : 'Importar JSON'}
          </Button>
        </div>
      </div>
    </div>
  );
}
