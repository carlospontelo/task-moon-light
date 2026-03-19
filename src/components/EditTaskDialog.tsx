import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Tag } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Task } from '@/types/task';
import { useSettings } from '@/contexts/SettingsContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: { date?: string; tag?: string | null }) => void;
}

export function EditTaskDialog({ task, open, onOpenChange, onSave }: EditTaskDialogProps) {
  const { tags } = useSettings();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize when dialog opens with a task
  if (task && open && !initialized) {
    setDate(parseISO(task.date));
    setTag(task.tag);
    setInitialized(true);
  }

  if (!open && initialized) {
    setInitialized(false);
  }

  const selectedTag = tag ? tags.find(t => t.key === tag) : undefined;

  const handleSave = () => {
    if (!task || !date) return;
    onSave(task.id, {
      date: format(date, 'yyyy-MM-dd'),
      tag: tag || null,
    });
    onOpenChange(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium text-foreground truncate">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Date picker */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Prazo</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start font-mono text-sm h-9"
                >
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : 'Selecionar data'}
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
          </div>

          {/* Tag selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Tag</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-sm h-9",
                    selectedTag ? selectedTag.textColor : "text-muted-foreground"
                  )}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  {selectedTag ? selectedTag.label : 'Sem tag'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
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
          </div>

          <Button onClick={handleSave} variant="glow" className="w-full h-9">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
