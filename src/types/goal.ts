export type GoalStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export type GoalArea = 'career' | 'health' | 'finance' | 'relationships' | 'personal';

export type GoalType = 'project' | 'habit' | 'learning' | 'milestone';

export type GoalEnergy = 'high' | 'medium' | 'low';

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'Ativa',
  paused: 'Pausada',
  completed: 'Concluída',
  abandoned: 'Abandonada',
};

export const GOAL_STATUS_ICONS: Record<GoalStatus, string> = {
  active: '🎯',
  paused: '⏸️',
  completed: '✅',
  abandoned: '🚫',
};

export const GOAL_AREA_LABELS: Record<GoalArea, string> = {
  career: 'Carreira',
  health: 'Saúde',
  finance: 'Finanças',
  relationships: 'Relacionamentos',
  personal: 'Pessoal',
};

export const GOAL_AREA_COLORS: Record<GoalArea, { bg: string; text: string }> = {
  career: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  health: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  finance: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  relationships: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  personal: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
};

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  project: 'Projeto',
  habit: 'Hábito',
  learning: 'Aprendizado',
  milestone: 'Marco',
};

export const GOAL_ENERGY_LABELS: Record<GoalEnergy, string> = {
  high: 'Alta Energia',
  medium: 'Média Energia',
  low: 'Baixa Energia',
};

export const GOAL_ENERGY_ICONS: Record<GoalEnergy, string> = {
  high: '⚡',
  medium: '🔋',
  low: '🌙',
};

export const MAX_ACTIVE_GOALS = 5;

export interface Goal {
  id: string;
  title: string;
  description?: string;
  quarter: string; // Format: "2025-Q1"
  status: GoalStatus;
  area: GoalArea;
  type: GoalType;
  energy: GoalEnergy;
  linkedTaskIds: string[];
  progress: number; // 0-100
  abandonReason?: string;
  createdAt: string;
  updatedAt: string;
}

export function getCurrentQuarter(): string {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${quarter}`;
}

export function getQuarterLabel(quarter: string): string {
  const [year, q] = quarter.split('-');
  return `${q} ${year}`;
}

export function getQuarterOptions(): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const quarters: string[] = [];
  
  // Previous year Q4
  quarters.push(`${currentYear - 1}-Q4`);
  
  // Current year all quarters
  for (let q = 1; q <= 4; q++) {
    quarters.push(`${currentYear}-Q${q}`);
  }
  
  // Next year Q1
  quarters.push(`${currentYear + 1}-Q1`);
  
  return quarters;
}
