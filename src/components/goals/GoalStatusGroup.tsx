import { useState } from 'react';
import { Goal, GOAL_STATUS_LABELS, GoalStatus } from '@/types/goal';
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
        aria-expanded={isOpen}
        className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground hover:text-foreground transition-colors w-full cursor-pointer"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        <span>{GOAL_STATUS_LABELS[status]}</span>
        <span className="num text-subtle">
          {goals.length}
        </span>
      </button>

      <div
        className={cn(
          "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 transition-opacity duration-200",
          isOpen ? "opacity-100" : "hidden"
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
