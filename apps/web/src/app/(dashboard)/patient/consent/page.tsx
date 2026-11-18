'use client';

import React, { useEffect, useState } from 'react';
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
import { abdmConsentApi } from '@/features/abdm/api/abdm-consent-api';
import {
  Clock,
  ArrowRight,
  ShieldCheck,
  FileKey2,
  ClipboardList,
  History,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  AbdmConsentArtefactRecordDto,
  AbdmConsentRequestDto,
  ConsentListItemDto,
} from '@healthbridge/shared-types';

export default function PatientConsentPage() {
  const { summary, isLoading: isSummaryLoading } = useConsentSummary();
  const { activeConsents, isLoading: isActiveLoading } = useActiveConsents();
  const { requests: pendingRequests } = useConsentRequests();

  const approveMutation = useApproveConsent();
  const rejectMutation = useRejectConsent();
  const revokeMutation = useRevokeConsent();

  const [activeConsentForRevoke, setActiveConsentForRevoke] = useState<ConsentListItemDto | null>(
    null
  );
  const [activeConsentForApprove, setActiveConsentForApprove] =
    useState<ConsentListItemDto | null>(null);
  const [activeConsentForReject, setActiveConsentForReject] = useState<ConsentListItemDto | null>(
    null
  );

  const [abdmRequests, setAbdmRequests] = useState<AbdmConsentRequestDto[]>([]);
  const [abdmArtefacts, setAbdmArtefacts] = useState<AbdmConsentArtefactRecordDto[]>([]);
  const [abdmLoading, setAbdmLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      abdmConsentApi.listOwnRequests().catch(() => []),
      abdmConsentApi.listOwnArtefacts().catch(() => []),
    ])
      .then(([reqs, arts]) => {
        if (!mounted) return;
        setAbdmRequests(reqs);
        setAbdmArtefacts(arts);
      })
      .finally(() => {
        if (mounted) setAbdmLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const pendingCount = summary?.pendingRequests ?? pendingRequests.length;
  const abdmPendingCount = abdmRequests.filter((r) =>
    ['PENDING_SUBMISSION', 'SUBMITTED', 'AWAITING_PATIENT_ACTION'].includes(r.internalStatus)
  ).length;
  const abdmActiveArtefactCount = abdmArtefacts.filter(
    (a) => a.externalStatus === 'GRANTED' && a.revocationStatus === 'NOT_REVOKED'
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <ConsentHeader />

      {/* Explicit Boundary Banner: Internal Consent vs ABDM HIE-CM Consent */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
          <p className="font-semibold">
            Two Distinct Consent Layers: Internal HealthBridge vs Official ABDM HIE-CM
          </p>
          <p>
            <strong>Internal HealthBridge Consents</strong> govern care-team access inside
            HealthBridge. <strong>ABDM HIE-CM Consent Artefacts</strong> are externally signed
            national health data exchange permissions that must be approved directly in your
            official ABDM PHR application — HealthBridge never fabricates or locally approves ABDM
            consents. Your access to your own records is never blocked if you have no ABDM
            artefacts.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards (Internal Consents) */}
      <ConsentSummary summary={summary} isLoading={isSummaryLoading} />

      {/* ABDM HIE-CM Consent Manager Section (Day 7 Task 03) */}
      <div className="rounded-2xl border border-teal-200/80 dark:border-teal-900/50 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileKey2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                ABDM Consent Manager (HIE-CM)
              </h2>
              <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-none text-[10px]">
                External Exchange Layer
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Track synchronized ABDM consent requests, inspect externally issued consent artefacts,
              view audit events, or initiate revocation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/patient/consent/requests">
              <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-teal-600" />
                ABDM Requests ({abdmLoading ? '…' : abdmRequests.length})
              </Button>
            </Link>
            <Link href="/patient/consent/artefacts">
              <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1.5">
                <FileKey2 className="h-3.5 w-3.5 text-teal-600" />
                Consent Artefacts ({abdmLoading ? '…' : abdmArtefacts.length})
              </Button>
            </Link>
            <Link href="/patient/consent/history">
              <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1.5">
                <History className="h-3.5 w-3.5 text-teal-600" />
                History
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5">
            <p className="text-[11px] font-medium text-slate-500">Awaiting ABDM PHR Action</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
              {abdmLoading ? '—' : abdmPendingCount}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5">
            <p className="text-[11px] font-medium text-slate-500">Active External Artefacts</p>
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-400 mt-1">
              {abdmLoading ? '—' : abdmActiveArtefactCount}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5">
            <p className="text-[11px] font-medium text-slate-500">Total Synchronized Artefacts</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {abdmLoading ? '—' : abdmArtefacts.length}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Access Notification Banner (if any pending) */}
      {pendingCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                You have {pendingCount} pending internal health data access{' '}
                {pendingCount === 1 ? 'request' : 'requests'}
              </h3>
              <p className="text-xs text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                Healthcare providers have requested internal HealthBridge permission to review
                portions of your electronic health records.
              </p>
            </div>
          </div>

          <Link href="/patient/consent/requests">
            <Button
              size="sm"
              className="rounded-xl text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shrink-0"
            >
              <span>Review Requests ({pendingCount})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Active Internal Platform Permissions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span>Active Internal HealthBridge Permissions</span>
            </h2>
            <p className="text-xs text-slate-500">
              Internal platform access grants (distinct from externally signed ABDM HIE-CM
              artefacts)
            </p>
          </div>

          <Link href="/patient/consent/history">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-teal-600 hover:text-teal-700 gap-1"
            >
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
