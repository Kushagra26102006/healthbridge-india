'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Fingerprint,
  Lock,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Link2,
} from 'lucide-react';
import type {
  AbhaLinkStatusDto,
  AbhaOtpInitiationResultDto,
  AbhaOtpSystem,
  AbhaVerificationOutcomeDto,
} from '@healthbridge/shared-types';
import { abhaApi, extractAbhaErrorMessage } from '@/features/abdm/api/abha-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type LinkingFlowMode = 'VERIFY_NUMBER' | 'VERIFY_ADDRESS' | 'CREATE_AADHAAR';

export default function PatientAbhaLinkPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [mode, setMode] = useState<LinkingFlowMode>('VERIFY_NUMBER');

  // Step 1 consent
  const [consentChecked, setConsentChecked] = useState(false);
  const [purposeChecked, setPurposeChecked] = useState(false);

  // Step 2 inputs
  const [abhaNumber, setAbhaNumber] = useState('');
  const [abhaAddress, setAbhaAddress] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSystem, setOtpSystem] = useState<AbhaOtpSystem>('abdm');

  // Step 3 OTP verification
  const [otpInit, setOtpInit] = useState<AbhaOtpInitiationResultDto | null>(null);
  const [otp, setOtp] = useState('');
  const [enrolConsentAccepted, setEnrolConsentAccepted] = useState(false);

  // Step 4 confirmation & optional ABHA address creation
  const [outcome, setOutcome] = useState<AbhaVerificationOutcomeDto | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chosenAddress, setChosenAddress] = useState('');
  const [linkedStatus, setLinkedStatus] = useState<AbhaLinkStatusDto | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitiateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let res: AbhaOtpInitiationResultDto;
      if (mode === 'VERIFY_NUMBER') {
        res = await abhaApi.initiateNumberVerification({
          abhaNumber: abhaNumber.trim(),
          otpSystem,
          patientConsentConfirmed: true,
        });
      } else if (mode === 'VERIFY_ADDRESS') {
        res = await abhaApi.initiateAddressVerification({
          abhaAddress: abhaAddress.trim().toLowerCase(),
          otpSystem,
          patientConsentConfirmed: true,
        });
      } else {
        res = await abhaApi.initiateCreation({
          method: 'AADHAAR_OTP',
          aadhaarNumber: aadhaarNumber.replace(/[\s-]/g, ''),
          patientConsentConfirmed: true,
        });
      }
      setOtpInit(res);
      setStep(3);
    } catch (err) {
      setError(extractAbhaErrorMessage(err, 'Could not initiate ABHA verification workflow.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInit) return;
    setError(null);
    setSubmitting(true);

    try {
      let res: AbhaVerificationOutcomeDto;
      if (mode === 'VERIFY_NUMBER') {
        res = await abhaApi.confirmNumberVerification({
          internalTransactionId: otpInit.internalTransactionId,
          otp: otp.trim(),
        });
      } else if (mode === 'VERIFY_ADDRESS') {
        res = await abhaApi.confirmAddressVerification({
          internalTransactionId: otpInit.internalTransactionId,
          otp: otp.trim(),
        });
      } else {
        res = await abhaApi.completeCreation({
          internalTransactionId: otpInit.internalTransactionId,
          otp: otp.trim(),
          mobileNumber: mobileNumber.trim() || undefined,
          consentAccepted: true,
        });
        try {
          const sug = await abhaApi.getAddressSuggestions(otpInit.internalTransactionId);
          setSuggestions(sug.suggestions);
        } catch {
          setSuggestions([]);
        }
      }
      setOutcome(res);
      setStep(4);
    } catch (err) {
      setError(extractAbhaErrorMessage(err, 'OTP verification failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCustomAddress = async () => {
    if (!outcome || !chosenAddress.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const created = await abhaApi.createAddress({
        internalTransactionId: outcome.internalTransactionId,
        abhaAddress: chosenAddress.trim().toLowerCase(),
        preferred: true,
      });
      setOutcome({ ...outcome, abhaAddress: created.abhaAddress });
      setChosenAddress('');
    } catch (err) {
      setError(extractAbhaErrorMessage(err, 'Unable to assign ABHA address.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmLink = async () => {
    if (!outcome) return;
    setError(null);
    setSubmitting(true);
    try {
      const linked = await abhaApi.confirmLink({
        internalTransactionId: outcome.internalTransactionId,
        patientConsentConfirmed: true,
        purposeAcknowledged: true,
      });
      setLinkedStatus(linked);
    } catch (err) {
      setError(extractAbhaErrorMessage(err, 'Unable to complete ABHA identity linking.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Link href="/patient/abha">
          <Button variant="outline" size="sm" className="gap-1.5 h-8">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to ABHA Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Link2 className="h-6 w-6 text-teal-600" />
          Link or Create ABHA Identity
        </h1>
        <p className="text-sm text-slate-500">
          Follow the verified ABDM ABHA V3 workflow to verify ownership and link your ABHA identity
          to HealthBridge India.
        </p>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        {[
          { n: 1, label: '1. Consent' },
          { n: 2, label: '2. Method' },
          { n: 3, label: '3. Verify OTP' },
          { n: 4, label: '4. Confirm Link' },
        ].map((item) => (
          <div
            key={item.n}
            className={`rounded-lg px-3 py-2 text-center font-medium border ${
              step >= item.n
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200'
                : 'border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900 p-4 text-sm text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: EXPLANATION & EXPLICIT AUTHORIZATION */}
      {step === 1 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-teal-600" />
              What ABHA Linking Means &amp; What Information Is Used
            </h2>
            <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-1.5">
              <li>
                <strong>Identity Verification Only:</strong> Your ABHA Number or ABHA Address is
                verified through an official ABDM OTP challenge so nobody else can claim your
                identity.
              </li>
              <li>
                <strong>Privacy Protection:</strong> Aadhaar numbers and OTPs are RSA-encrypted in
                transit, never written to application logs, and never stored in HealthBridge.
              </li>
              <li>
                <strong>No Automatic Medical Record Sharing:</strong> Linking your ABHA identity
                does <em>not</em> grant doctors, hospitals, or third parties access to your medical
                records. Record sharing always requires a separate consent request.
              </li>
            </ul>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-1 rounded border-slate-300"
              />
              <span>
                I explicitly authorize HealthBridge India to initiate ABHA identity verification on
                my behalf using the official ABDM V3 workflow.
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={purposeChecked}
                onChange={(e) => setPurposeChecked(e.target.checked)}
                className="mt-1 rounded border-slate-300"
              />
              <span>
                I understand that ABHA identity linking connects my identity only and does not
                authorize sharing of my medical records.
              </span>
            </label>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={!consentChecked || !purposeChecked}
              onClick={() => setStep(2)}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              Continue to Verification Method
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT VERIFIED WORKFLOW & INITIATE OTP */}
      {step === 2 && (
        <form
          onSubmit={handleInitiateOtp}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Choose Official ABHA V3 Workflow
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Use synthetic sandbox identities only during development and sandbox testing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'VERIFY_NUMBER' as const,
                title: 'Link ABHA Number',
                desc: '14-digit ABHA + OTP',
              },
              {
                id: 'VERIFY_ADDRESS' as const,
                title: 'Link ABHA Address',
                desc: 'user@sbx / @abdm + OTP',
              },
              {
                id: 'CREATE_AADHAAR' as const,
                title: 'Create New ABHA',
                desc: 'Aadhaar OTP (V3 byAadhaar)',
              },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setMode(option.id)}
                className={`rounded-xl border p-3.5 text-left transition-colors ${
                  mode === option.id
                    ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {option.title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{option.desc}</p>
              </button>
            ))}
          </div>

          {mode === 'VERIFY_NUMBER' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  14-Digit ABHA Number
                </label>
                <input
                  type="text"
                  required
                  value={abhaNumber}
                  onChange={(e) => setAbhaNumber(e.target.value)}
                  placeholder="91-0000-0001-2345"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  OTP Delivery System
                </label>
                <select
                  value={otpSystem}
                  onChange={(e) => setOtpSystem(e.target.value as AbhaOtpSystem)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="abdm">ABHA Registered Mobile OTP (abdm)</option>
                  <option value="aadhaar">Aadhaar Registered Mobile OTP (aadhaar)</option>
                </select>
              </div>
            </div>
          )}

          {mode === 'VERIFY_ADDRESS' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ABHA Address
                </label>
                <input
                  type="text"
                  required
                  value={abhaAddress}
                  onChange={(e) => setAbhaAddress(e.target.value)}
                  placeholder="aarav.sharma@sbx"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  OTP Delivery System
                </label>
                <select
                  value={otpSystem}
                  onChange={(e) => setOtpSystem(e.target.value as AbhaOtpSystem)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="abdm">ABHA Registered Mobile OTP (abdm)</option>
                  <option value="aadhaar">Aadhaar Registered Mobile OTP (aadhaar)</option>
                </select>
              </div>
            </div>
          )}

          {mode === 'CREATE_AADHAAR' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  12-Digit Aadhaar Number (Synthetic Sandbox Value Only)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  placeholder="Enter 12-digit synthetic Aadhaar"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Encrypted via RSA-OAEP-SHA1 before leaving the server. Never stored or logged.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Primary Contact Mobile (Optional 10-digit)
                </label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="9876543210"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
            >
              <KeyRound className="h-4 w-4" />
              {submitting ? 'Requesting OTP...' : 'Request Verification OTP'}
            </Button>
          </div>
        </form>
      )}

      {/* STEP 3: OTP VERIFICATION */}
      {step === 3 && otpInit && (
        <form
          onSubmit={handleVerifyOtp}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-sm"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-600" />
                Enter 6-Digit Verification OTP
              </h2>
              {otpInit.isMocked && (
                <Badge className="bg-purple-100 text-purple-800 border-none font-mono text-[10px]">
                  MOCK MODE
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {otpInit.maskedDestinationMessage}
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              Correlation ID: {otpInit.correlationId} • Expires:{' '}
              {new Date(otpInit.expiresAt).toLocaleTimeString()}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              6-Digit OTP
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-lg tracking-widest font-mono"
            />
          </div>

          {mode === 'CREATE_AADHAAR' && (
            <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={enrolConsentAccepted}
                onChange={(e) => setEnrolConsentAccepted(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>
                I accept the ABDM ABHA Enrolment Consent (<code>abha-enrollment</code> v1.4) to
                create my Ayushman Bharat Health Account.
              </span>
            </label>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              Restart
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                otp.length !== 6 ||
                (mode === 'CREATE_AADHAAR' && !enrolConsentAccepted)
              }
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {submitting ? 'Verifying OTP...' : 'Verify Ownership'}
            </Button>
          </div>
        </form>
      )}

      {/* STEP 4: VERIFICATION RESULT & EXPLICIT LINK CONFIRMATION */}
      {step === 4 && outcome && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-sm">
          {linkedStatus ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-7 w-7 shrink-0" />
                <div>
                  <h2 className="text-lg font-bold">ABHA Identity Successfully Linked</h2>
                  <p className="text-xs text-slate-500">
                    Your HealthBridge account is now associated with your verified ABHA identity.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5">
                  <p className="text-xs text-slate-500">Masked ABHA Number</p>
                  <p className="font-mono font-semibold">{linkedStatus.maskedAbhaNumber || '—'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5">
                  <p className="text-xs text-slate-500">ABHA Address</p>
                  <p className="font-mono font-semibold">{linkedStatus.abhaAddress || '—'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href="/patient/abha">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                    Go to ABHA Dashboard
                  </Button>
                </Link>
                <Link href="/patient/abha/history">
                  <Button variant="outline">View Audit History</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-emerald-600" />
                  Ownership Verified — Confirm Linking
                </h2>
                <Badge className="bg-emerald-100 text-emerald-800 border-none font-mono text-[10px]">
                  {outcome.verificationStatus}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5">
                  <p className="text-xs text-slate-500">Masked ABHA Number</p>
                  <p className="font-mono font-semibold">{outcome.maskedAbhaNumber || '—'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5">
                  <p className="text-xs text-slate-500">ABHA Address</p>
                  <p className="font-mono font-semibold">{outcome.abhaAddress || 'Not assigned'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5">
                  <p className="text-xs text-slate-500">ABHA Holder Name</p>
                  <p className="font-semibold">{outcome.profileSummary?.fullName || '—'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5">
                  <p className="text-xs text-slate-500">Verification Method</p>
                  <p className="font-mono text-xs font-semibold">{outcome.verificationMethod}</p>
                </div>
              </div>

              {outcome.demographicReviewRequired && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Demographic Discrepancy Notice
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {outcome.demographicMismatchReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  <p>
                    HealthBridge never merges accounts automatically. Confirm only if this ABHA
                    identity belongs to you.
                  </p>
                </div>
              )}

              {/* Optional ABHA Address Selection after Creation */}
              {mode === 'CREATE_AADHAAR' && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Optional: Choose or Customize ABHA Address
                  </p>
                  {suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setChosenAddress(s)}
                          className="text-xs font-mono px-2.5 py-1 rounded-full border border-teal-300 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chosenAddress}
                      onChange={(e) => setChosenAddress(e.target.value)}
                      placeholder="custom.address@sbx"
                      className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-sm font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={submitting || !chosenAddress.trim()}
                      onClick={handleCreateCustomAddress}
                    >
                      Save Address
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Link href="/patient/abha">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button
                  disabled={submitting}
                  onClick={handleConfirmLink}
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {submitting ? 'Linking...' : 'Confirm & Link ABHA Identity'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
