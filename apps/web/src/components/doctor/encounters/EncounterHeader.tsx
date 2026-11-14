'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EncounterHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function EncounterHeader({ onRefresh, isRefreshing = false }: EncounterHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          Clinical Encounters
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review and document your patient consultations.
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center">
        {onRefresh && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}

        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-8 shadow-sm">
          <Link href="/doctor/encounters/new">
            <Plus className="h-3.5 w-3.5" />
            New Encounter
          </Link>
        </Button>
      </div>
    </div>
  );
}
