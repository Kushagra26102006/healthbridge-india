'use client';

import React, { useState } from 'react';
import {
  PatientProfileHeader,
  PersonalInformationCard,
  EditProfileForm,
  ContactInformationCard,
  ABHAProfileCard,
  AccountStatusCard,
} from '@/components/patient/profile';
import { usePatientProfile } from '@/features/patient/hooks/use-profile';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PatientProfilePage() {
  const { profile, isLoading, isError, refetch } = usePatientProfile();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-pulse">
        <div className="h-28 rounded-2xl bg-muted/60" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-muted/60" />
          <div className="h-64 rounded-2xl bg-muted/60" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4 my-12">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-foreground text-sm">Failed to Load Profile</h3>
          <p className="text-xs text-muted-foreground">
            We encountered an error loading your patient profile details.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => refetch()}
          className="text-xs rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Profile Header */}
      <PatientProfileHeader
        profile={profile}
        isEditing={isEditing}
        onEditClick={() => setIsEditing(true)}
      />

      {/* Conditional Edit Form / Display Mode */}
      {isEditing ? (
        <EditProfileForm
          profile={profile}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      ) : (
        <PersonalInformationCard
          profile={profile}
          onEditClick={() => setIsEditing(true)}
        />
      )}

      {/* Contact & ABHA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ContactInformationCard profile={profile} />
        <ABHAProfileCard profile={profile} />
      </div>

      {/* Account Verification & Health Card */}
      <AccountStatusCard profile={profile} />
    </div>
  );
}
