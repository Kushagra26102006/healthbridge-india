import * as React from 'react';
import { ShieldCheck, Clock, Building2 } from 'lucide-react';
import type { ConsentListItemDto } from '@healthbridge/shared-types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HealthcareStatusBadge } from './HealthcareStatusBadge';
import { cn } from '@/lib/utils';

export interface ConsentStatusCardProps {
  consent: ConsentListItemDto;
  onSelect?: (consent: ConsentListItemDto) => void;
  actions?: React.ReactNode;
  className?: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ConsentStatusCard({
  consent,
  onSelect,
  actions,
  className,
}: ConsentStatusCardProps) {
  return (
    <Card
      variant={onSelect ? 'interactive' : 'default'}
      onClick={onSelect ? () => onSelect(consent) : undefined}
      className={cn('p-5 flex flex-col gap-3.5', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex flex-col gap-0.5">
            <h3 className="text-card-heading truncate">
              {consent.doctorName || consent.organization}
            </h3>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground truncate">
              <Building2 className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {consent.organization} • {consent.requesterRole}
              </span>
            </span>
          </div>
        </div>
        <HealthcareStatusBadge status={consent.status} size="sm" />
      </div>

      <p className="text-sm text-foreground/90 leading-relaxed">
        <span className="font-medium">Purpose:</span>{' '}
        {consent.purposeDescription || consent.purpose}
      </p>

      {consent.requestedDataTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {consent.requestedDataTypes.map((type) => (
            <Badge key={type} variant="neutral" size="sm">
              {type.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/80 text-xs text-muted-foreground tabular-nums">
        <span>Requested: {formatDate(consent.requestedAt)}</span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Expires: {formatDate(consent.expiresAt)}</span>
        </span>
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
