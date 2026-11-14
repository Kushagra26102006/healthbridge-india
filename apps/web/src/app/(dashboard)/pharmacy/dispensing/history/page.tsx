'use client';

import React from 'react';
import Link from 'next/link';
import { DispensingHistoryTable } from '@/components/pharmacy/DispensingHistoryTable';
import { Button } from '@/components/ui/button';
import { History, Pill } from 'lucide-react';

export default function DispensingHistoryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            <History className="w-3.5 h-3.5" />
            <span>Audit & Verification</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Prescription Dispensing History
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Full immutable audit log of completed, partial and cancelled medication dispensations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/pharmacy/dispensing">
            <Button size="sm" className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              <Pill className="w-3.5 h-3.5" />
              New Dispensation
            </Button>
          </Link>
        </div>
      </div>

      {/* History Table */}
      <DispensingHistoryTable />
    </div>
  );
}
