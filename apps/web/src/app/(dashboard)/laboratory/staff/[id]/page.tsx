'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Activity, KeyRound } from 'lucide-react';
import { useLaboratoryStaffDetail } from '@/features/laboratory/hooks/use-laboratory-workforce';
import { StaffProfileCard } from '@/features/laboratory/components/StaffProfileCard';
import { StaffActivityTimeline } from '@/features/laboratory/components/StaffActivityTimeline';
import { Button } from '@/components/ui/button';

export default function LaboratoryStaffDetailPage() {
  const params = useParams();
  const staffId = params?.id as string;

  const { staff, activities, loading, error } = useLaboratoryStaffDetail(staffId);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <p className="mt-2 text-sm text-slate-500">Loading staff profile...</p>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Link href="/laboratory/staff">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Staff Directory
          </Button>
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || 'Laboratory staff member not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/laboratory/staff">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Staff Directory
          </Button>
        </Link>
      </div>

      <StaffProfileCard staff={staff} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-teal-600" /> Effective Permissions
            </h3>
            <Link
              href={`/laboratory/staff/${staff.id}/permissions`}
              className="text-xs font-medium text-teal-600 hover:underline"
            >
              Configure
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {staff.permissions.map((perm) => (
              <span
                key={perm}
                className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {perm}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-600" /> Recent Audit Activity
            </h3>
            <Link
              href={`/laboratory/staff/${staff.id}/activity`}
              className="text-xs font-medium text-teal-600 hover:underline"
            >
              View Complete Audit Log →
            </Link>
          </div>
          <StaffActivityTimeline activities={activities.slice(0, 8)} />
        </div>
      </div>
    </div>
  );
}
