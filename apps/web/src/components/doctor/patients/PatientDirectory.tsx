'use client';

import React, { useState } from 'react';
import { Users, RefreshCw, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientSearch } from './PatientSearch';
import { PatientFilters, DirectoryFilterType } from './PatientFilters';
import { PatientCard } from './PatientCard';
import { PatientEmptyState } from './PatientEmptyState';
import { useDoctorPatientDirectory } from '@/features/doctor/hooks/use-doctor';
import type { DoctorPatientFilterQueryDto } from '@healthbridge/shared-types';

export const PatientDirectory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<DirectoryFilterType>('all');
  const [page, setPage] = useState(1);
  const limit = 12;

  const query: DoctorPatientFilterQueryDto = {
    search: searchTerm || undefined,
    filter: activeFilter,
    page,
    limit,
  };

  const { patients, pagination, isLoading, isError, error, refetch } =
    useDoctorPatientDirectory(query);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleFilterChange = (filter: DirectoryFilterType) => {
    setActiveFilter(filter);
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            My Patients
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review and manage patients you are authorized to care for.
          </p>
        </div>

        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 self-start sm:self-center h-8"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* ABDM Security Banner */}
      <div className="rounded-2xl border border-teal-500/30 bg-teal-50/40 dark:bg-teal-950/20 p-4 flex items-start gap-3 text-xs text-teal-800 dark:text-teal-200">
        <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <span className="font-bold">ABDM DPDP Act 2023 Clinical Privacy Barrier</span>
          <p className="text-muted-foreground text-[11px]">
            In strict compliance with India&apos;s Digital Personal Data Protection Act and ABDM guidelines, patient records are never accessible merely by guessing an identifier. A doctor must hold a confirmed appointment, an active clinical encounter, or verified electronic patient consent.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <PatientSearch
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search authorized patients by name, mobile number, or ABHA address..."
          />
        </div>

        <PatientFilters
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          totalCount={pagination?.total}
        />
      </div>

      {/* Patient Directory Roster */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-muted/40 animate-pulse border border-border/40" />
          ))}
        </div>
      ) : isError ? (
        <PatientEmptyState
          title="Failed to Load Patients"
          description={error?.message || 'Could not retrieve authorized patient roster from backend service.'}
          actionLabel="Try Again"
          onAction={() => refetch()}
        />
      ) : patients.length === 0 ? (
        <PatientEmptyState
          icon={Users}
          title="No Authorized Patients Found"
          description={
            searchTerm
              ? `No authorized patients matched "${searchTerm}".`
              : activeFilter !== 'all'
                ? 'No patients match the selected filter criteria.'
                : 'Patients who book appointments, attend clinical consultations, or grant ABDM consent will appear here.'
          }
          actionLabel={searchTerm || activeFilter !== 'all' ? 'Reset Filters' : undefined}
          onAction={() => {
            setSearchTerm('');
            setActiveFilter('all');
            setPage(1);
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient) => (
              <PatientCard key={patient.patientId} patient={patient} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs">
              <span className="text-muted-foreground">
                Showing Page <span className="font-bold text-foreground">{pagination.page}</span> of{' '}
                <span className="font-bold text-foreground">{pagination.totalPages}</span> ({pagination.total} patients)
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
        </>
      )}
    </div>
  );
};
