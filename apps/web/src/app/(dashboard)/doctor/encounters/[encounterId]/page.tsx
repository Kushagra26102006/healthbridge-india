'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileEdit, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EncounterWorkspace,
  EncounterWorkspaceSkeleton,
} from '@/components/doctor/encounters';
import { useDoctorEncounterDetail } from '@/features/doctor/hooks/use-doctor';

export default function DoctorEncounterDetailPage() {
  const params = useParams();
  const encounterId = params?.encounterId as string;

  const { encounter, isLoading, isError, error, refetch } = useDoctorEncounterDetail(encounterId);

  if (isLoading) {
    return <EncounterWorkspaceSkeleton />;
  }

  if (isError || !encounter) {
    return (
      <div className="py-16 text-center space-y-3 max-w-md mx-auto">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-sm font-bold text-foreground">Failed to load encounter</p>
        <p className="text-xs text-muted-foreground">{error?.message || 'Encounter record not found'}</p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link href="/doctor/encounters">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              All Encounters
            </Link>
          </Button>
          <Button size="sm" onClick={() => refetch()} className="text-xs gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl">
      {/* If draft, provide prominent quick CTA to switch to edit mode */}
      {encounter.isDraft && (
        <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
          <span>This clinical consultation is currently in draft mode.</span>
          <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 gap-1">
            <Link href={`/doctor/encounters/${encounterId}/edit`}>
              <FileEdit className="h-3 w-3" />
              Edit Consultation
            </Link>
          </Button>
        </div>
      )}

      <EncounterWorkspace
        encounter={encounter}
        onRefresh={refetch}
        isReadOnly={!encounter.isDraft || encounter.status === 'COMPLETED'}
      />
    </div>
  );
}
