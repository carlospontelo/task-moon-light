import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEYS = {
  tasks: 'tasks-storage',
  goals: 'goals-storage',
  expenses: 'expenses-storage',
};

export function DataBackupExport() {
  const { toast } = useToast();

  const exportBackup = () => {
    const backup: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      const raw = localStorage.getItem(storageKey);
      backup[key] = raw ? JSON.parse(raw) : [];
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Backup exportado',
      description: 'Arquivo JSON salvo com sucesso.',
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={exportBackup} className="gap-2">
      <Download className="h-4 w-4" />
      Exportar Backup
    </Button>
  );
}
