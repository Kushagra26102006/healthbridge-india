'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Clock,
  FlaskConical,
  Truck,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Activity,
  CheckCheck,
} from 'lucide-react';
import type { LabSampleStatus } from '@healthbridge/shared-types';

export interface LabSampleStatusBadgeProps {
  status: LabSampleStatus | string;
  className?: string;
}

export function LabSampleStatusBadge({ status, className }: LabSampleStatusBadgeProps) {
  const getBadgeConfig = () => {
    switch (status) {
      case 'COLLECTION_PENDING':
        return {
          label: 'Pending Collection',
          icon: Clock,
          color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        };
      case 'COLLECTED':
        return {
          label: 'Collected',
          icon: FlaskConical,
          color: 'text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
        };
      case 'IN_TRANSIT':
        return {
          label: 'In Transit',
          icon: Truck,
          color: 'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        };
      case 'RECEIVED':
        return {
          label: 'Received at Lab',
          icon: PackageCheck,
          color: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        };
      case 'ACCESSIONED':
        return {
          label: 'Accessioned',
          icon: CheckCircle2,
          color: 'text-teal-700 bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
        };
      case 'PROCESSING':
        return {
          label: 'In Processing',
          icon: Activity,
          color: 'text-cyan-700 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          icon: CheckCheck,
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'REJECTED':
        return {
          label: 'Sample Rejected',
          icon: XCircle,
          color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        };
      default:
        return {
          label: status,
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

export default LabSampleStatusBadge;
