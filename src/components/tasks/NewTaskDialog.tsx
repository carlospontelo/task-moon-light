import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';
import type { BoardGroup } from '@/types/task';

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (title: string, options?: { date?: string; tag?: string; boardGroup?: BoardGroup }) => void;
}

export function NewTaskDialog({ open, onOpenChange, onAdd }: NewTaskDialogProps) {
  const { tags } = useSettings();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const selectedTag = tag ? tags.find(t => t.id === tag) : undefined;

  const reset = () => { setTitle(''); setDate(undefined); setTag(undefined); };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), {
      date: date ? format(date, 'yyyy-MM-dd') : undefined,
      tag: tag || undefined,
      boardGroup: 'today',
    });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-base font-medium">Nova tarefa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="O que precisa ser feito?"
            aria-label="Título da tarefa"
            className="h-11"
          />

          <div className="flex flex-wrap gap-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <CalendarIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {date ? <span className="num">{format(date, 'dd/MM', { locale: ptBR })}</span> : 'Prazo'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
                <Button type="button" variant="outline" size="sm" className={cn('h-8 gap-1.5 text-xs', selectedTag?.textColor)}>
                  <Tag className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {selectedTag ? selectedTag.label : 'Tag'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => setTag(undefined)}>
                  <span className="text-muted-foreground">Sem tag</span>
                </DropdownMenuItem>
                {tags.map((t) => (
                  <DropdownMenuItem key={t.id} onSelect={() => setTag(t.id)}>
                    <span className={cn('flex items-center gap-2', t.textColor)}>
                      <span className={cn('h-2 w-2 rounded-full', t.bgColor.replace('/20', ''))} />
                      {t.label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button type="submit" className="w-full" disabled={!title.trim()}>
            Adicionar tarefa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
