import * as React from 'react';
import { Pill, Package, Building2, FileWarning } from 'lucide-react';
import type { MedicineCatalogItemDto, InventoryStockStatus } from '@healthbridge/shared-types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HealthcareStatusBadge } from './HealthcareStatusBadge';
import { cn } from '@/lib/utils';

export interface PharmacyMedicineCardProps {
  medicine: MedicineCatalogItemDto;
  stockStatus?: InventoryStockStatus;
  availableQuantity?: number;
  unitPrice?: number;
  onSelect?: (medicine: MedicineCatalogItemDto) => void;
  actions?: React.ReactNode;
  className?: string;
}

export function PharmacyMedicineCard({
  medicine,
  stockStatus,
  availableQuantity,
  unitPrice,
  onSelect,
  actions,
  className,
}: PharmacyMedicineCardProps) {
  return (
    <Card
      variant={onSelect ? 'interactive' : 'default'}
      onClick={onSelect ? () => onSelect(medicine) : undefined}
      className={cn('p-5 flex flex-col gap-3.5', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary/10 text-secondary"
            aria-hidden="true"
          >
            <Pill className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex flex-col gap-0.5">
            <h3 className="text-card-heading truncate">
              {medicine.brandName || medicine.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {medicine.genericName} • {medicine.strength} ({medicine.dosageForm})
            </p>
          </div>
        </div>
        {stockStatus && <HealthcareStatusBadge status={stockStatus} size="sm" />}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {medicine.requiresPrescription && (
          <Badge variant="warning" size="sm">
            <FileWarning className="h-3 w-3" aria-hidden="true" />
            <span>Rx Required</span>
          </Badge>
        )}
        {medicine.schedule && (
          <Badge variant="outline" size="sm">
            Schedule {medicine.schedule}
          </Badge>
        )}
        {medicine.category && (
          <Badge variant="neutral" size="sm">
            {medicine.category}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/80 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{medicine.manufacturer}</span>
        </span>

        <div className="flex items-center gap-3 tabular-nums shrink-0">
          {availableQuantity !== undefined && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Package className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span>{availableQuantity} units</span>
            </span>
          )}
          {unitPrice !== undefined && (
            <span className="font-semibold text-foreground">₹{unitPrice.toFixed(2)}</span>
          )}
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
