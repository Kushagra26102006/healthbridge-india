'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NotificationPreferencesForm } from '@/components/notifications';

export default function PatientNotificationPreferencesPage() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Link
        href="/patient/notifications"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Notification Center</span>
      </Link>

      <NotificationPreferencesForm roleTitle="Patient Communication & Notification Preferences" />
    </div>
  );
}
