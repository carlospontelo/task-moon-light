import { useMemo, useState, memo, type ReactNode } from 'react';
import {
  DndContext, DragEndEvent, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { Task, TaskStatus, BoardGroup } from '@/types/task';
import { AddTaskForm } from './AddTaskForm';
import { EditTaskDialog } from './EditTaskDialog';
import { PageHeader } from './layout/PageHeader';
import { TaskListItem, type TaskActions } from './tasks/TaskListItem';
import { FocusSection, FOCUS_DROP_ID } from './tasks/FocusSection';
import { CollapsibleSection } from './tasks/CollapsibleSection';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { classifyTasks, isFocus, isSomeday, todayKey, FOCUS_LIMIT, FOCUS_LIMIT_MESSAGE } from '@/lib/task-sections';

interface TodoViewProps {
  tasks: Task[];
  onAdd: (title: string, options?: { date?: string; tag?: string; boardGroup?: BoardGroup }) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateTask: (id: string, updates: { date?: string; tag?: string | null; boardGroup?: BoardGroup }) => void;
  onMoveTask: (id: string, group: BoardGroup) => void;
  onDelete: (id: string) => void;
  onReorderTasks: (reordered: { id: string; sortOrder: number }[]) => void;
  /** Tasks linked to goals: kept by "Limpar concluídas" so goal progress stays correct. */
  protectedTaskIds?: string[];
}

const LIST_DROP_ID = 'list-zone';

function ListDropZone({ children }: { children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id: LIST_DROP_ID });
  return <div ref={setNodeRef} className="space-y-4">{children}</div>;
}

function SectionLabel({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'danger' }) {
  return (
    <h3 className={tone === 'danger'
      ? 'px-2 pb-1 text-xs font-medium uppercase tracking-[0.06em] text-destructive'
      : 'px-2 pb-1 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground'}
    >
      {children}
    </h3>
  );
}

export const TodoView = memo(function TodoView({
  tasks, onAdd, onUpdateStatus, onUpdateTask, onMoveTask, onDelete, onReorderTasks, protectedTaskIds = [],
}: TodoViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const isMobile = useIsMobile();
  const today = todayKey();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const sections = useMemo(() => classifyTasks(tasks, today), [tasks, today]);
  const { focus, overdue, main, upcoming, someday, completed } = sections;
  const focusIds = useMemo(() => new Set(focus.map(t => t.id)), [focus]);
  const pendingCount = focus.length + overdue.length + main.length + upcoming.length;
  const protectedSet = useMemo(() => new Set(protectedTaskIds), [protectedTaskIds]);
  const clearable = completed.filter(t => !protectedSet.has(t.id));
  const keptCount = completed.length - clearable.length;

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  const focusTask = (task: Task) => {
    if (focus.length >= FOCUS_LIMIT) {
      toast(FOCUS_LIMIT_MESSAGE);
      return;
    }
    onMoveTask(task.id, 'pinned');
  };

  const actions: TaskActions = {
    onUpdateStatus,
    onEdit: setEditingTask,
    onDelete,
    onToggleFocus: (task) => (isFocus(task) ? onMoveTask(task.id, 'today') : focusTask(task)),
    onToggleSomeday: (task) => onMoveTask(task.id, isSomeday(task) ? 'today' : 'standby'),
  };

  const reorder = (list: Task[], fromId: string, toId: string) => {
    const oldIndex = list.findIndex(t => t.id === fromId);
    const newIndex = list.findIndex(t => t.id === toId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    onReorderTasks(arrayMove(list, oldIndex, newIndex).map((t, i) => ({ id: t.id, sortOrder: i })));
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const overId = over.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const fromFocus = focusIds.has(taskId);
    const toFocus = overId === FOCUS_DROP_ID || focusIds.has(overId);

    if (toFocus) {
      if (fromFocus) reorder(focus, taskId, overId);
      else focusTask(task);
      return;
    }

    if (fromFocus) {
      // Dragged out of focus into the list.
      onMoveTask(taskId, 'today');
      return;
    }

    // Manual order only applies to the default list; dated sections are sorted by date.
    if (main.some(t => t.id === taskId) && main.some(t => t.id === overId)) {
      reorder(main, taskId, overId);
    }
  };

  const renderList = (list: Task[]) => (
    <SortableContext items={list.map(t => t.id)} strategy={verticalListSortingStrategy}>
      <div className="space-y-0.5">
        {list.map(task => (
          <TaskListItem key={task.id} task={task} dragDisabled={isMobile} today={today} {...actions} />
        ))}
      </div>
    </SortableContext>
  );

  const listEmpty = overdue.length + main.length + upcoming.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <PageHeader
        title="Tarefas"
        description={
          <>
            <span className="num text-foreground">{pendingCount}</span> {pendingCount === 1 ? 'pendente' : 'pendentes'}
          </>
        }
      />

      <AddTaskForm onAdd={onAdd} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
        <FocusSection
          tasks={focus}
          isDraggingIn={!!activeId && !focusIds.has(activeId)}
          dragDisabled={isMobile}
          today={today}
          {...actions}
        />

        <ListDropZone>
          {overdue.length > 0 && (
            <div>
              <SectionLabel tone="danger">Atrasadas</SectionLabel>
              {renderList(overdue)}
            </div>
          )}

          {main.length > 0 && renderList(main)}

          {upcoming.length > 0 && (
            <div>
              <SectionLabel>Próximas</SectionLabel>
              {renderList(upcoming)}
            </div>
          )}

          {listEmpty && (
            <div className="rounded-xl border border-dashed border-border-strong px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">Nada pendente</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Escreva uma tarefa no campo acima e pressione Enter.
              </p>
            </div>
          )}
        </ListDropZone>

        <div className="space-y-2">
          {someday.length > 0 && (
            <CollapsibleSection title="Algum dia" count={someday.length}>
              <SortableContext items={[]}>
                <div className="space-y-0.5">
                  {someday.map(task => (
                    <TaskListItem key={task.id} task={task} dragDisabled today={today} {...actions} />
                  ))}
                </div>
              </SortableContext>
            </CollapsibleSection>
          )}

          {completed.length > 0 && (
            <CollapsibleSection
              title="Concluídas"
              count={completed.length}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-subtle hover:text-destructive"
                  onClick={() => setConfirmClear(true)}
                  disabled={clearable.length === 0}
                >
                  Limpar concluídas
                </Button>
              }
            >
              <SortableContext items={[]}>
                <div className="space-y-0.5">
                  {completed.map(task => (
                    <TaskListItem key={task.id} task={task} dragDisabled today={today} {...actions} />
                  ))}
                </div>
              </SortableContext>
            </CollapsibleSection>
          )}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rounded-lg border border-primary bg-surface-3 px-3 py-2.5">
              <p className="text-sm text-foreground">{activeTask.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar {clearable.length} {clearable.length === 1 ? 'tarefa concluída' : 'tarefas concluídas'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Elas serão excluídas de vez.
              {keptCount > 0 && ` ${keptCount} ${keptCount === 1 ? 'tarefa vinculada' : 'tarefas vinculadas'} a metas ${keptCount === 1 ? 'será mantida' : 'serão mantidas'} para não alterar o progresso.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearable.forEach(t => onDelete(t.id))}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditTaskDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
        focusFull={focus.length >= FOCUS_LIMIT}
        onSave={(id, updates) => {
          const { status, ...rest } = updates;
          onUpdateTask(id, rest);
          if (status) onUpdateStatus(id, status);
        }}
      />
    </div>
  );
});
