'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Droplet } from 'lucide-react';
import type { SpecimenType } from '@healthbridge/shared-types';

export interface SpecimenTypeBadgeProps {
  specimenType: SpecimenType | string;
  className?: string;
}

export function SpecimenTypeBadge({ specimenType, className }: SpecimenTypeBadgeProps) {
  const getStyle = () => {
    switch (specimenType) {
      case 'BLOOD':
      case 'SERUM':
      case 'PLASMA':
        return 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
      case 'URINE':
        return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'STOOL':
        return 'text-amber-900 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800';
      case 'CSF':
        return 'text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
      case 'BIOPSY':
        return 'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
      case 'SWAB':
      case 'SPUTUM':
        return 'text-teal-700 bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border font-mono tracking-tight',
        getStyle(),
        className
      )}
    >
      <Droplet className="w-3 h-3 shrink-0" />
      <span>{specimenType}</span>
    </span>
  );
}

export default SpecimenTypeBadge;
