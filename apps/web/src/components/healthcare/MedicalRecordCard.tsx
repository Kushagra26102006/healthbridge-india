import * as React from 'react';
import { FileText, Paperclip, Building2, User, Calendar } from 'lucide-react';
import type { HealthRecordSummary, HealthInformationType } from '@healthbridge/shared-types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const RECORD_TYPE_LABELS: Record<HealthInformationType, string> = {
  OP_CONSULTATION: 'OP Consultation',
  DISCHARGE_SUMMARY: 'Discharge Summary',
  DIAGNOSTIC_REPORT: 'Diagnostic Report',
  PRESCRIPTION: 'Prescription',
  IMMUNIZATION_RECORD: 'Immunization',
  WELLNESS_RECORD: 'Wellness Record',
};

export interface MedicalRecordCardProps {
  record: HealthRecordSummary;
  onSelect?: (record: HealthRecordSummary) => void;
  actions?: React.ReactNode;
  className?: string;
}

export function MedicalRecordCard({
  record,
  onSelect,
  actions,
  className,
}: MedicalRecordCardProps) {
  const formattedDate = React.useMemo(() => {
    const parsed = new Date(record.date);
    return Number.isNaN(parsed.getTime())
      ? record.date
      : parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [record.date]);

  return (
    <Card
      variant={onSelect ? 'interactive' : 'default'}
      onClick={onSelect ? () => onSelect(record) : undefined}
      className={cn('p-5 flex flex-col gap-3.5', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex flex-col gap-1">
            <h3 className="text-card-heading truncate">{record.title}</h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="info" size="sm">
                {RECORD_TYPE_LABELS[record.recordType] ?? record.recordType}
              </Badge>
              {record.hasAttachment && (
                <Badge variant="neutral" size="sm">
                  <Paperclip className="h-3 w-3" aria-hidden="true" />
                  <span>Attachment</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0 tabular-nums">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{formattedDate}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-border/80 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate text-foreground font-medium">{record.practitionerName}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{record.facilityName}</span>
        </div>
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
