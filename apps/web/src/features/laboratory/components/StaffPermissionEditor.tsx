'use client';

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Ban, RotateCcw, Save } from 'lucide-react';
import type {
  LaboratoryStaffDto,
  PermissionGroupDto,
  LaboratoryPermission,
  UpdateStaffPermissionsDto,
} from '@healthbridge/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface StaffPermissionEditorProps {
  staff: LaboratoryStaffDto;
  catalogue: PermissionGroupDto[];
  roleDefaultPermissions: LaboratoryPermission[];
  onSave: (dto: UpdateStaffPermissionsDto) => Promise<void>;
}

export function StaffPermissionEditor({
  staff,
  catalogue,
  roleDefaultPermissions,
  onSave,
}: StaffPermissionEditorProps) {
  const [allowed, setAllowed] = useState<Set<LaboratoryPermission>>(new Set(staff.allowedPermissions));
  const [denied, setDenied] = useState<Set<LaboratoryPermission>>(new Set(staff.deniedPermissions));
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setAllowed(new Set(staff.allowedPermissions));
    setDenied(new Set(staff.deniedPermissions));
  }, [staff]);

  const roleDefaultSet = new Set(roleDefaultPermissions);

  const isEffective = (code: LaboratoryPermission) => {
    if (denied.has(code)) return false;
    if (allowed.has(code)) return true;
    return roleDefaultSet.has(code);
  };

  const togglePermission = (code: LaboratoryPermission) => {
    const currentlyGranted = isEffective(code);
    const inDefault = roleDefaultSet.has(code);
    const nextAllowed = new Set(allowed);
    const nextDenied = new Set(denied);

    if (currentlyGranted) {
      // Revoke permission
      nextAllowed.delete(code);
      if (inDefault) {
        nextDenied.add(code);
      }
    } else {
      // Grant permission
      nextDenied.delete(code);
      if (!inDefault) {
        nextAllowed.add(code);
      }
    }

    setAllowed(nextAllowed);
    setDenied(nextDenied);
  };

  const resetToRoleDefaults = () => {
    setAllowed(new Set());
    setDenied(new Set());
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);
      await onSave({
        allowedPermissions: Array.from(allowed),
        deniedPermissions: Array.from(denied),
        reason: reason.trim() || undefined,
      });
      setReason('');
      setFeedback({ type: 'success', message: 'Staff permission overrides saved and audited.' });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Failed to update permissions',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-600" />
            Permission Overrides for {staff.fullName}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Base Role: <strong>{staff.role}</strong> • Custom Grants: +{allowed.size} • Explicit Denials: -{denied.size}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetToRoleDefaults} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Reset to Role Defaults
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Audit Reason for Permission Change (Optional)
        </label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Temporarily granting inventory receipt rights during stock audit"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {catalogue.map((group) => (
          <div
            key={group.group}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
          >
            <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {group.label}
              </h4>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {group.permissions.map((perm) => {
                const effective = isEffective(perm.code);
                const isDefault = roleDefaultSet.has(perm.code);
                const isCustomGrant = allowed.has(perm.code);
                const isCustomDeny = denied.has(perm.code);

                return (
                  <div
                    key={perm.code}
                    className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {perm.label}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{perm.code}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{perm.description}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                        {isDefault && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Role Default
                          </span>
                        )}
                        {isCustomGrant && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">
                            Explicit Grant
                          </span>
                        )}
                        {isCustomDeny && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold">
                            Explicit Deny
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePermission(perm.code)}
                      className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        effective
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {effective ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Allowed
                        </>
                      ) : (
                        <>
                          <Ban className="h-3.5 w-3.5" /> Denied
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
