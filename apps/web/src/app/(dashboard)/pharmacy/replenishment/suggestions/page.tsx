'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  useReplenishmentSuggestions,
  useConvertSuggestionsToRequisition,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { ReplenishmentSuggestionTable } from '@/components/pharmacy';
import { Button } from '@/components/ui/button';
import type { ConvertSuggestionsToRequisitionDto } from '@healthbridge/shared-types';

export default function AllReplenishmentSuggestionsPage() {
  const router = useRouter();

  const { data: suggestions = [], isLoading, refetch } = useReplenishmentSuggestions({
    onlyBelowReorderLevel: false,
  });

  const convertMutation = useConvertSuggestionsToRequisition();

  const handleConvertToRequisition = async (dto: ConvertSuggestionsToRequisitionDto) => {
    await convertMutation.mutateAsync(dto);
    router.push('/pharmacy/purchases/new');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/pharmacy/replenishment')}
          className="gap-1.5 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Replenishment Overview
        </Button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Comprehensive Inventory Reorder Matrix
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review stock availability across all catalogue medications, including healthy, low, and zero-stock items.
        </p>
      </div>

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
