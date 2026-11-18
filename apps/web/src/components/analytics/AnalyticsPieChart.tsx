'use client';

import React, { useState } from 'react';
import { ChartShell, type ChartShellProps } from './ChartShell';
import { cn } from '@/lib/utils';

export interface PieChartDatum {
  key: string;
  label: string;
  value: number;
  color?: string;
}

export interface AnalyticsPieChartProps
  extends Omit<ChartShellProps, 'children' | 'isEmpty' | 'accessibleRows'> {
  data: PieChartDatum[];
  variant?: 'pie' | 'donut';
  centerLabel?: string;
  unit?: string;
  selectedKey?: string | null;
  onSelectSlice?: (item: PieChartDatum) => void;
}

const DEFAULT_PALETTE = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArcSlice(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
) {
  const clampedEnd = endAngle - startAngle >= 359.99 ? startAngle + 359.99 : endAngle;
  const startOuter = polarToCartesian(cx, cy, outerR, clampedEnd);
  const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const largeArcFlag = clampedEnd - startAngle <= 180 ? '0' : '1';

  if (innerR <= 0) {
    return [
      `M ${cx} ${cy}`,
      `L ${endOuter.x.toFixed(2)} ${endOuter.y.toFixed(2)}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${startOuter.x.toFixed(2)} ${startOuter.y.toFixed(2)}`,
      'Z',
    ].join(' ');
  }

  const startInner = polarToCartesian(cx, cy, innerR, clampedEnd);
  const endInner = polarToCartesian(cx, cy, innerR, startAngle);

  return [
    `M ${endOuter.x.toFixed(2)} ${endOuter.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${startOuter.x.toFixed(2)} ${startOuter.y.toFixed(2)}`,
    `L ${startInner.x.toFixed(2)} ${startInner.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${endInner.x.toFixed(2)} ${endInner.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export function AnalyticsPieChart({
  data,
  variant = 'donut',
  centerLabel = 'Total',
  unit = '',
  selectedKey = null,
  onSelectSlice,
  ...shellProps
}: AnalyticsPieChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const nonZero = data.filter((d) => d.value > 0);
  const total = nonZero.reduce((sum, d) => sum + d.value, 0);

  let cumulative = 0;
  const slices = nonZero.map((d, idx) => {
    const startAngle = (cumulative / Math.max(1, total)) * 360;
    cumulative += d.value;
    const endAngle = (cumulative / Math.max(1, total)) * 360;
    return {
      ...d,
      startAngle,
      endAngle,
      pct: Math.round((d.value / Math.max(1, total)) * 100),
      color: d.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]!,
    };
  });

  const activeSlice =
    slices.find((s) => s.key === hoveredKey) ??
    slices.find((s) => s.key === selectedKey) ??
    null;

  return (
    <ChartShell
      {...shellProps}
      isEmpty={total === 0}
      accessibleRows={data.map((d) => ({
        label: d.label,
        value: unit ? `${d.value} ${unit}` : d.value,
        share: total > 0 ? `${Math.round((d.value / total) * 100)}%` : '0%',
      }))}
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        {/* SVG Pie / Donut */}
        <div className="sm:col-span-5 flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            role="img"
            aria-label={`${shellProps.title} ${variant} chart`}
            className="w-44 h-44 sm:w-48 sm:h-48 overflow-visible select-none"
          >
            {slices.map((slice) => {
              const isHighlighted =
                hoveredKey === slice.key || selectedKey === slice.key;
              const outerR = isHighlighted ? 88 : 82;
              const innerR = variant === 'donut' ? 52 : 0;
              const dPath = describeArcSlice(
                100,
                100,
                outerR,
                innerR,
                slice.startAngle,
                slice.endAngle
              );
              return (
                <path
                  key={slice.key}
                  d={dPath}
                  fill={slice.color}
                  fillOpacity={hoveredKey && !isHighlighted ? 0.45 : 0.95}
                  stroke="hsl(var(--card))"
                  strokeWidth="2"
                  tabIndex={0}
                  role="button"
                  aria-label={`${slice.label}: ${slice.value}${unit ? ` ${unit}` : ''} (${slice.pct}%)`}
                  onMouseEnter={() => setHoveredKey(slice.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onFocus={() => setHoveredKey(slice.key)}
                  onBlur={() => setHoveredKey(null)}
                  onClick={() => onSelectSlice?.(slice)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectSlice?.(slice);
                    }
                  }}
                  className="cursor-pointer transition-all duration-150 focus:outline-none"
                />
              );
            })}

            {variant === 'donut' && (
              <g aria-live="polite">
                <text
                  x="100"
                  y="96"
                  textAnchor="middle"
                  className="fill-foreground text-xl font-bold tabular-nums"
                >
                  {activeSlice ? activeSlice.value : total}
                </text>
                <text
                  x="100"
                  y="114"
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {activeSlice
                    ? activeSlice.label.length > 13
                      ? `${activeSlice.label.slice(0, 12)}…`
                      : activeSlice.label
                    : centerLabel}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Interactive Legend */}
        <div className="sm:col-span-7 space-y-1.5">
          {slices.map((slice) => {
            const isHighlighted =
              hoveredKey === slice.key || selectedKey === slice.key;
            return (
              <button
                key={slice.key}
                type="button"
                onMouseEnter={() => setHoveredKey(slice.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onFocus={() => setHoveredKey(slice.key)}
                onBlur={() => setHoveredKey(null)}
                onClick={() => onSelectSlice?.(slice)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-xs transition-colors focus-ring',
                  isHighlighted ? 'bg-muted font-semibold' : 'hover:bg-muted/50'
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-pill shrink-0"
                    style={{ backgroundColor: slice.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-foreground">{slice.label}</span>
                </span>
                <span className="font-mono text-muted-foreground tabular-nums shrink-0">
                  <strong className="text-foreground">{slice.value}</strong>
                  {unit ? ` ${unit}` : ''} · {slice.pct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </ChartShell>
  );
}

export function AnalyticsDonutChart(props: Omit<AnalyticsPieChartProps, 'variant'>) {
  return <AnalyticsPieChart {...props} variant="donut" />;
}

export default AnalyticsPieChart;
