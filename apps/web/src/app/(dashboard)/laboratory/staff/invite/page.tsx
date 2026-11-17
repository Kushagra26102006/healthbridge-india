'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus, KeyRound, CheckCircle2, Copy } from 'lucide-react';
import {
  LABORATORY_STAFF_ROLES,
  type LaboratoryStaffRole,
} from '@healthbridge/shared-types';
import { laboratoryWorkforceApi } from '@/features/laboratory/api/laboratory-workforce-api';
import { useLaboratoryDepartments } from '@/features/laboratory/hooks/use-laboratory-workforce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function InviteLaboratoryStaffPage() {
  const { departments } = useLaboratoryDepartments();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [role, setRole] = useState<LaboratoryStaffRole>('LAB_TECHNICIAN');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await laboratoryWorkforceApi.inviteStaff({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        designation: designation.trim(),
        departmentId: departmentId || undefined,
        role,
        licenseNumber: licenseNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setToken(res.invitationToken || 'INVITATION_DISPATCHED');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to invite staff');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/laboratory/staff">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Staff
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-teal-600" />
            Invite Laboratory Staff Member
          </h1>
          <p className="text-xs text-slate-500">
            Generates a single-use SHA-256 hashed onboarding token valid for 7 days.
          </p>
        </div>
      </div>

      {token ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-800 p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Staff Invitation Created</h2>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Share this single-use onboarding token securely with <strong>{fullName}</strong> ({email}).
            Raw tokens are never stored in logs or database records.
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 font-mono text-xs break-all">
            <KeyRound className="h-4 w-4 text-teal-600 shrink-0" />
            <span className="flex-1">{token}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(token);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1" /> {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setToken(null);
                setFullName('');
                setEmail('');
                setDesignation('');
              }}
            >
              Invite Another Member
            </Button>
            <Link href="/laboratory/staff">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">Return to Directory</Button>
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name *
              </label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Email *
              </label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Designation *
              </label>
              <Input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g., Senior Lab Technologist"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Laboratory Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as LaboratoryStaffRole)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                {LABORATORY_STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace('LAB_', 'LAB ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="">-- General Laboratory --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Professional / Medical Council License Number
            </label>
            <Input
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="Optional for pathologists / licensed technologists"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Onboarding Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Bench scope or shift handover orientation notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Link href="/laboratory/staff">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white">
              {submitting ? 'Generating Invitation...' : 'Send Staff Invitation'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
