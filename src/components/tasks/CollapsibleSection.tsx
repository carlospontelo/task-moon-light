import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  count: number;
  children: ReactNode;
  /** Extra control shown on the right of the header when open. */
  action?: ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({ title, count, children, action, defaultOpen = false }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-t border-border pt-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="flex items-center gap-2 py-1.5 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-90')} />
          {title}
          <span className="num text-subtle">{count}</span>
        </button>
        {open && action}
      </div>
      {open && <div className="mt-1">{children}</div>}
    </section>
  );
}
