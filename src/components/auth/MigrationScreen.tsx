import { useState, useEffect } from 'react';
import { CheckSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEYS = {
  tasks: 'tasks-storage',
  goals: 'goals-storage',
  expenses: 'expenses-storage',
};
const MIGRATION_DONE_KEY = 'migration-completed';

interface MigrationScreenProps {
  onComplete: () => void;
}

export function MigrationScreen({ onComplete }: MigrationScreenProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'migrating' | 'done' | 'error'>('migrating');
  const [progress, setProgress] = useState({ tasks: false, goals: false, expenses: false });

  useEffect(() => {
    if (!user) return;
    migrate();
  }, [user]);

  const migrate = async () => {
    if (!user) return;

    try {
      // Migrate tasks
      const rawTasks = localStorage.getItem(STORAGE_KEYS.tasks);
      if (rawTasks) {
        const tasks = JSON.parse(rawTasks) as any[];
        if (tasks.length > 0) {
          const rows = tasks.map((t) => ({
            user_id: user.id,
            title: t.title,
            status: t.status || (t.completed ? 'completed' : 'pending'),
            tag: t.tag || null,
            date: t.date,
            created_at: t.createdAt || new Date().toISOString(),
          }));
          const { error } = await supabase.from('tasks').insert(rows);
          if (error) throw error;
        }
      }
      setProgress((p) => ({ ...p, tasks: true }));

      // Migrate goals — need task ID mapping
      const rawGoals = localStorage.getItem(STORAGE_KEYS.goals);
      if (rawGoals) {
        const goals = JSON.parse(rawGoals) as any[];
        if (goals.length > 0) {
          // Get newly inserted task IDs to remap linked tasks
          const { data: dbTasks } = await supabase
            .from('tasks')
            .select('id, title, date')
            .eq('user_id', user.id);

          const rows = goals.map((g) => ({
            user_id: user.id,
            title: g.title,
            description: g.description || null,
            quarter: g.quarter,
            status: g.status,
            area: g.area,
            type: g.type,
            energy: g.energy,
            linked_task_ids: [], // Cannot remap old UUIDs; user can re-link
            progress: 0,
            abandon_reason: g.abandonReason || null,
            created_at: g.createdAt || new Date().toISOString(),
            updated_at: g.updatedAt || new Date().toISOString(),
          }));
          const { error } = await supabase.from('goals').insert(rows);
          if (error) throw error;
        }
      }
      setProgress((p) => ({ ...p, goals: true }));

      // Migrate expenses
      const rawExpenses = localStorage.getItem(STORAGE_KEYS.expenses);
      if (rawExpenses) {
        const expenses = JSON.parse(rawExpenses) as any[];
        if (expenses.length > 0) {
          const rows = expenses.map((e) => ({
            user_id: user.id,
            name: e.name,
            amount: e.amount,
            category: e.category,
            type: e.type,
            installment_current: e.installmentCurrent || null,
            installment_total: e.installmentTotal || null,
            installment_group_id: e.installmentGroupId || null,
            fixed_group_id: e.fixedGroupId || null,
            month: e.month,
            payment_method: e.paymentMethod || null,
            created_at: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
          }));
          const { error } = await supabase.from('expenses').insert(rows);
          if (error) throw error;
        }
      }
      setProgress((p) => ({ ...p, expenses: true }));

      // Mark migration as done — prevents re-migration
      localStorage.setItem(MIGRATION_DONE_KEY, user.id);
      setStatus('done');
      toast({ title: 'Migração concluída!', description: 'Seus dados foram salvos na nuvem.' });
      setTimeout(onComplete, 1500);
    } catch (err: any) {
      console.error('Migration error:', err);
      setStatus('error');
      toast({
        title: 'Erro na migração',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const steps = [
    { key: 'tasks', label: 'Tarefas' },
    { key: 'goals', label: 'Metas' },
    { key: 'expenses', label: 'Despesas' },
  ] as const;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20">
            <CheckSquare className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {status === 'migrating' ? 'Migrando seus dados...' : status === 'done' ? 'Migração concluída!' : 'Erro na migração'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {status === 'migrating'
            ? 'Salvando seus dados na nuvem para acesso em qualquer dispositivo.'
            : status === 'done'
            ? 'Todos os dados foram transferidos com sucesso.'
            : 'Seus dados locais não foram alterados. Tente novamente.'}
        </p>

        <div className="glass-card rounded-xl p-4 space-y-3 border border-border text-left">
          {steps.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              {progress[key] ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
              )}
              <span className={`text-sm ${progress[key] ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {status === 'error' && (
          <button onClick={migrate} className="text-primary hover:underline text-sm font-medium">
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}

export function hasLocalData(): boolean {
  return Object.values(STORAGE_KEYS).some((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      return Array.isArray(data) && data.length > 0;
    } catch {
      return false;
    }
  });
}

export function isMigrationDone(userId: string): boolean {
  return localStorage.getItem(MIGRATION_DONE_KEY) === userId;
}
