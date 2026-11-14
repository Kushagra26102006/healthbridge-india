'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useSuppliers,
  usePharmacyMedicines,
  useCreatePurchaseOrder,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { PurchaseOrderForm } from '@/components/pharmacy';
import type { CreatePurchaseOrderDto } from '@healthbridge/shared-types';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSupplierId = searchParams.get('supplierId') || undefined;

  const { data: suppliersData, isLoading: isSuppliersLoading } = useSuppliers({ limit: 100 });
  const { data: medicinesData, isLoading: isMedicinesLoading } = usePharmacyMedicines({ limit: 100 });
  const createMutation = useCreatePurchaseOrder();

  const handleSubmit = async (dto: CreatePurchaseOrderDto) => {
    const order = await createMutation.mutateAsync(dto);
    router.push(`/pharmacy/purchases/${order.id}`);
  };

  if (isSuppliersLoading || isMedicinesLoading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p>Loading procurement catalog & suppliers...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/pharmacy/purchases')}
          className="gap-1.5 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Create New Purchase Order
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Draft a purchase order to replenish pharmaceuticals from authorized vendors with automated tax and financial calculations.
        </p>
      </div>

      <PurchaseOrderForm
        suppliers={suppliersData?.data || []}
        catalogMedicines={medicinesData?.items || []}
        initialSupplierId={initialSupplierId}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/pharmacy/purchases')}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
