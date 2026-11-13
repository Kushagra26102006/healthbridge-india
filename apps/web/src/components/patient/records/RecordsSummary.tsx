'use client';

import React from 'react';
import { FileText, Stethoscope, Pill, FlaskConical } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
      title: 'Total Records',
      count: summary?.totalRecords ?? 0,
      subtitle: 'All indexed documents',
      icon: FileText,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-500/10',
      category: '' as MedicalRecordType | '',
      isSelected: !selectedCategory,
    },
    {
      id: 'CLINICAL',
      title: 'Medical Documents',
      count: summary?.clinicalDocuments ?? 0,
      subtitle: 'OPD & discharge notes',
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
      subtitle: 'Digital e-prescriptions',
      icon: Pill,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-500/10',
      category: 'PRESCRIPTION' as MedicalRecordType,
      isSelected: selectedCategory === 'PRESCRIPTION',
    },
    {
      id: 'LAB_REPORTS',
      title: 'Laboratory Reports',
      count: summary?.labReports ?? 0,
      subtitle: 'Diagnostics & pathology',
      icon: FlaskConical,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-500/10',
      category: 'DIAGNOSTIC_REPORT' as MedicalRecordType,
      isSelected: selectedCategory === 'DIAGNOSTIC_REPORT',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 border-border/60 bg-card animate-pulse space-y-3">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-7 w-12 bg-muted rounded" />
            <div className="h-3 w-28 bg-muted/60 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.id}
            onClick={() => onSelectCategory?.(card.category)}
            className={cn(
              'p-4 border transition-all duration-200 cursor-pointer text-left',
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
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-2xl font-bold tracking-tight text-foreground block">
                {card.count}
              </span>
              <p className="text-[11px] text-muted-foreground truncate">{card.subtitle}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default RecordsSummary;
