'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  usePharmacyOrder,
  useVerifyPickup,
  useMarkReadyForPickup,
} from '@/features/pharmacy/hooks/use-pharmacy';
import {
  OrderStatusBadge,
  PickupManagementPanel,
  PickupVerificationForm,
} from '@/components/pharmacy';
import {
  ArrowLeft,
  MapPin,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function PharmacyOrderPickupPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const { data: order, isLoading, error, refetch } = usePharmacyOrder(orderId);
  const verifyMutation = useVerifyPickup();
  const markReadyMutation = useMarkReadyForPickup();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-slate-100 rounded-xl" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center text-slate-500 space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Order Not Found</h2>
        <Link
          href="/pharmacy/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Orders Queue</span>
        </Link>
      </div>
    );
  }

  const handleVerify = async (dto: any) => {
    await verifyMutation.mutateAsync({ orderId, dto });
    refetch();
  };

  const handleMarkReady = async (dto: any) => {
    await markReadyMutation.mutateAsync({ orderId, dto });
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href={`/pharmacy/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Order #{order.orderNumber}</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-teal-600" />
              <span>In-Store Counter Pickup & Handover</span>
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer: <strong className="text-slate-700">{order.patientName}</strong> • Items: {order.items?.length || 0} medications (₹{order.totalAmount.toFixed(2)})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pickup Management Card */}
      <PickupManagementPanel
        order={order}
        onMarkReady={handleMarkReady}
        isMarking={markReadyMutation.isPending}
      />

      {/* Handover Verification Form */}
      <PickupVerificationForm
        order={order}
        onVerify={handleVerify}
        isSubmitting={verifyMutation.isPending}
      />
    </div>
  );
}

