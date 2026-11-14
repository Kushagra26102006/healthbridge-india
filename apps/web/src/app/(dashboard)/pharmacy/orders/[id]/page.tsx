'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  usePharmacyOrder,
  usePharmacyOrderTimeline,
  useReviewPharmacyOrder,
  useRequestOrderClarification,
} from '@/features/pharmacy/hooks/use-pharmacy';
import {
  OrderDetailPanel,
  OrderReviewPanel,
  OrderTimeline,
} from '@/components/pharmacy';
import {
  ArrowLeft,
  Package,
  MapPin,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function PharmacyOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const { data: order, isLoading, error, refetch } = usePharmacyOrder(orderId);
  const { data: timeline = [], isLoading: isTimelineLoading, refetch: refetchTimeline } =
    usePharmacyOrderTimeline(orderId);

  const reviewMutation = useReviewPharmacyOrder();
  const clarificationMutation = useRequestOrderClarification();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center text-slate-500 space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Order Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested pharmacy order does not exist or you lack permission to view it.
        </p>
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

  const isPendingOrReview = order.status === 'PENDING' || order.status === 'UNDER_REVIEW';
  const isReady = order.status === 'READY_FOR_PICKUP';
  const isProcessing =
    order.status === 'ACCEPTED' ||
    order.status === 'PROCESSING' ||
    order.status === 'PARTIALLY_FULFILLED';

  const handleAccept = async (dto: any) => {
    await reviewMutation.mutateAsync({ orderId, dto });
    refetch();
    refetchTimeline();
  };

  const handleReject = async (dto: any) => {
    await reviewMutation.mutateAsync({ orderId, dto });
    refetch();
    refetchTimeline();
  };

  const handleClarification = async (notes: string) => {
    await clarificationMutation.mutateAsync({ orderId, dto: { notes } });
    refetch();
    refetchTimeline();
  };

  return (
    <div className="space-y-6">
      {/* Back and Subnav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/pharmacy/orders"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Orders Queue</span>
        </Link>

        <div className="flex items-center gap-2">
          {isProcessing && (
            <Link
              href={`/pharmacy/orders/${order.id}/fulfillment`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Fulfill Order</span>
            </Link>
          )}

          {isReady && (
            <Link
              href={`/pharmacy/orders/${order.id}/pickup`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Counter Pickup</span>
            </Link>
          )}

          <button
            onClick={() => {
              refetch();
              refetchTimeline();
            }}
            className="p-1.5 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Refresh Order"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Review Workflow Section (Only for PENDING or UNDER_REVIEW) */}
      {isPendingOrReview && (
        <OrderReviewPanel
          order={order}
          onAccept={handleAccept}
          onReject={handleReject}
          onRequestClarification={handleClarification}
          isSubmitting={reviewMutation.isPending || clarificationMutation.isPending}
        />
      )}

      {/* Primary Order Detail Panel */}
      <OrderDetailPanel order={order} />

      {/* Real Persisted Event Timeline */}
      <OrderTimeline timeline={timeline} isLoading={isTimelineLoading} />
    </div>
  );
}

