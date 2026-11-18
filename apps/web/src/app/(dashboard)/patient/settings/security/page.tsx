'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsNav, SecuritySettings } from '@/components/patient/settings';
import { SecurityPostureCard } from '@/components/security/SecurityPostureCard';

export default function PatientSecuritySettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-2.5">
        <Button asChild variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-md">
          <Link href="/patient/settings" aria-label="Back to patient settings">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Security &amp; Password Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update account credentials, review session expiration rules, and monitor authentication safeguards
          </p>
        </div>
      </div>

      <SettingsNav />

      <SecurityPostureCard sessionsHref="/patient/settings/sessions" />

      <SecuritySettings />
    </div>
  );
}
