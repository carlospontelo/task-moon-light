import { useState } from 'react';
import { Goal, GOAL_STATUS_ICONS, GOAL_STATUS_LABELS, GoalStatus } from '@/types/goal';
import { Task } from '@/types/task';
import { GoalCard } from './GoalCard';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalStatusGroupProps {
  status: GoalStatus;
  goals: Goal[];
  getLinkedTasks: (goalId: string) => Task[];
  onStatusChange: (goalId: string, status: GoalStatus, reason?: string) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onManageLinks: (goal: Goal) => void;
  defaultOpen?: boolean;
}

export function GoalStatusGroup({
  status,
  goals,
  getLinkedTasks,
  onStatusChange,
  onEdit,
  onDelete,
  onManageLinks,
  defaultOpen = true,
}: GoalStatusGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (goals.length === 0) return null;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span>{GOAL_STATUS_ICONS[status]}</span>
        <span>{GOAL_STATUS_LABELS[status]}</span>
        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
          {goals.length}
        </span>
      </button>

      <div
        className={cn(
          "space-y-3 overflow-hidden transition-all duration-200",
          isOpen ? "opacity-100" : "h-0 opacity-0"
        )}
      >
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            linkedTasks={getLinkedTasks(goal.id)}
            onStatusChange={(newStatus, reason) => onStatusChange(goal.id, newStatus, reason)}
            onEdit={() => onEdit(goal)}
            onDelete={() => onDelete(goal.id)}
            onManageLinks={() => onManageLinks(goal)}
          />
        ))}
      </div>
    </div>
  );
}
