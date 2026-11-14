'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { usePatientOrderDetail } from '@/features/pharmacy/hooks/use-pharmacy';
import { OrderDetailPanel } from '@/components/pharmacy/OrderDetailPanel';
import {
  ArrowLeft,
  MapPin,
  KeyRound,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function PatientOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const { data: order, isLoading, error, refetch } = usePatientOrderDetail(orderId);

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
          href="/patient/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Orders</span>
        </Link>
      </div>
    );
  }

  const isReady = order.status === 'READY_FOR_PICKUP';

  return (
    <div className="space-y-6">
      {/* Back and Subnav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/patient/orders"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Orders</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/patient/orders/${order.id}/tracking`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Track Order Timeline</span>
          </Link>

          <button
            onClick={() => refetch()}
            className="p-1.5 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Secret Pickup Code Hero Card (Only when READY_FOR_PICKUP) */}
      {isReady && order.pickupDetails?.pickupReference && (
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 rounded-2xl text-white shadow-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-100">
            <KeyRound className="w-4 h-4" />
            <span>Ready for Counter Collection</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Your Pickup Verification Code</h2>
              <p className="text-xs text-teal-100 mt-1 max-w-md">
                Present this code to the pharmacist at the counter. Handover will be completed upon entering this code.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20 text-center">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-white">
                {order.pickupDetails.pickupReference}
              </span>
            </div>
          </div>

          {order.pickupDetails.pickupInstructions && (
            <div className="text-xs text-teal-100 pt-2 border-t border-white/10">
              Note: {order.pickupDetails.pickupInstructions}
            </div>
          )}
        </div>
      )}

      {/* Primary Detail Panel (Privacy-Guarded for Patient) */}
      <OrderDetailPanel order={order} isPatientView={true} />
    </div>
  );
}
