'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ClipboardList,
  Search,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  FileKey2,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ConsentRequestList,
  ConsentApprovalDialog,
  ConsentRejectionDialog,
  ConsentSkeleton,
} from '@/components/patient/consent';
import {
  useConsentRequests,
  useApproveConsent,
  useRejectConsent,
} from '@/features/consent/hooks/use-consent';
import { abdmConsentApi } from '@/features/abdm/api/abdm-consent-api';
import type { AbdmConsentRequestDto, ConsentListItemDto } from '@healthbridge/shared-types';

const ABDM_STATUS_COLORS: Record<string, string> = {
  AWAITING_PATIENT_ACTION: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  EXPIRED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  REVOKED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
};

export default function PatientConsentRequestsPage() {
  const [search, setSearch] = useState('');
  const [activeConsentForApprove, setActiveConsentForApprove] =
    useState<ConsentListItemDto | null>(null);
  const [activeConsentForReject, setActiveConsentForReject] = useState<ConsentListItemDto | null>(
    null
  );

  const [abdmRequests, setAbdmRequests] = useState<AbdmConsentRequestDto[]>([]);
  const [abdmLoading, setAbdmLoading] = useState(true);

  const { requests, pagination, isLoading, isError, refetch } = useConsentRequests({
    search: search || undefined,
  });

  const approveMutation = useApproveConsent();
  const rejectMutation = useRejectConsent();

  const loadAbdmRequests = async () => {
    try {
      setAbdmLoading(true);
      const list = await abdmConsentApi.listOwnRequests();
      setAbdmRequests(list);
    } catch {
      setAbdmRequests([]);
    } finally {
      setAbdmLoading(false);
    }
  };

  useEffect(() => {
    loadAbdmRequests();
  }, []);

  const filteredAbdmRequests = abdmRequests.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.requestingOrganizationName.toLowerCase().includes(q) ||
      r.purposeText.toLowerCase().includes(q) ||
      r.internalReference.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <Link href="/patient/consent">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mt-0.5 sm:mt-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              <span>Consent Requests</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review internal HealthBridge requests and externally synchronized ABDM HIE-CM consent
              requests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs h-9 px-3.5 rounded-xl border-slate-200 dark:border-slate-800"
          >
            <Link href="/patient/consent/artefacts">
              <FileKey2 className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
              ABDM Artefacts
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs h-9 px-3.5 rounded-xl border-slate-200 dark:border-slate-800"
          >
            <Link href="/patient/consent">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
              Overview
            </Link>
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by requesting hospital, organization, purpose, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {/* ABDM HIE-CM Consent Requests Section (Official External Approval Workflow) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileKey2 className="h-4 w-4 text-teal-600" />
              ABDM HIE-CM Consent Requests ({filteredAbdmRequests.length})
            </h2>
            <p className="text-xs text-slate-500">
              ABDM consent requests must be approved or denied in your official ABDM PHR application
              — HealthBridge displays synchronized status only.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAbdmRequests}
            disabled={abdmLoading}
            className="text-xs gap-1.5 rounded-xl"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${abdmLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>

        {abdmLoading ? (
          <ConsentSkeleton count={1} />
        ) : filteredAbdmRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center text-xs text-slate-500">
            No externally synchronized ABDM HIE-CM consent requests found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredAbdmRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {req.requestingOrganizationName}
                    </span>
                    <Badge
                      className={`${
                        ABDM_STATUS_COLORS[req.internalStatus] || 'bg-slate-100 text-slate-700'
                      } border-none font-mono text-[10px]`}
                    >
                      {req.internalStatus}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      HIE-CM: {req.externalStatus}
                    </Badge>
                    {req.isMocked && (
                      <Badge className="bg-purple-100 text-purple-800 border-none font-mono text-[10px]">
                        MOCK DEV
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Purpose: <strong>{req.purposeText}</strong> ({req.purposeCode}) • Mode:{' '}
                    <span className="font-mono">{req.accessMode}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {req.hiTypes.map((hi) => (
                      <span
                        key={hi}
                        className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 text-[11px] font-medium"
                      >
                        {hi}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                    <Calendar className="h-3 w-3" />
                    Range: {new Date(req.dateRange.from).toLocaleDateString()} –{' '}
                    {new Date(req.dateRange.to).toLocaleDateString()} • Ref:{' '}
                    <span className="font-mono">{req.internalReference}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/patient/consent/requests/${req.id}`}>
                    <Button size="sm" className="rounded-xl text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white">
                      Review &amp; Official Workflow
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Internal HealthBridge Consent Requests Section (Preserved Existing Workflow) */}
      <div className="space-y-3 pt-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Internal HealthBridge Platform Requests
          </h2>
          <p className="text-xs text-slate-500">
            Requests from HealthBridge clinicians for intra-platform record access.
          </p>
        </div>

        {isLoading ? (
          <ConsentSkeleton count={2} />
        ) : isError ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Unable to load internal consent requests
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              An error occurred while loading internal platform requests.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          </div>
        ) : (
          <ConsentRequestList
            consents={requests}
            pagination={pagination}
            onApproveClick={(c) => setActiveConsentForApprove(c)}
            onRejectClick={(c) => setActiveConsentForReject(c)}
            onResetFilters={() => setSearch('')}
            emptyTitle="No pending internal requests"
            emptyDescription="You have no incoming internal platform access requests awaiting approval."
          />
        )}
      </div>

      {/* Approval Dialog (Internal Platform Requests Only) */}
      <ConsentApprovalDialog
        isOpen={Boolean(activeConsentForApprove)}
        onClose={() => setActiveConsentForApprove(null)}
        consent={activeConsentForApprove}
        onConfirmApprove={async (id, signature) => {
          await approveMutation.mutateAsync({ consentId: id, input: { signature } });
        }}
        isLoading={approveMutation.isPending}
      />

      {/* Rejection Dialog (Internal Platform Requests Only) */}
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
