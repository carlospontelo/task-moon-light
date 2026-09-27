import { LayoutDashboard, ListTodo, Target, Wallet, type LucideIcon } from 'lucide-react';

export type TabType = 'dashboard' | 'todo' | 'goals' | 'finances';

export interface NavItem {
  id: TabType;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Geral',
    items: [
      { id: 'dashboard', label: 'Dashboard', shortLabel: 'Início', icon: LayoutDashboard },
      { id: 'todo', label: 'Tarefas', shortLabel: 'Tarefas', icon: ListTodo },
      { id: 'goals', label: 'Metas', shortLabel: 'Metas', icon: Target },
    ],
  },
  {
    title: 'Finanças',
    items: [{ id: 'finances', label: 'Financeiro', shortLabel: 'Finanças', icon: Wallet }],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap(s => s.items);
