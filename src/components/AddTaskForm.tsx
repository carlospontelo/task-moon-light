import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowUp, CalendarIcon, Plus, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BoardGroup } from '@/types/task';
import { useSettings } from '@/contexts/SettingsContext';

interface AddTaskFormProps {
  onAdd: (title: string, options?: { date?: string; tag?: string; boardGroup?: BoardGroup }) => void;
}

export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const { tags } = useSettings();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedTag = tag ? tags.find(t => t.id === tag) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), {
      date: date ? format(date, 'yyyy-MM-dd') : undefined,
      tag: tag || undefined,
      boardGroup: 'today',
    });
    setTitle('');
    setDate(undefined);
    setTag(undefined);
  };

  const iconButton = 'h-8 gap-1.5 px-2 text-xs text-subtle hover:text-foreground';

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-1 rounded-xl border border-border bg-card pl-3 pr-1.5 transition-colors focus-within:border-primary"
    >
      <Plus className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Adicionar tarefa…"
        aria-label="Adicionar tarefa"
        className="h-12 min-w-0 flex-1 bg-transparent px-2 text-base text-foreground placeholder:text-subtle focus:outline-none md:text-sm"
      />

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className={cn(iconButton, date && 'text-foreground')} aria-label="Definir prazo">
            <CalendarIcon className="h-4 w-4" strokeWidth={1.5} />
            {date && <span className="num">{format(date, 'dd/MM', { locale: ptBR })}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => { setDate(d ?? undefined); setCalendarOpen(false); }}
            initialFocus
            locale={ptBR}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className={iconButton} aria-label="Definir tag">
            {selectedTag ? (
              <span className={cn('rounded-full px-1.5 py-[3px] text-[10px] font-medium leading-none', selectedTag.bgColor, selectedTag.textColor)}>
                {selectedTag.label}
              </span>
            ) : (
              <Tag className="h-4 w-4" strokeWidth={1.5} />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setTag(undefined)}>
            <span className="text-muted-foreground">Sem tag</span>
          </DropdownMenuItem>
          {tags.map((t) => (
            <DropdownMenuItem key={t.id} onSelect={() => setTag(t.id)}>
              <span className={cn("flex items-center gap-2", t.textColor)}>
                <span className={cn("w-2 h-2 rounded-full", t.bgColor.replace('/20', ''))} />
                {t.label}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="submit"
        size="icon-sm"
        disabled={!title.trim()}
        aria-label="Adicionar"
        className="shrink-0 disabled:bg-secondary disabled:text-subtle disabled:opacity-100"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </form>
  );
}
