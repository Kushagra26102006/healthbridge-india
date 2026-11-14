'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePurchaseOrder, useReceiveGoods } from '@/features/pharmacy/hooks/use-pharmacy';
import { GoodsReceivingForm } from '@/components/pharmacy';
import type { ReceiveGoodsDto } from '@healthbridge/shared-types';

export default function ReceiveGoodsPage() {
  const params = useParams();
  const router = useRouter();
  const poId = params.id as string;

  const { data: order, isLoading } = usePurchaseOrder(poId);
  const receiveMutation = useReceiveGoods();

  const handleSubmit = async (dto: ReceiveGoodsDto) => {
    await receiveMutation.mutateAsync({ poId, dto });
    router.push(`/pharmacy/purchases/${poId}`);
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p>Loading purchase order for goods receipt...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-24 text-center text-slate-400">
        <p>Purchase order not found.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/pharmacy/purchases')}
          className="mt-4"
        >
          Return to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/pharmacy/purchases/${poId}`)}
          className="gap-1.5 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Order {order.poNumber}
        </Button>
      </div>

      <GoodsReceivingForm
        order={order}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/pharmacy/purchases/${poId}`)}
        isLoading={receiveMutation.isPending}
      />
    </div>
  );
}
