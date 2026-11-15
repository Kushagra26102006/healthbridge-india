'use client';

import React from 'react';
import { Bell } from 'lucide-react';

export default function LaboratoryNotificationsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            Laboratory Notification Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time notifications for incoming orders, urgent/STAT alerts, specimen recollections, and statutory verification updates
          </p>
        </div>
      </div>

      <div className="p-8 text-center bg-card rounded-2xl border border-border shadow-xs space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 flex items-center justify-center mx-auto">
          <Bell className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-bold text-foreground">
          Real-Time Diagnostic Alerts Active
        </h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Diagnostic event alerts are delivered via the topbar bell icon and in-app toasts. Real-time channels listen for order acceptance, specimen collection events, and critical result escalations.
        </p>
      </div>
    </div>
  );
}
