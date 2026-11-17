'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, UserCog } from 'lucide-react';
import {
  LABORATORY_STAFF_ROLES,
  type LaboratoryStaffRole,
} from '@healthbridge/shared-types';
import {
  useLaboratoryStaffDetail,
  useLaboratoryDepartments,
} from '@/features/laboratory/hooks/use-laboratory-workforce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function EditLaboratoryStaffPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params?.id as string;

  const { staff, loading, error, updateStaff } = useLaboratoryStaffDetail(staffId);
  const { departments } = useLaboratoryDepartments();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [role, setRole] = useState<LaboratoryStaffRole>('LAB_TECHNICIAN');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [qualificationsStr, setQualificationsStr] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (staff) {
      setFullName(staff.fullName);
      setPhone(staff.phone || '');
      setDesignation(staff.designation);
      setDepartmentId(staff.departmentId || '');
      setRole(staff.role);
      setLicenseNumber(staff.licenseNumber || '');
      setQualificationsStr((staff.qualifications || []).join(', '));
      setNotes(staff.notes || '');
    }
  }, [staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveError(null);
      const qualifications = qualificationsStr
        .split(',')
        .map((q) => q.trim())
        .filter(Boolean);

      await updateStaff({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        designation: designation.trim(),
        departmentId: departmentId || null,
        role,
        licenseNumber: licenseNumber.trim() || undefined,
        qualifications,
        notes: notes.trim() || undefined,
      });
      router.push(`/laboratory/staff/${staffId}`);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err?.message || 'Failed to update staff profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || 'Staff member not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/laboratory/staff/${staffId}`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCog className="h-6 w-6 text-teal-600" />
            Edit Staff Profile
          </h1>
          <p className="text-xs text-slate-500">
            {staff.fullName} ({staff.employeeId})
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5"
      >
        {saveError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
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
              Phone
            </label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Designation *
            </label>
            <Input value={designation} onChange={(e) => setDesignation(e.target.value)} required />
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
              <option value="">-- Unassigned --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Laboratory Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as LaboratoryStaffRole)}
              disabled={staff.isPrimaryOwner}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white disabled:opacity-60"
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
              License Number
            </label>
            <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Qualifications (comma-separated)
          </label>
          <Input
            value={qualificationsStr}
            onChange={(e) => setQualificationsStr(e.target.value)}
            placeholder="e.g., B.Sc MLT, M.Sc Biochemistry, MD Pathology"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Administrative Notes
          </label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link href={`/laboratory/staff/${staffId}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
