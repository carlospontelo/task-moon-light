import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useExpenses } from '@/hooks/useExpenses';
import { TabNavigation } from '@/components/TabNavigation';
import { TodoView } from '@/components/TodoView';
import { CalendarView } from '@/components/CalendarView';
import { GoalsView } from '@/components/goals/GoalsView';
import { FinancesView } from '@/components/finances/FinancesView';
import { CheckSquare } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'todo' | 'calendar' | 'goals' | 'finances'>('todo');
  const { tasks, addTask, updateTaskStatus, deleteTask, getTasksByDate } = useTasks();
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByMonthAndType,
    getCategoryBreakdown,
    getTypeTotal,
  } = useExpenses();
  const {
    goals,
    addGoal,
    updateGoalStatus,
    updateGoal,
    deleteGoal,
    linkTask,
    unlinkTask,
    getLinkedTasks,
    getUnlinkedTasks,
    getActiveGoalsCount,
  } = useGoals(tasks);

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle grid background */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Logo / Brand */}
        <header className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">TaskFlow</h2>
            <p className="text-xs text-muted-foreground font-mono">Organize seu dia</p>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="mb-8">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content */}
        <main>
          {activeTab === 'todo' && (
            <TodoView
              tasks={tasks}
              onAdd={addTask}
              onUpdateStatus={updateTaskStatus}
              onDelete={deleteTask}
            />
          )}
          {activeTab === 'calendar' && (
            <CalendarView
              tasks={tasks}
              getTasksByDate={getTasksByDate}
              onUpdateStatus={updateTaskStatus}
            />
          )}
          {activeTab === 'goals' && (
            <GoalsView
              goals={goals}
              tasks={tasks}
              addGoal={addGoal}
              updateGoalStatus={updateGoalStatus}
              updateGoal={updateGoal}
              deleteGoal={deleteGoal}
              linkTask={linkTask}
              unlinkTask={unlinkTask}
              getLinkedTasks={getLinkedTasks}
              getUnlinkedTasks={getUnlinkedTasks}
              getActiveGoalsCount={getActiveGoalsCount}
            />
          )}
          {activeTab === 'finances' && (
            <FinancesView
              expenses={expenses}
              addExpense={addExpense}
              updateExpense={updateExpense}
              deleteExpense={deleteExpense}
              getExpensesByMonthAndType={getExpensesByMonthAndType}
              getCategoryBreakdown={getCategoryBreakdown}
              getTypeTotal={getTypeTotal}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border">
          <p className="text-center text-xs text-muted-foreground font-mono">
            TaskFlow • {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
