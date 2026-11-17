'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { DashboardPlaceholder } from '@/components/dashboard/DashboardPlaceholder';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardPlaceholder
        role="ADMIN"
        title="Administrative Governance Portal"
        description="Oversee healthcare facility onboarding, monitor ABDM webhook events, and inspect system audit trails."
      />
      <div className="max-w-4xl mx-auto px-4">
        <Link
          href="/admin/integrations/abdm"
          className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-teal-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                ABDM Integration Status &amp; Sandbox Readiness
              </h2>
              <p className="text-xs text-slate-500">
                Inspect configuration completeness, FHIR R4 mapping readiness, consent adapter
                controls, and sandbox onboarding prerequisites.
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </Link>
      </div>
    </div>
  );
}
