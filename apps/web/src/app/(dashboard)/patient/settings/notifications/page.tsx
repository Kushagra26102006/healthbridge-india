'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsNav, NotificationPreferences } from '@/components/patient/settings';

export default function PatientNotificationsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-2.5">
        <Link href="/patient/settings">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Notification Preferences
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure delivery channels for consultations, laboratory reports, and prescriptions
          </p>
        </div>
      </div>

      <SettingsNav />

      <NotificationPreferences />
    </div>
  );
}

