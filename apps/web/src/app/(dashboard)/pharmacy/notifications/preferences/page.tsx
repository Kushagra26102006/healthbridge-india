'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NotificationPreferencesForm } from '@/components/notifications';

export default function PharmacyNotificationPreferencesPage() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Link
        href="/pharmacy/notifications"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Notification Center</span>
      </Link>

      <NotificationPreferencesForm roleTitle="Pharmacy Communication & Notification Preferences" />
    </div>
  );
}
