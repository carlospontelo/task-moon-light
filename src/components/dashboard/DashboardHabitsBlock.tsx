import { useState, useMemo } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { getCurrentMonth, getMonthLabel, addMonths } from '@/types/expense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function DashboardHabitsBlock() {
  const { habits, addHabit, deleteHabit, toggleEntry, isCompleted, getDailyCompletionRates, getDaysInMonth } = useHabits();
  const [month, setMonth] = useState(getCurrentMonth());
  const [newHabit, setNewHabit] = useState('');
  const label = getMonthLabel(month);
  const daysInMonth = getDaysInMonth(month);
  const chartData = getDailyCompletionRates(month);

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

  const [yearStr, monthStr] = month.split('-');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Hábitos</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonth(addMonths(month, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[80px] text-center">{label.short} {label.year}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chart */}
      {habits.length > 0 && chartData.length > 0 && (
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="habitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(190, 95%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(190, 95%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: 8, fontSize: 12 }}
                labelFormatter={(v) => `Dia ${v}`}
                formatter={(v: number) => [`${v}%`, 'Conclusão']}
              />
              <Area type="monotone" dataKey="rate" stroke="hsl(190, 95%, 55%)" fill="url(#habitGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add habit */}
      <div className="flex gap-2">
        <Input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="Novo hábito..."
          className="h-8 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button size="sm" className="h-8 px-3" onClick={handleAdd} disabled={!newHabit.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Habit tracker table */}
      {habits.length > 0 && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left text-muted-foreground font-medium py-2 px-2 sticky left-0 bg-card min-w-[120px]">
                  Hábito
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <th key={i} className="text-center text-muted-foreground font-normal py-2 px-0.5 min-w-[28px]">
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => (
                <tr key={habit.id} className="group border-t border-border/50">
                  <td className="py-1.5 px-2 sticky left-0 bg-card">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-foreground">{habit.name}</span>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
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
                      <td key={i} className="text-center py-1.5 px-0.5">
                        <button
                          onClick={() => toggleEntry(habit.id, dateStr)}
                          className={cn(
                            "w-5 h-5 rounded-sm transition-all duration-200 border",
                            done
                              ? "bg-primary/80 border-primary shadow-[0_0_6px_hsl(190_95%_55%_/_0.3)]"
                              : "border-border/50 hover:border-primary/40",
                            isToday && !done && "border-primary/30"
                          )}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {habits.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Adicione um hábito para começar a rastrear
        </p>
      )}
    </div>
  );
}
