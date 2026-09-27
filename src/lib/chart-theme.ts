// Shared Recharts styling. Colors read the CSS tokens so charts follow the theme.
export const CHART = {
  grid: 'hsl(var(--border))',
  tick: { fill: 'hsl(var(--subtle))', fontSize: 11, fontFamily: '"IBM Plex Mono", ui-monospace, monospace' },
  cursor: 'hsl(var(--secondary))',
  barMuted: 'hsl(var(--surface-3))',
  barAccent: 'hsl(var(--primary))',
} as const;

/** Tooltip container classes: dark surface with a strong border, as in the activity reference. */
export const CHART_TOOLTIP_CLASS =
  'rounded-lg border border-border-strong bg-background px-3 py-2 text-xs shadow-none';
