import { brand } from '@/config/brand';
import { cn } from '@/lib/utils';

interface BrandMarkProps {
  showText?: boolean;
  className?: string;
}

export function BrandMark({ showText = true, className }: BrandMarkProps) {
  return (
    <div className={cn('flex items-center gap-2.5 min-w-0', className)}>
      <div
        aria-hidden
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-[15px] font-semibold text-primary-foreground"
      >
        {brand.name.charAt(0).toUpperCase()}
      </div>
      {showText && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-foreground">{brand.name}</p>
          <p className="truncate text-xs text-subtle">{brand.tagline}</p>
        </div>
      )}
    </div>
  );
}
