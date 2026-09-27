import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { EntryScope, FinanceEntry, FinanceEntryKind } from '@/types/financeEntry';

export const KIND_COPY: Record<FinanceEntryKind, { singular: string; newLabel: string; descriptionPlaceholder: string }> = {
  income: { singular: 'entrada', newLabel: 'Nova entrada', descriptionPlaceholder: 'Ex.: Salário' },
  investment: { singular: 'investimento', newLabel: 'Novo investimento', descriptionPlaceholder: 'Ex.: Tesouro Selic (opcional)' },
};

/** "1.234,56" → 123456 cents. */
function parseAmount(input: string): number {
  const normalized = input.trim().replace(/\./g, '').replace(',', '.');
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : NaN;
}

const formatAmountInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

interface EntryFormDialogProps {
  kind: FinanceEntryKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this entry. */
  entry?: FinanceEntry | null;
  onCreate: (data: { description: string; amount: number; recurring: boolean }) => void;
  onUpdate: (id: string, data: { description: string; amount: number }, scope: EntryScope) => void;
}

export function EntryFormDialog({ kind, open, onOpenChange, entry, onCreate, onUpdate }: EntryFormDialogProps) {
  const copy = KIND_COPY[kind];
  const editing = !!entry;
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [scope, setScope] = useState<EntryScope>('this');
  const [initializedFor, setInitializedFor] = useState<string | null>(null);

  // Sync form state when the dialog opens (for a new or edited entry).
  const openKey = open ? (entry?.id ?? 'new') : null;
  if (openKey !== initializedFor) {
    setInitializedFor(openKey);
    if (openKey) {
      setDescription(entry?.description ?? '');
      setAmount(entry ? formatAmountInput(entry.amount) : '');
      setRecurring(false);
      setScope('this');
    }
  }

  const cents = parseAmount(amount);
  const descriptionRequired = kind === 'income';
  const valid = cents > 0 && (!descriptionRequired || description.trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    if (entry) onUpdate(entry.id, { description, amount: cents }, entry.seriesId ? scope : 'this');
    else onCreate({ description, amount: cents, recurring });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {editing ? `Editar ${copy.singular}` : copy.newLabel}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="entry-description" className="text-xs text-muted-foreground">
              Descrição{descriptionRequired ? '' : ' (opcional)'}
            </Label>
            <Input
              id="entry-description"
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={copy.descriptionPlaceholder}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="entry-amount" className="text-xs text-muted-foreground">Valor</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-subtle">R$</span>
              <Input
                id="entry-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="num pl-10"
              />
            </div>
          </div>

          {!editing && (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
              <Checkbox checked={recurring} onCheckedChange={(v) => setRecurring(v === true)} />
              Repete todo mês
            </label>
          )}

          {editing && entry?.seriesId && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Aplicar alteração em</p>
              <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-secondary p-1">
                {([['this', 'Só este mês'], ['from_this', 'Este e os próximos']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={scope === value}
                    onClick={() => setScope(value)}
                    className={cn(
                      'h-8 rounded-md text-xs transition-colors',
                      scope === value ? 'bg-surface-3 text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={!valid}>
            {editing ? 'Salvar' : `Adicionar ${copy.singular}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
