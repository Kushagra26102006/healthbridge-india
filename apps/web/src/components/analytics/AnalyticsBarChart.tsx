'use client';

import React, { useState } from 'react';
import { m } from 'framer-motion';
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion/tokens';
import { ChartShell, type ChartShellProps } from './ChartShell';
import { cn } from '@/lib/utils';

export interface BarChartDatum {
  key: string;
  label: string;
  value: number;
  sublabel?: string;
  color?: string;
}

export interface AnalyticsBarChartProps
  extends Omit<ChartShellProps, 'children' | 'isEmpty' | 'accessibleRows'> {
  data: BarChartDatum[];
  orientation?: 'vertical' | 'horizontal';
  unit?: string;
  selectedKey?: string | null;
  onSelectBar?: (item: BarChartDatum) => void;
}

const DEFAULT_PALETTE = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function AnalyticsBarChart({
  data,
  orientation = 'horizontal',
  unit = '',
  selectedKey = null,
  onSelectBar,
  ...shellProps
}: AnalyticsBarChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const maxVal = Math.max(1, ...data.map((d) => d.value));

  const activeItem =
    data.find((d) => d.key === hoveredKey) ??
    data.find((d) => d.key === selectedKey) ??
    null;

  return (
    <ChartShell
      {...shellProps}
      isEmpty={data.length === 0}
      accessibleRows={data.map((d) => ({
        label: d.label,
        value: unit ? `${d.value} ${unit}` : d.value,
        share: total > 0 ? `${Math.round((d.value / total) * 100)}%` : '0%',
      }))}
    >
      <div className="space-y-3">
        {/* Live Tooltip / Readout Bar */}
        <div
          aria-live="polite"
          className="flex items-center justify-between text-xs text-muted-foreground min-h-[20px]"
        >
          <span>{data.length} categories</span>
          {activeItem ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-muted text-foreground font-mono">
              <span>{activeItem.label}:</span>
              <strong>
                {activeItem.value}
                {unit ? ` ${unit}` : ''}
              </strong>
              {total > 0 && <span>({Math.round((activeItem.value / total) * 100)}%)</span>}
            </span>
          ) : (
            <span>Select or hover a bar to inspect</span>
          )}
        </div>

        {orientation === 'horizontal' ? (
          <div className="space-y-3">
            {data.map((item, idx) => {
              const color = item.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]!;
              const ratio = Math.max(0.02, item.value / maxVal);
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              const highlighted = hoveredKey === item.key || selectedKey === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onMouseEnter={() => setHoveredKey(item.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onFocus={() => setHoveredKey(item.key)}
                  onBlur={() => setHoveredKey(null)}
                  onClick={() => onSelectBar?.(item)}
                  className={cn(
                    'w-full text-left p-2 -mx-2 rounded-lg transition-colors focus-ring space-y-1.5',
                    highlighted ? 'bg-muted/60' : 'hover:bg-muted/35'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-foreground truncate">
                      {item.label}
                      {item.sublabel && (
                        <span className="text-muted-foreground font-normal ml-1.5">
                          · {item.sublabel}
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-muted-foreground tabular-nums shrink-0">
                      <strong className="text-foreground">{item.value}</strong>
                      {unit ? ` ${unit}` : ''} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-pill bg-muted overflow-hidden">
                    <m.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: ratio }}
                      transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.standard }}
                      style={{ transformOrigin: 'left center', backgroundColor: color }}
                      className="h-full w-full rounded-pill"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Vertical SVG Bar Chart */
          <div className="w-full overflow-hidden">
            <svg
              viewBox="0 0 600 220"
              role="img"
              aria-label={`${shellProps.title} bar chart`}
              className="w-full h-auto max-h-[230px] select-none"
            >
              {[0, 0.5, 1].map((frac, idx) => {
                const y = 20 + (1 - frac) * 155;
                return (
                  <g key={idx}>
                    <line
                      x1="36"
                      y1={y}
                      x2="584"
                      y2={y}
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 4"
                    />
                    <text
                      x="30"
                      y={y + 4}
                      textAnchor="end"
                      className="fill-muted-foreground text-[10px] font-mono"
                    >
                      {Math.round(maxVal * frac)}
                    </text>
                  </g>
                );
              })}

              {data.map((item, idx) => {
                const slotW = (584 - 44) / Math.max(1, data.length);
                const barW = Math.min(44, slotW * 0.58);
                const x = 44 + idx * slotW + (slotW - barW) / 2;
                const barH = Math.max(4, (item.value / maxVal) * 155);
                const y = 175 - barH;
                const color = item.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]!;
                const highlighted = hoveredKey === item.key || selectedKey === item.key;

                return (
                  <g key={item.key}>
                    <m.rect
                      x={x}
                      y={y}
                      width={barW}
                      height={barH}
                      rx={5}
                      fill={color}
                      fillOpacity={hoveredKey && !highlighted ? 0.45 : 0.92}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.standard }}
                      style={{ transformOrigin: `${x + barW / 2}px 175px` }}
                      tabIndex={0}
                      role="button"
                      aria-label={`${item.label}: ${item.value}${unit ? ` ${unit}` : ''}`}
                      onMouseEnter={() => setHoveredKey(item.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      onFocus={() => setHoveredKey(item.key)}
                      onBlur={() => setHoveredKey(null)}
                      onClick={() => onSelectBar?.(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectBar?.(item);
                        }
                      }}
                      className="cursor-pointer focus:outline-none transition-opacity duration-150"
                    />
                    <text
                      x={x + barW / 2}
                      y={196}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px]"
                    >
                      {item.label.length > 11 ? `${item.label.slice(0, 10)}…` : item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>
    </ChartShell>
  );
}

export default AnalyticsBarChart;
