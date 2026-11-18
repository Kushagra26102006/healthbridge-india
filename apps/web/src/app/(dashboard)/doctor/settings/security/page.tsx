'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsNav, DoctorSecuritySettings } from '@/components/doctor/settings';
import { SecurityPostureCard } from '@/components/security/SecurityPostureCard';
import { RolePrivacyBanner } from '@/components/security/RolePrivacyBanner';

export default function DoctorSecuritySettingsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-md">
          <Link href="/doctor/settings" aria-label="Back to doctor settings">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Security &amp; Password Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage clinical account credentials, session security, and patient data access boundaries
          </p>
        </div>
      </div>

      <SettingsNav />

      <RolePrivacyBanner role="DOCTOR" />

      <SecurityPostureCard sessionsHref="/doctor/settings/sessions" />

      <DoctorSecuritySettings />
    </div>
  );
}
