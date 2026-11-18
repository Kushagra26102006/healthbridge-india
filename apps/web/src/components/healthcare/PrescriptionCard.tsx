import * as React from 'react';
import { Pill, Calendar, Building2, RefreshCw } from 'lucide-react';
import type { PrescriptionListItemDto } from '@healthbridge/shared-types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HealthcareStatusBadge } from './HealthcareStatusBadge';
import { cn } from '@/lib/utils';

export interface PrescriptionCardProps {
  prescription: PrescriptionListItemDto;
  onSelect?: (prescription: PrescriptionListItemDto) => void;
  actions?: React.ReactNode;
  className?: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PrescriptionCard({
  prescription,
  onSelect,
  actions,
  className,
}: PrescriptionCardProps) {
  return (
    <Card
      variant={onSelect ? 'interactive' : 'default'}
      onClick={onSelect ? () => onSelect(prescription) : undefined}
      className={cn('p-5 flex flex-col gap-3.5', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <Pill className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex flex-col gap-0.5">
            <span className="font-mono text-xs font-semibold text-primary">
              {prescription.prescriptionNumber}
            </span>
            <h3 className="text-card-heading truncate">{prescription.doctorName}</h3>
            {prescription.facilityName && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground truncate">
                <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{prescription.facilityName}</span>
              </span>
            )}
          </div>
        </div>
        <HealthcareStatusBadge status={prescription.status} size="sm" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="neutral" size="sm" className="tabular-nums">
          {prescription.medicationCount}{' '}
          {prescription.medicationCount === 1 ? 'Medication' : 'Medications'}
        </Badge>
        {prescription.refillEligible && (
          <Badge variant="teal" size="sm" className="tabular-nums">
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            <span>{prescription.refillsRemaining} refills left</span>
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/80 text-xs text-muted-foreground tabular-nums">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Issued: {formatDate(prescription.issuedAt)}</span>
        </span>
        <span>Valid until: {formatDate(prescription.validUntil)}</span>
      </div>

      {actions && (
        <div
          className="flex flex-wrap items-center justify-end gap-2 pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </Card>
  );
}
