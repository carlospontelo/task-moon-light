import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarIcon, Tag, Layers, ListChecks, Plus, Trash2, GripVertical } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Task, TaskStatus, BoardGroup, BOARD_GROUP_LABELS } from '@/types/task';
import { useSettings } from '@/contexts/SettingsContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Circle, Loader2, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useSubtasksContext } from '@/contexts/SubtasksContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Subtask } from '@/hooks/useSubtasks';

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: { date?: string; tag?: string | null; boardGroup?: BoardGroup; status?: TaskStatus }) => void;
}

function SortableSubtaskItem({ subtask, onToggle, onDelete }: { subtask: Subtask; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/sub flex items-center gap-2 py-1.5 px-1 rounded-md",
        isDragging && "opacity-50 bg-secondary/50"
      )}
    >
      <button {...attributes} {...listeners} className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={() => onToggle(subtask.id)}
        className="flex-shrink-0"
      />
      <span className={cn(
        "flex-1 text-sm min-w-0 truncate",
        subtask.completed && "line-through opacity-50"
      )}>
        {subtask.title}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(subtask.id)}
        className="h-6 w-6 opacity-0 group-hover/sub:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function EditTaskDialog({ task, open, onOpenChange, onSave }: EditTaskDialogProps) {
  const { tags } = useSettings();
  const { getSubtasksByTaskId, getSubtaskProgress, addSubtask, toggleSubtask, deleteSubtask, reorderSubtasks } = useSubtasksContext();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [tag, setTag] = useState<string | undefined>(undefined);
  const [boardGroup, setBoardGroup] = useState<BoardGroup>('today');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (task && open && !initialized) {
    setDate(parseISO(task.date));
    setTag(task.tag);
    setBoardGroup(task.boardGroup);
    setStatus(task.status);
    setInitialized(true);
  }

  if (!open && initialized) {
    setInitialized(false);
    setNewSubtaskTitle('');
  }

  const selectedTag = tag ? tags.find(t => t.id === tag) : undefined;
  const taskSubtasks = task ? getSubtasksByTaskId(task.id) : [];
  const progress = task ? getSubtaskProgress(task.id) : { completed: 0, total: 0 };
  const progressPercent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  const handleSave = () => {
    if (!task || !date) return;
    onSave(task.id, {
      date: format(date, 'yyyy-MM-dd'),
      tag: tag || null,
      boardGroup,
      status,
    });
    onOpenChange(false);
  };

  const handleAddSubtask = async () => {
    if (!task || !newSubtaskTitle.trim()) return;
    await addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!task) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = taskSubtasks.findIndex(s => s.id === active.id);
    const newIndex = taskSubtasks.findIndex(s => s.id === over.id);
    const reordered = arrayMove(taskSubtasks, oldIndex, newIndex);
    reorderSubtasks(task.id, reordered.map(s => s.id));
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[85vh] overflow-y-auto">
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
                <Button type="button" variant="outline" className="w-full justify-start font-mono text-sm h-9">
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
                  className={cn("w-full justify-start text-sm h-9", selectedTag ? selectedTag.textColor : "text-muted-foreground")}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  {selectedTag ? selectedTag.label : 'Sem tag'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
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
          </div>

          {/* Status selector */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">Estado</label>
            <RadioGroup value={status} onValueChange={(v) => setStatus(v as TaskStatus)} className="flex gap-2">
              {([['pending', 'Não iniciada', Circle], ['in_progress', 'Em andamento', Loader2], ['completed', 'Concluída', CheckCircle2]] as const).map(([value, label, Icon]) => (
                <Label
                  key={value}
                  htmlFor={`status-${value}`}
                  className={cn(
                    "flex items-center gap-1.5 cursor-pointer rounded-lg border px-3 py-2 text-xs transition-all",
                    status === value ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <RadioGroupItem value={value} id={`status-${value}`} className="sr-only" />
                  <Icon className={cn("h-3.5 w-3.5", value === 'in_progress' && status === value && "animate-spin")} />
                  {label}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Board group selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Contexto</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-start text-sm h-9">
                  <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
                  {BOARD_GROUP_LABELS[boardGroup]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {(Object.keys(BOARD_GROUP_LABELS) as BoardGroup[]).map((g) => (
                  <DropdownMenuItem key={g} onSelect={() => setBoardGroup(g)}>
                    <span className={cn(boardGroup === g && "font-semibold")}>{BOARD_GROUP_LABELS[g]}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Subtasks section */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
              <label className="text-xs text-muted-foreground font-medium">Subtarefas</label>
            </div>

            {progress.total > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {progress.completed} de {progress.total} concluídas
                  </span>
                  <span className="text-[11px] text-muted-foreground">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={taskSubtasks.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-0.5">
                  {taskSubtasks.map(sub => (
                    <SortableSubtaskItem
                      key={sub.id}
                      subtask={sub}
                      onToggle={toggleSubtask}
                      onDelete={deleteSubtask}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex items-center gap-2">
              <Input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                placeholder="Nova subtarefa..."
                className="h-8 text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="h-8 w-8 flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button onClick={handleSave} variant="glow" className="w-full h-9">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
