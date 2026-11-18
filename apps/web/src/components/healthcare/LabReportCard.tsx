import * as React from 'react';
import { FlaskConical, AlertTriangle, FileCheck2, Building2, Calendar } from 'lucide-react';
import type { LabReportListItemDto } from '@healthbridge/shared-types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HealthcareStatusBadge } from './HealthcareStatusBadge';
import { cn } from '@/lib/utils';

export interface LabReportCardProps {
  report: LabReportListItemDto;
  onSelect?: (report: LabReportListItemDto) => void;
  actions?: React.ReactNode;
  className?: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function LabReportCard({ report, onSelect, actions, className }: LabReportCardProps) {
  return (
    <Card
      variant={onSelect ? 'interactive' : 'default'}
      onClick={onSelect ? () => onSelect(report) : undefined}
      className={cn(
        'p-5 flex flex-col gap-3.5',
        report.hasAbnormalResults && 'border-amber-300/80 dark:border-amber-800/70',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary/10 text-secondary"
            aria-hidden="true"
          >
            <FlaskConical className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex flex-col gap-0.5">
            <span className="font-mono text-xs font-medium text-muted-foreground">
              {report.reportNumber}
            </span>
            <h3 className="text-card-heading truncate">{report.testName}</h3>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground truncate">
              <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{report.laboratoryName}</span>
            </span>
          </div>
        </div>
        <HealthcareStatusBadge status={report.status} size="sm" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="neutral" size="sm">
          {report.category.replace(/_/g, ' ')}
        </Badge>
        <Badge variant="info" size="sm" className="tabular-nums">
          {report.observationCount} {report.observationCount === 1 ? 'Parameter' : 'Parameters'}
        </Badge>
        {report.hasAbnormalResults && (
          <Badge variant="warning" size="sm">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            <span>Out-of-Range Values</span>
          </Badge>
        )}
        {report.hasDocument && (
          <Badge variant="outline" size="sm">
            <FileCheck2 className="h-3 w-3" aria-hidden="true" />
            <span>PDF Ready</span>
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/80 text-xs text-muted-foreground tabular-nums">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Reported: {formatDate(report.reportDate)}</span>
        </span>
        {report.doctorName && <span className="truncate">Ordered by {report.doctorName}</span>}
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
