'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConsentPermissionList } from './ConsentPermissionList';
import { CONSENT_PURPOSE_LABELS } from '@healthbridge/config';
import type { ConsentListItemDto, ConsentStatus } from '@healthbridge/shared-types';

export interface ConsentRequestCardProps {
  consent: ConsentListItemDto;
  onApprove?: (consentId: string) => void;
  onReject?: (consentId: string) => void;
  onRevoke?: (consentId: string) => void;
}

export const getConsentStatusBadge = (status: ConsentStatus) => {
  switch (status) {
    case 'APPROVED':
      return {
        label: 'Active Permission',
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        icon: CheckCircle2,
      };
    case 'PENDING':
      return {
        label: 'Pending Review',
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        icon: Clock,
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
        icon: XCircle,
      };
    case 'REVOKED':
      return {
        label: 'Revoked',
        bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
        icon: AlertCircle,
      };
    case 'EXPIRED':
    default:
      return {
        label: 'Expired',
        bg: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
        icon: AlertCircle,
      };
  }
};

export const ConsentRequestCard: React.FC<ConsentRequestCardProps> = ({
  consent,
  onApprove,
  onReject,
  onRevoke,
}) => {
  const statusInfo = getConsentStatusBadge(consent.status);
  const StatusIcon = statusInfo.icon;

  const requestedFormattedDate = new Date(consent.requestedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const expiresFormattedDate = new Date(consent.expiresAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const purposeLabel =
    CONSENT_PURPOSE_LABELS[consent.purpose] || consent.purpose;

  const isPending = consent.status === 'PENDING';
  const isActive = consent.status === 'APPROVED';

  return (
    <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4">
      {/* Top Header: Requester Organization & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {consent.organization}
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-slate-200 dark:border-slate-800 text-slate-500"
              >
                {consent.requesterRole}
              </Badge>
            </div>
            {consent.doctorName && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <User className="h-3 w-3 text-slate-400" />
                <span>{consent.doctorName}</span>
              </p>
            )}
          </div>
        </div>

        <Badge
          className={`${statusInfo.bg} border text-xs font-medium flex items-center gap-1 w-fit`}
        >
          <StatusIcon className="h-3 w-3" />
          <span>{statusInfo.label}</span>
        </Badge>
      </div>

      {/* Purpose Description */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
        <div className="flex items-center justify-between text-slate-500">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Purpose of Request:
          </span>
          <span className="font-mono text-[10px] uppercase text-teal-600 dark:text-teal-400">
            {consent.purpose}
          </span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
          {consent.purposeDescription || purposeLabel}
        </p>
      </div>

      {/* Requested Data Categories */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
          Requested Categories
        </span>
        <ConsentPermissionList categories={consent.requestedDataTypes} />
      </div>

      {/* Validity & Expiry Timeline */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>Requested: {requestedFormattedDate}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>Expires: {expiresFormattedDate}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
        <Link href={`/patient/consent/${consent.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 px-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 gap-1"
          >
            <span>Review Full Details</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {isPending && (
            <>
              {onReject && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onReject(consent.id)}
                  className="text-xs h-8 px-3 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/40"
                >
                  Reject
                </Button>
              )}
              {onApprove && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onApprove(consent.id)}
                  className="text-xs h-8 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
                >
                  Approve Access
                </Button>
              )}
            </>
          )}

          {isActive && onRevoke && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRevoke(consent.id)}
              className="text-xs h-8 px-3 rounded-lg border-slate-300 text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400"
            >
              Revoke Access
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
