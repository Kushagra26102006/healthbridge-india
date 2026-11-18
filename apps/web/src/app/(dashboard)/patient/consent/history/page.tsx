'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  History,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Lock,
  FileKey2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConsentHistoryTimeline, ConsentSkeleton } from '@/components/patient/consent';
import { useConsentHistory } from '@/features/consent/hooks/use-consent';
import { abdmConsentApi } from '@/features/abdm/api/abdm-consent-api';
import type { AbdmConsentEventDto } from '@healthbridge/shared-types';

export default function PatientConsentHistoryPage() {
  const { history, isLoading, isError, refetch } = useConsentHistory();
  const [abdmEvents, setAbdmEvents] = useState<AbdmConsentEventDto[]>([]);
  const [abdmLoading, setAbdmLoading] = useState(true);

  useEffect(() => {
    abdmConsentApi
      .getOwnHistory()
      .then((list) => setAbdmEvents(list))
      .catch(() => setAbdmEvents([]))
      .finally(() => setAbdmLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
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
              <History className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              <span>Consent Audit History</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable ledger of internal HealthBridge consent grants and ABDM HIE-CM consent
              lifecycle events.
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

      {/* Compliance Information Notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 dark:text-teal-200 leading-relaxed shadow-sm">
        <Lock className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-teal-800 dark:text-teal-300">
            Immutable Consent &amp; Revocation Ledger
          </p>
          <p className="text-teal-700/90 dark:text-teal-300/80">
            Consent history is never deleted after revocation or expiry. Both internal HealthBridge
            platform consents and external ABDM HIE-CM callback synchronization events are tracked
            separately below.
          </p>
        </div>
      </div>

      {/* ABDM HIE-CM Lifecycle Events Section */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileKey2 className="h-4 w-4 text-teal-600" />
          ABDM HIE-CM Consent Lifecycle Events ({abdmEvents.length})
        </h2>

        {abdmLoading ? (
          <ConsentSkeleton count={1} />
        ) : abdmEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center text-xs text-slate-500">
            No external ABDM HIE-CM consent events recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {abdmEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {ev.direction}
                    </Badge>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {ev.eventType}
                    </span>
                    <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-none font-mono text-[10px]">
                      {ev.processingOutcome}
                    </Badge>
                    {ev.externalStatus && (
                      <Badge className="bg-teal-100 text-teal-800 border-none font-mono text-[10px]">
                        {ev.externalStatus}
                      </Badge>
                    )}
                  </div>
                  {ev.reason && <p className="text-slate-600 dark:text-slate-300">{ev.reason}</p>}
                  {ev.correlationId && (
                    <p className="font-mono text-[10px] text-slate-400">
                      Correlation: {ev.correlationId}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 shrink-0">
                  {new Date(ev.eventTimestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Internal HealthBridge Consent Audit Trail */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Internal HealthBridge Platform Audit Trail
        </h2>
        {isLoading ? (
          <ConsentSkeleton count={2} />
        ) : isError ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Unable to load internal consent history
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              An error occurred while communicating with the audit service.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          </div>
        ) : (
          <ConsentHistoryTimeline events={history} />
        )}
      </div>
    </div>
  );
}
