'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EncounterCard } from './EncounterCard';
import type { EncounterItemDto, PaginationMeta } from '@healthbridge/shared-types';

export interface EncounterListProps {
  encounters: EncounterItemDto[];
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
}

export function EncounterList({
  encounters,
  pagination,
  onPageChange,
}: EncounterListProps) {
  if (encounters.length === 0) {
    return (
      <div className="py-16 text-center space-y-3 bg-card border border-border/80 rounded-2xl p-6">
        <FileText className="h-10 w-10 text-muted-foreground/60 mx-auto" />
        <h3 className="text-base font-bold text-foreground">No Clinical Encounters Found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          No consultation records match your selected filters. Start a new encounter or reset search parameters.
        </p>
        <div className="pt-2">
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-8">
            <Link href="/doctor/encounters/new">
              <Plus className="h-3.5 w-3.5" />
              Start New Encounter
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Encounter Cards */}
      <div className="space-y-3">
        {encounters.map((encounter) => (
          <EncounterCard key={encounter.id} encounter={encounter} />
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
          <span className="text-muted-foreground">
            Showing Page <span className="font-semibold text-foreground">{pagination.page}</span> of{' '}
            <span className="font-semibold text-foreground">{pagination.totalPages}</span> ({pagination.total} total)
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="h-8 px-2.5 text-xs gap-1"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
