'use client';

import React from 'react';
import {
  usePharmacyProfile,
  useUpdatePharmacyProfile,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { PharmacyProfileForm } from '@/components/pharmacy';
import { Building2, AlertCircle, RefreshCw } from 'lucide-react';

export default function PharmacyProfilePage() {
  const { data: profile, isLoading, error, refetch } = usePharmacyProfile();
  const updateMutation = useUpdatePharmacyProfile();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-20 bg-slate-200 rounded-2xl w-full"></div>
        <div className="h-64 bg-slate-200 rounded-2xl w-full"></div>
        <div className="h-64 bg-slate-200 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200 my-6 max-w-lg mx-auto shadow-xs">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          Unable to Load Pharmacy Profile
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          We encountered an error loading your statutory registration and operating details.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
          <Building2 className="w-3.5 h-3.5" />
          <span>Statutory Entity Management</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Pharmacy Profile & Operating Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your establishment contact details, operating schedules, and review ABDM/CDSCO drug license credentials.
        </p>
      </div>

      {/* Main Profile Form */}
      <PharmacyProfileForm
        profile={profile}
        onSave={async (dto) => {
          await updateMutation.mutateAsync(dto);
        }}
        isSaving={updateMutation.isPending}
      />
    </div>
  );
}
