'use client';

import React from 'react';
import Link from 'next/link';
import {
  Settings,
  Building2,
  FileText,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
  Laptop,
  Bell,
  ArrowRight,
  AlertTriangle,
  BadgeCheck,
} from 'lucide-react';
import {
  usePharmacyProfile,
  usePharmacyOperatingHours,
  usePharmacyServices,
  usePharmacyStaffList,
  usePharmacySessions,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { PharmacySettingsNav } from '@/components/pharmacy/settings/PharmacySettingsNav';
import { Badge } from '@/components/ui/badge';

export default function PharmacySettingsPage() {
  const { data: profile } = usePharmacyProfile();
  const { data: operatingHours } = usePharmacyOperatingHours();
  const { data: services } = usePharmacyServices();
  const { data: staffData } = usePharmacyStaffList();
  const { data: sessions } = usePharmacySessions();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
          <Settings className="w-3.5 h-3.5" />
          <span>Configuration, Operations & IAM</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Pharmacy Portal Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your establishment details, statutory licenses, operating schedules, dispensary staff, and IAM security.
        </p>
      </div>

      {/* Sub-Navigation */}
      <PharmacySettingsNav />

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. General Info */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">General Information</h3>
            <p className="text-xs text-slate-500 mt-1">
              Establishment name, store branding, contact phone, dispensary email, and location.
            </p>
            <div className="mt-3 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="font-medium text-slate-900">{profile?.pharmacyName || 'HealthBridge Pharmacy'}</span>
              <p className="text-[11px] text-slate-500 truncate">{profile?.email || 'N/A'}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/pharmacy/settings/general"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              <span>Manage General Info</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 2. Business & License */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Business & Licensing</h3>
            <p className="text-xs text-slate-500 mt-1">
              CDSCO / State Drug Controller license, GSTIN number, and statutory documents.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Badge
                className={
                  profile?.verificationStatus === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }
              >
                {profile?.verificationStatus === 'VERIFIED' ? (
                  <BadgeCheck className="w-3 h-3 mr-1" />
                ) : (
                  <AlertTriangle className="w-3 h-3 mr-1" />
                )}
                {profile?.verificationStatus || 'PENDING'}
              </Badge>
              <span className="text-xs font-mono text-slate-600 truncate">
                {profile?.pharmacyLicenseNumber || 'DL-PENDING'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/pharmacy/settings/business"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              <span>View Statutory Credentials</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3. Operating Hours */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Operating Hours</h3>
            <p className="text-xs text-slate-500 mt-1">
              Weekly schedule, staff break intervals, temporary closures, and timezone settings.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  operatingHours?.isOpenNow
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    operatingHours?.isOpenNow ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                />
                {operatingHours?.isOpenNow ? 'Open Now' : 'Closed'}
              </span>
              <span className="text-[11px] text-slate-500">
                {operatingHours?.timezone || 'Asia/Kolkata'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/pharmacy/settings/operating-hours"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <span>Configure Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4. Services */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Services & Capabilities</h3>
            <p className="text-xs text-slate-500 mt-1">
              Prescription dispensing, in-store pickup, chronic refills, and delivery parameters.
            </p>
            <div className="mt-3 text-xs text-slate-600 flex flex-wrap gap-1.5">
              {services?.dispensingEnabled && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                  Dispensing Active
                </span>
              )}
              {services?.inStorePickupEnabled && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                  Pickup Ready
                </span>
              )}
              {services?.chronicRefillProgramEnabled && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                  Chronic Refills
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/pharmacy/settings/services"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700"
            >
              <span>Manage Services</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 5. Staff Management */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Staff Management</h3>
            <p className="text-xs text-slate-500 mt-1">
              Dispensary staff invitations, pharmacist credentials, and role-based permissions.
            </p>
            <div className="mt-3 text-xs text-slate-700">
              <span className="font-semibold text-slate-900">{staffData?.total || 0}</span> staff members registered
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/pharmacy/settings/staff"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700"
            >
              <span>Manage Dispensary Staff</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 6. Account Security */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Account Security</h3>
            <p className="text-xs text-slate-500 mt-1">
              Change portal password, enforce strong credential policies, and safeguard IAM tokens.
            </p>
            <div className="mt-3 text-xs text-slate-500">
              Encrypted with Bcrypt + SHA-256
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/pharmacy/settings/security"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              <span>Change Password & Security</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 7. Active Sessions */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
              <Laptop className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Active Sessions</h3>
            <p className="text-xs text-slate-500 mt-1">
              Review connected devices, terminate unauthorized browsers, and manage single sign-on sessions.
            </p>
            <div className="mt-3 text-xs text-slate-700">
              <span className="font-semibold text-slate-900">{sessions?.length || 1}</span> active session(s)
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/pharmacy/settings/sessions"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              <span>Inspect Active Sessions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 8. Notification Preferences */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Notifications & Alerts</h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure inventory alerts, prescription events, order notifications, and delivery channels.
            </p>
            <div className="mt-3 text-xs text-slate-500">
              Real-time SSE + In-App dispatch
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/pharmacy/settings/notifications"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 hover:text-cyan-700"
            >
              <span>Notification Preferences</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
