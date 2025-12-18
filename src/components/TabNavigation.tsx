import { Button } from '@/components/ui/button';
import { ListTodo, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabNavigationProps {
  activeTab: 'todo' | 'calendar';
  onTabChange: (tab: 'todo' | 'calendar') => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="flex items-center gap-1 p-1 bg-secondary rounded-xl">
      <Button
        variant="ghost"
        onClick={() => onTabChange('todo')}
        className={cn(
          "flex-1 h-10 gap-2 rounded-lg transition-all duration-200",
          activeTab === 'todo' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <ListTodo className="h-4 w-4" />
        <span>Tarefas</span>
      </Button>
      <Button
        variant="ghost"
        onClick={() => onTabChange('calendar')}
        className={cn(
          "flex-1 h-10 gap-2 rounded-lg transition-all duration-200",
          activeTab === 'calendar' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Calendar className="h-4 w-4" />
        <span>Calendário</span>
      </Button>
    </nav>
  );
}
