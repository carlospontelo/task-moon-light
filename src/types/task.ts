export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type BoardGroup = 'pinned' | 'today' | 'this_week' | 'standby';

export const BOARD_GROUP_LABELS: Record<BoardGroup, string> = {
  pinned: 'Fixadas',
  today: 'Hoje',
  this_week: 'Esta Semana',
  standby: 'Standby',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
};

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  tag?: string;
  date: string;
  createdAt: string;
  pinned: boolean;
  boardGroup: BoardGroup;
  sortOrder: number;
}
