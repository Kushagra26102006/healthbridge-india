'use client';

import React from 'react';
import { Check, Minus, ShieldCheck } from 'lucide-react';
import type {
  PermissionGroupDto,
  LaboratoryStaffRole,
  LaboratoryPermission,
} from '@healthbridge/shared-types';

export interface RolePermissionMatrixProps {
  catalogue: PermissionGroupDto[];
  rolePermissions: { role: LaboratoryStaffRole; permissions: LaboratoryPermission[] }[];
  loading?: boolean;
}

export function RolePermissionMatrix({
  catalogue,
  rolePermissions,
  loading = false,
}: RolePermissionMatrixProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <p className="mt-2 text-sm text-slate-500">Loading RBAC role permission matrix...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Laboratory-Scoped Role Permission Matrix (Deny-by-Default RBAC)
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          {rolePermissions.length} lab roles • {catalogue.reduce((sum, g) => sum + g.permissions.length, 0)} granular permissions
        </span>
      </div>

      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          <tr>
            <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 px-4 py-3 min-w-[220px]">
              Permission
            </th>
            {rolePermissions.map((rp) => (
              <th key={rp.role} className="px-3 py-3 text-center whitespace-nowrap">
                {rp.role.replace('LAB_', '')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {catalogue.map((group) => (
            <React.Fragment key={group.group}>
              <tr className="bg-slate-100/80 dark:bg-slate-800/50">
                <td
                  colSpan={rolePermissions.length + 1}
                  className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300"
                >
                  {group.label}
                </td>
              </tr>
              {group.permissions.map((perm) => (
                <tr key={perm.code} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-4 py-2.5 border-r border-slate-100 dark:border-slate-800">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{perm.label}</div>
                    <div className="font-mono text-[10px] text-slate-400">{perm.code}</div>
                  </td>
                  {rolePermissions.map((rp) => {
                    const has = rp.permissions.includes(perm.code);
                    return (
                      <td key={`${rp.role}-${perm.code}`} className="px-3 py-2.5 text-center">
                        {has ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex h-5 w-5 items-center justify-center text-slate-300 dark:text-slate-700">
                            <Minus className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
