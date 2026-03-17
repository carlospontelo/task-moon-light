import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TaskTag } from '@/types/task';
import { useSettings } from '@/contexts/SettingsContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AddTaskFormProps {
  onAdd: (title: string, date: string, tag?: TaskTag) => void;
}

export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const { tags } = useSettings();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [tag, setTag] = useState<string | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedTag = tag ? tags.find(t => t.key === tag) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), format(date, 'yyyy-MM-dd'), tag as TaskTag);
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
              selectedTag ? selectedTag.textColor : "text-muted-foreground"
            )}
          >
            <Tag className="h-4 w-4 mr-2" />
            {selectedTag ? selectedTag.label : 'Tag'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTag(undefined)}>
            <span className="text-muted-foreground">Sem tag</span>
          </DropdownMenuItem>
          {tags.map((t) => (
            <DropdownMenuItem key={t.key} onClick={() => setTag(t.key)}>
              <span className={cn("flex items-center gap-2", t.textColor)}>
                <span className={cn("w-2 h-2 rounded-full", t.bgColor.replace('/20', ''))} />
                {t.label}
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
