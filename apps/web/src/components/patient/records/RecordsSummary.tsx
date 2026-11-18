'use client';

import React from 'react';
import { FileText, Stethoscope, Pill, FlaskConical, HardDrive, Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  computeStorageUsagePercent,
  formatFileSize,
} from '@/features/records/lib/document-helpers';
import type { MedicalRecordSummaryDto, MedicalRecordType } from '@healthbridge/shared-types';
import { cn } from '@/lib/utils';

export interface RecordsSummaryProps {
  summary?: MedicalRecordSummaryDto;
  isLoading?: boolean;
  selectedCategory?: MedicalRecordType | '';
  onSelectCategory?: (category: MedicalRecordType | '') => void;
}

export function RecordsSummary({
  summary,
  isLoading = false,
  selectedCategory,
  onSelectCategory,
}: RecordsSummaryProps) {
  const cards = [
    {
      id: 'ALL',
      title: 'Total Documents',
      count: summary?.totalRecords ?? 0,
      subtitle: 'All indexed records',
      icon: FileText,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-500/10',
      category: '' as MedicalRecordType | '',
      isSelected: !selectedCategory,
    },
    {
      id: 'CLINICAL',
      title: 'Clinical Notes',
      count: summary?.clinicalDocuments ?? 0,
      subtitle: 'OPD, discharge & certificates',
      icon: Stethoscope,
      iconColor: 'text-teal-600 dark:text-teal-400',
      iconBg: 'bg-teal-500/10',
      category: 'OP_CONSULTATION' as MedicalRecordType,
      isSelected:
        selectedCategory === 'OP_CONSULTATION' || selectedCategory === 'DISCHARGE_SUMMARY',
    },
    {
      id: 'PRESCRIPTIONS',
      title: 'Prescriptions',
      count: summary?.prescriptions ?? 0,
      subtitle: 'Digital & uploaded Rx',
      icon: Pill,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-500/10',
      category: 'PRESCRIPTION' as MedicalRecordType,
      isSelected: selectedCategory === 'PRESCRIPTION',
    },
    {
      id: 'LAB_REPORTS',
      title: 'Lab & Imaging',
      count: (summary?.labReports ?? 0) + (summary?.imagingReports ?? 0),
      subtitle: 'Pathology & radiology',
      icon: FlaskConical,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-500/10',
      category: 'DIAGNOSTIC_REPORT' as MedicalRecordType,
      isSelected:
        selectedCategory === 'DIAGNOSTIC_REPORT' || selectedCategory === 'IMAGING_REPORT',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 border-border/60 bg-card animate-pulse space-y-3">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-7 w-12 bg-muted rounded" />
              <div className="h-3 w-28 bg-muted/60 rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const hasRealStorageMetrics =
    summary?.totalStorageBytes !== undefined &&
    summary?.maxStorageBytes !== undefined &&
    summary.maxStorageBytes > 0;
  const storagePercent = computeStorageUsagePercent(
    summary?.totalStorageBytes,
    summary?.maxStorageBytes
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectCategory?.(card.category)}
              aria-pressed={card.isSelected}
              className={cn(
                'p-4 rounded-xl border transition-all duration-200 text-left focus-ring',
                card.isSelected
                  ? 'border-primary ring-1 ring-primary/40 bg-card shadow-sm'
                  : 'border-border/60 bg-card hover:border-border hover:shadow-card'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {card.title}
                </span>
                <div
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                    card.iconBg,
                    card.iconColor
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-2xl font-bold tracking-tight text-foreground block">
                  {card.count}
                </span>
                <p className="text-[11px] text-muted-foreground truncate">{card.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Real Storage Usage & Upload Activity Bar (rendered only when backend provides metrics) */}
      {hasRealStorageMetrics && (
        <Card className="px-4 py-3 border-border/70 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <HardDrive className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-semibold text-foreground">Private Vault Storage</span>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {formatFileSize(summary?.totalStorageBytes)} /{' '}
                  {formatFileSize(summary?.maxStorageBytes)} ({storagePercent}%)
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={storagePercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Private medical document vault storage usage"
                className="h-1.5 w-full rounded-full bg-muted overflow-hidden"
              >
                <div
                  style={{ width: `${Math.max(storagePercent, summary?.totalStorageBytes ? 2 : 0)}%` }}
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    storagePercent >= 85
                      ? 'bg-rose-500'
                      : storagePercent >= 65
                        ? 'bg-amber-500'
                        : 'bg-primary'
                  )}
                />
              </div>
            </div>
          </div>

          {summary?.recentUploadsCount !== undefined && (
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground sm:border-l sm:border-border sm:pl-4 shrink-0">
              <Upload className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>
                <strong className="text-foreground">{summary.recentUploadsCount}</strong> uploaded
                in last 30 days
              </span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default RecordsSummary;
