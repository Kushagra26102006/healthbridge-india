'use client';

import React, { useState } from 'react';
import { X, Mail, Shield, CheckCircle2, Copy } from 'lucide-react';
import type {
  InviteLaboratoryStaffDto,
  LaboratoryStaffRole,
  LaboratoryDepartmentDto,
} from '@healthbridge/shared-types';
import { LABORATORY_STAFF_ROLES } from '@healthbridge/shared-types';
import { Button } from '@/components/ui/button';

export interface StaffInvitationModalProps {
  open: boolean;
  onClose: () => void;
  departments: LaboratoryDepartmentDto[];
  onSubmit: (dto: InviteLaboratoryStaffDto) => Promise<{ invitationToken?: string }>;
}

export function StaffInvitationModal({
  open,
  onClose,
  departments,
  onSubmit,
}: StaffInvitationModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [role, setRole] = useState<LaboratoryStaffRole>('LAB_TECHNICIAN');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await onSubmit({
        fullName,
        email,
        phone: phone || undefined,
        designation,
        departmentId: departmentId || undefined,
        role,
        licenseNumber: licenseNumber || undefined,
      });
      setGeneratedToken(res.invitationToken || 'INVITED');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to invite staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetAndClose = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setDesignation('');
    setDepartmentId('');
    setRole('LAB_TECHNICIAN');
    setLicenseNumber('');
    setGeneratedToken(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-white">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Invite Laboratory Staff
              </h2>
              <p className="text-xs text-slate-500">
                Generates a cryptographically secure, single-use onboarding token
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {generatedToken ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Invitation Created & Notification Queued
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Staff member {fullName} ({email}) has been invited as {role.replace('LAB_', '')}.
                </p>
              </div>
            </div>

            {generatedToken !== 'INVITED' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Single-Use Onboarding Token (Expires in 7 days)
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200">
                    {generatedToken}
                  </code>
                  <Button variant="outline" size="sm" onClick={handleCopyToken}>
                    <Copy className="h-4 w-4 mr-1" />
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Security note: Only the SHA-256 hash is stored in the database. Share this token securely if email delivery is not configured.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={resetAndClose}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Ananya Rao"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ananya@diagnosticlab.in"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Designation *
                </label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Senior Biochemist"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-9876543210"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Laboratory Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as LaboratoryStaffRole)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                >
                  {LABORATORY_STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace('LAB_', '').replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical / Technician License Number
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="MCI / DMLT Reg No. (optional)"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-blue-900 hover:bg-blue-800 text-white">
                <Shield className="h-4 w-4 mr-1.5" />
                {submitting ? 'Sending Invite...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
