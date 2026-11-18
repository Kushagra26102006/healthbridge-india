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
import { EditorialVisual } from '@/components/ui/visual-asset';
import { Badge } from '@/components/ui/badge';
import { useClinicalActionFeedback } from '@/components/motion';
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
  const feedback = useClinicalActionFeedback();

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
      {/* Page Header + Granular Consent Visual */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
        <div className="xl:col-span-8">
          <ConsentHeader />
        </div>
        <div className="hidden xl:block xl:col-span-4">
          <EditorialVisual
            asset="serviceConsentControl"
            aspectClassName="aspect-[16/9]"
            sizes="360px"
            className="rounded-xl shadow-xs"
          />
        </div>
      </div>

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
      <div className="rounded-xl border border-secondary/30 bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <FileKey2 className="h-5 w-5 text-secondary" />
              <h2 className="text-base font-bold text-foreground">
                ABDM Consent Manager (HIE-CM)
              </h2>
              <Badge variant="teal" size="sm">
                External Exchange Layer
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Track synchronized ABDM consent requests, inspect externally issued consent artefacts,
              view audit events, or initiate revocation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild className="text-xs gap-1.5">
              <Link href="/patient/consent/requests">
                <ClipboardList className="h-3.5 w-3.5 text-secondary" />
                <span>ABDM Requests ({abdmLoading ? '…' : abdmRequests.length})</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="text-xs gap-1.5">
              <Link href="/patient/consent/artefacts">
                <FileKey2 className="h-3.5 w-3.5 text-secondary" />
                <span>Consent Artefacts ({abdmLoading ? '…' : abdmArtefacts.length})</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="text-xs gap-1.5">
              <Link href="/patient/consent/history">
                <History className="h-3.5 w-3.5 text-secondary" />
                <span>Expired &amp; Revoked History</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-md bg-muted/40 border border-border/70 p-3.5">
            <p className="text-xs font-medium text-muted-foreground">Awaiting ABDM PHR Action</p>
            <p className="text-metric text-amber-700 dark:text-amber-400 mt-1">
              {abdmLoading ? '—' : abdmPendingCount}
            </p>
          </div>
          <div className="rounded-md bg-muted/40 border border-border/70 p-3.5">
            <p className="text-xs font-medium text-muted-foreground">Active External Artefacts</p>
            <p className="text-metric text-secondary mt-1">
              {abdmLoading ? '—' : abdmActiveArtefactCount}
            </p>
          </div>
          <div className="rounded-md bg-muted/40 border border-border/70 p-3.5">
            <p className="text-xs font-medium text-muted-foreground">Total Synchronized Artefacts</p>
            <p className="text-metric mt-1">
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
          const targetOrg = activeConsentForRevoke?.organization;
          try {
            await revokeMutation.mutateAsync({ consentId: id, input: { reason } });
            feedback.notifyConsentRevoked(targetOrg);
          } catch (err) {
            feedback.notifyOperationError(
              'Unable to revoke consent',
              err instanceof Error ? err.message : undefined
            );
            throw err;
          }
        }}
        isLoading={revokeMutation.isPending}
      />

      {/* Approval Dialog */}
      <ConsentApprovalDialog
        isOpen={Boolean(activeConsentForApprove)}
        onClose={() => setActiveConsentForApprove(null)}
        consent={activeConsentForApprove}
        onConfirmApprove={async (id, signature) => {
          const targetOrg = activeConsentForApprove?.organization;
          try {
            await approveMutation.mutateAsync({ consentId: id, input: { signature } });
            feedback.notifyConsentApproved(targetOrg);
          } catch (err) {
            feedback.notifyOperationError(
              'Unable to approve consent',
              err instanceof Error ? err.message : undefined
            );
            throw err;
          }
        }}
        isLoading={approveMutation.isPending}
      />

      {/* Rejection Dialog */}
      <ConsentRejectionDialog
        isOpen={Boolean(activeConsentForReject)}
        onClose={() => setActiveConsentForReject(null)}
        consent={activeConsentForReject}
        onConfirmReject={async (id, reason) => {
          try {
            await rejectMutation.mutateAsync({ consentId: id, input: { reason } });
            feedback.notifyConsentRevoked(activeConsentForReject?.organization);
          } catch (err) {
            feedback.notifyOperationError(
              'Unable to reject consent request',
              err instanceof Error ? err.message : undefined
            );
            throw err;
          }
        }}
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
}
