'use client';

import React from 'react';
import Link from 'next/link';
import type { PharmacyOrderDto } from '@healthbridge/shared-types';
import { OrderStatusBadge } from './OrderStatusBadge';
import {
  FileText,
  User,
  Stethoscope,
  Calendar,
  AlertTriangle,
  Package,
  MapPin,
  CheckSquare,
} from 'lucide-react';

interface OrderDetailPanelProps {
  order: PharmacyOrderDto;
  isPatientView?: boolean;
}

export function OrderDetailPanel({ order, isPatientView = false }: OrderDetailPanelProps) {
  const isTerminal =
    order.status === 'COMPLETED' || order.status === 'REJECTED' || order.status === 'CANCELLED';

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
              {order.orderNumber}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-slate-500">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Quick Context Actions for Pharmacy Staff */}
        {!isPatientView && !isTerminal && (
          <div className="flex flex-wrap items-center gap-2">
            {(order.status === 'PENDING' || order.status === 'UNDER_REVIEW') && (
              <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium">
                Awaiting Review Decision
              </span>
            )}

            {(order.status === 'ACCEPTED' ||
              order.status === 'PROCESSING' ||
              order.status === 'PARTIALLY_FULFILLED') && (
              <Link
                href={`/pharmacy/orders/${order.id}/fulfillment`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <Package className="w-3.5 h-3.5" />
                Fulfill Items
              </Link>
            )}

            {order.status === 'READY_FOR_PICKUP' && (
              <Link
                href={`/pharmacy/orders/${order.id}/pickup`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <MapPin className="w-3.5 h-3.5" />
                Verify & Handover
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Terminal Rejection / Cancellation Banner */}
      {order.status === 'REJECTED' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-900">Order Rejected by Pharmacy</div>
            <p className="mt-0.5">
              Reason [{order.rejectionReasonCode || 'OTHER'}]: {order.rejectionReason}
            </p>
            {order.rejectedByName && (
              <p className="text-[11px] text-rose-600 mt-1">Reviewed by: {order.rejectedByName}</p>
            )}
          </div>
        </div>
      )}

      {order.status === 'CANCELLED' && (
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-900">Order Cancelled</div>
            <p className="mt-0.5">Reason: {order.cancellationReason || 'No reason provided'}</p>
            {order.cancelledByName && (
              <p className="text-[11px] text-slate-500 mt-1">Cancelled by: {order.cancelledByName}</p>
            )}
          </div>
        </div>
      )}

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Patient Info */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <User className="w-3.5 h-3.5 text-teal-600" />
            <span>Patient Information</span>
          </div>
          <div className="text-sm font-bold text-slate-900">{order.patientName}</div>
          {order.patientPhone && (
            <div className="text-xs text-slate-500 mt-0.5">Phone: {order.patientPhone}</div>
          )}
          <div className="text-xs text-slate-500 mt-1">
            Fulfillment: <strong className="text-slate-700">{order.fulfillmentType === 'HOME_DELIVERY' ? 'Home Delivery' : 'In-Store Pickup'}</strong>
          </div>
        </div>

        {/* Prescription Info */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Prescription Details</span>
          </div>
          {order.prescriptionNumber ? (
            <>
              <div className="font-mono text-xs font-bold text-slate-900">
                #{order.prescriptionNumber}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-slate-400" />
                <span>Dr. {order.doctorName || 'Assigned Physician'}</span>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-400 italic">Direct counter order</div>
          )}
        </div>

        {/* Readiness Info */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span>Fulfillment Scheduling</span>
          </div>
          <div className="text-xs text-slate-600">
            Estimated Readiness:
            <div className="text-xs font-semibold text-slate-900 mt-0.5">
              {order.estimatedReadiness
                ? new Date(order.estimatedReadiness).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Standard 2–4 hours'}
            </div>
          </div>
          {order.pickupDetails?.pickupInstructions && (
            <div className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              {order.pickupDetails.pickupInstructions}
            </div>
          )}
        </div>
      </div>

      {/* Order Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 font-semibold text-xs text-slate-800 bg-slate-50/50 flex items-center justify-between">
          <span>Medications Ordered ({order.items?.length || 0})</span>
          <span className="text-slate-500 text-[11px] font-normal">
            Dosage instructions preserved from doctor&apos;s prescription
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Medication</th>
                <th className="py-2.5 px-4">Dosage / Form</th>
                <th className="py-2.5 px-4 text-center">Requested</th>
                <th className="py-2.5 px-4 text-center">Fulfilled</th>
                <th className="py-2.5 px-4 text-center">Remaining</th>
                <th className="py-2.5 px-4">Batch Number</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items?.map((it, idx) => {
                const reqQty = it.requestedQuantity || it.quantity;
                const fulQty = it.fulfilledQuantity || 0;
                const remQty = it.remainingQuantity !== undefined ? it.remainingQuantity : reqQty;

                return (
                  <tr key={it.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{it.medicationName}</div>
                      {it.instructions && (
                        <div className="text-[11px] text-slate-500 mt-0.5 italic">
                          &ldquo;{it.instructions}&rdquo;
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-700">{it.strength}</div>
                      <div className="text-[11px] text-slate-400">{it.dosageForm}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{reqQty}</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-600">
                      {fulQty}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-amber-600">
                      {remQty}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {it.batchNumber ? (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                          {it.batchNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {it.fulfillmentStatus === 'FULFILLED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Fulfilled
                        </span>
                      ) : it.fulfillmentStatus === 'PARTIALLY_FULFILLED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          Partial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      ₹{it.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex flex-col items-end text-xs">
          <div className="w-64 space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-900">₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST Tax (5%):</span>
              <span className="font-medium text-slate-900">₹{order.tax.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-₹{order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Grand Total:</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Operational Notes (Pharmacy View Only) */}
      {!isPatientView && order.internalOperationalNotes && (
        <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-200 text-xs">
          <div className="font-semibold text-amber-900 flex items-center gap-1.5 mb-1">
            <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
            <span>Pharmacy Internal Operational Notes (Confidential)</span>
          </div>
          <p className="text-amber-800">{order.internalOperationalNotes}</p>
        </div>
      )}
    </div>
  );
}

