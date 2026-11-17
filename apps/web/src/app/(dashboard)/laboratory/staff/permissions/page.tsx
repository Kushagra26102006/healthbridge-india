'use client';

import React from 'react';
import Link from 'next/link';
import { KeyRound, ShieldAlert, Users } from 'lucide-react';
import { useLaboratoryPermissions } from '@/features/laboratory/hooks/use-laboratory-workforce';
import { RolePermissionMatrix } from '@/features/laboratory/components/RolePermissionMatrix';
import { Button } from '@/components/ui/button';

export default function LaboratoryRolePermissionsPage() {
  const { catalogue, rolePermissions, loading, error } = useLaboratoryPermissions();

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <KeyRound className="h-6 w-6 text-teal-600" />
            Laboratory Role Permissions & Segregation of Duties
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Deny-by-default laboratory RBAC matrix across 8 operational roles and granular permissions.
          </p>
        </div>

        <Link href="/laboratory/staff">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Users className="h-4 w-4" /> Manage Staff Overrides
          </Button>
        </Link>
      </div>

      {/* Segregation of Duties Policy Notice */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-semibold">Enforced Clinical Segregation of Duties Controls</p>
          <p>
            Technicians entering clinical results cannot self-approve diagnostic reports. Final
            report authorization requires an eligible Reviewer or Pathologist (different actor than
            result author). Inventory adjustments and permission grants are audited and restricted
            by laboratory scope.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <RolePermissionMatrix
        catalogue={catalogue}
        rolePermissions={rolePermissions}
        loading={loading}
      />
    </div>
  );
}
