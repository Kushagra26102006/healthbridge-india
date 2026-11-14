'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  User,
  ArrowLeft,
  Lock,
  XCircle,
  BadgeCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConsentPermissionList } from './ConsentPermissionList';
import { getConsentStatusBadge } from './ConsentRequestCard';
import { CONSENT_PURPOSE_LABELS } from '@healthbridge/config';
import type { ConsentDetailDto } from '@healthbridge/shared-types';

export interface ConsentDetailsProps {
  consent: ConsentDetailDto;
  onApproveClick: () => void;
  onRejectClick: () => void;
  onRevokeClick: () => void;
}

export const ConsentDetails: React.FC<ConsentDetailsProps> = ({
  consent,
  onApproveClick,
  onRejectClick,
  onRevokeClick,
}) => {
  const statusInfo = getConsentStatusBadge(consent.status);
  const StatusIcon = statusInfo.icon;

  const requestedDate = new Date(consent.requestedAt).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const fromDate = new Date(consent.dateRange.from).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const toDate = new Date(consent.dateRange.to).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });


  const isPending = consent.status === 'PENDING';
  const isActive = consent.status === 'APPROVED';
  const isRevoked = consent.status === 'REVOKED';
  const isRejected = consent.status === 'REJECTED';

  const purposeLabel =
    CONSENT_PURPOSE_LABELS[consent.purpose] || consent.purpose;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 -ml-2"
        >
          <Link href={isPending ? '/patient/consent/requests' : '/patient/consent'}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            {isPending ? 'Back to Requests' : 'Back to Permissions'}
          </Link>
        </Button>
      </div>

      {/* Main Header Card */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs font-mono border-slate-200 dark:border-slate-800 text-slate-500"
              >
                REQUEST ID: {consent.consentRequestId || consent.id.slice(-8)}
              </Badge>

              <Badge className={`${statusInfo.bg} border text-xs font-medium flex items-center gap-1`}>
                <StatusIcon className="h-3 w-3" />
                <span>{statusInfo.label}</span>
              </Badge>
            </div>

            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>{consent.organization}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRejectClick}
                  className="text-xs h-9 px-4 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950"
                >
                  Reject Request
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onApproveClick}
                  className="text-xs h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium"
                >
                  Approve Access
                </Button>
              </>
            )}

            {isActive && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRevokeClick}
                className="text-xs h-9 px-4 rounded-xl border-slate-300 text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300"
              >
                Revoke Access
              </Button>
            )}
          </div>
        </div>

        {/* Requester Identity & Facility Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 block font-medium">Healthcare Practitioner</span>
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
              <User className="h-3.5 w-3.5 text-teal-600" />
              <span>{consent.doctorName || 'Attending Clinical Staff'}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Role: {consent.requesterRole}</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block font-medium">Facility Verification</span>
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <BadgeCheck className="h-3.5 w-3.5" />
              <span>Verified ABDM Health Facility</span>
            </div>
            <span className="text-[11px] text-slate-500">Registry: NMC / ABDM Network</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 block font-medium">Requisition Date</span>
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{requestedDate}</span>
            </div>
          </div>
        </div>

        {/* Purpose of Access */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Purpose of Access</span>
            <Badge variant="outline" className="text-xs uppercase font-mono">
              {consent.purpose}
            </Badge>
          </h2>

          <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {purposeLabel}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {consent.purposeDescription ||
                'Clinical examination, continuous care management, and health record evaluation.'}
            </p>
          </div>
        </div>

        {/* Requested Data Categories */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Requested Data Categories ({consent.requestedDataTypes.length})
          </h2>

          <ConsentPermissionList
            categories={consent.requestedDataTypes}
            variant="detailed"
          />
        </div>

        {/* Validity & Expiration Period */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Access Duration & Validity Window
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">From (Start Date)</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                {fromDate}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">To (End Date)</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                {toDate}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Granted Duration</span>
              <span className="font-semibold text-teal-600 dark:text-teal-400 mt-1 block">
                {consent.durationDays} Days Active Window
              </span>
            </div>
          </div>
        </div>

        {/* Revocation or Rejection Notice if applicable */}
        {isRevoked && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-300">
              <XCircle className="h-4 w-4" />
              <span>Permission Revoked</span>
            </div>
            <p className="text-rose-600 dark:text-rose-400 text-[11px] leading-relaxed">
              This permission was explicitly revoked on{' '}
              {consent.revokedAt ? new Date(consent.revokedAt).toLocaleDateString('en-IN') : 'N/A'}.
              {consent.revocationReason ? ` Reason: ${consent.revocationReason}` : ''}
            </p>
          </div>
        )}

        {isRejected && (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
              Request Declined
            </span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              This request was rejected.
              {consent.rejectionReason ? ` Stated reason: ${consent.rejectionReason}` : ''}
            </p>
          </div>
        )}

        {/* Digital Signature & ABDM Verification Footnote */}
        {consent.signature && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-teal-600" />
              <span>Digital ABHA Signature: Verified</span>
            </span>
            <span className="font-mono text-[10px] truncate max-w-xs">{consent.signature}</span>
          </div>
        )}
      </Card>
    </div>
  );
};
