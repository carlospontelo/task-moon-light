import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/types/expense';
import type { EntryScope, FinanceEntry } from '@/types/financeEntry';
import { KIND_COPY } from './EntryFormDialog';

interface EntryDeleteDialogProps {
  entry: FinanceEntry | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string, scope: EntryScope) => void;
}

export function EntryDeleteDialog({ entry, onOpenChange, onConfirm }: EntryDeleteDialogProps) {
  const repeats = !!entry?.seriesId;
  const label = entry ? (entry.description || KIND_COPY[entry.kind].singular) : '';

  return (
    <AlertDialog open={!!entry} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {entry ? KIND_COPY[entry.kind].singular : ''}?</AlertDialogTitle>
          <AlertDialogDescription>
            {label} · <span className="num">{entry ? formatCurrency(entry.amount) : ''}</span>
            {repeats && '. Ela se repete todo mês.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {repeats && (
            <AlertDialogAction
              onClick={() => entry && onConfirm(entry.id, 'from_this')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Este e os próximos
            </AlertDialogAction>
          )}
          <AlertDialogAction
            onClick={() => entry && onConfirm(entry.id, 'this')}
            className={repeats ? 'border border-border-strong bg-transparent text-foreground hover:bg-accent' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
          >
            {repeats ? 'Só este mês' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
