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
    <div className="relative flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => scroll('left')}
        className="shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-hide py-2 px-1"
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
                "flex flex-col items-center px-4 py-2 rounded-lg transition-all min-w-[60px]",
                isSelected 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-secondary",
                isPast && !isSelected && "text-muted-foreground",
                isCurrent && !isSelected && "ring-1 ring-primary/30"
              )}
            >
              <span className={cn(
                "text-sm font-semibold",
                isSelected ? "text-primary-foreground" : ""
              )}>
                {short}
              </span>
              <span className={cn(
                "text-xs",
                isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
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
        className="shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
