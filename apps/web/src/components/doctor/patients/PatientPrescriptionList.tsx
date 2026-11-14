'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Pill,
  Calendar,
  User,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PatientEmptyState } from './PatientEmptyState';
import { useDoctorPatientPrescriptions } from '@/features/doctor/hooks/use-doctor';

interface PatientPrescriptionListProps {
  patientId: string;
}

export const PatientPrescriptionList: React.FC<PatientPrescriptionListProps> = ({ patientId }) => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { prescriptions, pagination, isLoading, isError, error, refetch } =
    useDoctorPatientPrescriptions(patientId, page, limit);

  const formatDate = (isoString: string) => {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-50/40 text-[10px]">
            ACTIVE
          </Badge>
        );
      case 'DISCONTINUED':
        return (
          <Badge variant="outline" className="border-rose-500/40 text-rose-600 bg-rose-50/40 text-[10px]">
            DISCONTINUED
          </Badge>
        );
      case 'COMPLETED':
      case 'DISPENSED':
        return (
          <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-50/40 text-[10px]">
            {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Prescription & Medication History
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active and previously issued electronic prescriptions for this patient.
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
            <Link href={`/doctor/prescriptions/new?patientId=${patientId}`}>
              <Plus className="h-3.5 w-3.5" />
              New Prescription
            </Link>
          </Button>
        </div>
      </div>

      {/* Prescriptions Roster */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted/40 animate-pulse border border-border/40" />
          ))}
        </div>
      ) : isError ? (
        <PatientEmptyState
          title="Prescriptions Unavailable"
          description={error?.message || 'Failed to load prescription history.'}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : prescriptions.length === 0 ? (
        <PatientEmptyState
          icon={Pill}
          title="No Prescriptions Issued"
          description="There are no prescriptions on file for this patient."
          actionLabel="Write New Prescription"
          onAction={() => {
            window.location.href = `/doctor/prescriptions/new?patientId=${patientId}`;
          }}
        />
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <Card
              key={rx.id}
              className="border border-border/80 bg-card hover:border-teal-500/40 transition-all shadow-xs"
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-teal-600 text-xs">
                      {rx.prescriptionNumber}
                    </span>
                    {getStatusBadge(rx.status)}
                    {rx.isOwner && (
                      <Badge variant="outline" className="text-[10px] border-teal-500/30 text-teal-600">
                        Prescribed by Me
                      </Badge>
                    )}
                  </div>

                  {rx.diagnosis && (
                    <p className="text-xs font-semibold text-foreground">
                      Clinical Indication: {rx.diagnosis}
                    </p>
                  )}

                  {/* Medications Pills List */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {rx.medications.map((m, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60 text-[11px] text-foreground font-medium"
                      >
                        <Pill className="h-3 w-3 text-teal-600 shrink-0" />
                        {m.name} ({m.dosage}) • {m.frequency}
                      </span>
                    ))}
                  </div>

                  {rx.discontinuationReason && (
                    <p className="text-[11px] text-rose-600 italic">
                      Discontinued: {rx.discontinuationReason}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(rx.issuedAt)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {rx.doctor.name}
                    </span>
                    {rx.doctor.registrationNumber && (
                      <span className="font-mono text-[11px]">
                        (Reg: {rx.doctor.registrationNumber})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button asChild size="sm" variant="outline" className="text-xs gap-1.5 h-8">
                    <Link href={`/doctor/prescriptions/${rx.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Document
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
              <span className="text-muted-foreground">
                Page <span className="font-bold text-foreground">{pagination.page}</span> of{' '}
                <span className="font-bold text-foreground">{pagination.totalPages}</span> ({pagination.total} prescriptions)
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
