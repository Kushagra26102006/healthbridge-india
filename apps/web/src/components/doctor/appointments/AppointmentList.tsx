'use client';

import React from 'react';
import { AppointmentCard } from './AppointmentCard';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DoctorAppointmentItemDto, PaginationMeta } from '@healthbridge/shared-types';

export interface AppointmentListProps {
  appointments: DoctorAppointmentItemDto[];
  pagination?: PaginationMeta;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
  emptyMessage?: string;
}

export function AppointmentList({
  appointments,
  pagination,
  isLoading = false,
  onPageChange,
  onRefresh,
  emptyMessage = 'No appointments found matching your criteria.',
}: AppointmentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-muted/40 animate-pulse border border-border/60"
          />
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
          <Calendar className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-foreground">No Appointments Found</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {appointments.map((apt) => (
          <AppointmentCard key={apt.id} appointment={apt} onRefresh={onRefresh} />
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/80 text-xs text-muted-foreground">
          <span>
            Showing Page <strong>{pagination.page}</strong> of{' '}
            <strong>{pagination.totalPages}</strong> ({pagination.total} total)
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!pagination.hasPrevPage}
              onClick={() => onPageChange?.(pagination.page - 1)}
              className="text-xs gap-1 h-8"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange?.(pagination.page + 1)}
              className="text-xs gap-1 h-8"
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

