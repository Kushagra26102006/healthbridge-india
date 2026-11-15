'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FlaskConical,
  Activity,
  CheckCheck,
  Ban,
} from 'lucide-react';

export interface LabOrderStatusBadgeProps {
  status: string;
  className?: string;
}

export function LabOrderStatusBadge({ status, className }: LabOrderStatusBadgeProps) {
  const getBadgeConfig = () => {
    switch (status) {
      case 'ORDERED':
        return {
          label: 'Order Placed',
          variant: 'info' as const,
          icon: Clock,
          color: 'text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
        };
      case 'ACCEPTED':
        return {
          label: 'Accepted',
          variant: 'teal' as const,
          icon: CheckCircle2,
          color: 'text-teal-700 bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        };
      case 'CLARIFICATION_REQUESTED':
        return {
          label: 'Clarification Needed',
          variant: 'warning' as const,
          icon: HelpCircle,
          color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        };
      case 'SAMPLE_COLLECTED':
        return {
          label: 'Sample Collected',
          variant: 'secondary' as const,
          icon: FlaskConical,
          color: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
        };
      case 'IN_ANALYSIS':
        return {
          label: 'In Analysis',
          variant: 'secondary' as const,
          icon: Activity,
          color: 'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          variant: 'success' as const,
          icon: CheckCheck,
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          variant: 'outline' as const,
          icon: Ban,
          color: 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
          icon: Clock,
          color: 'text-slate-600 bg-slate-50 border-slate-200',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
        config.color,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}

export default LabOrderStatusBadge;
