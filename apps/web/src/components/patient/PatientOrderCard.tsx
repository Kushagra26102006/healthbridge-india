'use client';

import React from 'react';
import Link from 'next/link';
import type { PharmacyOrderDto } from '@healthbridge/shared-types';
import { OrderStatusBadge } from '@/components/pharmacy/OrderStatusBadge';
import {
  Building2,
  Calendar,
  MapPin,
  ChevronRight,
  KeyRound,
  XCircle,
} from 'lucide-react';

interface PatientOrderCardProps {
  order: PharmacyOrderDto;
  onCancelClick?: (order: PharmacyOrderDto) => void;
}

export function PatientOrderCard({ order, onCancelClick }: PatientOrderCardProps) {
  const isReady = order.status === 'READY_FOR_PICKUP';
  const canCancel =
    order.status === 'PENDING' || order.status === 'UNDER_REVIEW' || order.status === 'ACCEPTED';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm sm:text-base font-bold text-slate-900">
                {order.orderNumber}
              </span>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm sm:text-base font-bold text-slate-900">
              ₹{order.totalAmount.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400">
              {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {/* Pharmacy Details */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
            <div>
              <div className="font-semibold text-slate-900">
                {order.pharmacyName || 'HealthBridge Pharmacy Partner'}
              </div>
              <div className="text-[11px] text-slate-500">
                {order.fulfillmentType === 'HOME_DELIVERY' ? 'Home Delivery' : 'In-Store Counter Pickup'}
              </div>
            </div>
          </div>
        </div>

        {/* Secret Pickup Code Banner (Visible to Patient when READY_FOR_PICKUP) */}
        {isReady && order.pickupDetails?.pickupReference && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-teal-900 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-700" />
                Your Counter Pickup Code:
              </span>
              <span className="font-mono text-sm font-bold tracking-wider text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-300">
                {order.pickupDetails.pickupReference}
              </span>
            </div>
            <p className="text-[11px] text-teal-700">
              {order.pickupDetails.pickupInstructions || 'Show this code at the pharmacy counter.'}
            </p>
          </div>
        )}

        {/* Items Summary */}
        <div className="space-y-1 text-xs">
          <div className="text-slate-500 font-medium text-[11px]">Medications:</div>
          <div className="flex flex-wrap gap-1.5">
            {order.items?.slice(0, 3).map((it, idx) => (
              <span
                key={it.id || idx}
                className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium"
              >
                {it.medicationName} ({it.requestedQuantity || it.quantity})
              </span>
            ))}
            {(order.items?.length || 0) > 3 && (
              <span className="text-slate-400 text-[11px] px-1 py-0.5">
                +{(order.items?.length || 0) - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <div>
          {canCancel && onCancelClick && (
            <button
              onClick={() => onCancelClick(order)}
              className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/patient/orders/${order.id}/tracking`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Track</span>
          </Link>

          <Link
            href={`/patient/orders/${order.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
