'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ConsentDetails,
  ConsentApprovalDialog,
  ConsentRejectionDialog,
  ConsentRevocationDialog,
} from '@/components/patient/consent';
import {
  useConsentDetails,
  useApproveConsent,
  useRejectConsent,
  useRevokeConsent,
} from '@/features/consent/hooks/use-consent';

export default function PatientConsentDetailPage() {
  const params = useParams();
  const consentId = params?.consentId as string;

  const { consent, isLoading, isError, refetch } = useConsentDetails(consentId);

  const approveMutation = useApproveConsent();
  const rejectMutation = useRejectConsent();
  const revokeMutation = useRevokeConsent();

  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4">
          <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        </Card>
      </div>
    );
  }

  if (isError || !consent) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Consent Record Not Found
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The requested electronic consent authorization could not be located or you do not have permission to review it.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/patient/consent">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Permissions
            </Button>
          </Link>
          <Button variant="default" size="sm" onClick={() => refetch()} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <ConsentDetails
        consent={consent}
        onApproveClick={() => setIsApproveOpen(true)}
        onRejectClick={() => setIsRejectOpen(true)}
        onRevokeClick={() => setIsRevokeOpen(true)}
      />

      {/* Approval Dialog */}
      <ConsentApprovalDialog
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        consent={consent}
        onConfirmApprove={async (id, signature) => {
          await approveMutation.mutateAsync({ consentId: id, input: { signature } });
        }}
        isLoading={approveMutation.isPending}
      />

      {/* Rejection Dialog */}
      <ConsentRejectionDialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        consent={consent}
        onConfirmReject={async (id, reason) => {
          await rejectMutation.mutateAsync({ consentId: id, input: { reason } });
        }}
        isLoading={rejectMutation.isPending}
      />

      {/* Revocation Dialog */}
      <ConsentRevocationDialog
        isOpen={isRevokeOpen}
        onClose={() => setIsRevokeOpen(false)}
        consent={consent}
        onConfirmRevoke={async (id, reason) => {
          await revokeMutation.mutateAsync({ consentId: id, input: { reason } });
        }}
        isLoading={revokeMutation.isPending}
      />
    </div>
  );
}
