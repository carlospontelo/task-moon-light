import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark } from './BrandMark';
import { NAV_ITEMS, type TabType } from './nav-items';

interface MobileHeaderProps {
  onOpenSettings: () => void;
}

export function MobileHeader({ onOpenSettings }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
      <BrandMark showText={false} className="gap-2" />
      <button
        onClick={onOpenSettings}
        aria-label="Configurações"
        className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Settings className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </header>
  );
}

interface MobileTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background pb-safe lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map(({ id, shortLabel, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <li key={id}>
              <button
                onClick={() => onTabChange(id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] transition-colors',
                  active ? 'text-foreground' : 'text-subtle'
                )}
              >
                {active && <span className="absolute top-0 h-[2px] w-8 rounded-full bg-primary" />}
                <Icon className={cn('h-5 w-5', active && 'text-primary')} strokeWidth={1.5} />
                <span>{shortLabel}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
