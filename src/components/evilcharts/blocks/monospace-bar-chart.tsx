"use client";

// Adapted from Evil Charts (evilcharts.com) monospace-bar-chart:
// data comes from props, the highlighted bar stays expanded, blur filters removed.
import { useState } from "react";
import { type ChartConfig, ChartContainer } from "@/components/evilcharts/ui/recharts-chart";
import { Bar, BarChart, Rectangle, Tooltip, XAxis } from "recharts";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

export interface MonospaceBarDatum {
  key: string;
  label: string;
  value: number;
}

interface MonospaceBarChartProps {
  data: MonospaceBarDatum[];
  /** Key of the bar that stays expanded and colored (e.g. selected month). */
  highlightKey?: string;
  formatValue: (value: number) => string;
  /** Terminal-style stats shown above the chart. */
  stats: { label: string; value: string }[];
  className?: string;
}

const chartConfig = {
  value: {
    label: "Valor",
    colors: { light: ["hsl(var(--muted-foreground))"], dark: ["hsl(var(--muted-foreground))"] },
  },
} satisfies ChartConfig;

// Scale factor: collapsed = thin line, expanded = full width
const COLLAPSED_SCALE = 0.12;

export function EvilMonospaceBarChart({ data, highlightKey, formatValue, stats, className }: MonospaceBarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const reduce = Boolean(useReducedMotion());

  return (
    <div className={className}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-row">
          {stats.map((s, i) => (
            <div key={s.label} className="flex flex-row">
              {i > 0 && <hr className="mx-4 h-full border-l border-dashed border-border-strong" />}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-xs text-subtle">{s.label}</span>
                <span className="font-mono text-2xl tabular-nums tracking-tight text-foreground">{s.value}</span>
              </div>
            </div>
          ))}
        </div>
        <span className="font-mono text-[10px] text-subtle">
          {"// Y: "}<span className="text-muted-foreground">INVESTIDO</span>
        </span>
      </div>
      <hr className="my-4 border-t border-dashed border-border-strong" />
      <ChartContainer config={chartConfig} className="aspect-auto h-[180px]">
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ top: 18, right: 0, bottom: 0, left: 0 }}
          onMouseMove={(state) => setActiveIndex(typeof state?.activeTooltipIndex === "number" ? state.activeTooltipIndex : null)}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} className="font-mono" />
          <Tooltip content={() => null} cursor={false} />
          <Bar
            dataKey="value"
            isAnimationActive={false}
            shape={(props: BarProps) => (
              <BarShape
                {...props}
                expanded={props.index === activeIndex || data[props.index ?? -1]?.key === highlightKey}
                highlighted={data[props.index ?? -1]?.key === highlightKey}
                showLabel={props.index === activeIndex || (activeIndex === null && data[props.index ?? -1]?.key === highlightKey)}
                formatValue={formatValue}
                reduce={reduce}
              />
            )}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

interface BarProps {
  index?: number;
  value?: number | [number, number];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
}

interface BarShapeProps extends BarProps {
  expanded: boolean;
  highlighted: boolean;
  showLabel: boolean;
  reduce: boolean;
  formatValue: (value: number) => string;
}

const BarShape = ({ x, y, width, height, index, value, expanded, highlighted, showLabel, reduce, formatValue }: BarShapeProps) => {
  const xPos = Number(x || 0);
  const yPos = Number(y || 0);
  const realWidth = Number(width || 0);
  const realHeight = Number(height || 0);
  const centerX = xPos + realWidth / 2;
  const centerY = yPos + realHeight / 2;
  const fill = highlighted ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))";
  const numeric = Array.isArray(value) ? value[1] : Number(value ?? 0);

  return (
    <>
      <Rectangle x={xPos} y={yPos} width={realWidth} height={realHeight} fill="transparent" />
      <motion.rect
        key={`bar-${index}`}
        x={xPos}
        y={yPos}
        width={realWidth}
        height={realHeight}
        fill={fill}
        initial={false}
        animate={{ scaleX: expanded ? 1 : COLLAPSED_SCALE }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 25 }}
        style={{ transformOrigin: `${centerX}px ${centerY}px`, transformBox: "fill-box" }}
      />
      <AnimatePresence>
        {showLabel && numeric > 0 && (
          <motion.text
            className="font-mono"
            key={`text-${index}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            x={centerX}
            y={yPos - 6}
            textAnchor="middle"
            fontSize={11}
            fill={fill}
            style={{ pointerEvents: "none" }}
          >
            {formatValue(numeric)}
          </motion.text>
        )}
      </AnimatePresence>
    </>
  );
};
