import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { TabNavigation, TabType } from '@/components/TabNavigation';
import { TodoView } from '@/components/TodoView';
import { GoalsView } from '@/components/goals/GoalsView';
import { FinancesView } from '@/components/finances/FinancesView';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { AuthPage } from '@/components/auth/AuthPage';
import { MigrationScreen, hasLocalData, isMigrationDone } from '@/components/auth/MigrationScreen';
import { SettingsDialog, SettingsButton } from '@/components/settings/SettingsDialog';
import { CheckSquare, Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const [showMigration, setShowMigration] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);
  const { tasks, addTask, updateTaskStatus, updateTask, moveTask, togglePin, deleteTask, reorderTasks } = useTasks();
  const {
    expenses, addExpense, updateExpense, deleteExpense, togglePaid,
    getExpensesByMonthAndType, getCategoryBreakdown, getTypeTotal,
  } = useExpenses();
  const {
    goals, addGoal, updateGoalStatus, updateGoal, deleteGoal,
    linkTask, unlinkTask, getLinkedTasks, getUnlinkedTasks, getActiveGoalsCount,
  } = useGoals(tasks);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const localDataExists = hasLocalData();
    return (
      <AuthPage
        hasLocalData={localDataExists}
        onAuthSuccess={(isNewAccount) => {
          if (isNewAccount && localDataExists) {
            setShowMigration(true);
          }
        }}
      />
    );
  }

  if (showMigration && !migrationDone) {
    return (
      <MigrationScreen
        onComplete={() => {
          setShowMigration(false);
          setMigrationDone(true);
          window.location.reload();
        }}
      />
    );
  }

  if (hasLocalData() && !isMigrationDone(user.id) && !migrationDone) {
    return (
      <MigrationScreen
        onComplete={() => {
          setMigrationDone(true);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
              <CheckSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">TaskFlow</h2>
              <p className="text-xs text-muted-foreground font-mono">Organize seu dia</p>
            </div>
          </div>
          <SettingsButton onClick={() => setSettingsOpen(true)} />
        </header>

        <div className="mb-8">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <main>
          {activeTab === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              goals={goals}
              onUpdateTaskStatus={updateTaskStatus}
              onNavigateToTasks={() => setActiveTab('todo')}
              getCategoryBreakdown={getCategoryBreakdown}
            />
          )}
          {activeTab === 'todo' && (
            <TodoView
              tasks={tasks}
              onAdd={addTask}
              onUpdateStatus={updateTaskStatus}
              onUpdateTask={updateTask}
              onMoveTask={moveTask}
              onDelete={deleteTask}
              onReorderTasks={reorderTasks}
            />
          )}
          {activeTab === 'goals' && (
            <GoalsView goals={goals} tasks={tasks} addGoal={addGoal} updateGoalStatus={updateGoalStatus}
              updateGoal={updateGoal} deleteGoal={deleteGoal} linkTask={linkTask} unlinkTask={unlinkTask}
              getLinkedTasks={getLinkedTasks} getUnlinkedTasks={getUnlinkedTasks} getActiveGoalsCount={getActiveGoalsCount} />
          )}
          {activeTab === 'finances' && (
            <FinancesView expenses={expenses} addExpense={addExpense} updateExpense={updateExpense}
              deleteExpense={deleteExpense} togglePaid={togglePaid} getExpensesByMonthAndType={getExpensesByMonthAndType}
              getCategoryBreakdown={getCategoryBreakdown} getTypeTotal={getTypeTotal} />
          )}
        </main>

        <footer className="mt-16 pt-8 border-t border-border">
          <p className="text-center text-xs text-muted-foreground font-mono">
            TaskFlow • {new Date().getFullYear()}
          </p>
        </footer>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Index;
