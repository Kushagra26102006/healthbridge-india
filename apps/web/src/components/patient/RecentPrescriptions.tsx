'use client';

import React from 'react';
import Link from 'next/link';
import { Pill, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PatientEmptyState } from './PatientEmptyState';
import type { PatientDashboardSummaryDto } from '@healthbridge/shared-types';

export interface RecentPrescriptionsProps {
  prescriptions?: PatientDashboardSummaryDto['recentPrescriptions'];
  isLoading?: boolean;
}

export function RecentPrescriptions({
  prescriptions = [],
  isLoading = false,
}: RecentPrescriptionsProps) {
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return iso;
    }
  };

  return (
    <Card className="border-border/80 shadow-card bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400">
            <Pill className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-bold text-foreground">Recent Prescriptions</CardTitle>
        </div>

        <Link
          href="/patient/prescriptions"
          className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-muted/40 border border-border animate-pulse space-y-2"
              >
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-3 w-64 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : prescriptions.length > 0 ? (
          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-muted/30 border border-border/70 hover:border-teal-500/40 hover:bg-accent/40 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">
                        {rx.doctorName}
                      </h4>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Issued on {formatDate(rx.issuedAt)}</span>
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={rx.status === 'ACTIVE' ? 'success' : 'secondary'}
                    className="text-[10px] font-mono capitalize"
                  >
                    {rx.status.toLowerCase()}
                  </Badge>
                </div>

                {/* Medication Details */}
                <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-muted-foreground block font-medium">
                      Prescribed Medications
                    </span>
                    <p className="font-semibold text-foreground truncate">
                      {rx.medicationsSummary}
                    </p>
                  </div>

                  <Link href="/patient/prescriptions">
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1 shrink-0">
                      <span>Details</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PatientEmptyState
            icon={Pill}
            title="No Active Prescriptions"
            description="When a doctor generates an e-prescription for you during an appointment or teleconsultation, it will be securely accessible here."
          />
        )}
      </CardContent>
    </Card>
  );
}

export default RecentPrescriptions;
