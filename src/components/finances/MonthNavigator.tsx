import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getMonthRange, getMonthLabel, getCurrentMonth } from '@/types/expense';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthNavigatorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export function MonthNavigator({ selectedMonth, onMonthChange }: MonthNavigatorProps) {
  const currentMonth = getCurrentMonth();
  const months = getMonthRange(currentMonth, 3, 6);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to selected month on mount
    const container = scrollRef.current;
    if (container) {
      const selectedElement = container.querySelector(`[data-month="${selectedMonth}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -120 : 120;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex min-w-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => scroll('left')}
        aria-label="Rolar meses para trás"
        className="shrink-0 text-muted-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={scrollRef}
        className="flex min-w-0 flex-1 gap-1 overflow-x-auto scrollbar-hide py-1 px-1 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {months.map((month) => {
          const { short, year } = getMonthLabel(month);
          const isSelected = month === selectedMonth;
          const isCurrent = month === currentMonth;
          const isPast = month < currentMonth;

          return (
            <button
              key={month}
              data-month={month}
              onClick={() => onMonthChange(month)}
              className={cn(
                "relative flex flex-col items-center px-3 py-1.5 rounded-lg transition-colors min-w-[56px] cursor-pointer",
                isSelected 
                  ? "bg-secondary text-foreground border border-border-strong" 
                  : "border border-transparent hover:bg-secondary",
                isPast && !isSelected && "text-subtle",
                isSelected && "after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-5 after:-translate-x-1/2 after:rounded-full after:bg-primary"
              )}
            >
              <span className={cn(
                "text-sm font-medium capitalize",
                isCurrent && !isSelected && "text-primary"
              )}>
                {short}
              </span>
              <span className={cn(
                "num text-[11px]",
                isSelected ? "text-muted-foreground" : "text-subtle"
              )}>
                {year}
              </span>
            </button>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => scroll('right')}
        aria-label="Rolar meses para frente"
        className="shrink-0 text-muted-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
