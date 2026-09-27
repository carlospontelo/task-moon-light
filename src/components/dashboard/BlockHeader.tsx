import type { ReactNode } from 'react';

interface BlockHeaderProps {
  label: string;
  action?: ReactNode;
}

/** Small label on the left, action tucked into the top-right corner. */
export function BlockHeader({ label, action }: BlockHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</h2>
      {action}
    </div>
  );
}
