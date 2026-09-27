import { BatteryMedium, Moon, Zap, type LucideProps } from 'lucide-react';
import type { GoalEnergy } from '@/types/goal';

const ICONS = { high: Zap, medium: BatteryMedium, low: Moon } as const;

/** Lucide icon for a goal's energy level (replaces the emoji in the UI; the constants stay as they are). */
export function EnergyIcon({ energy, ...props }: { energy: GoalEnergy } & LucideProps) {
  const Icon = ICONS[energy];
  return <Icon aria-hidden strokeWidth={1.5} {...props} />;
}
