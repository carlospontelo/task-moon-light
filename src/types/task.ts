export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type TaskTag = 'work' | 'personal' | 'urgent' | 'study' | 'health';

export const TAG_COLORS: Record<TaskTag, { bg: string; text: string }> = {
  work: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  personal: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  urgent: { bg: 'bg-red-500/20', text: 'text-red-400' },
  study: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  health: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
};

export const TAG_LABELS: Record<TaskTag, string> = {
  work: 'Trabalho',
  personal: 'Pessoal',
  urgent: 'Urgente',
  study: 'Estudo',
  health: 'Saúde',
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
  tag?: TaskTag;
  date: string;
  createdAt: string;
}
