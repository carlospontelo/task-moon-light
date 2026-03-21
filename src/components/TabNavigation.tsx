import { Button } from '@/components/ui/button';
import { LayoutDashboard, ListTodo, Target, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabType = 'dashboard' | 'todo' | 'goals' | 'finances';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'todo', label: 'Tarefas', icon: ListTodo },
  { id: 'goals', label: 'Metas', icon: Target },
  { id: 'finances', label: 'Financeiro', icon: Wallet },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="flex items-center gap-1 p-1 bg-secondary rounded-xl">
      {tabs.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant="ghost"
          onClick={() => onTabChange(id)}
          className={cn(
            "flex-1 h-10 gap-2 rounded-lg transition-all duration-200",
            activeTab === id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </nav>
  );
}
