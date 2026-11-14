'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ClinicalStatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  href: string;
  colorScheme?: 'blue' | 'teal' | 'indigo' | 'amber' | 'purple';
  isLoading?: boolean;
}

export function ClinicalStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  colorScheme = 'blue',
  isLoading = false,
}: ClinicalStatCardProps) {
  const colorMap = {
    blue: {
      iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      border: 'hover:border-blue-500/40',
      badge: 'text-blue-700 dark:text-blue-300',
    },
    teal: {
      iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
      border: 'hover:border-teal-500/40',
      badge: 'text-teal-700 dark:text-teal-300',
    },
    indigo: {
      iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
      border: 'hover:border-indigo-500/40',
      badge: 'text-indigo-700 dark:text-indigo-300',
    },
    amber: {
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      border: 'hover:border-amber-500/40',
      badge: 'text-amber-700 dark:text-amber-300',
    },
    purple: {
      iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
      border: 'hover:border-purple-500/40',
      badge: 'text-purple-700 dark:text-purple-300',
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
          'transition-all duration-200 border-border/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 bg-card',
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
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              {title}
            </span>

            {isLoading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded-md my-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {value}
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
