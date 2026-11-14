'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface PatientSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search patients by name, phone, or ABHA address...',
  className = '',
}) => {
  return (
    <div className={`relative flex-1 ${className}`}>
      <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-muted/30 text-xs rounded-xl pl-10 pr-9 py-2.5 border border-input text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
