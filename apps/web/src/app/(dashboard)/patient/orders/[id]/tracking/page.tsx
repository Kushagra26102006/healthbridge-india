'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  usePatientOrderDetail,
  usePatientOrderTracking,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { PatientOrderTracking } from '@/components/patient/PatientOrderTracking';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function PatientOrderTrackingPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const { data: order, isLoading: isOrderLoading, error } = usePatientOrderDetail(orderId);
  const { data: timeline = [], isLoading: isTimelineLoading } = usePatientOrderTracking(orderId);

  if (isOrderLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="h-48 bg-slate-100 rounded-xl" />
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
          href="/patient/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Orders</span>
        </Link>
      </div>
    );
  }

  return (
    <PatientOrderTracking
      order={order}
      timeline={timeline}
      isLoadingTimeline={isTimelineLoading}
    />
  );
}

