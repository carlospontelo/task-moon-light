import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TaskTag, TAG_COLORS, TAG_LABELS } from '@/types/task';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AddTaskFormProps {
  onAdd: (title: string, date: string, tag?: TaskTag) => void;
}

const TAGS: TaskTag[] = ['work', 'personal', 'urgent', 'study', 'health'];

export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [tag, setTag] = useState<TaskTag | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), format(date, 'yyyy-MM-dd'), tag);
      setTitle('');
      setTag(undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nova tarefa..."
          className="bg-secondary border-border focus:border-primary/50 h-11"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-11 px-3",
              tag ? TAG_COLORS[tag].text : "text-muted-foreground"
            )}
          >
            <Tag className="h-4 w-4 mr-2" />
            {tag ? TAG_LABELS[tag] : 'Tag'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTag(undefined)}>
            <span className="text-muted-foreground">Sem tag</span>
          </DropdownMenuItem>
          {TAGS.map((t) => (
            <DropdownMenuItem key={t} onClick={() => setTag(t)}>
              <span className={cn(
                "flex items-center gap-2",
                TAG_COLORS[t].text
              )}>
                <span className={cn("w-2 h-2 rounded-full", TAG_COLORS[t].bg.replace('/20', ''))} />
                {TAG_LABELS[t]}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-11 px-3 font-mono text-sm",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {format(date, "dd/MM", { locale: ptBR })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) setDate(d);
              setCalendarOpen(false);
            }}
            initialFocus
            locale={ptBR}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <Button type="submit" variant="glow" className="h-11 px-4">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Adicionar</span>
      </Button>
    </form>
  );
}
