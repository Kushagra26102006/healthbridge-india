'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';
import type {
  AbhaAddressAvailabilityDto,
  AbhaOtpInitiationResultDto,
  AbhaOtpSystem,
  AbhaVerificationOutcomeDto,
} from '@healthbridge/shared-types';
import { abhaApi, extractAbhaErrorMessage } from '@/features/abdm/api/abha-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PatientAbhaVerificationPage() {
  // Address availability lookup state
  const [checkAddressInput, setCheckAddressInput] = useState('');
  const [availability, setAvailability] = useState<AbhaAddressAvailabilityDto | null>(null);
  const [checkingAddress, setCheckingAddress] = useState(false);

  // Quick verification state
  const [verifyTarget, setVerifyTarget] = useState<'NUMBER' | 'ADDRESS'>('NUMBER');
  const [identifierInput, setIdentifierInput] = useState('');
  const [otpSystem, setOtpSystem] = useState<AbhaOtpSystem>('abdm');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [otpInit, setOtpInit] = useState<AbhaOtpInitiationResultDto | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [outcome, setOutcome] = useState<AbhaVerificationOutcomeDto | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAvailability(null);
    setCheckingAddress(true);
    try {
      const res = await abhaApi.checkAddressAvailability(checkAddressInput.trim().toLowerCase());
      setAvailability(res);
    } catch (err) {
      setError(extractAbhaErrorMessage(err, 'Failed to check ABHA address availability.'));
    } finally {
      setCheckingAddress(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOutcome(null);
    setSubmitting(true);
    try {
      const res =
        verifyTarget === 'NUMBER'
          ? await abhaApi.initiateNumberVerification({
              abhaNumber: identifierInput.trim(),
              otpSystem,
              patientConsentConfirmed: true,
            })
          : await abhaApi.initiateAddressVerification({
              abhaAddress: identifierInput.trim().toLowerCase(),
              otpSystem,
              patientConsentConfirmed: true,
            });
      setOtpInit(res);
    } catch (err) {
      setError(extractAbhaErrorMessage(err, 'Failed to start ABHA verification.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInit) return;
    setError(null);
    setSubmitting(true);
    try {
      const res =
        verifyTarget === 'NUMBER'
          ? await abhaApi.confirmNumberVerification({
              internalTransactionId: otpInit.internalTransactionId,
              otp: otpCode.trim(),
            })
          : await abhaApi.confirmAddressVerification({
              internalTransactionId: otpInit.internalTransactionId,
              otp: otpCode.trim(),
            });
      setOutcome(res);
      setOtpInit(null);
      setOtpCode('');
    } catch (err) {
      setError(extractAbhaErrorMessage(err, 'OTP verification failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <Link href="/patient/abha">
          <Button variant="outline" size="sm" className="gap-1.5 h-8">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to ABHA Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-teal-600" />
          ABHA Verification &amp; Address Checker
        </h1>
        <p className="text-sm text-slate-500">
          Syntax alone never proves ABHA ownership. Verify your ABHA Number or ABHA Address through
          an official ABDM V3 OTP workflow.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900 p-4 text-sm text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: ABHA Ownership Verification */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-teal-600" />
            Verify ABHA Ownership (OTP)
          </h2>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={verifyTarget === 'NUMBER' ? 'default' : 'outline'}
              onClick={() => {
                setVerifyTarget('NUMBER');
                setOtpInit(null);
                setOutcome(null);
              }}
            >
              ABHA Number
            </Button>
            <Button
              type="button"
              size="sm"
              variant={verifyTarget === 'ADDRESS' ? 'default' : 'outline'}
              onClick={() => {
                setVerifyTarget('ADDRESS');
                setOtpInit(null);
                setOutcome(null);
              }}
            >
              ABHA Address
            </Button>
          </div>

          {!otpInit ? (
            <form onSubmit={handleRequestOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {verifyTarget === 'NUMBER' ? '14-Digit ABHA Number' : 'ABHA Address'}
                </label>
                <input
                  type="text"
                  required
                  value={identifierInput}
                  onChange={(e) => setIdentifierInput(e.target.value)}
                  placeholder={verifyTarget === 'NUMBER' ? '91-0000-0001-2345' : 'user@sbx'}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  OTP System
                </label>
                <select
                  value={otpSystem}
                  onChange={(e) => setOtpSystem(e.target.value as AbhaOtpSystem)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="abdm">ABHA Mobile OTP (abdm)</option>
                  <option value="aadhaar">Aadhaar Mobile OTP (aadhaar)</option>
                </select>
              </div>
              <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300"
                />
                <span>I authorize initiating OTP verification for this ABHA identifier.</span>
              </label>
              <Button
                type="submit"
                disabled={submitting || !consentConfirmed}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                {submitting ? 'Sending OTP...' : 'Send Verification OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleConfirmOtp} className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {otpInit.maskedDestinationMessage}
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base font-mono tracking-widest"
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={submitting || otpCode.length !== 6}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {submitting ? 'Verifying...' : 'Confirm OTP'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOtpInit(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {outcome && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Ownership Verified
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 border-none font-mono text-[10px]">
                  {outcome.verificationStatus}
                </Badge>
              </div>
              <p>Masked ABHA: {outcome.maskedAbhaNumber || '—'}</p>
              <p>ABHA Address: {outcome.abhaAddress || '—'}</p>
              <p className="font-mono text-[10px] text-slate-500">
                Correlation: {outcome.correlationId}
              </p>
            </div>
          )}
        </div>

        {/* Card 2: ABHA Address Availability Lookup */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="h-4 w-4 text-teal-600" />
            Check ABHA Address Availability
          </h2>
          <p className="text-xs text-slate-500">
            Verify whether an ABHA Address (<code>@sbx</code> in sandbox, <code>@abdm</code> in
            production) already exists via official V3 <code>isExists</code> check.
          </p>

          <form onSubmit={handleCheckAddress} className="space-y-3">
            <input
              type="text"
              required
              value={checkAddressInput}
              onChange={(e) => setCheckAddressInput(e.target.value)}
              placeholder="e.g., myname.health@sbx"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
            />
            <Button
              type="submit"
              disabled={checkingAddress}
              variant="outline"
              className="w-full gap-2"
            >
              <Search className="h-4 w-4" />
              {checkingAddress ? 'Checking...' : 'Check Availability'}
            </Button>
          </form>

          {availability && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {availability.abhaAddress}
                </span>
                <Badge
                  className={
                    availability.exists
                      ? 'bg-amber-100 text-amber-800 border-none'
                      : 'bg-emerald-100 text-emerald-800 border-none'
                  }
                >
                  {availability.exists ? 'ALREADY REGISTERED' : 'AVAILABLE'}
                </Badge>
              </div>
              <p className="text-slate-500">
                {availability.exists
                  ? 'This ABHA address already exists. If it belongs to you, verify ownership via OTP to link it.'
                  : 'This ABHA address appears available for creation during ABHA enrolment.'}
              </p>
              <p className="font-mono text-[10px] text-slate-400">
                Correlation: {availability.correlationId} •{' '}
                {availability.isMocked ? 'SYNTHETIC MOCK' : 'SANDBOX'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
