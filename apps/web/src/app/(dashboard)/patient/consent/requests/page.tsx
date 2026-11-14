'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ClipboardList,
  Search,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import type { ConsentListItemDto } from '@healthbridge/shared-types';

export default function PatientConsentRequestsPage() {
  const [search, setSearch] = useState('');
  const [activeConsentForApprove, setActiveConsentForApprove] = useState<ConsentListItemDto | null>(null);
  const [activeConsentForReject, setActiveConsentForReject] = useState<ConsentListItemDto | null>(null);

  const { requests, pagination, isLoading, isError, refetch } = useConsentRequests({
    search: search || undefined,
  });

  const approveMutation = useApproveConsent();
  const rejectMutation = useRejectConsent();

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
              <span>Incoming Consent Requests</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and act upon health data access authorizations requested by healthcare providers.
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

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by requesting hospital, clinic, or physician name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <ConsentSkeleton count={3} />
      ) : isError ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Unable to load consent requests
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            An error occurred while communicating with the electronic consent gateway.
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
          emptyTitle="No pending requests"
          emptyDescription="You have no incoming access requests awaiting your approval."
        />
      )}

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
