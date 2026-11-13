'use client';

import React from 'react';
import { Filter, RotateCcw, Video, Users, MapPin, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ConsultationType } from '@healthbridge/shared-types';

export interface DoctorFiltersState {
  specialization?: string;
  consultationType?: ConsultationType;
  city?: string;
}

export interface DoctorFiltersProps {
  filters: DoctorFiltersState;
  onFilterChange: (filters: DoctorFiltersState) => void;
  onReset: () => void;
  availableSpecializations?: string[];
  availableCities?: string[];
}

const DEFAULT_SPECIALIZATIONS = [
  'Cardiology',
  'Endocrinology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'General Medicine',
  'Dermatology',
  'Pulmonology',
];

const DEFAULT_CITIES = ['New Delhi', 'Gurugram', 'Noida', 'Bengaluru', 'Mumbai'];

export const DoctorFilters: React.FC<DoctorFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  availableSpecializations = DEFAULT_SPECIALIZATIONS,
  availableCities = DEFAULT_CITIES,
}) => {
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Filter Specialists
          </h3>
          {activeCount > 0 && (
            <Badge variant="secondary" className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs">
              {activeCount} active
            </Badge>
          )}
        </div>

        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset all
          </Button>
        )}
      </div>

      {/* Consultation Mode */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Consultation Mode
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              onFilterChange({
                ...filters,
                consultationType:
                  filters.consultationType === 'IN_PERSON' ? undefined : 'IN_PERSON',
              })
            }
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filters.consultationType === 'IN_PERSON'
                ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/40 dark:border-teal-400 dark:text-teal-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>In-Person Clinic</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onFilterChange({
                ...filters,
                consultationType:
                  filters.consultationType === 'TELECONSULTATION'
                    ? undefined
                    : 'TELECONSULTATION',
              })
            }
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filters.consultationType === 'TELECONSULTATION'
                ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:border-blue-400 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>Teleconsultation</span>
          </button>
        </div>
      </div>

      {/* Specialization Filter */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1">
          <Stethoscope className="h-3 w-3" />
          <span>Specialization</span>
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
          {availableSpecializations.map((spec) => {
            const isSelected = filters.specialization === spec;
            return (
              <button
                key={spec}
                type="button"
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    specialization: isSelected ? undefined : spec,
                  })
                }
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {spec}
              </button>
            );
          })}
        </div>
      </div>

      {/* City Filter */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1">
          <MapPin className="h-3 w-3" />
          <span>City / Region</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {availableCities.map((city) => {
            const isSelected = filters.city === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    city: isSelected ? undefined : city,
                  })
                }
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  isSelected
                    ? 'bg-teal-600 text-white font-medium'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

