'use client';

import React, { useState } from 'react';
import type { PharmacyOrderDto, MarkReadyForPickupDto } from '@healthbridge/shared-types';
import {
  MapPin,
  Clock,
  Send,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface PickupManagementPanelProps {
  order: PharmacyOrderDto;
  onMarkReady?: (dto: MarkReadyForPickupDto) => Promise<void>;
  isMarking?: boolean;
}

export function PickupManagementPanel({
  order,
  onMarkReady,
  isMarking = false,
}: PickupManagementPanelProps) {
  const [instructions, setInstructions] = useState(
    order.pickupDetails?.pickupInstructions ||
      'Please present this pickup code at the pharmacy counter along with your photo ID.'
  );
  const [errorMsg, setErrorMsg] = useState('');

  const isReady = order.status === 'READY_FOR_PICKUP';
  const isCompleted = order.status === 'COMPLETED';

  const handleMarkReadySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (onMarkReady) {
        await onMarkReady({
          pickupInstructions: instructions.trim(),
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to mark order ready for pickup');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">In-Store Counter Pickup Management</h3>
        </div>
        <span className="text-[11px] font-medium text-slate-500">
          Order #{order.orderNumber}
        </span>
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Current Readiness Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-slate-500 font-medium">Pickup Status</div>
          <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            {isCompleted ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Handed Over (Completed)
              </span>
            ) : isReady ? (
              <span className="text-teal-700 flex items-center gap-1">
                <Clock className="w-4 h-4 text-teal-600" />
                Awaiting Counter Collection
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-600" />
                Preparing Medications
              </span>
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-slate-500 font-medium">Readiness Expiry</div>
          <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>
              {order.pickupDetails?.expiresAt
                ? new Date(order.pickupDetails.expiresAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '7 Days from Readiness'}
            </span>
          </div>
        </div>
      </div>

      {/* Mark Ready Form (if not yet marked) */}
      {!isReady && !isCompleted && onMarkReady && (
        <form onSubmit={handleMarkReadySubmit} className="space-y-3 pt-2">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Pickup Instructions for Patient
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={isMarking}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isMarking ? 'Generating Pickup Code...' : 'Mark Ready & Notify Patient'}</span>
          </button>
        </form>
      )}

      {/* Pickup Security Notice */}
      <div className="p-3 bg-teal-50/40 border border-teal-200 rounded-lg text-[11px] text-teal-800 space-y-1">
        <div className="font-semibold text-teal-900">Zero-Knowledge Verification Secret</div>
        <p>
          For regulatory security and patient safety under the Drugs & Cosmetics Rules, the secret
          pickup verification code is delivered directly to the patient&apos;s authenticated portal.
          Pharmacy staff must input the code presented by the patient to authorize physical handover.
        </p>
      </div>
    </div>
  );
}

