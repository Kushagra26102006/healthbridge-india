'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { privacyApi, type PrivacyNoticeDto } from '@/features/privacy/api/privacy-api';

export default function PatientPrivacyNoticePage() {
  const [notice, setNotice] = useState<PrivacyNoticeDto | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([privacyApi.getPublicNotice(), privacyApi.getPatientOverview()])
      .then(([n, ov]) => {
        setNotice(n);
        setAcknowledged(Boolean(ov.privacyNotice.acknowledged));
      })
      .catch(() => undefined);
  }, []);

  const handleAcknowledge = async () => {
    if (!notice) return;
    setBusy(true);
    try {
      await privacyApi.acknowledgeNotice(notice.version);
      setAcknowledged(true);
    } finally {
      setBusy(false);
    }
  };

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

        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-teal-600 shrink-0" />
            <div>
              <h1 className="text-xl font-bold">Patient Privacy Notice</h1>
              <p className="text-xs text-muted-foreground">
                Version {notice?.version || '1.0.0-draft'} • Effective {notice?.effectiveDate || '2026-11-18'}
              </p>
            </div>
          </div>

          {acknowledged ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Acknowledged</span>
            </span>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={handleAcknowledge}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 disabled:opacity-50"
            >
              Acknowledge Current Version
            </button>
          )}
        </div>

        {(notice?.sections || []).map((section) => (
          <section key={section.id} className="rounded-2xl border border-border bg-card p-6 space-y-2.5">
            <h2 className="text-sm font-bold">{section.title}</h2>
            <p className="text-xs text-muted-foreground">{section.summary}</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-foreground/90">
              {section.points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ProtectedRoute>
  );
}
