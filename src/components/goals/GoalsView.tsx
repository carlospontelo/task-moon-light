import { useState, memo } from 'react';
import { Goal, GoalStatus, getCurrentQuarter, MAX_ACTIVE_GOALS } from '@/types/goal';
import { Task } from '@/types/task';
import { QuarterSelector } from './QuarterSelector';
import { GoalStatusGroup } from './GoalStatusGroup';
import { GoalForm } from './GoalForm';
import { LinkTasksDialog } from './LinkTasksDialog';
import { Button } from '@/components/ui/button';
import { Plus, Target } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

interface GoalsViewProps {
  goals: Goal[];
  tasks: Task[];
  addGoal: (
    title: string,
    area: any,
    type: any,
    energy: any,
    quarter: string,
    description?: string
  ) => boolean | Promise<boolean>;
  updateGoalStatus: (id: string, status: GoalStatus, reason?: string) => void;
  updateGoal: (id: string, updates: any) => void;
  deleteGoal: (id: string) => void;
  linkTask: (goalId: string, taskId: string) => void;
  unlinkTask: (goalId: string, taskId: string) => void;
  getLinkedTasks: (goalId: string) => Task[];
  getUnlinkedTasks: () => Task[];
  getActiveGoalsCount: (quarter: string) => number;
}

export const GoalsView = memo(function GoalsView({
  goals,
  tasks,
  addGoal,
  updateGoalStatus,
  updateGoal,
  deleteGoal,
  linkTask,
  unlinkTask,
  getLinkedTasks,
  getUnlinkedTasks,
  getActiveGoalsCount,
}: GoalsViewProps) {
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [linkingGoal, setLinkingGoal] = useState<Goal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [abandoningGoalId, setAbandoningGoalId] = useState<string | null>(null);
  const [abandonReason, setAbandonReason] = useState('');

  const quarterGoals = goals.filter(g => g.quarter === selectedQuarter);
  const activeGoals = quarterGoals.filter(g => g.status === 'active');
  const pausedGoals = quarterGoals.filter(g => g.status === 'paused');
  const completedGoals = quarterGoals.filter(g => g.status === 'completed');
  const abandonedGoals = quarterGoals.filter(g => g.status === 'abandoned');

  const handleStatusChange = (goalId: string, status: GoalStatus, reason?: string) => {
    if (status === 'abandoned') {
      setAbandoningGoalId(goalId);
    } else {
      updateGoalStatus(goalId, status, reason);
    }
  };

  const handleConfirmAbandon = () => {
    if (abandoningGoalId) {
      updateGoalStatus(abandoningGoalId, 'abandoned', abandonReason || undefined);
      setAbandoningGoalId(null);
      setAbandonReason('');
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <QuarterSelector 
            value={selectedQuarter} 
            onChange={setSelectedQuarter} 
          />
          <span className="text-sm text-muted-foreground">
            {activeGoals.length} de {MAX_ACTIVE_GOALS} metas ativas
          </span>
        </div>
        
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {/* Goals List */}
      {quarterGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhuma meta neste trimestre
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Defina suas metas estratégicas para manter o foco no que realmente importa.
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar primeira meta
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <GoalStatusGroup
            status="active"
            goals={activeGoals}
            getLinkedTasks={getLinkedTasks}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={setDeletingGoalId}
            onManageLinks={setLinkingGoal}
            defaultOpen={true}
          />
          
          <GoalStatusGroup
            status="paused"
            goals={pausedGoals}
            getLinkedTasks={getLinkedTasks}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={setDeletingGoalId}
            onManageLinks={setLinkingGoal}
            defaultOpen={false}
          />
          
          <GoalStatusGroup
            status="completed"
            goals={completedGoals}
            getLinkedTasks={getLinkedTasks}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={setDeletingGoalId}
            onManageLinks={setLinkingGoal}
            defaultOpen={false}
          />
          
          <GoalStatusGroup
            status="abandoned"
            goals={abandonedGoals}
            getLinkedTasks={getLinkedTasks}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={setDeletingGoalId}
            onManageLinks={setLinkingGoal}
            defaultOpen={false}
          />
        </div>
      )}

      {/* Goal Form Dialog */}
      <GoalForm
        open={showForm}
        onOpenChange={handleFormClose}
        onSubmit={addGoal}
        currentQuarter={selectedQuarter}
        activeGoalsCount={getActiveGoalsCount(selectedQuarter)}
        editingGoal={editingGoal || undefined}
        onUpdate={editingGoal ? (updates) => updateGoal(editingGoal.id, updates) : undefined}
      />

      {/* Link Tasks Dialog */}
      {linkingGoal && (
        <LinkTasksDialog
          open={!!linkingGoal}
          onOpenChange={() => setLinkingGoal(null)}
          goal={linkingGoal}
          linkedTasks={getLinkedTasks(linkingGoal.id)}
          unlinkedTasks={getUnlinkedTasks()}
          onLink={(taskId) => linkTask(linkingGoal.id, taskId)}
          onUnlink={(taskId) => unlinkTask(linkingGoal.id, taskId)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingGoalId} onOpenChange={() => setDeletingGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A meta será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingGoalId) {
                  deleteGoal(deletingGoalId);
                  setDeletingGoalId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Abandon Confirmation */}
      <AlertDialog open={!!abandoningGoalId} onOpenChange={() => setAbandoningGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abandonar meta?</AlertDialogTitle>
            <AlertDialogDescription>
              Abandonar uma meta é uma decisão consciente. Você pode registrar o motivo para refletir depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Motivo (opcional)"
            value={abandonReason}
            onChange={(e) => setAbandonReason(e.target.value)}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAbandonReason('')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAbandon}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
