'use client';

// Adapted from Spectrum UI (ui.spectrumhq.in) pie-chart:
// data/colors come from props, glow and the dotted plot surface were removed.
import * as React from 'react';
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { HatchPatternDef } from '@/components/finances/HatchPattern';
import { ChartFrame, HOVER_TRANSITION, markOpacity, useChartId, useChartMotion } from './chart-kit';

export interface PieSlice {
  key: string;
  name: string;
  value: number;
  color: string;
  /** Render with diagonal stripes instead of a solid fill. */
  hatched?: boolean;
}

export interface SpectrumPieChartProps {
  data: PieSlice[];
  className?: string;
  innerRadius?: number | string;
  outerRadius?: number | string;
  paddingAngle?: number;
  cornerRadius?: number;
  formatValue?: (value: number) => string;
  /** Content rendered in the donut hole. */
  center?: React.ReactNode;
}

export function PieChart({
  data,
  className,
  innerRadius = '62%',
  outerRadius = '92%',
  paddingAngle = 2,
  cornerRadius = 4,
  formatValue = (v) => String(v),
  center,
}: SpectrumPieChartProps) {
  const id = useChartId('pie');
  const { isAnimationActive, animationDuration } = useChartMotion();
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartFrame className={cn('relative', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <defs>
            {data.filter(d => d.hatched).map(d => (
              <HatchPatternDef key={d.key} id={`${id}-${d.key}`} color={d.color} />
            ))}
          </defs>
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const slice = payload[0].payload as PieSlice;
              const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
              return (
                <div className="rounded-lg border border-border-strong bg-background px-3 py-2 text-xs">
                  <p className="text-muted-foreground">{slice.name}</p>
                  <p className="num mt-0.5 text-sm text-foreground">
                    {formatValue(slice.value)} <span className="text-subtle">· {pct}%</span>
                  </p>
                </div>
              );
            }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={data.length > 1 ? paddingAngle : 0}
            cornerRadius={cornerRadius}
            isAnimationActive={isAnimationActive}
            animationDuration={animationDuration}
            animationEasing="ease-out"
            stroke="none"
            onMouseLeave={() => setActiveKey(null)}
          >
            {data.map((slice) => (
              <Cell
                key={slice.key}
                fill={slice.hatched ? `url(#${id}-${slice.key})` : slice.color}
                style={{
                  opacity: markOpacity(activeKey, slice.key),
                  transition: HOVER_TRANSITION,
                  cursor: 'pointer',
                  outline: 'none',
                }}
                onMouseEnter={() => setActiveKey(slice.key)}
              />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
      {center && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {center}
        </div>
      )}
    </ChartFrame>
  );
}
