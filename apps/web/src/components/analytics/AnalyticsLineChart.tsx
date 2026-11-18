'use client';

import React, { useId, useState } from 'react';
import { m } from 'framer-motion';
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion/tokens';
import { ChartShell, type ChartShellProps } from './ChartShell';
import { cn } from '@/lib/utils';

export interface LineChartDatum {
  key: string;
  label: string;
  value: number;
}

export interface AnalyticsLineChartProps
  extends Omit<ChartShellProps, 'children' | 'isEmpty' | 'accessibleRows'> {
  data: LineChartDatum[];
  variant?: 'line' | 'area';
  seriesLabel?: string;
  colorVar?: string;
  unit?: string;
  selectedKey?: string | null;
  onSelectPoint?: (point: LineChartDatum) => void;
}

export function AnalyticsLineChart({
  data,
  variant = 'line',
  seriesLabel = 'Count',
  colorVar = 'hsl(var(--chart-1))',
  unit = '',
  selectedKey = null,
  onSelectPoint,
  ...shellProps
}: AnalyticsLineChartProps) {
  const gradientId = useId().replace(/:/g, '');
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const width = 620;
  const height = 220;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 34;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const maxVal = Math.max(1, ...data.map((d) => d.value));
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  const coords = data.map((d, i) => {
    const x =
      data.length === 1
        ? padLeft + innerW / 2
        : padLeft + (i / (data.length - 1)) * innerW;
    const y = padTop + innerH - (d.value / maxVal) * innerH;
    return { ...d, x, y, index: i };
  });

  const linePath = coords
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1]!.x.toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${coords[0]!.x.toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`
      : '';

  const activePoint =
    activeIdx !== null
      ? coords[activeIdx]
      : selectedKey
        ? coords.find((c) => c.key === selectedKey) ?? null
        : null;

  return (
    <ChartShell
      {...shellProps}
      isEmpty={data.length === 0}
      accessibleRows={data.map((d) => ({
        label: d.label,
        value: unit ? `${d.value} ${unit}` : d.value,
      }))}
    >
      <div className="space-y-3">
        {/* Interactive Legend & Active Selection Readout */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <span
              className="inline-block h-2.5 w-2.5 rounded-pill"
              style={{ backgroundColor: colorVar }}
              aria-hidden="true"
            />
            <span className="font-medium text-foreground">{seriesLabel}</span>
          </div>

          <div
            aria-live="polite"
            className="text-xs font-mono text-muted-foreground min-h-[18px]"
          >
            {activePoint ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-muted text-foreground">
                <span>{activePoint.label}:</span>
                <strong>
                  {activePoint.value}
                  {unit ? ` ${unit}` : ''}
                </strong>
              </span>
            ) : (
              <span>Hover or focus points to inspect</span>
            )}
          </div>
        </div>

        {/* Responsive SVG Chart */}
        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`${shellProps.title} ${variant} chart`}
            className="w-full h-auto max-h-[240px] select-none"
          >
            <defs>
              <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorVar} stopOpacity="0.28" />
                <stop offset="100%" stopColor={colorVar} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y Labels */}
            {yTicks.map((tick, idx) => {
              const y = padTop + innerH - (tick / maxVal) * innerH;
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px] font-mono"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {variant === 'area' && areaPath && (
              <m.path
                d={areaPath}
                fill={`url(#area-${gradientId})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.standard }}
              />
            )}

            {/* Main Line Path */}
            {linePath && (
              <m.path
                d={linePath}
                fill="none"
                stroke={colorVar}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0.4 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.standard }}
              />
            )}

            {/* Interactive Points & X Labels */}
            {coords.map((pt, i) => {
              const isHighlighted =
                activeIdx === i || (selectedKey !== null && selectedKey === pt.key);
              const showXLabel =
                coords.length <= 7 || i === 0 || i === coords.length - 1 || i % 2 === 0;
              return (
                <g key={pt.key}>
                  {isHighlighted && (
                    <line
                      x1={pt.x}
                      y1={padTop}
                      x2={pt.x}
                      y2={padTop + innerH}
                      stroke={colorVar}
                      strokeOpacity="0.28"
                      strokeWidth="1.5"
                    />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHighlighted ? 6 : 4}
                    fill="hsl(var(--card))"
                    stroke={colorVar}
                    strokeWidth={isHighlighted ? 3 : 2}
                    tabIndex={0}
                    role="button"
                    aria-label={`${pt.label}: ${pt.value}${unit ? ` ${unit}` : ''}`}
                    onMouseEnter={() => setActiveIdx(i)}
                    onMouseLeave={() => setActiveIdx(null)}
                    onFocus={() => setActiveIdx(i)}
                    onBlur={() => setActiveIdx(null)}
                    onClick={() => onSelectPoint?.(pt)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectPoint?.(pt);
                      }
                    }}
                    className={cn(
                      'cursor-pointer transition-all duration-150 focus:outline-none',
                      isHighlighted && 'drop-shadow-sm'
                    )}
                  />
                  {showXLabel && (
                    <text
                      x={pt.x}
                      y={height - 10}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px]"
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </ChartShell>
  );
}

export function AnalyticsAreaChart(props: Omit<AnalyticsLineChartProps, 'variant'>) {
  return <AnalyticsLineChart {...props} variant="area" />;
}

export default AnalyticsLineChart;
