'use client';

import React from 'react';
import { Search, X, Filter } from 'lucide-react';

interface MedicationCatalogSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  dosageForm: string;
  onDosageFormChange: (form: string) => void;
  placeholder?: string;
}

export function MedicationCatalogSearch({
  search,
  onSearchChange,
  dosageForm,
  onDosageFormChange,
  placeholder = 'Search by medicine, generic, or brand name (e.g. Paracetamol, Augmentin, Dolo)...',
}: MedicationCatalogSearchProps) {
  const dosageForms = [
    { value: 'ALL', label: 'All Forms' },
    { value: 'TABLET', label: 'Tablets' },
    { value: 'CAPSULE', label: 'Capsules' },
    { value: 'SYRUP', label: 'Syrups' },
    { value: 'INHALER', label: 'Inhalers' },
    { value: 'INJECTION', label: 'Injections' },
    { value: 'OINTMENT', label: 'Ointments' },
    { value: 'DROPS', label: 'Drops' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
          <Filter className="h-3 w-3" />
          <span className="hidden sm:inline">Form:</span>
        </div>
        <select
          value={dosageForm}
          onChange={(e) => onDosageFormChange(e.target.value)}
          aria-label="Filter medications by dosage form"
          className="text-xs py-2 px-3 rounded-xl border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-600"
        >
          {dosageForms.map((df) => (
            <option key={df.value} value={df.value}>
              {df.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}