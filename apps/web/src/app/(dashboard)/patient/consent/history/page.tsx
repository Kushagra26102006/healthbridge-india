'use client';

import React from 'react';
import Link from 'next/link';
import {
  History,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ConsentHistoryTimeline,
  ConsentSkeleton,
} from '@/components/patient/consent';
import { useConsentHistory } from '@/features/consent/hooks/use-consent';

export default function PatientConsentHistoryPage() {
  const { history, isLoading, isError, refetch } = useConsentHistory();

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
              Immutable ledger of all access permission requests, patient approvals, and revocations.
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
            <Link href="/patient/consent">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
              Active Permissions
            </Link>
          </Button>
        </div>
      </div>

      {/* Compliance Information Notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 dark:text-teal-200 leading-relaxed shadow-sm">
        <Lock className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-teal-800 dark:text-teal-300">
            Immutable Audit Compliance
          </p>
          <p className="text-teal-700/90 dark:text-teal-300/80">
            Under the Digital Personal Data Protection (DPDP) Act and Ayushman Bharat Digital Mission
            (ABDM), every electronic consent grant, denial, and revocation is recorded in an immutable,
            tamper-proof audit ledger for patient sovereignty and legal accountability.
          </p>
        </div>
      </div>

      {/* Timeline Section */}
      {isLoading ? (
        <ConsentSkeleton count={3} />
      ) : isError ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Unable to load consent history
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
  );
}
