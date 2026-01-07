export type ExpenseCategory = 
  | 'housing'      // 🏠 Moradia
  | 'food'         // 🍔 Alimentação
  | 'transport'    // 🚗 Transporte
  | 'leisure'      // 🎮 Lazer
  | 'health'       // 💊 Saúde
  | 'work'         // 💼 Trabalho
  | 'education'    // 📚 Educação
  | 'shopping'     // 🛒 Compras
  | 'other';       // 📦 Outros

export type ExpenseType = 'fixed' | 'installment' | 'single';

export interface Expense {
  id: string;
  name: string;
  amount: number; // valor em centavos
  category: ExpenseCategory;
  type: ExpenseType;
  
  // Para parcelamentos
  installmentCurrent?: number;
  installmentTotal?: number;
  installmentGroupId?: string;
  
  // Para fixas
  fixedGroupId?: string;
  
  month: string; // "2024-12"
  createdAt: Date;
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; icon: string }> = {
  housing: { label: 'Moradia', icon: '🏠' },
  food: { label: 'Alimentação', icon: '🍔' },
  transport: { label: 'Transporte', icon: '🚗' },
  leisure: { label: 'Lazer', icon: '🎮' },
  health: { label: 'Saúde', icon: '💊' },
  work: { label: 'Trabalho', icon: '💼' },
  education: { label: 'Educação', icon: '📚' },
  shopping: { label: 'Compras', icon: '🛒' },
  other: { label: 'Outros', icon: '📦' },
};

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  fixed: 'Despesas Fixas',
  installment: 'Parcelamentos',
  single: 'Despesas Únicas',
};

// Utility functions
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthLabel(month: string): { short: string; year: string; full: string } {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  const shortMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const fullMonths = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  return {
    short: shortMonths[date.getMonth()],
    year: year,
    full: `${fullMonths[date.getMonth()]} de ${year}`,
  };
}

export function addMonths(month: string, count: number): string {
  const [year, monthNum] = month.split('-').map(Number);
  const date = new Date(year, monthNum - 1 + count);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthRange(currentMonth: string, pastCount: number = 3, futureCount: number = 6): string[] {
  const months: string[] = [];
  for (let i = -pastCount; i <= futureCount; i++) {
    months.push(addMonths(currentMonth, i));
  }
  return months;
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}
