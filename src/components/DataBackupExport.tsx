import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, LogOut, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function DataBackupExport() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const exportBackup = async () => {
    if (!user) return;
    const backup: Record<string, unknown> = { exportedAt: new Date().toISOString(), version: '1.0' };

    const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', user.id);
    const { data: goals } = await supabase.from('goals').select('*').eq('user_id', user.id);
    const { data: expenses } = await supabase.from('expenses').select('*').eq('user_id', user.id);

    backup.tasks = tasks || [];
    backup.goals = goals || [];
    backup.expenses = expenses || [];

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

      // Import tasks — deduplicate by title+date
      if (backup.tasks?.length) {
        const { data: existing } = await supabase.from('tasks').select('title, date').eq('user_id', user.id);
        const existingSet = new Set((existing || []).map((t: any) => `${t.title}|${t.date}`));
        const newTasks = backup.tasks
          .filter((t: any) => !existingSet.has(`${t.title}|${t.date}`))
          .map((t: any) => ({
            user_id: user.id,
            title: t.title,
            status: t.status || 'pending',
            tag: t.tag || null,
            date: t.date,
            created_at: t.createdAt || t.created_at || new Date().toISOString(),
          }));
        if (newTasks.length) await supabase.from('tasks').insert(newTasks);
      }

      // Import goals — deduplicate by title+quarter
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
            created_at: g.createdAt || g.created_at || new Date().toISOString(),
            updated_at: g.updatedAt || g.updated_at || new Date().toISOString(),
          }));
        if (newGoals.length) await supabase.from('goals').insert(newGoals);
      }

      // Import expenses — deduplicate by name+month+amount
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
            created_at: e.createdAt ? new Date(e.createdAt).toISOString() : e.created_at || new Date().toISOString(),
          }));
        if (newExpenses.length) await supabase.from('expenses').insert(newExpenses);
      }

      toast({ title: 'Importação concluída', description: 'Dados restaurados com sucesso. Recarregue a página.' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast({ title: 'Erro na importação', description: err.message, variant: 'destructive' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input ref={fileInputRef} type="file" accept=".json" onChange={importBackup} className="hidden" />
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2" disabled={importing}>
        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Importar
      </Button>
      <Button variant="outline" size="sm" onClick={exportBackup} className="gap-2">
        <Download className="h-4 w-4" />
        Exportar
      </Button>
      <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
