'use client';

import React, { useState } from 'react';
import type { PharmacyOrderDto, OrderReviewDto } from '@healthbridge/shared-types';
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface OrderReviewPanelProps {
  order: PharmacyOrderDto;
  onAccept: (dto: OrderReviewDto) => Promise<void>;
  onReject: (dto: OrderReviewDto) => Promise<void>;
  onRequestClarification?: (notes: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function OrderReviewPanel({
  order,
  onAccept,
  onReject,
  onRequestClarification,
  isSubmitting = false,
}: OrderReviewPanelProps) {
  const [action, setAction] = useState<'ACCEPT' | 'REJECT' | 'CLARIFICATION'>('ACCEPT');
  const [reasonCode, setReasonCode] = useState<OrderReviewDto['reasonCode']>('STOCK_UNAVAILABLE');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('2');
  const [clarificationText, setClarificationText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (action === 'ACCEPT') {
        const estDate = new Date(Date.now() + Number(estimatedHours) * 60 * 60 * 1000).toISOString();
        await onAccept({
          action: 'ACCEPT',
          notes: notes.trim(),
          estimatedReadiness: estDate,
        });
      } else if (action === 'REJECT') {
        if (!reason.trim()) {
          setErrorMsg('A detailed explanation is required when rejecting an order.');
          return;
        }
        await onReject({
          action: 'REJECT',
          reasonCode,
          reason: reason.trim(),
          notes: notes.trim(),
        });
      } else if (action === 'CLARIFICATION') {
        if (!clarificationText.trim()) {
          setErrorMsg('Please specify the clinical clarification needed.');
          return;
        }
        if (onRequestClarification) {
          await onRequestClarification(clarificationText.trim());
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Order Verification & Review</h3>
          <p className="text-xs text-slate-500">
            Verify prescription authenticity, medicine availability, and fulfillment eligibility for Order #{order.orderNumber}.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Toggle Selector */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setAction('ACCEPT')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border font-semibold transition-all cursor-pointer ${
              action === 'ACCEPT'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Accept Order</span>
          </button>

          <button
            type="button"
            onClick={() => setAction('CLARIFICATION')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border font-semibold transition-all cursor-pointer ${
              action === 'CLARIFICATION'
                ? 'bg-purple-50 border-purple-500 text-purple-800 ring-2 ring-purple-500/20 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>Clarification</span>
          </button>

          <button
            type="button"
            onClick={() => setAction('REJECT')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border font-semibold transition-all cursor-pointer ${
              action === 'REJECT'
                ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Reject Order</span>
          </button>
        </div>

        {/* ACCEPT FLOW */}
        {action === 'ACCEPT' && (
          <div className="space-y-3 bg-emerald-50/30 p-3.5 rounded-lg border border-emerald-100">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Estimated Turnaround Time</span>
              </label>
              <select
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
              >
                <option value="1">Within 1 Hour (Urgent / Ready Stock)</option>
                <option value="2">2 Hours (Standard)</option>
                <option value="4">4 Hours (Complex Packing)</option>
                <option value="24">Tomorrow (Inbound Transfer)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Operational Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal packaging instructions or shelf allocation notes..."
                rows={2}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* CLARIFICATION FLOW */}
        {action === 'CLARIFICATION' && (
          <div className="space-y-3 bg-purple-50/30 p-3.5 rounded-lg border border-purple-100">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Clinical Clarification Details
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Document required clinical inquiries (e.g., dosage ambiguity or patient allergy warnings). Note: Pharmacy staff cannot alter doctor instructions directly.
              </p>
              <textarea
                value={clarificationText}
                onChange={(e) => setClarificationText(e.target.value)}
                placeholder="Describe the clinical issue or dosage discrepancy requiring clarification..."
                rows={3}
                required
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* REJECT FLOW */}
        {action === 'REJECT' && (
          <div className="space-y-3 bg-rose-50/30 p-3.5 rounded-lg border border-rose-100">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Rejection Reason Code
              </label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-rose-500"
              >
                <option value="STOCK_UNAVAILABLE">Stock Unavailable (Medication Out of Stock)</option>
                <option value="PRESCRIPTION_EXPIRED">Prescription Expired (Beyond Legal Validity)</option>
                <option value="CLINICAL_CLARIFICATION_NEEDED">Clinical Clarification Unresolved</option>
                <option value="DOSAGE_DISCREPANCY">Severe Dosage Discrepancy</option>
                <option value="OTHER">Other Compliance / Regulatory Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Detailed Explanation (Mandatory)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this order is rejected. This notice will be visible to the patient."
                rows={3}
                required
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 font-semibold text-white rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
              action === 'ACCEPT'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : action === 'CLARIFICATION'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isSubmitting
              ? 'Processing...'
              : action === 'ACCEPT'
              ? 'Confirm Acceptance'
              : action === 'CLARIFICATION'
              ? 'Submit Clarification Request'
              : 'Confirm Rejection'}
          </button>
        </div>
      </form>
    </div>
  );
}
