import type { ReactNode } from 'react';
import { LogOut, PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { BrandMark } from './BrandMark';
import { NAV_SECTIONS, type TabType } from './nav-items';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  userEmail?: string | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const ICON_PROPS = { className: 'h-[18px] w-[18px] shrink-0', strokeWidth: 1.5 };

function WithTooltip({ show, label, children }: { show: boolean; label: string; children: ReactNode }) {
  if (!show) return <>{children}</>;
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>{label}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar({
  activeTab,
  onTabChange,
  onOpenSettings,
  onSignOut,
  userEmail,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const itemBase =
    'relative flex h-9 w-full items-center gap-3 rounded-lg text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-background transition-[width] duration-200 lg:flex',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand + collapse toggle */}
      <div className={cn('flex h-16 items-center border-b border-border', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
        {!collapsed && <BrandMark />}
        <WithTooltip show={collapsed} label="Expandir menu">
          <button
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
          >
            {collapsed ? <PanelLeftOpen {...ICON_PROPS} /> : <PanelLeftClose {...ICON_PROPS} />}
          </button>
        </WithTooltip>
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 overflow-y-auto py-5', collapsed ? 'px-2' : 'px-3')}>
        {NAV_SECTIONS.map((section, i) => (
          <div key={section.title} className={cn(i > 0 && 'mt-6')}>
            {collapsed ? (
              i > 0 && <div className="mx-2 mb-3 border-t border-border" />
            ) : (
              <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-subtle">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <li key={id}>
                    <WithTooltip show={collapsed} label={label}>
                      <button
                        onClick={() => onTabChange(id)}
                        aria-current={active ? 'page' : undefined}
                        aria-label={collapsed ? label : undefined}
                        className={cn(
                          itemBase,
                          'cursor-pointer',
                          collapsed ? 'justify-center' : 'px-3',
                          active
                            ? 'bg-secondary text-foreground before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:rounded-full before:bg-primary'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                        )}
                      >
                        <Icon {...ICON_PROPS} />
                        {!collapsed && <span className="truncate">{label}</span>}
                      </button>
                    </WithTooltip>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn('space-y-1 border-t border-border py-3', collapsed ? 'px-2' : 'px-3')}>
        <WithTooltip show={collapsed} label="Configurações">
          <button
            onClick={onOpenSettings}
            aria-label={collapsed ? 'Configurações' : undefined}
            className={cn(
              itemBase,
              'cursor-pointer text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
              collapsed ? 'justify-center' : 'px-3'
            )}
          >
            <Settings {...ICON_PROPS} />
            {!collapsed && <span>Configurações</span>}
          </button>
        </WithTooltip>

        {collapsed ? (
          <WithTooltip show label="Sair">
            <button
              onClick={onSignOut}
              aria-label="Sair"
              className={cn(itemBase, 'cursor-pointer justify-center text-subtle hover:bg-secondary/60 hover:text-foreground')}
            >
              <LogOut {...ICON_PROPS} />
            </button>
          </WithTooltip>
        ) : (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium uppercase text-muted-foreground">
              {userEmail?.charAt(0) ?? '?'}
            </div>
            <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={userEmail ?? undefined}>
              {userEmail}
            </p>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <button
                  onClick={onSignOut}
                  aria-label="Sair"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Sair</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </aside>
  );
}
