'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit3, ShieldCheck, UserCheck, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PatientProfileDto } from '@healthbridge/shared-types';

export interface PatientProfileHeaderProps {
  profile?: PatientProfileDto;
  onEditClick?: () => void;
  isEditing?: boolean;
}

export const PatientProfileHeader: React.FC<PatientProfileHeaderProps> = ({
  profile,
  onEditClick,
  isEditing = false,
}) => {
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : '2024';

  const isAbhaLinked = profile?.abhaLinkageStatus === 'LINKED';

  return (
    <div className="space-y-4">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link href="/patient/dashboard">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Patient Profile & Identity
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage personal identity, verified contact channels, and ABHA credentials
            </p>
          </div>
        </div>

        {onEditClick && !isEditing && (
          <Button
            size="sm"
            onClick={onEditClick}
            className="text-xs gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Information</span>
          </Button>
        )}
      </div>

      {/* Main Profile Identity Card */}
      <div className="p-6 rounded-2xl border border-border/80 bg-card shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-500 text-white flex items-center justify-center font-bold text-2xl shadow-md select-none">
              {profile?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            {profile?.accountStatus === 'ACTIVE' && (
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center text-white"
                title="Active Account"
              >
                <UserCheck className="h-3 w-3" />
              </div>
            )}
          </div>

          {/* Name & Badges */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {profile?.name || 'Verified Patient'}
              </h2>
              <Badge variant="outline" className="text-[10px] font-mono border-teal-500/30 text-teal-600 dark:text-teal-400">
                PATIENT
              </Badge>
              {isAbhaLinked ? (
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[10px] flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>ABHA Linked</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/20 bg-amber-500/10">
                  ABHA Not Linked
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>ID: {profile?.userId ? `${profile.userId.slice(0, 8)}...` : 'N/A'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>Member since {memberSince}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Completion Indicator */}
        <div className="w-full sm:w-48 p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Profile Status</span>
            <span className="text-teal-600 dark:text-teal-400">
              {profile?.completionPercentage ?? 75}% Complete
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${profile?.completionPercentage ?? 75}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

