import { useCallback, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { MobileHeader, MobileTabBar } from './MobileNav';
import type { TabType } from './nav-items';

const COLLAPSED_KEY = 'sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

interface AppShellProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  userEmail?: string | null;
  children: ReactNode;
}

export function AppShell({ activeTab, onTabChange, onOpenSettings, onSignOut, userEmail, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        // Storage unavailable (private mode etc.) — keep in-memory state only.
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onOpenSettings={onOpenSettings}
        onSignOut={onSignOut}
        userEmail={userEmail}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <MobileHeader onOpenSettings={onOpenSettings} />

      <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-16' : 'lg:pl-60')}>
        <main className="mx-auto w-full max-w-[1400px] px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </main>
      </div>

      <MobileTabBar activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
