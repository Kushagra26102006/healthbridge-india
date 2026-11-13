'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface RecordsSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RecordsSearch({
  value,
  onChange,
  placeholder = 'Search by title, doctor, facility, or ABDM ID...',
  className = '',
}: RecordsSearchProps) {
  const [searchTerm, setSearchTerm] = useState(value);

  // Sync internal state with external value changes (e.g. url query or reset)
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Debounce input to trigger onChange after 350ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== value) {
        onChange(searchTerm);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, onChange, value]);

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9 h-10 text-xs sm:text-sm bg-background border-border/80 focus-visible:ring-primary/40 rounded-xl"
      />
      {searchTerm && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground rounded-full"
          title="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export default RecordsSearch;

