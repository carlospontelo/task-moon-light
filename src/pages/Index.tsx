import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useExpenses } from '@/hooks/useExpenses';
import { useFinanceEntries } from '@/hooks/useFinanceEntries';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import type { TabType } from '@/components/layout/nav-items';
import { TodoView } from '@/components/TodoView';
import { GoalsView } from '@/components/goals/GoalsView';
import { FinancesView } from '@/components/finances/FinancesView';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { AuthPage } from '@/components/auth/AuthPage';
import { MigrationScreen, hasLocalData, isMigrationDone } from '@/components/auth/MigrationScreen';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [showMigration, setShowMigration] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);
  const { tasks, hasCompletionTracking, addTask, updateTaskStatus, updateTask, moveTask, togglePin, deleteTask, reorderTasks } = useTasks();
  const {
    expenses, addExpense, updateExpense, deleteExpense, togglePaid, isPaid,
    getExpensesByMonthAndType, getCategoryBreakdown, getTypeTotal,
  } = useExpenses();
  const {
    goals, addGoal, updateGoalStatus, updateGoal, deleteGoal,
    linkTask, unlinkTask, getLinkedTasks, getUnlinkedTasks, getActiveGoalsCount,
  } = useGoals(tasks);
  const finance = useFinanceEntries();

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
    <>
      <AppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setSettingsOpen(true)}
        onSignOut={signOut}
        userEmail={user.email}
      >
        {activeTab === 'dashboard' && (
          <DashboardView
            tasks={tasks}
            goals={goals}
            onUpdateTaskStatus={updateTaskStatus}
            onNavigateToTasks={() => setActiveTab('todo')}
            getCategoryBreakdown={getCategoryBreakdown}
            finance={finance}
            onNavigateToFinances={() => setActiveTab('finances')}
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
            hasCompletionTracking={hasCompletionTracking}
          />
        )}
        {activeTab === 'goals' && (
          <GoalsView goals={goals} tasks={tasks} addGoal={addGoal} updateGoalStatus={updateGoalStatus}
            updateGoal={updateGoal} deleteGoal={deleteGoal} linkTask={linkTask} unlinkTask={unlinkTask}
            getLinkedTasks={getLinkedTasks} getUnlinkedTasks={getUnlinkedTasks} getActiveGoalsCount={getActiveGoalsCount} />
        )}
        {activeTab === 'finances' && (
          <FinancesView expenses={expenses} addExpense={addExpense} updateExpense={updateExpense}
            deleteExpense={deleteExpense} togglePaid={togglePaid} isPaid={isPaid} getExpensesByMonthAndType={getExpensesByMonthAndType}
            getCategoryBreakdown={getCategoryBreakdown} getTypeTotal={getTypeTotal} finance={finance} />
        )}
      </AppShell>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};

export default Index;
