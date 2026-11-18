'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Share2, ShieldCheck, ArrowLeft, Info } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { privacyApi } from '@/features/privacy/api/privacy-api';

export default function PatientDataSharingPage() {
  const [posture, setPosture] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    privacyApi
      .getGovernanceMetadata()
      .then((res) => setPosture(res.externalSharingPosture))
      .catch(() => undefined);
  }, []);

  return (
    <ProtectedRoute allowedRoles={['PATIENT']} redirectUnauth>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/patient/privacy"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Privacy Dashboard</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-6 h-6 text-teal-600" />
            <h1 className="text-xl font-bold">External Data Sharing & ABDM Governance</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            HealthBridge India enforces purpose-specific, category-scoped, time-bound consent before sharing any health record externally.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2 text-xs">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Active Safeguards</span>
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Account registration never grants blanket sharing permission.</li>
              <li>Only explicitly consented data categories are ever included in an exchange.</li>
              <li>Revoking a consent blocks subsequent access immediately.</li>
              <li>Imported external records always retain source provenance and are never auto-marked as locally verified.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2 text-xs">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Current ABDM Environment Status</span>
            </h2>
            <p className="text-muted-foreground">
              ABDM External Gateway:{' '}
              <strong className="text-foreground">
                {posture?.abdmEnabled ? 'Enabled (Sandbox/Configured)' : 'Disabled (Local Only)'}
              </strong>
            </p>
            <p className="text-muted-foreground">
              Environment Mode:{' '}
              <strong className="text-foreground font-mono">
                {String(posture?.abdmEnvironment || 'disabled')}
              </strong>
            </p>
            <div className="pt-2 flex gap-2">
              <Link
                href="/patient/consent"
                className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700"
              >
                Manage Active Consents
              </Link>
              <Link
                href="/patient/abha"
                className="px-3 py-1.5 rounded-lg border border-border font-semibold hover:bg-muted"
              >
                ABHA Identity Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
