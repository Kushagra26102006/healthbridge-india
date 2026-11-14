'use client';

import React from 'react';
import {
  FileText,
  Pill,
  FlaskConical,
  Activity,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CONSENT_DATA_CATEGORY_LABELS } from '@healthbridge/config';

export interface ConsentPermissionListProps {
  categories: string[];
  className?: string;
  variant?: 'chips' | 'detailed';
}

export const getCategoryIcon = (category: string) => {
  switch (category.toUpperCase()) {
    case 'MEDICAL_RECORDS':
      return FileText;
    case 'PRESCRIPTIONS':
      return Pill;
    case 'LAB_REPORTS':
      return FlaskConical;
    case 'DIAGNOSTIC_REPORTS':
      return Activity;
    case 'ENCOUNTER_INFO':
    default:
      return Calendar;
  }
};

export const ConsentPermissionList: React.FC<ConsentPermissionListProps> = ({
  categories,
  className = '',
  variant = 'chips',
}) => {
  if (categories.length === 0) {
    return <span className="text-xs text-slate-400">No categories specified</span>;
  }

  if (variant === 'chips') {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {categories.map((category) => {
          const Icon = getCategoryIcon(category);
          const label =
            CONSENT_DATA_CATEGORY_LABELS[category] || category.replace(/_/g, ' ');

          return (
            <Badge
              key={category}
              variant="outline"
              className="text-[11px] font-medium py-0.5 px-2 rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              <Icon className="h-3 w-3 text-teal-600 dark:text-teal-400" />
              <span>{label}</span>
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {categories.map((category) => {
        const Icon = getCategoryIcon(category);
        const label =
          CONSENT_DATA_CATEGORY_LABELS[category] || category.replace(/_/g, ' ');

        return (
          <div
            key={category}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  {label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  SCOPE: {category}
                </span>
              </div>
            </div>

            <Badge
              variant="outline"
              className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 flex items-center gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Requested</span>
            </Badge>
          </div>
        );
      })}
    </div>
  );
};
