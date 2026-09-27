import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getQuarterLabel, getQuarterOptions } from '@/types/goal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuarterSelectorProps {
  value: string;
  onChange: (quarter: string) => void;
}

export function QuarterSelector({ value, onChange }: QuarterSelectorProps) {
  const quarters = getQuarterOptions();
  const currentIndex = quarters.indexOf(value);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      onChange(quarters[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (currentIndex < quarters.length - 1) {
      onChange(quarters[currentIndex + 1]);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={goToPrevious}
        disabled={currentIndex <= 0}
        aria-label="Trimestre anterior"
        className="text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="num w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {quarters.map((quarter) => (
            <SelectItem key={quarter} value={quarter}>
              {getQuarterLabel(quarter)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={goToNext}
        disabled={currentIndex >= quarters.length - 1}
        aria-label="Próximo trimestre"
        className="text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
