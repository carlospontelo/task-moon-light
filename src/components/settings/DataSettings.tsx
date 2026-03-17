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
    const backup: Record<string, unknown> = { exportedAt: new Date().toISOString(), version: '2.0' };

    const [tasks, goals, expenses] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('expenses').select('*').eq('user_id', user.id),
    ]);

    backup.tasks = tasks.data || [];
    backup.goals = goals.data || [];
    backup.expenses = expenses.data || [];

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
