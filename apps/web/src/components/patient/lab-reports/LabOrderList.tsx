'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LabOrderCard } from './LabOrderCard';
import type { LabOrderListItemDto, PaginationMeta } from '@healthbridge/shared-types';

export interface LabOrderListProps {
  orders: LabOrderListItemDto[];
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onResetFilters?: () => void;
}

export const LabOrderList: React.FC<LabOrderListProps> = ({
  orders,
  pagination,
  onPageChange,
  onResetFilters,
}) => {
  if (orders.length === 0) {
    return (
      <div className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 max-w-md mx-auto my-6 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
          <ClipboardList className="h-7 w-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            No diagnostic orders found
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            There are currently no diagnostic or laboratory orders matching your selected status filter.
          </p>
        </div>

        {onResetFilters && (
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="gap-2 rounded-xl text-xs"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    );
  }

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const total = pagination?.total || orders.length;
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="space-y-4">
      {/* Order Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <LabOrderCard key={order.id} order={order} />
        ))}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{orders.length}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{total}</span> diagnostic orders
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrevious}
              onClick={() => onPageChange?.(currentPage - 1)}
              className="h-8 gap-1 rounded-lg border-slate-200 dark:border-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => onPageChange?.(currentPage + 1)}
              className="h-8 gap-1 rounded-lg border-slate-200 dark:border-slate-800"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
