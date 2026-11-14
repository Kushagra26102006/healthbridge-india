'use client';

import React from 'react';
import { Pill, CheckCircle2, FileEdit, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DoctorPrescriptionSummaryDto } from '@healthbridge/shared-types';

interface PrescriptionSummaryProps {
  summary?: DoctorPrescriptionSummaryDto;
  isLoading?: boolean;
  activeStatus?: string;
  onSelectStatus?: (status: string) => void;
}

export function PrescriptionSummary({
  summary,
  isLoading = false,
  activeStatus,
  onSelectStatus,
}: PrescriptionSummaryProps) {
  const cards = [
    {
      id: 'ALL',
      title: 'Total Prescriptions',
      value: summary?.total ?? 0,
      icon: Pill,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      description: 'Lifetime clinical prescriptions',
    },
    {
      id: 'ACTIVE',
      title: 'Issued Prescriptions',
      value: summary?.issued ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      description: 'Finalized and digitally sealed',
    },
    {
      id: 'DRAFT',
      title: 'Draft Prescriptions',
      value: summary?.draft ?? 0,
      icon: FileEdit,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      description: 'Unfinalized clinical drafts',
    },
    {
      id: 'RECENT',
      title: 'Recent (7 Days)',
      value: summary?.recent ?? 0,
      icon: Clock,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
      description: 'Prescribed this week',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeStatus === card.id;

        return (
          <Card
            key={card.id}
            onClick={() => onSelectStatus?.(card.id)}
            className={`border cursor-pointer transition-all hover:shadow-sm ${
              isSelected
                ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/20 dark:bg-blue-950/20'
                : 'border-border/80 bg-card hover:border-border'
            }`}
          >
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                {isLoading ? (
                  <div className="h-6 w-10 bg-muted/60 animate-pulse rounded" />
                ) : (
                  <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    {card.value}
                  </span>
                )}
              </div>
              <div className="mt-2.5">
                <h3 className="text-xs font-semibold text-foreground truncate">{card.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}