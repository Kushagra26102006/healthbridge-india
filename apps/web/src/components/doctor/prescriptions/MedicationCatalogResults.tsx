'use client';

import React from 'react';
import { Pill, Plus, Building2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MedicationCatalogItemDto } from '@healthbridge/shared-types';

interface MedicationCatalogResultsProps {
  items: MedicationCatalogItemDto[];
  isLoading?: boolean;
  onSelect?: (item: MedicationCatalogItemDto) => void;
  selectedId?: string;
}

export function MedicationCatalogResults({
  items,
  isLoading = false,
  onSelect,
  selectedId,
}: MedicationCatalogResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 py-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-3 rounded-xl border border-border/60 bg-card animate-pulse space-y-2">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-3 w-64 bg-muted/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-8 text-center rounded-xl border border-dashed border-border/80 bg-card/40 p-4 space-y-2">
        <Pill className="h-5 w-5 text-muted-foreground mx-auto" />
        <p className="text-xs font-semibold text-foreground">No catalog medications found</p>
        <p className="text-[11px] text-muted-foreground">
          Try a different medicine name, brand, or generic composition.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
      {items.map((item) => {
        const isSelected = selectedId === item.id;

        return (
          <div
            key={item.id}
            onClick={() => onSelect?.(item)}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              isSelected
                ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/20 ring-1 ring-blue-600/30'
                : 'border-border/70 hover:border-border bg-card hover:bg-muted/20'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-xs text-foreground truncate">
                    {item.name}
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {item.dosageForm}
                  </Badge>
                  {item.schedule.includes('H1') && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">
                      <ShieldAlert className="h-2.5 w-2.5 mr-0.5 inline" />
                      Sch H1
                    </Badge>
                  )}
                </div>

                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  {item.genericName} &bull; {item.strength}
                </p>

                <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1 truncate">
                    <Building2 className="h-3 w-3" />
                    {item.manufacturer}
                  </span>
                  <span>&bull;</span>
                  <span>{item.packageSize}</span>
                </div>
              </div>

              {onSelect && (
                <Button
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  className={`h-7 px-2 text-[11px] shrink-0 gap-1 ${
                    isSelected ? 'bg-blue-600 text-white' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(item);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Select
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}