'use client';

import React from 'react';
import { Building2, MapPin, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDoctorScheduleFacilities } from '@/features/doctor/hooks/use-doctor';

interface FacilitySelectorProps {
  selectedFacilityId?: string;
  onSelect: (facilityId: string) => void;
  disabled?: boolean;
}

export function FacilitySelector({
  selectedFacilityId,
  onSelect,
  disabled = false,
}: FacilitySelectorProps) {
  const { facilities, isLoading } = useDoctorScheduleFacilities();

  if (isLoading) {
    return <div className="h-20 bg-muted/40 rounded-xl animate-pulse" />;
  }

  if (facilities.length === 0) {
    return (
      <div className="p-4 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
        No registered facilities found. Practicing under standard hospital credentials.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
        Select Clinical Facility
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {facilities.map((facility) => {
          const isSelected = selectedFacilityId === facility.id;

          return (
            <Card
              key={facility.id}
              onClick={() => !disabled && onSelect(facility.id)}
              className={`p-3.5 cursor-pointer transition-all border ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 dark:border-blue-500 dark:bg-blue-950/20 ring-1 ring-blue-600'
                  : 'border-border/70 hover:border-border hover:bg-muted/30'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 shrink-0 mt-0.5">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{facility.name}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {facility.address || 'Integrated Healthcare Hospital'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                        {facility.type}
                      </Badge>
                      {facility.isPrimary && (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px]"
                        >
                          Primary Clinic
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default FacilitySelector;
