import { useState, useMemo } from 'react';
import { Task, TaskStatus, TAG_COLORS } from '@/types/task';
import { Button } from '@/components/ui/button';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, Grid3X3, Circle, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  tasks: Task[];
  getTasksByDate: (date: string) => Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
}

type ViewMode = 'week' | 'month';

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  pending: <Circle className="h-3 w-3" />,
  in_progress: <Clock className="h-3 w-3" />,
  completed: <CheckCircle2 className="h-3 w-3" />,
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'text-muted-foreground',
  in_progress: 'text-amber-400',
  completed: 'text-emerald-400',
};

export function CalendarView({ tasks, getTasksByDate, onUpdateStatus }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const days = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const monthDays = eachDayOfInterval({ start, end });
      
      // Add padding days from previous month
      const startPadding = startOfWeek(start, { weekStartsOn: 0 });
      const paddingDays = eachDayOfInterval({ start: startPadding, end: start }).slice(0, -1);
      
      // Add padding days for next month
      const endPadding = endOfWeek(end, { weekStartsOn: 0 });
      const endPaddingDays = eachDayOfInterval({ start: end, end: endPadding }).slice(1);
      
      return [...paddingDays, ...monthDays, ...endPaddingDays];
    }
  }, [currentDate, viewMode]);

  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  const headerTitle = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, "dd MMM", { locale: ptBR })} - ${format(end, "dd MMM yyyy", { locale: ptBR })}`;
    }
    return format(currentDate, "MMMM yyyy", { locale: ptBR });
  }, [currentDate, viewMode]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Calendário</h1>
          <p className="text-muted-foreground font-mono text-sm capitalize mt-1">{headerTitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-secondary rounded-lg p-1">
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="h-8"
            >
              <CalendarDays className="h-4 w-4 mr-1.5" />
              Semana
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="h-8"
            >
              <Grid3X3 className="h-4 w-4 mr-1.5" />
              Mês
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => navigate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="font-mono text-xs"
            >
              Hoje
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => navigate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className={cn(
          "grid grid-cols-7",
          viewMode === 'week' ? 'min-h-[400px]' : ''
        )}>
          {days.map((day, index) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayTasks = getTasksByDate(dateStr);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const today = isToday(day);

            return (
              <div
                key={index}
                className={cn(
                  "border-r border-b border-border last:border-r-0 p-2 min-h-[100px]",
                  viewMode === 'week' ? 'min-h-[400px]' : 'min-h-[100px]',
                  !isCurrentMonth && viewMode === 'month' && "bg-muted/20"
                )}
              >
                <div
                  className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mb-2",
                    today && "bg-primary text-primary-foreground glow-primary",
                    !today && isCurrentMonth && "text-foreground",
                    !isCurrentMonth && "text-muted-foreground/50"
                  )}
                >
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {dayTasks.slice(0, viewMode === 'week' ? 10 : 3).map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs",
                        "bg-muted/50 hover:bg-muted transition-colors cursor-pointer",
                        task.status === 'completed' && "opacity-60"
                      )}
                      onClick={() => {
                        const nextStatus: Record<TaskStatus, TaskStatus> = {
                          pending: 'in_progress',
                          in_progress: 'completed',
                          completed: 'pending',
                        };
                        onUpdateStatus(task.id, nextStatus[task.status]);
                      }}
                    >
                      <span className={STATUS_COLORS[task.status]}>
                        {STATUS_ICONS[task.status]}
                      </span>
                      <span className={cn(
                        "truncate flex-1",
                        task.status === 'completed' && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </span>
                      {task.tag && (
                        <span className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          TAG_COLORS[task.tag].bg.replace('/20', '')
                        )} />
                      )}
                    </div>
                  ))}
                  {dayTasks.length > (viewMode === 'week' ? 10 : 3) && (
                    <div className="text-xs text-muted-foreground px-2">
                      +{dayTasks.length - (viewMode === 'week' ? 10 : 3)} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
