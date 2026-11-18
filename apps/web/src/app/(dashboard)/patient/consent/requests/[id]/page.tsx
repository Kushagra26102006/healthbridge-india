'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  Calendar,
  Building2,
  Clock,
  FileKey2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { abdmConsentApi } from '@/features/abdm/api/abdm-consent-api';
import type { AbdmConsentRequestDto } from '@healthbridge/shared-types';

export default function PatientAbdmConsentRequestDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [request, setRequest] = useState<AbdmConsentRequestDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await abdmConsentApi.getOwnRequestDetail(id);
      setRequest(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load ABDM consent request details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleRefreshStatus = async () => {
    if (!id) return;
    try {
      setRefreshing(true);
      setError(null);
      const updated = await abdmConsentApi.refreshOwnRequestStatus(id);
      setRequest(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to synchronize request status.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/patient/consent/requests">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileKey2 className="h-5 w-5 text-teal-600" />
              ABDM Consent Request Details
            </h1>
            <p className="text-xs text-slate-500">
              Inspect scope, understand access consequences, and continue to the official ABDM PHR
              approval workflow.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshStatus}
          disabled={refreshing || loading}
          className="text-xs gap-1.5 rounded-xl self-start sm:self-center"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Sync Status
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-xs text-slate-500">
          Loading synchronized ABDM consent request...
        </div>
      ) : request ? (
        <>
          {/* Request Overview Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-teal-600" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {request.requestingOrganizationName}
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Requester: {request.requesterName} • Participant ID:{' '}
                  <span className="font-mono">{request.requestingParticipantId}</span> (
                  {request.requestingParticipantRole})
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-teal-100 text-teal-800 border-none font-mono text-[11px]">
                  Internal: {request.internalStatus}
                </Badge>
                <Badge variant="outline" className="font-mono text-[11px]">
                  ABDM HIE-CM: {request.externalStatus}
                </Badge>
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                  {request.isMocked ? 'MOCKED DEV' : request.environment}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Purpose of Access
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {request.purposeText} ({request.purposeCode})
                </p>
                <p className="text-slate-500">
                  Access Mode: <span className="font-mono">{request.accessMode}</span>
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Record Date Range
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {new Date(request.dateRange.from).toLocaleDateString()} to{' '}
                  {new Date(request.dateRange.to).toLocaleDateString()}
                </p>
                <p className="text-slate-500">
                  Frequency: {request.frequency.value} per {request.frequency.unit} (Repeats:{' '}
                  {request.frequency.repeats})
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Expiry &amp; Data Erasure
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Data Erase Deadline: {new Date(request.dataEraseAt).toLocaleString()}
                </p>
                {request.expiresAt && (
                  <p className="text-slate-500">
                    Request Expiry: {new Date(request.expiresAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Synchronization Identifiers
                </p>
                <p className="font-mono text-[11px] text-slate-900 dark:text-white truncate">
                  Internal Ref: {request.internalReference}
                </p>
                <p className="font-mono text-[11px] text-slate-500 truncate">
                  External ID: {request.externalRequestId || 'Awaiting on-init callback'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Last Synced:{' '}
                  {request.lastSyncedAt
                    ? new Date(request.lastSyncedAt).toLocaleString()
                    : 'Not yet synced'}
                </p>
              </div>
            </div>

            {/* Requested Health Information Categories */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Requested Health Information Categories (HI-Types)
              </p>
              <div className="flex flex-wrap gap-2">
                {request.hiTypes.map((hi) => (
                  <Badge
                    key={hi}
                    className="bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                  >
                    {hi}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Consequences of Granting Access */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold text-sm">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Consequences of Granting Access
            </div>
            <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
              {request.officialApprovalGuidance.consequencesSummary}
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              You retain sovereign control and may revoke a granted consent artefact at any time.
              External data exchange will never proceed until a valid, verified ABDM Consent
              Artefact is synchronized.
            </p>
          </div>

          {/* Official ABDM Approval Workflow Callout — ZERO local approve simulation! */}
          <div className="rounded-2xl border border-teal-200 dark:border-teal-900/50 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {request.externalStatus === 'GRANTED' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-teal-600" />
                )}
                Official ABDM Consent Manager Approval Workflow
              </h3>
              <Badge variant="outline" className="font-mono text-[10px]">
                {request.officialApprovalGuidance.supportedWorkflow}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {request.officialApprovalGuidance.phrPortalHint}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="https://phr.abdm.gov.in"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" className="rounded-xl text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white">
                  Continue to Official ABDM PHR Portal
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
              <Link href="/patient/consent/artefacts">
                <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
                  <FileKey2 className="h-3.5 w-3.5 text-teal-600" />
                  View Synchronized Consent Artefacts ({request.artefactIds.length})
                </Button>
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
