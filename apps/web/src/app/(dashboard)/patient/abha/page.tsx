'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Fingerprint,
  ShieldCheck,
  Link2,
  CheckCircle2,
  AlertTriangle,
  History,
  RefreshCw,
  Unlink2,
  Lock,
  UserCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import type {
  AbhaAuthorizedProfileDto,
  AbhaLinkStatusDto,
  AbhaVerificationStatus,
} from '@healthbridge/shared-types';
import { abhaApi, extractAbhaErrorMessage } from '@/features/abdm/api/abha-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const VERIFICATION_BADGE: Record<AbhaVerificationStatus, string> = {
  NOT_LINKED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  PENDING_VERIFICATION: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  VERIFICATION_IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  VERIFIED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  VERIFICATION_FAILED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  REVOKED_OR_UNLINKED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export default function PatientAbhaDashboardPage() {
  const [status, setStatus] = useState<AbhaLinkStatusDto | null>(null);
  const [profile, setProfile] = useState<AbhaAuthorizedProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Unlink drawer/form state
  const [showUnlinkForm, setShowUnlinkForm] = useState(false);
  const [unlinkReason, setUnlinkReason] = useState('');
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await abhaApi.getStatus();
      setStatus(data);
    } catch (err) {
      setError(extractAbhaErrorMessage(err, 'Unable to load ABHA identity status.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleLoadAuthorizedProfile = async () => {
    try {
      setFetchingProfile(true);
      setError(null);
      const prof = await abhaApi.getAuthorizedProfile();
      setProfile(prof);
    } catch (err) {
      setError(extractAbhaErrorMessage(err, 'Unable to fetch authorized ABHA profile.'));
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleUnlink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmUnlink || unlinkReason.trim().length < 5) return;

    try {
      setUnlinking(true);
      setError(null);
      const updated = await abhaApi.unlink({
        reason: unlinkReason.trim(),
        confirmUnlink: true,
      });
      setStatus(updated);
      setProfile(null);
      setShowUnlinkForm(false);
      setUnlinkReason('');
      setConfirmUnlink(false);
      setActionMessage(
        'Your ABHA identity has been unlinked from HealthBridge. Your national ABHA account at NHA remains unaffected.'
      );
    } catch (err) {
      setError(extractAbhaErrorMessage(err, 'Unable to unlink ABHA identity.'));
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-none">
              Ayushman Bharat Digital Mission (ABDM)
            </Badge>
            {status?.isMocked && (
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-none font-mono text-[10px]">
                SYNTHETIC MOCK MODE
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Fingerprint className="h-6 w-6 text-teal-600" />
            ABHA Identity &amp; Verification
          </h1>
          <p className="text-sm text-slate-500">
            Manage your Ayushman Bharat Health Account (ABHA) association with HealthBridge India.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadStatus} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Link href="/patient/abha/history">
            <Button variant="outline" size="sm" className="gap-1.5">
              <History className="h-4 w-4" /> History
            </Button>
          </Link>
        </div>
      </div>

      {/* Explicit Consent Separation Notice */}
      <div className="rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/70 dark:bg-teal-950/30 p-4 flex items-start gap-3">
        <Lock className="h-5 w-5 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-950 dark:text-teal-200 space-y-1">
          <p className="font-semibold">Identity Linking Is Separate From Medical Record Consent</p>
          <p>
            {status?.consentSeparationNotice ||
              'Linking your ABHA identity connects your HealthBridge account for identification only. It does NOT automatically share your medical records. Any health data exchange requires a separate, explicit patient consent.'}
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900 p-4 text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900 p-4 text-sm text-rose-800 dark:text-rose-200 flex items-center gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main ABHA Dashboard Card */}
      {loading && !status ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">Loading your ABHA identity status...</p>
        </div>
      ) : status ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Identity Card */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ABHA Connection Status
                </p>
                <div className="flex items-center gap-2.5 mt-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {status.linkStatus === 'ACTIVE'
                      ? 'Linked & Verified'
                      : status.linkStatus === 'UNLINKED'
                      ? 'Unlinked'
                      : 'Not Linked'}
                  </span>
                  <Badge className={`${VERIFICATION_BADGE[status.verificationStatus]} border-none font-mono text-[11px]`}>
                    {status.verificationStatus}
                  </Badge>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-[11px] uppercase">
                ENV: {status.environment}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
                <p className="text-xs text-slate-500">Masked ABHA Number</p>
                <p className="font-mono font-semibold text-base text-slate-900 dark:text-white mt-1">
                  {status.maskedAbhaNumber || 'Not Linked'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Full 14-digit ABHA number is encrypted at rest and never displayed in plain text.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
                <p className="text-xs text-slate-500">ABHA Address (PHR Handle)</p>
                <p className="font-mono font-semibold text-base text-slate-900 dark:text-white mt-1 break-all">
                  {status.abhaAddress || 'Not Assigned'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Distinct from your 14-digit ABHA number; used for future consent-based routing.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
                <p className="text-xs text-slate-500">Verification Method</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-1">
                  {status.verificationMethod || 'None'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
                <p className="text-xs text-slate-500">Last Verification Date</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-1">
                  {status.lastVerificationAt
                    ? new Date(status.lastVerificationAt).toLocaleString()
                    : 'Not yet verified'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {status.linkStatus !== 'ACTIVE' ? (
                <Link href="/patient/abha/link">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                    <Link2 className="h-4 w-4" /> Link or Create ABHA Identity
                  </Button>
                </Link>
              ) : (
                <>
                  {status.availableActions.canRetrieveProfile && (
                    <Button
                      variant="outline"
                      onClick={handleLoadAuthorizedProfile}
                      disabled={fetchingProfile}
                      className="gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      {fetchingProfile ? 'Fetching Profile...' : 'View Authorized ABHA Profile'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowUnlinkForm((v) => !v)}
                    className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40"
                  >
                    <Unlink2 className="h-4 w-4" /> Unlink from HealthBridge
                  </Button>
                </>
              )}

              <Link href="/patient/abha/verification">
                <Button variant="outline" className="gap-2">
                  <ShieldCheck className="h-4 w-4" /> Verify ABHA / Check Address
                </Button>
              </Link>
            </div>

            {/* Authorized Profile Preview */}
            {profile && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Authorized ABHA Profile (Active Session)
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    Correlation: {profile.correlationId.slice(0, 8)}...
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-500">Name:</span> {profile.fullName}
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span> {profile.abhaStatus}
                  </div>
                  <div>
                    <span className="text-slate-500">KYC:</span>{' '}
                    {profile.kycVerified ? 'Verified' : 'Unverified'}
                  </div>
                  {profile.stateName && (
                    <div>
                      <span className="text-slate-500">State:</span> {profile.stateName}
                    </div>
                  )}
                  {profile.districtName && (
                    <div>
                      <span className="text-slate-500">District:</span> {profile.districtName}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Local Unlink Confirmation Form */}
            {showUnlinkForm && (
              <form
                onSubmit={handleUnlink}
                className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 p-4 space-y-3"
              >
                <div className="flex items-start gap-2 text-xs text-rose-900 dark:text-rose-200">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    This removes the ABHA identity link from your <strong>HealthBridge</strong>{' '}
                    account only and records an immutable audit event. It does not delete or
                    deactivate your national ABHA account at NHA.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Reason for unlinking (required)
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    value={unlinkReason}
                    onChange={(e) => setUnlinkReason(e.target.value)}
                    placeholder="e.g., Linked incorrect sandbox identity or privacy preference"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={confirmUnlink}
                    onChange={(e) => setConfirmUnlink(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  I confirm I want to unlink this ABHA identity from HealthBridge.
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    disabled={unlinking || !confirmUnlink || unlinkReason.trim().length < 5}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                    size="sm"
                  >
                    {unlinking ? 'Unlinking...' : 'Confirm Local Unlink'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUnlinkForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Navigation & Guidance Sidebar */}
          <div className="space-y-4">
            <Link
              href="/patient/abha/link"
              className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-teal-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-teal-600" /> Guided ABHA Linking
                </h2>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Create a new ABHA via Aadhaar OTP or link an existing ABHA Number / ABHA Address
                with OTP ownership verification.
              </p>
            </Link>

            <Link
              href="/patient/abha/verification"
              className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-teal-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-600" /> Identity &amp; Address Verification
                </h2>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Verify ABHA Number or ABHA Address ownership via official V3 OTP flows and check
                ABHA Address availability.
              </p>
            </Link>

            <Link
              href="/patient/abha/history"
              className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-teal-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="h-4 w-4 text-teal-600" /> Identity &amp; Verification History
                </h2>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Review past ABHA verification attempts, correlation IDs, linked timestamps, and
                previous ABHA address history.
              </p>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
