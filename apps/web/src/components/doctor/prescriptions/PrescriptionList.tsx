'use client';

import React from 'react';
import Link from 'next/link';
import { Pill, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrescriptionCard } from './PrescriptionCard';
import { PrescriptionListItemDto, PaginationMeta } from '@healthbridge/shared-types';

interface PrescriptionListProps {
  prescriptions: PrescriptionListItemDto[];
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

export function PrescriptionList({
  prescriptions,
  meta,
  onPageChange,
  isLoading = false,
}: PrescriptionListProps) {
  if (prescriptions.length === 0 && !isLoading) {
    return (
      <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-card/50 space-y-3">
        <div className="mx-auto w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
          <Pill className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">No prescriptions found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No e-prescriptions match your current filter criteria. You can issue a new digital prescription or adjust your filters.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/doctor/prescriptions/new">
            <Button size="sm" className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-3.5 w-3.5" />
              New Prescription
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentPage = meta?.page || 1;
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.total || prescriptions.length;

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        {prescriptions.map((rx) => (
          <PrescriptionCard key={rx.id} prescription={rx} />
        ))}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between pt-2 px-1 text-xs text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * (meta?.limit || 10) + 1} to{' '}
            {Math.min(currentPage * (meta?.limit || 10), totalItems)} of {totalItems} prescriptions
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="h-8 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>

            <span className="px-2 font-medium text-foreground">
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="h-8 text-xs gap-1"
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