'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  SlidersHorizontal,
  Boxes,
} from 'lucide-react';
import {
  useReplenishmentSuggestions,
  useConvertSuggestionsToRequisition,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { ReplenishmentSuggestionTable } from '@/components/pharmacy';
import { Button } from '@/components/ui/button';
import type { ConvertSuggestionsToRequisitionDto } from '@healthbridge/shared-types';

export default function ReplenishmentOverviewPage() {
  const router = useRouter();

  const { data: suggestions = [], isLoading, refetch } = useReplenishmentSuggestions({
    onlyBelowReorderLevel: true,
  });

  const convertMutation = useConvertSuggestionsToRequisition();

  const handleConvertToRequisition = async (dto: ConvertSuggestionsToRequisitionDto) => {
    await convertMutation.mutateAsync(dto);
    router.push(`/pharmacy/purchases/new`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <RefreshCw className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Stock Replenishment & Reorder Suggestions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated procurement calculations based on net stock (available − reserved), reorder thresholds, and pending inbound PO quantities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/pharmacy/replenishment/settings">
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              <SlidersHorizontal className="w-4 h-4" />
              Reorder Settings
            </Button>
          </Link>

          <Link href="/pharmacy/replenishment/suggestions">
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              <Boxes className="w-4 h-4" />
              All Stock Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Suggestions Table */}
      <ReplenishmentSuggestionTable
        suggestions={suggestions}
        isLoading={isLoading}
        onRefresh={() => refetch()}
        onConvertToRequisition={handleConvertToRequisition}
        isConverting={convertMutation.isPending}
      />
    </div>
  );
}
