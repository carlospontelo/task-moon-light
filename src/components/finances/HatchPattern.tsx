/**
 * Diagonal stripes (SVG pattern, not a gradient). Marks money that has no
 * destination yet ("Sobrou").
 */
export function HatchPatternDef({ id, color }: { id: string; color: string }) {
  return (
    <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" fill={color} opacity={0.22} />
      <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="2.5" />
    </pattern>
  );
}

/** Full-size hatched layer for HTML surfaces (cards, legend swatches). */
export function HatchFill({ id, color, className }: { id: string; color: string; className?: string }) {
  return (
    <svg aria-hidden className={className} width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <HatchPatternDef id={id} color={color} />
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
