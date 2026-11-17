'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Activity, RefreshCw } from 'lucide-react';
import { useLaboratoryStaffDetail } from '@/features/laboratory/hooks/use-laboratory-workforce';
import { StaffActivityTimeline } from '@/features/laboratory/components/StaffActivityTimeline';
import { Button } from '@/components/ui/button';

export default function LaboratoryStaffActivityPage() {
  const params = useParams();
  const staffId = params?.id as string;

  const { staff, activities, activityTotal, loading, error, refetch } =
    useLaboratoryStaffDetail(staffId);

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/laboratory/staff/${staffId}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Profile
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-6 w-6 text-teal-600" />
              Staff Activity & Audit Log
            </h1>
            <p className="text-xs text-slate-500">
              {staff ? `${staff.fullName} (${staff.employeeId})` : 'Staff Member'} • {activityTotal}{' '}
              immutable audit records
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <StaffActivityTimeline activities={activities} loading={loading} />
    </div>
  );
}
