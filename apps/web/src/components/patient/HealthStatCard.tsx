'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { cn } from '@/lib/utils';

export interface HealthStatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  href: string;
  colorScheme?: 'teal' | 'blue' | 'amber' | 'emerald' | 'cyan';
  isLoading?: boolean;
}

export function HealthStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  colorScheme = 'teal',
  isLoading = false,
}: HealthStatCardProps) {
  const colorMap = {
    teal: {
      iconBg: 'bg-secondary/12 text-secondary',
      border: 'hover:border-secondary/40',
    },
    blue: {
      iconBg: 'bg-primary/12 text-primary',
      border: 'hover:border-primary/40',
    },
    amber: {
      iconBg: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
      border: 'hover:border-amber-500/40',
    },
    emerald: {
      iconBg: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
      border: 'hover:border-emerald-500/40',
    },
    cyan: {
      iconBg: 'bg-cyan-500/12 text-cyan-700 dark:text-cyan-400',
      border: 'hover:border-cyan-500/40',
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <Link href={href} className="group block focus-ring rounded-lg">
      <Card className={cn('hover-lift h-full', scheme.border)}>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className={cn('p-2.5 rounded-md transition-colors', scheme.iconBg)}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>

            <ArrowRight
              className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
              aria-hidden="true"
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground block truncate">
              {title}
            </span>

            {isLoading ? (
              <div className="h-8 w-16 rounded-sm bg-muted animate-pulse my-1" />
            ) : (
              <div className="text-metric">
                <AnimatedCounter value={value} />
              </div>
            )}

            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default HealthStatCard;
