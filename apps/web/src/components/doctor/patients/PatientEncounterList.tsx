'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Building2,
  User,
  ArrowRight,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Lock,
  Edit3,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PatientEmptyState } from './PatientEmptyState';
import { useDoctorPatientEncounters } from '@/features/doctor/hooks/use-doctor';

interface PatientEncounterListProps {
  patientId: string;
}

export const PatientEncounterList: React.FC<PatientEncounterListProps> = ({ patientId }) => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { encounters, pagination, isLoading, isError, error, refetch } =
    useDoctorPatientEncounters(patientId, page, limit);

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Consultation Encounter History
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Previous clinical consultation chartings and consultation notes for this patient.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-8"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>

          <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 h-8 shadow-xs">
            <Link href={`/doctor/encounters/new?patientId=${patientId}`}>
              <Plus className="h-3.5 w-3.5" />
              New Encounter
            </Link>
          </Button>
        </div>
      </div>

      {/* Encounters List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted/40 animate-pulse border border-border/40" />
          ))}
        </div>
      ) : isError ? (
        <PatientEmptyState
          title="Encounters Unavailable"
          description={error?.message || 'Failed to load consultation encounter history.'}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : encounters.length === 0 ? (
        <PatientEmptyState
          icon={Calendar}
          title="No Consultations Recorded"
          description="There are no documented clinical encounters for this patient yet."
          actionLabel="Start First Consultation"
          onAction={() => {
            window.location.href = `/doctor/encounters/new?patientId=${patientId}`;
          }}
        />
      ) : (
        <div className="space-y-3">
          {encounters.map((enc) => (
            <Card
              key={enc.id}
              className="border border-border/80 bg-card hover:border-teal-500/40 transition-all shadow-xs"
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-teal-600 text-xs">
                      {enc.encounterReference}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                      {enc.encounterType}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        enc.status === 'COMPLETED'
                          ? 'border-emerald-500/40 text-emerald-600 bg-emerald-50/40'
                          : 'border-blue-500/40 text-blue-600 bg-blue-50/40'
                      }`}
                    >
                      {enc.status}
                    </Badge>
                    {enc.isOwner ? (
                      <Badge variant="outline" className="text-[10px] border-teal-500/30 text-teal-600">
                        My Consultation
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Read-Only Chart
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {enc.chiefComplaint || 'Clinical consultation note'}
                    </h4>
                    {enc.primaryDiagnosis && (
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                        Primary Diagnosis: {enc.primaryDiagnosis}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(enc.startTime)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {enc.treatingDoctor.name}
                    </span>
                    {enc.facility?.name && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {enc.facility.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {enc.isOwner && enc.isDraft ? (
                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-8">
                      <Link href={`/doctor/encounters/${enc.id}/edit`}>
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit Draft
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline" className="text-xs gap-1.5 h-8">
                      <Link href={`/doctor/encounters/${enc.id}`}>
                        View Chart
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
              <span className="text-muted-foreground">
                Page <span className="font-bold text-foreground">{pagination.page}</span> of{' '}
                <span className="font-bold text-foreground">{pagination.totalPages}</span> ({pagination.total} consultations)
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
