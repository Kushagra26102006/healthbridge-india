'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ConsentHeader,
  ConsentSummary,
  ActiveConsentList,
  ConsentApprovalDialog,
  ConsentRejectionDialog,
  ConsentRevocationDialog,
  ConsentSkeleton,
} from '@/components/patient/consent';
import {
  useConsentSummary,
  useActiveConsents,
  useConsentRequests,
  useApproveConsent,
  useRejectConsent,
  useRevokeConsent,
} from '@/features/consent/hooks/use-consent';
import { Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ConsentListItemDto } from '@healthbridge/shared-types';

export default function PatientConsentPage() {
  const { summary, isLoading: isSummaryLoading } = useConsentSummary();
  const { activeConsents, isLoading: isActiveLoading } = useActiveConsents();
  const { requests: pendingRequests } = useConsentRequests();

  const approveMutation = useApproveConsent();
  const rejectMutation = useRejectConsent();
  const revokeMutation = useRevokeConsent();

  const [activeConsentForRevoke, setActiveConsentForRevoke] = useState<ConsentListItemDto | null>(null);
  const [activeConsentForApprove, setActiveConsentForApprove] = useState<ConsentListItemDto | null>(null);
  const [activeConsentForReject, setActiveConsentForReject] = useState<ConsentListItemDto | null>(null);

  const pendingCount = summary?.pendingRequests ?? pendingRequests.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <ConsentHeader />

      {/* Summary KPI Cards */}
      <ConsentSummary summary={summary} isLoading={isSummaryLoading} />

      {/* Pending Access Notification Banner (if any pending) */}
      {pendingCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                You have {pendingCount} pending health data access {pendingCount === 1 ? 'request' : 'requests'}
              </h3>
              <p className="text-xs text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                Healthcare providers have requested permission to review portions of your electronic health records.
              </p>
            </div>
          </div>

          <Link href="/patient/consent/requests">
            <Button size="sm" className="rounded-xl text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shrink-0">
              <span>Review Requests ({pendingCount})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Active Permissions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Currently Active Permissions</span>
            </h2>
            <p className="text-xs text-slate-500">
              Authorizations currently active under ABDM consent framework
            </p>
          </div>

          <Link href="/patient/consent/history">
            <Button variant="ghost" size="sm" className="text-xs text-teal-600 hover:text-teal-700 gap-1">
              <span>View Audit Trail</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {isActiveLoading ? (
          <ConsentSkeleton count={2} />
        ) : (
          <ActiveConsentList
            activeConsents={activeConsents}
            onRevokeClick={(c) => setActiveConsentForRevoke(c)}
          />
        )}
      </div>

      {/* Revocation Dialog */}
      <ConsentRevocationDialog
        isOpen={Boolean(activeConsentForRevoke)}
        onClose={() => setActiveConsentForRevoke(null)}
        consent={activeConsentForRevoke}
        onConfirmRevoke={async (id, reason) => {
          await revokeMutation.mutateAsync({ consentId: id, input: { reason } });
        }}
        isLoading={revokeMutation.isPending}
      />

      {/* Approval Dialog */}
      <ConsentApprovalDialog
        isOpen={Boolean(activeConsentForApprove)}
        onClose={() => setActiveConsentForApprove(null)}
        consent={activeConsentForApprove}
        onConfirmApprove={async (id, signature) => {
          await approveMutation.mutateAsync({ consentId: id, input: { signature } });
        }}
        isLoading={approveMutation.isPending}
      />

      {/* Rejection Dialog */}
      <ConsentRejectionDialog
        isOpen={Boolean(activeConsentForReject)}
        onClose={() => setActiveConsentForReject(null)}
        consent={activeConsentForReject}
        onConfirmReject={async (id, reason) => {
          await rejectMutation.mutateAsync({ consentId: id, input: { reason } });
        }}
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
}
