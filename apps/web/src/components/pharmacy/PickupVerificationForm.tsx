'use client';

import React, { useState } from 'react';
import type { PharmacyOrderDto, VerifyPickupDto } from '@healthbridge/shared-types';
import {
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Lock,
  User,
} from 'lucide-react';

interface PickupVerificationFormProps {
  order: PharmacyOrderDto;
  onVerify: (dto: VerifyPickupDto) => Promise<void>;
  isSubmitting?: boolean;
}

export function PickupVerificationForm({
  order,
  onVerify,
  isSubmitting = false,
}: PickupVerificationFormProps) {
  const [pickupCode, setPickupCode] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const attemptsMade = order.pickupDetails?.verificationAttempts ?? 0;
  const maxAttempts = order.pickupDetails?.maxAttempts ?? 5;
  const attemptsRemaining = Math.max(0, maxAttempts - attemptsMade);
  const isLockedOut = attemptsRemaining === 0;
  const isAlreadyCompleted = order.status === 'COMPLETED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!pickupCode.trim()) {
      setErrorMsg('Please enter the 6-character pickup verification code.');
      return;
    }

    try {
      await onVerify({
        pickupCode: pickupCode.trim().toUpperCase(),
        handoverNotes: handoverNotes.trim(),
      });
      setSuccessMsg('Pickup code verified successfully! Order handover completed.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the code and try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Authorized Medication Handover Verification</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ask the patient or authorized collector for the secure pickup code shown in their HealthBridge portal.
          </p>
        </div>

        {order.status === 'READY_FOR_PICKUP' && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              attemptsRemaining <= 2
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-teal-50 text-teal-700 border-teal-200'
            }`}
          >
            {attemptsRemaining} / {maxAttempts} Attempts Remaining
          </span>
        )}
      </div>

      <div className="p-5">
        {isAlreadyCompleted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm">Order Already Handed Over & Completed</div>
              <p className="text-emerald-800">
                This order was verified and handed over on{' '}
                {order.pickupDetails?.collectedAt
                  ? new Date(order.pickupDetails.collectedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'earlier date'}
                {order.pickupDetails?.handedOverByName && (
                  <span> by authorized staff member: <strong>{order.pickupDetails.handedOverByName}</strong></span>
                )}
                .
              </p>
              {order.pickupDetails?.handoverNotes && (
                <p className="italic text-emerald-700 mt-1">
                  Handover Notes: &ldquo;{order.pickupDetails.handoverNotes}&rdquo;
                </p>
              )}
            </div>
          </div>
        ) : isLockedOut ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-3">
            <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Pickup Verification Locked</div>
              <p className="text-rose-800 mt-1">
                The maximum number of verification attempts ({maxAttempts}) has been exceeded.
                Automated pickup handover is locked to prevent brute-force attacks.
              </p>
              <p className="text-rose-700 mt-1">
                Please verify the patient&apos;s physical government ID (Aadhaar / Voter ID) and contact the pharmacy manager.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs max-w-lg">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-800 font-semibold mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                <span>Patient Pickup Code</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Code format: PKUP-XXXXXX (or 6-character alphanumeric code presented by customer).
              </p>
              <input
                type="text"
                placeholder="e.g. PKUP-A8F29C"
                value={pickupCode}
                onChange={(e) => setPickupCode(e.target.value)}
                maxLength={20}
                required
                className="w-full font-mono text-base font-bold tracking-wider uppercase p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-semibold mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Handover Notes (Optional)</span>
              </label>
              <textarea
                placeholder="Record collector ID details, family member name, or cold-chain counseling notes..."
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                rows={2}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !pickupCode.trim()}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Verifying Code...' : 'Verify Code & Complete Handover'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

