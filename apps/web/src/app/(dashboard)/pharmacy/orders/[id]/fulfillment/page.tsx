'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  usePharmacyOrder,
  useUpdateOrderFulfillment,
  useMarkReadyForPickup,
} from '@/features/pharmacy/hooks/use-pharmacy';
import {
  OrderStatusBadge,
  FulfillmentProgress,
} from '@/components/pharmacy';
import {
  ArrowLeft,
  Package,
  MapPin,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function PharmacyOrderFulfillmentPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const { data: order, isLoading, error, refetch } = usePharmacyOrder(orderId);
  const fulfillmentMutation = useUpdateOrderFulfillment();
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

  const handleLinkDispensing = async (dispensingRecordId: string) => {
    await fulfillmentMutation.mutateAsync({
      orderId,
      dto: { dispensingRecordId },
    });
    refetch();
  };

  const handleMarkReady = async () => {
    await markReadyMutation.mutateAsync({
      orderId,
      dto: {
        pickupInstructions: 'Medications packed and labeled for counter collection.',
      },
    });
    refetch();
  };

  const isReady = order.status === 'READY_FOR_PICKUP';
  const isCompleted = order.status === 'COMPLETED';

  return (
    <div className="space-y-6">
      {/* Top Header */}
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
              <Package className="w-6 h-6 text-sky-600" />
              <span>Order Packaging & Fulfillment Console</span>
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Patient: <strong className="text-slate-700">{order.patientName}</strong> • Prescription: #{order.prescriptionNumber || 'Direct'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isReady && !isCompleted && (
            <button
              onClick={handleMarkReady}
              disabled={markReadyMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{markReadyMutation.isPending ? 'Marking...' : 'Mark Ready for Pickup'}</span>
            </button>
          )}

          {isReady && (
            <Link
              href={`/pharmacy/orders/${order.id}/pickup`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Go to Counter Pickup</span>
            </Link>
          )}

          <button
            onClick={() => refetch()}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fulfillment Progress Component */}
      <FulfillmentProgress
        order={order}
        onLinkDispensingRecord={handleLinkDispensing}
        isLinking={fulfillmentMutation.isPending}
      />
    </div>
  );
}
