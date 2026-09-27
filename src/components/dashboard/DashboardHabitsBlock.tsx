import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import { useHabits, Habit } from '@/hooks/useHabits';
import { getCurrentMonth, getMonthLabel, addMonths } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CHART, CHART_TOOLTIP_CLASS } from '@/lib/chart-theme';
import { BlockHeader } from './BlockHeader';

interface SortableHabitRowProps {
  habit: Habit;
  daysInMonth: number;
  yearStr: string;
  monthStr: string;
  today: string;
  isCompleted: (habitId: string, date: string) => boolean;
  toggleEntry: (habitId: string, date: string) => void;
  deleteHabit: (id: string) => void;
}

function SortableHabitRow({ habit, daysInMonth, yearStr, monthStr, today, isCompleted, toggleEntry, deleteHabit }: SortableHabitRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} className={cn("group", isDragging && "opacity-50")}>
      <td className="py-1 pr-3 pl-1 sticky left-0 z-10 bg-card">
        <div className="flex items-center gap-1.5">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-subtle hover:text-foreground transition-colors touch-none"
            aria-label="Reordenar hábito"
          >
            <GripVertical className="h-3 w-3" />
          </button>
          <span className="truncate text-foreground text-[13px]">{habit.name}</span>
          <button
            onClick={() => deleteHabit(habit.id)}
            aria-label="Excluir hábito"
            className="ml-auto opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-subtle hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </td>
      {Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dateStr = `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;
        const done = isCompleted(habit.id, dateStr);
        const isToday = dateStr === today;
        return (
          <td key={i} className="text-center py-1 px-[2px]">
            <button
              onClick={() => toggleEntry(habit.id, dateStr)}
              aria-label={`${habit.name}, dia ${day}${done ? ', concluído' : ''}`}
              className={cn(
                "block mx-auto w-5 h-5 rounded-[4px] transition-colors duration-150",
                done ? "bg-primary hover:bg-primary-hover" : "bg-secondary hover:bg-surface-3",
                isToday && !done && "ring-1 ring-inset ring-primary/60"
              )}
            />
          </td>
        );
      })}
    </tr>
  );
}

export function DashboardHabitsBlock() {
  const { habits, addHabit, deleteHabit, toggleEntry, isCompleted, getDailyCompletionRates, getDaysInMonth, reorderHabits } = useHabits();
  const [month, setMonth] = useState(getCurrentMonth());
  const [newHabit, setNewHabit] = useState('');
  const label = getMonthLabel(month);
  const daysInMonth = getDaysInMonth(month);
  const chartData = getDailyCompletionRates(month);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const handleAdd = () => {
    if (newHabit.trim()) {
      addHabit(newHabit.trim());
      setNewHabit('');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = habits.findIndex(h => h.id === active.id);
    const newIndex = habits.findIndex(h => h.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(habits, oldIndex, newIndex);
      const updates = reordered.map((h, i) => ({ id: h.id, sortOrder: i }));
      reorderHabits(updates);
    }
  };

  const [yearStr, monthStr] = month.split('-');
  // Single highlighted bar: today when viewing the current month, otherwise none.
  const highlightDay = today.startsWith(`${yearStr}-${monthStr}`) ? Number(today.slice(8)) : null;

  return (
    <div className="space-y-4">
      <BlockHeader
        label="Hábitos"
        action={
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => setMonth(addMonths(month, -1))} aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="num min-w-[72px] text-center text-xs text-muted-foreground">{label.short} {label.year}</span>
            <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => setMonth(addMonths(month, 1))} aria-label="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Chart */}
      {habits.length > 0 && chartData.length > 0 && (
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: -24 }} barCategoryGap="18%">
              <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="2 4" />
              <XAxis dataKey="day" tick={CHART.tick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={CHART.tick} tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 50, 100]} unit="%" />
              <Tooltip
                cursor={{ fill: CHART.cursor, radius: 4 }}
                content={({ active, payload, label: day }) =>
                  active && payload?.length ? (
                    <div className={CHART_TOOLTIP_CLASS}>
                      <p className="text-subtle">Dia <span className="num">{day}</span></p>
                      <p className="num mt-0.5 text-base text-primary">{payload[0].value}%</p>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="rate" radius={[4, 4, 4, 4]} minPointSize={2}>
                {chartData.map(d => (
                  <Cell key={d.day} fill={d.day === highlightDay ? CHART.barAccent : CHART.barMuted} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add habit */}
      <div className="flex gap-2">
        <Input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="Novo hábito..."
          className="h-9 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button variant="secondary" size="sm" className="h-9 px-3" onClick={handleAdd} disabled={!newHabit.trim()} aria-label="Adicionar hábito">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Habit tracker table */}
      {habits.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-subtle font-normal py-2 pl-1 pr-3 sticky left-0 z-10 bg-card min-w-[140px]">
                    Hábito
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <th key={i} className="num text-center text-subtle font-normal py-2 px-[2px] min-w-[24px] text-[10px]">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <SortableContext items={habits.map(h => h.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {habits.map(habit => (
                    <SortableHabitRow
                      key={habit.id}
                      habit={habit}
                      daysInMonth={daysInMonth}
                      yearStr={yearStr}
                      monthStr={monthStr}
                      today={today}
                      isCompleted={isCompleted}
                      toggleEntry={toggleEntry}
                      deleteHabit={deleteHabit}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </DndContext>
      )}

      {habits.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-sm font-medium text-foreground">Nenhum hábito ainda</p>
          <p className="mt-1 text-xs text-muted-foreground">Escreva um hábito acima e marque os dias em que cumpriu.</p>
        </div>
      )}
    </div>
  );
}
