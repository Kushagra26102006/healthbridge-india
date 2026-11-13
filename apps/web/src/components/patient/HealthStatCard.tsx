'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
      iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
      border: 'hover:border-teal-500/40',
      badge: 'text-teal-700 dark:text-teal-300',
    },
    blue: {
      iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      border: 'hover:border-blue-500/40',
      badge: 'text-blue-700 dark:text-blue-300',
    },
    amber: {
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      border: 'hover:border-amber-500/40',
      badge: 'text-amber-700 dark:text-amber-300',
    },
    emerald: {
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      border: 'hover:border-emerald-500/40',
      badge: 'text-emerald-700 dark:text-emerald-300',
    },
    cyan: {
      iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
      border: 'hover:border-cyan-500/40',
      badge: 'text-cyan-700 dark:text-cyan-300',
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <Link
      href={href}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
    >
      <Card
        className={cn(
          'transition-all duration-200 border-border/80 shadow-card hover:shadow-subtle hover:-translate-y-0.5 bg-card',
          scheme.border
        )}
      >
        <CardContent className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className={cn('p-2.5 rounded-2xl transition-colors', scheme.iconBg)}>
              <Icon className="h-5 w-5" />
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground block truncate">
              {title}
            </span>

            {isLoading ? (
              <div className="h-8 w-16 rounded-lg bg-muted animate-pulse my-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {value}
              </div>
            )}

            {subtitle && (
              <p className="text-[11px] text-muted-foreground truncate font-medium">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default HealthStatCard;
