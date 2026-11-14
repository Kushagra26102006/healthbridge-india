'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NotificationDeliveryStatus } from '@/components/notifications';

export default function PharmacyNotificationHistoryPage() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <Link
        href="/pharmacy/notifications"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Notification Center</span>
      </Link>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Notification Delivery History & Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review dispatch confirmations, provider response references, and retry states across In-App, Email, and SMS channels.
        </p>
      </div>

      <NotificationDeliveryStatus />
    </div>
  );
}
