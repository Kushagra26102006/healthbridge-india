'use client';

import React from 'react';
import Link from 'next/link';
import type { PharmacyOrderDto, OrderStatusEventDto } from '@healthbridge/shared-types';
import { OrderStatusBadge } from '@/components/pharmacy/OrderStatusBadge';
import {
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

interface PatientOrderTrackingProps {
  order: PharmacyOrderDto;
  timeline?: OrderStatusEventDto[];
  isLoadingTimeline?: boolean;
}

const STEP_DEFINITIONS = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Prescription received by pharmacy' },
  { key: 'ACCEPTED', label: 'Accepted', desc: 'Order approved & scheduled' },
  { key: 'PROCESSING', label: 'Processing', desc: 'Medications checked & packed' },
  { key: 'READY', label: 'Ready for Pickup', desc: 'Ready for counter collection' },
  { key: 'COMPLETED', label: 'Completed', desc: 'Medications collected' },
];

export function PatientOrderTracking({
  order,
  timeline = [],
  isLoadingTimeline = false,
}: PatientOrderTrackingProps) {
  // Determine active step index
  let activeStepIndex = 0;
  if (order.status === 'UNDER_REVIEW') activeStepIndex = 0;
  if (order.status === 'ACCEPTED') activeStepIndex = 1;
  if (order.status === 'PROCESSING' || order.status === 'PARTIALLY_FULFILLED') activeStepIndex = 2;
  if (order.status === 'READY_FOR_PICKUP') activeStepIndex = 3;
  if (order.status === 'COMPLETED') activeStepIndex = 4;

  const isCancelled = order.status === 'CANCELLED';
  const isRejected = order.status === 'REJECTED';
  const isReady = order.status === 'READY_FOR_PICKUP';

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/patient/orders"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Orders</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
              {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Counter Pickup Code Banner if Ready */}
        {isReady && order.pickupDetails?.pickupReference && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1 text-right">
            <div className="text-[11px] font-semibold text-teal-900">Present Code at Counter</div>
            <div className="font-mono text-xl font-bold tracking-wider text-teal-800">
              {order.pickupDetails.pickupReference}
            </div>
          </div>
        )}
      </div>

      {/* Visual Stepper (when not cancelled or rejected) */}
      {!isCancelled && !isRejected ? (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-6">Order Fulfillment Journey</h2>

          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-0">
            {/* Horizontal Line for sm screens */}
            <div className="hidden sm:block absolute left-8 right-8 top-4 h-0.5 bg-slate-200 -z-0" />

            {STEP_DEFINITIONS.map((step, idx) => {
              const isPast = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;

              return (
                <div
                  key={step.key}
                  className="relative z-10 flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center w-full sm:w-1/5"
                >
                  {/* Step Icon Bubble */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-teal-600 text-white ring-4 ring-teal-100 shadow-xs'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>

                  {/* Step Label & Subtext */}
                  <div>
                    <div
                      className={`text-xs font-semibold ${
                        isCurrent
                          ? 'text-teal-700'
                          : isPast
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                      {step.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
          <div className="font-bold text-sm text-rose-950">
            {isRejected ? 'Order Rejected by Pharmacy' : 'Order Cancelled'}
          </div>
          <p>
            {isRejected
              ? `Reason: ${order.rejectionReason || 'Medication unavailable or prescription validation issue'}`
              : `Reason: ${order.cancellationReason || 'Cancelled upon customer or pharmacy request'}`}
          </p>
        </div>
      )}

      {/* Grid: Pharmacy Contact & Real Persisted Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pharmacy Partner Info */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs md:col-span-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Pharmacy Partner</span>
          </h3>

          <div className="space-y-1">
            <div className="font-semibold text-slate-900 text-sm">
              {order.pharmacyName || 'HealthBridge Pharmacy Partner'}
            </div>
            <div className="text-slate-500">
              {order.fulfillmentType === 'HOME_DELIVERY' ? 'Home Delivery' : 'In-Store Counter Collection'}
            </div>
          </div>

          {order.prescriptionNumber && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-slate-600">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Prescription #{order.prescriptionNumber}</span>
            </div>
          )}

          {order.pickupDetails?.pickupInstructions && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800">Collection Instructions:</div>
              <p>{order.pickupDetails.pickupInstructions}</p>
            </div>
          )}
        </div>

        {/* Real Persisted Event Stepper */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs md:col-span-2 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Persisted Fulfillment Event Log</span>
          </h3>

          {isLoadingTimeline ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : timeline.length === 0 ? (
            <p className="text-slate-400 text-xs italic">No event history available.</p>
          ) : (
            <div className="space-y-4 border-l-2 border-slate-200 pl-4 ml-2">
              {timeline.map((evt, idx) => (
                <div key={evt.id || idx} className="relative space-y-0.5">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-teal-600" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {evt.newStatus.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(evt.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      ,{' '}
                      {new Date(evt.timestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  {evt.reason && <p className="text-slate-600 text-[11px]">{evt.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
