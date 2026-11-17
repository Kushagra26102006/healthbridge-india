'use client';

import React from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  Building,
  Shield,
  Award,
  FileBadge,
  Calendar,
  KeyRound,
  Activity,
  Edit2,
  UserCheck,
} from 'lucide-react';
import type { LaboratoryStaffDto, LaboratoryStaffStatus } from '@healthbridge/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface StaffProfileCardProps {
  staff: LaboratoryStaffDto;
}

const STATUS_BADGE: Record<LaboratoryStaffStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  INVITED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  PENDING_ACCEPTANCE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  SUSPENDED: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
  DEACTIVATED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
};

export function StaffProfileCard({ staff }: StaffProfileCardProps) {
  const initials = staff.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 px-6 py-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-xl font-bold text-teal-300">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">{staff.fullName}</h2>
                <Badge className={`${STATUS_BADGE[staff.status]} border-none text-xs`}>
                  {staff.status.replace('_', ' ')}
                </Badge>
                {staff.isPrimaryOwner && (
                  <Badge className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs">
                    Primary Owner
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-0.5">
                {staff.designation} •{' '}
                <span className="font-mono text-teal-300">{staff.employeeId}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/laboratory/staff/${staff.id}/edit`}>
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-1.5">
                <Edit2 className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            </Link>
            <Link href={`/laboratory/staff/${staff.id}/permissions`}>
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-1.5">
                <KeyRound className="h-3.5 w-3.5" /> Permissions
              </Button>
            </Link>
            <Link href={`/laboratory/staff/${staff.id}/activity`}>
              <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-1.5">
                <Activity className="h-3.5 w-3.5" /> Activity
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Contact & Identity
          </h3>
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>{staff.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-400" />
              <span>{staff.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-400" />
              <span>{staff.departmentName || 'General Laboratory'}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Role & Credentials
          </h3>
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-teal-600" />
              <span className="font-semibold">{staff.role.replace('LAB_', 'LAB ')}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileBadge className="h-4 w-4 text-slate-400" />
              <span>License: {staff.licenseNumber || 'N/A'}</span>
            </div>
            <div className="flex items-start gap-2">
              <Award className="h-4 w-4 text-slate-400 mt-0.5" />
              <span>
                {staff.qualifications && staff.qualifications.length > 0
                  ? staff.qualifications.join(', ')
                  : 'No qualifications recorded'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Effective Access & Audit
          </h3>
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span>{staff.permissions.length} effective permissions granted</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>
                Joined: {staff.invitationAcceptedAt ? staff.invitationAcceptedAt.slice(0, 10) : staff.createdAt.slice(0, 10)}
              </span>
            </div>
            {(staff.allowedPermissions.length > 0 || staff.deniedPermissions.length > 0) && (
              <div className="text-xs text-amber-600 dark:text-amber-400">
                Overrides: +{staff.allowedPermissions.length} allowed / -{staff.deniedPermissions.length} denied
              </div>
            )}
          </div>
        </div>
      </div>

      {staff.notes && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 py-3.5 text-xs text-slate-600 dark:text-slate-400">
          <strong className="text-slate-800 dark:text-slate-200">Admin Notes:</strong> {staff.notes}
        </div>
      )}
    </div>
  );
}
