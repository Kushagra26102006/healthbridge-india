'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  useLaboratoryStaffDetail,
  useLaboratoryPermissions,
} from '@/features/laboratory/hooks/use-laboratory-workforce';
import { StaffPermissionEditor } from '@/features/laboratory/components/StaffPermissionEditor';
import { Button } from '@/components/ui/button';

export default function LaboratoryStaffPermissionsDetailPage() {
  const params = useParams();
  const staffId = params?.id as string;

  const { staff, loading: staffLoading, error: staffError, updatePermissions } =
    useLaboratoryStaffDetail(staffId);
  const { catalogue, rolePermissions, loading: permLoading } = useLaboratoryPermissions();

  if (staffLoading || permLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <p className="mt-2 text-sm text-slate-500">Loading staff permission controls...</p>
      </div>
    );
  }

  if (staffError || !staff) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {staffError || 'Staff member not found.'}
        </div>
      </div>
    );
  }

  const roleDefault =
    rolePermissions.find((rp) => rp.role === staff.role)?.permissions || [];

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href={`/laboratory/staff/${staffId}`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Staff Profile
          </Button>
        </Link>
      </div>

      <StaffPermissionEditor
        staff={staff}
        catalogue={catalogue}
        roleDefaultPermissions={roleDefault}
        onSave={async (dto) => {
          await updatePermissions(dto);
        }}
      />
    </div>
  );
}
