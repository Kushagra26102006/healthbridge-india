'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PrivacyRole = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'LABORATORY' | 'ADMIN';

const ROLE_PRIVACY_COPY: Record<
  PrivacyRole,
  { title: string; summary: string; actionHref?: string; actionLabel?: string }
> = {
  PATIENT: {
    title: 'Your Health Data Remains Under Your Consent Control',
    summary:
      'Providers only view health records you explicitly share or authorize for active care. Every external access attempt is logged in your Access History and consents can be revoked at any time.',
    actionHref: '/patient/consent',
    actionLabel: 'Manage Consents',
  },
  DOCTOR: {
    title: 'Scoped Clinical Privacy Boundary',
    summary:
      'Patient clinical records are strictly limited to assigned care relationships and active patient consent artefacts. Every record inspection is audited server-side.',
  },
  PHARMACY: {
    title: 'Prescription Data Minimization Active',
    summary:
      'Pharmacy workspaces only expose prescription fulfillment details required for safe dispensing—unrelated clinical history and full medical charts remain inaccessible.',
  },
  LABORATORY: {
    title: 'Diagnostic Order & Report Privacy Boundary',
    summary:
      'Laboratory access is scoped to assigned diagnostic orders, specimen custody, and authorized report publication. Reports are shared only with authorized patients and ordering clinicians.',
  },
  ADMIN: {
    title: 'Least-Privilege Administrative Governance',
    summary:
      'Platform administrators manage operational health, privacy requests, and sanitized security telemetry only. Unrestricted access to private patient clinical records is disabled server-side.',
    actionHref: '/admin/roles',
    actionLabel: 'View Access Policy',
  },
};

export function RolePrivacyBanner({
  role,
  className,
}: {
  role: PrivacyRole;
  className?: string;
}) {
  const copy = ROLE_PRIVACY_COPY[role];

  return (
    <aside
      aria-label={copy.title}
      className={cn(
        'rounded-xl border border-secondary/25 bg-secondary/[0.06] dark:bg-secondary/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs',
        className
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="h-7 w-7 rounded-md bg-secondary/15 text-secondary flex items-center justify-center shrink-0 mt-0.5">
          {role === 'PATIENT' ? (
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Lock className="h-4 w-4" aria-hidden="true" />
          )}
        </div>
        <div className="space-y-0.5 min-w-0">
          <p className="font-semibold text-foreground">{copy.title}</p>
          <p className="text-muted-foreground leading-relaxed">{copy.summary}</p>
        </div>
      </div>

      {copy.actionHref && copy.actionLabel && (
        <Link
          href={copy.actionHref}
          className="inline-flex items-center gap-1 font-semibold text-secondary hover:underline shrink-0 focus-ring rounded-sm self-start sm:self-center"
        >
          <span>{copy.actionLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </aside>
  );
}

export default RolePrivacyBanner;
