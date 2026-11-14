'use client';

import React from 'react';
import type { PharmacyOrderDto } from '@healthbridge/shared-types';
import {
  X,
  User,
  FileText,
  Truck,
  Store,
  Receipt,
  MapPin,
} from 'lucide-react';

interface OrderDetailModalProps {
  order: PharmacyOrderDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-800">
                  Order Details
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold">
                  {order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Created on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patient Info */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Customer / Patient</span>
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {order.patientName}
              </div>
              {order.patientPhone && (
                <div className="text-xs text-slate-600 mt-1">
                  Phone: {order.patientPhone}
                </div>
              )}
              {order.prescriptionNumber && (
                <div className="mt-2 text-xs flex items-center gap-1.5 text-slate-700">
                  <FileText className="w-3.5 h-3.5 text-sky-600" />
                  <span>Prescription:</span>
                  <span className="font-mono font-medium">
                    {order.prescriptionNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Fulfillment Info */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {order.fulfillmentType === 'HOME_DELIVERY' ? (
                  <Truck className="w-3.5 h-3.5 text-purple-600" />
                ) : (
                  <Store className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>Fulfillment Details</span>
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {order.fulfillmentType === 'HOME_DELIVERY'
                  ? 'Home Delivery'
                  : 'In-Store Pickup'}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Status:{' '}
                <span className="font-semibold text-slate-800">
                  {order.status}
                </span>
              </div>
              {order.deliveryAddress && (
                <div className="mt-2 text-xs text-slate-600 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {order.deliveryAddress.line1}, {order.deliveryAddress.city},{' '}
                    {order.deliveryAddress.state} -{' '}
                    {order.deliveryAddress.postalCode}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Itemized Medicine List */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Order Items ({order.items?.length || 0})
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-500 font-semibold uppercase border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">
                      Medication
                    </th>
                    <th scope="col" className="px-3 py-2.5">
                      Strength & Form
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-center">
                      Qty
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right">
                      Unit Price
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {order.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {item.medicationName}
                        </div>
                        {item.batchNumber && (
                          <div className="text-[11px] font-mono text-slate-400">
                            Batch: {item.batchNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {item.dosageForm} • {item.strength}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-900 font-mono">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        ₹{item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        ₹{item.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Billing & Tax Summary */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-end text-xs space-y-1.5">
            <div className="flex justify-between w-64 text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-900">
                ₹{order.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between w-64 text-slate-600">
              <span>Applicable Tax (GST):</span>
              <span className="font-medium text-slate-900">
                ₹{order.tax.toFixed(2)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between w-64 text-emerald-600">
                <span>Discount Applied:</span>
                <span className="font-medium">-₹{order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between w-64 pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span className="text-sky-700">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Fulfillment Phase 1 Foundation
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close Order
          </button>
        </div>
      </div>
    </div>
  );
};
