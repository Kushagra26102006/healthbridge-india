'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, ArrowLeft, AlertTriangle } from 'lucide-react';
import { privacyApi, type PrivacyNoticeDto } from '@/features/privacy/api/privacy-api';

export default function PublicPrivacyPolicyPage() {
  const [notice, setNotice] = useState<PrivacyNoticeDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    privacyApi
      .getPublicNotice()
      .then(setNotice)
      .catch(() => setError('Unable to load the current privacy notice right now.'));
  }, []);

  return (
    <main id="main-content" className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to HealthBridge India</span>
          </Link>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
            Version {notice?.version || '1.0.0-draft'}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">HealthBridge India Privacy Notice</h1>
              <p className="text-xs text-muted-foreground">
                Effective Date: {notice?.effectiveDate || '2026-11-18'} • Operator:{' '}
                {notice?.organization.name || 'HealthBridge India (Configurable)'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              <strong>Legal Review Notice:</strong> This plain-language privacy notice is a structured
              pre-production draft. Final statutory wording, retention durations, and Data Protection
              Officer / Grievance Officer contact details must be reviewed and approved by qualified
              Indian legal counsel prior to production launch.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 text-sm text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {(notice?.sections || []).map((section) => (
            <section
              key={section.id}
              className="rounded-2xl border border-border bg-card p-6 space-y-3"
            >
              <h2 className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>{section.title}</span>
              </h2>
              <p className="text-sm text-muted-foreground">{section.summary}</p>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-foreground/90">
                {section.points.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 p-6 text-xs text-muted-foreground space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Grievance & Privacy Contact</h2>
          <p>{notice?.organization.grievanceChannelLabel}</p>
          <p>
            Signed-in patients can manage consents, review access history, request data exports,
            submit corrections, or request account closure directly from{' '}
            <Link href="/patient/privacy" className="text-teal-700 dark:text-teal-300 underline">
              the Patient Privacy Dashboard
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
