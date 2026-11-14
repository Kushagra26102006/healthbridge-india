'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  usePurchaseOrder,
  useApprovePurchaseOrder,
  useRejectPurchaseOrder,
  useSendPurchaseOrder,
  useSubmitPurchaseOrder,
  useCancelPurchaseOrder,
} from '@/features/pharmacy/hooks/use-pharmacy';
import {
  PurchaseOrderDetails,
  PurchaseApprovalPanel,
} from '@/components/pharmacy';

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const poId = params.id as string;

  const [isApprovalOpen, setIsApprovalOpen] = useState(false);

  const { data: order, isLoading, refetch } = usePurchaseOrder(poId);
  const approveMutation = useApprovePurchaseOrder();
  const rejectMutation = useRejectPurchaseOrder();
  const sendMutation = useSendPurchaseOrder();
  const submitMutation = useSubmitPurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p>Loading purchase order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-24 text-center text-slate-400">
        <p>Purchase order not found or you lack permission to view it.</p>
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

  const handleReceiveGoods = () => {
    router.push(`/pharmacy/purchases/${poId}/receive`);
  };

  const handleSend = async () => {
    await sendMutation.mutateAsync(poId);
    refetch();
  };

  const handleSubmitForApproval = async () => {
    await submitMutation.mutateAsync(poId);
    refetch();
  };

  const handleCancel = async () => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason || !reason.trim()) return;
    await cancelMutation.mutateAsync({ id: poId, reason: reason.trim() });
    refetch();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/pharmacy/purchases')}
          className="gap-1.5 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Button>
      </div>

      <PurchaseOrderDetails
        order={order}
        onReceiveGoods={handleReceiveGoods}
        onApprove={() => setIsApprovalOpen(true)}
        onReject={() => setIsApprovalOpen(true)}
        onSend={handleSend}
        onSubmitForApproval={handleSubmitForApproval}
        onCancel={handleCancel}
        isActionLoading={
          approveMutation.isPending ||
          rejectMutation.isPending ||
          sendMutation.isPending ||
          submitMutation.isPending ||
          cancelMutation.isPending
        }
      />

      <PurchaseApprovalPanel
        order={order}
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        onApprove={async (id, comments) => {
          await approveMutation.mutateAsync({ id, dto: { comments } });
          refetch();
        }}
        onReject={async (id, reason) => {
          await rejectMutation.mutateAsync({ id, dto: { reason } });
          refetch();
        }}
        isLoading={approveMutation.isPending || rejectMutation.isPending}
      />
    </div>
  );
}
