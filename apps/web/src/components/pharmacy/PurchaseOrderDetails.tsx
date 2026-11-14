'use client';

import React from 'react';
import {
  Building2,
  CheckCircle,
  Truck,
  ArrowDownToLine,
  Send,
  XCircle,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PurchaseOrderDto } from '@healthbridge/shared-types';

export interface PurchaseOrderDetailsProps {
  order: PurchaseOrderDto;
  onReceiveGoods?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onSend?: () => void;
  onCancel?: () => void;
  onSubmitForApproval?: () => void;
  isActionLoading?: boolean;
}

export function PurchaseOrderDetails({
  order,
  onReceiveGoods,
  onApprove,
  onReject,
  onSend,
  onCancel,
  onSubmitForApproval,
  isActionLoading = false,
}: PurchaseOrderDetailsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Draft
          </Badge>
        );
      case 'PENDING_APPROVAL':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Pending Approval
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Approved
          </Badge>
        );
      case 'SENT_TO_SUPPLIER':
        return (
          <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            Dispatched to Supplier
          </Badge>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            Partially Received
          </Badge>
        );
      case 'FULLY_RECEIVED':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Fully Received
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Cancelled
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canReceive = ['APPROVED', 'SENT_TO_SUPPLIER', 'PARTIALLY_RECEIVED'].includes(order.status);
  const canApprove = order.status === 'PENDING_APPROVAL';
  const canSend = order.status === 'APPROVED';
  const canSubmit = order.status === 'DRAFT';
  const canCancel = order.status !== 'FULLY_RECEIVED' && order.status !== 'CANCELLED';

  return (
    <div className="space-y-6">
      {/* Top Banner & Primary Actions */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              {order.poNumber}
            </h1>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ordered on{' '}
            {new Date(order.orderDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            by {order.createdByName}
            {order.requisitionNumber && ` • Linked to Requisition: ${order.requisitionNumber}`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canSubmit && onSubmitForApproval && (
            <Button
              onClick={onSubmitForApproval}
              disabled={isActionLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs h-9"
            >
              <Send className="w-3.5 h-3.5" />
              Submit for Approval
            </Button>
          )}

          {canApprove && onApprove && (
            <Button
              onClick={onApprove}
              disabled={isActionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs h-9"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve Order
            </Button>
          )}

          {canApprove && onReject && (
            <Button
              variant="outline"
              onClick={onReject}
              disabled={isActionLoading}
              className="text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 text-xs h-9"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </Button>
          )}

          {canSend && onSend && (
            <Button
              onClick={onSend}
              disabled={isActionLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs h-9"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch to Supplier
            </Button>
          )}

          {canReceive && onReceiveGoods && (
            <Button
              onClick={onReceiveGoods}
              disabled={isActionLoading}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs h-9"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Receive Goods (GRN)
            </Button>
          )}

          {canCancel && onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={isActionLoading}
              className="text-slate-400 hover:text-rose-600 text-xs h-9"
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Supplier & Delivery Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supplier Info */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
            <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Supplier Details</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-bold text-sm text-slate-900 dark:text-white">
              {order.supplierName}
            </p>
            <p className="font-mono text-slate-400">Code: {order.supplierCode}</p>
            {order.supplierGstin && <p>GSTIN: {order.supplierGstin}</p>}
            {order.supplierDrugLicense && <p>Drug License: {order.supplierDrugLicense}</p>}
            {order.supplierEmail && (
              <p className="flex items-center gap-1.5 text-slate-500">
                <Mail className="w-3.5 h-3.5" /> {order.supplierEmail}
              </p>
            )}
            {order.supplierPhone && (
              <p className="flex items-center gap-1.5 text-slate-500">
                <Phone className="w-3.5 h-3.5" /> {order.supplierPhone}
              </p>
            )}
          </div>
        </div>

        {/* Delivery & Terms */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
            <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Delivery & Terms</span>
          </div>
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Terms:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Net {order.paymentTermsDays} Days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Expected Delivery:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {order.expectedDeliveryDate
                  ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Standard Schedule'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                {order.deliveryAddress.line1 ? `${order.deliveryAddress.line1}, ` : ''}
                {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
                {order.deliveryAddress.postalCode}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Line Items Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Order Items & Fulfillment Status
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {order.items.length} {order.items.length === 1 ? 'Line Item' : 'Line Items'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Medication</th>
                <th className="py-3 px-4">Ordered</th>
                <th className="py-3 px-4">Received</th>
                <th className="py-3 px-4">Remaining</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Taxes</th>
                <th className="py-3 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.medicationName}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        {item.strength} • {item.dosageForm} {item.packSize ? `(${item.packSize})` : ''}
                      </p>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {item.orderedQuantity}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={
                        item.receivedQuantity > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                      }
                    >
                      {item.receivedQuantity}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={
                        item.remainingQuantity > 0 ? 'text-amber-600 font-semibold' : 'text-slate-400'
                      }
                    >
                      {item.remainingQuantity}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    ₹{item.unitPrice.toFixed(2)}
                  </td>

                  <td className="py-3 px-4 text-slate-500">
                    {item.taxPercent}% GST (₹{item.itemTax.toFixed(2)})
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                    ₹{item.itemTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex-1 text-slate-500 space-y-1">
            {order.notes && (
              <p>
                <strong>Notes:</strong> {order.notes}
              </p>
            )}
            {order.termsAndConditions && (
              <p>
                <strong>Commercial Terms:</strong> {order.termsAndConditions}
              </p>
            )}
          </div>

          <div className="w-full sm:w-72 space-y-2 shrink-0">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                ₹{order.subtotal.toFixed(2)}
              </span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount Total:</span>
                <span className="font-medium">-₹{order.discountTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Taxes (GST):</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                +₹{order.taxTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Grand Total:</span>
              <span>₹{order.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail: Approval & Cancellation */}
      {(order.approvalDetails || order.cancellationDetails) && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Audit Trail & Approval History
          </h3>
          <div className="space-y-2 text-xs">
            {order.approvalDetails && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Approved by {order.approvalDetails.approverName}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    {new Date(order.approvalDetails.approvedAt).toLocaleString('en-IN')}
                  </p>
                  {order.approvalDetails.comments && (
                    <p className="text-slate-600 dark:text-slate-300 mt-1 italic">
                      &quot;{order.approvalDetails.comments}&quot;
                    </p>
                  )}
                  {order.approvalDetails.rejectedReason && (
                    <p className="text-rose-600 font-medium mt-1">
                      Rejection Reason: {order.approvalDetails.rejectedReason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {order.cancellationDetails && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    Cancelled by {order.cancellationDetails.cancelledByName}
                  </p>
                  <p className="text-[11px] opacity-80">
                    {new Date(order.cancellationDetails.cancelledAt).toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1">Reason: {order.cancellationDetails.reason}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
