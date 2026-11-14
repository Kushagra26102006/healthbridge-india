'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  usePurchaseOrder,
  useSuppliers,
  usePharmacyMedicines,
  useUpdatePurchaseOrder,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { PurchaseOrderForm } from '@/components/pharmacy';
import type { CreatePurchaseOrderDto } from '@healthbridge/shared-types';

export default function EditPurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const poId = params.id as string;

  const { data: order, isLoading: isOrderLoading } = usePurchaseOrder(poId);
  const { data: suppliersData } = useSuppliers({ limit: 100 });
  const { data: medicinesData } = usePharmacyMedicines({ limit: 100 });
  const updateMutation = useUpdatePurchaseOrder();

  const handleSubmit = async (dto: CreatePurchaseOrderDto) => {
    await updateMutation.mutateAsync({ id: poId, dto });
    router.push(`/pharmacy/purchases/${poId}`);
  };

  if (isOrderLoading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <p>Loading purchase order...</p>
      </div>
    );
  }

  if (!order || (order.status !== 'DRAFT' && order.status !== 'PENDING_APPROVAL')) {
    return (
      <div className="py-24 text-center text-slate-400">
        <p>Order cannot be edited in current status ({order?.status}).</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/pharmacy/purchases/${poId}`)}
          className="mt-4"
        >
          View Order
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/pharmacy/purchases/${poId}`)}
          className="gap-1.5 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Order
        </Button>
      </div>

      <PurchaseOrderForm
        suppliers={suppliersData?.data || []}
        catalogMedicines={medicinesData?.items || []}
        initialSupplierId={order.supplierId}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/pharmacy/purchases/${poId}`)}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
