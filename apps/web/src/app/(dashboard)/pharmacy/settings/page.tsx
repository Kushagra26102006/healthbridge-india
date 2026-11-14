'use client';

import React from 'react';
import Link from 'next/link';
import {
  Settings,
  Building2,
  ShieldCheck,
  Bell,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { usePharmacyProfile } from '@/features/pharmacy/hooks/use-pharmacy';

export default function PharmacySettingsPage() {
  const { data: profile } = usePharmacyProfile();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
          <Settings className="w-3.5 h-3.5" />
          <span>Configuration & Security</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Pharmacy Portal Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage statutory verification details, inventory alerts, and account preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pharmacy Profile Card */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Establishment Profile
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Update store operating hours, phone numbers, delivery address, and supported pharmaceutical services.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/pharmacy/profile"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              <span>Edit Profile & Hours</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Statutory License & Verification */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Statutory Verification Status
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Drug license credentials and state drug authority verification status.
            </p>
            <div className="mt-2 text-xs font-mono text-slate-700">
              License: {profile?.pharmacyLicenseNumber || 'DL-PENDING'}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                profile?.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {profile?.verificationStatus || 'PENDING'}
            </span>
            <span className="text-[11px] text-slate-400">CDSCO Audited</span>
          </div>
        </div>

        {/* Notifications & Low-Stock Alerts */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Alerts & Notifications
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure inventory low-stock thresholds, expiry reminders, and prescription notifications.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/pharmacy/notifications"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700"
            >
              <span>View System Alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Security & Credentials */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Account Security & Sessions
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Manage your pharmacy login credentials, multi-factor authentication, and active browser sessions.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Protected by HealthBridge India Central IAM
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
