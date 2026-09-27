import { useMemo, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { MoreHorizontal, Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EvilMonospaceBarChart } from '@/components/evilcharts/blocks/monospace-bar-chart';
import { formatCurrency, getMonthLabel } from '@/types/expense';
import type { FinanceEntriesApi } from '@/hooks/useFinanceEntries';
import type { FinanceEntry, FinanceEntryKind } from '@/types/financeEntry';
import { EntryFormDialog, KIND_COPY } from './EntryFormDialog';
import { EntryDeleteDialog } from './EntryDeleteDialog';

const BRL = { style: 'currency', currency: 'BRL' } as const;
const LABEL = 'text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground';

/** Compact BRL for chart labels: 1.2k, 850. */
const compact = (cents: number) => {
  const v = cents / 100;
  return v >= 1000 ? `${(v / 1000).toFixed(1).replace('.0', '')}k` : v.toFixed(0);
};

interface EntriesTabProps {
  kind: FinanceEntryKind;
  month: string;
  finance: FinanceEntriesApi;
}

export function EntriesTab({ kind, month, finance }: EntriesTabProps) {
  const { getEntries, getTotal, addEntry, updateEntry, deleteEntry } = finance;
  const copy = KIND_COPY[kind];
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceEntry | null>(null);
  const [deleting, setDeleting] = useState<FinanceEntry | null>(null);

  const list = getEntries(kind, month);
  const monthTotal = getTotal(kind, month);
  const year = month.slice(0, 4);
  const monthLabel = getMonthLabel(month).full;

  const yearData = useMemo(() => {
    if (kind !== 'investment') return [];
    return Array.from({ length: 12 }, (_, i) => {
      const m = `${year}-${String(i + 1).padStart(2, '0')}`;
      return { key: m, label: getMonthLabel(m).short, value: getTotal('investment', m) };
    });
  }, [kind, year, getTotal]);

  // Accumulated from January through the selected month.
  const yearToDate = yearData.filter(d => d.key <= month).reduce((s, d) => s + d.value, 0);
  const yearTotal = yearData.reduce((s, d) => s + d.value, 0);
  const topMonth = yearData.reduce<(typeof yearData)[number] | null>((top, d) => (d.value > (top?.value ?? 0) ? d : top), null);

  const openNew = () => { setEditing(null); setFormOpen(true); };

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
          <div>
            <p className={LABEL}>{kind === 'income' ? 'Entrou no mês' : 'Investido no mês'}</p>
            <NumberFlow value={monthTotal / 100} format={BRL} locales="pt-BR" className="num mt-2 text-4xl font-medium text-foreground" />
          </div>
          {kind === 'investment' && (
            <div>
              <p className={LABEL}>Acumulado em {year}</p>
              <NumberFlow value={yearToDate / 100} format={BRL} locales="pt-BR" className="num mt-2 text-2xl font-medium text-foreground sm:text-[28px]" />
            </div>
          )}
        </div>
        <Button onClick={openNew} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          {copy.newLabel}
        </Button>
      </section>

      {kind === 'investment' && yearTotal > 0 && (
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <EvilMonospaceBarChart
            data={yearData}
            highlightKey={month}
            formatValue={compact}
            stats={[
              { label: `[Σ] Total ${year}`, value: formatCurrency(yearTotal) },
              { label: '[↑] Maior mês', value: topMonth ? topMonth.label : '—' },
            ]}
          />
        </section>
      )}

      <section className="rounded-xl border border-border bg-card p-2 sm:p-3">
        {list.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-foreground">
              {kind === 'income' ? 'Nenhuma entrada' : 'Nenhum investimento'} em <span className="lowercase">{monthLabel}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {kind === 'income'
                ? 'Registre salário e outros valores que entraram para ver quanto sobrou no mês.'
                : 'Registre quanto você guardou ou aplicou neste mês.'}
            </p>
            <Button variant="outline" onClick={openNew} className="mt-5 gap-2">
              <Plus className="h-4 w-4" />
              {copy.newLabel}
            </Button>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {list.map(entry => (
              <li key={entry.id} className="group flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-secondary">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm text-foreground">
                    {entry.description || <span className="text-muted-foreground">Sem descrição</span>}
                  </span>
                  {entry.seriesId && (
                    <Repeat className="h-3.5 w-3.5 shrink-0 text-subtle" strokeWidth={1.5} aria-label="Repete todo mês" />
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="num text-sm text-foreground">{formatCurrency(entry.amount)}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Ações da ${copy.singular}`}
                        className="h-8 w-8 text-subtle md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 md:data-[state=open]:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => { setEditing(entry); setFormOpen(true); }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setDeleting(entry)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EntryFormDialog
        kind={kind}
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }}
        entry={editing}
        onCreate={(data) => addEntry({ kind, month, ...data })}
        onUpdate={updateEntry}
      />
      <EntryDeleteDialog
        entry={deleting}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        onConfirm={deleteEntry}
      />
    </div>
  );
}
