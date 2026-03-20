import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, CalendarIcon, Tag, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BoardGroup, BOARD_GROUP_LABELS } from '@/types/task';
import { useSettings } from '@/contexts/SettingsContext';

interface AddTaskFormProps {
  onAdd: (title: string, options?: { date?: string; tag?: string; boardGroup?: BoardGroup }) => void;
}

export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const { tags } = useSettings();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [boardGroup, setBoardGroup] = useState<BoardGroup>('today');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedTag = tag ? tags.find(t => t.id === tag) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), {
        date: date ? format(date, 'yyyy-MM-dd') : undefined,
        tag: tag || undefined,
        boardGroup,
      });
      setTitle('');
      setDate(undefined);
      setTag(undefined);
      setBoardGroup('today');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nova tarefa..."
          className="flex-1 bg-secondary border-border focus:border-primary/50 h-11"
        />
        <Button type="submit" variant="glow" className="h-11 px-4">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Board group selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              {BOARD_GROUP_LABELS[boardGroup]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(Object.keys(BOARD_GROUP_LABELS) as BoardGroup[]).map((g) => (
              <DropdownMenuItem key={g} onSelect={() => setBoardGroup(g)}>
                <span className={cn(boardGroup === g && "font-semibold")}>{BOARD_GROUP_LABELS[g]}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date picker */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              {date ? format(date, "dd/MM", { locale: ptBR }) : 'Prazo'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => { if (d) setDate(d); setCalendarOpen(false); }}
              initialFocus
              locale={ptBR}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Tag selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("h-8 text-xs gap-1.5", selectedTag ? selectedTag.textColor : "")}
            >
              <Tag className="h-3.5 w-3.5" />
              {selectedTag ? selectedTag.label : 'Tag'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => setTag(undefined)}>
              <span className="text-muted-foreground">Sem tag</span>
            </DropdownMenuItem>
            {tags.map((t) => (
              <DropdownMenuItem key={t.key} onSelect={() => setTag(t.key)}>
                <span className={cn("flex items-center gap-2", t.textColor)}>
                  <span className={cn("w-2 h-2 rounded-full", t.bgColor.replace('/20', ''))} />
                  {t.label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </form>
  );
}
