'use client';

import React from 'react';
import type { PharmacyOrderStatus } from '@healthbridge/shared-types';
import {
  Clock,
  Eye,
  CheckCircle,
  Package,
  Boxes,
  MapPin,
  Truck,
  CheckCircle2,
  XCircle,
  Ban,
} from 'lucide-react';

interface OrderStatusBadgeProps {
  status: PharmacyOrderStatus | string;
  className?: string;
  showIcon?: boolean;
}

export function OrderStatusBadge({
  status,
  className = '',
  showIcon = true,
}: OrderStatusBadgeProps) {
  const normalized = (status || 'PENDING').toUpperCase() as PharmacyOrderStatus;

  switch (normalized) {
    case 'PENDING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
        >
          {showIcon && <Clock className="w-3.5 h-3.5" />}
          Pending Review
        </span>
      );

    case 'UNDER_REVIEW':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${className}`}
        >
          {showIcon && <Eye className="w-3.5 h-3.5" />}
          Under Review
        </span>
      );

    case 'ACCEPTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
        >
          {showIcon && <CheckCircle className="w-3.5 h-3.5" />}
          Accepted
        </span>
      );

    case 'PROCESSING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 ${className}`}
        >
          {showIcon && <Package className="w-3.5 h-3.5" />}
          Processing
        </span>
      );

    case 'PARTIALLY_FULFILLED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 ${className}`}
        >
          {showIcon && <Boxes className="w-3.5 h-3.5" />}
          Partially Fulfilled
        </span>
      );

    case 'READY_FOR_PICKUP':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 ${className}`}
        >
          {showIcon && <MapPin className="w-3.5 h-3.5" />}
          Ready for Pickup
        </span>
      );

    case 'DISPATCHED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 ${className}`}
        >
          {showIcon && <Truck className="w-3.5 h-3.5" />}
          Dispatched
        </span>
      );

    case 'COMPLETED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5" />}
          Completed
        </span>
      );

    case 'REJECTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5" />}
          Rejected
        </span>
      );

    case 'CANCELLED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
        >
          {showIcon && <Ban className="w-3.5 h-3.5" />}
          Cancelled
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          {status}
        </span>
      );
  }
}

