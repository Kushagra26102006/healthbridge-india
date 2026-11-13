'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Stethoscope, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DoctorSearch,
  DoctorFilters,
  DoctorCard,
  DoctorSkeleton,
  type DoctorFiltersState,
} from '@/components/patient/appointments';
import { useDoctors } from '@/features/appointments/hooks/use-appointments';

export default function PatientDoctorsPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<DoctorFiltersState>({});

  const { doctors, pagination, isLoading } = useDoctors({
    search: search || undefined,
    specialization: filters.specialization,
    city: filters.city,
    consultationType: filters.consultationType,
    limit: 12,
  });

  const handleResetFilters = () => {
    setSearch('');
    setFilters({});
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/patient/appointments">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              <span>Find Healthcare Specialists</span>
            </h1>
            <p className="text-xs text-slate-500">
              Discover verified doctors across hospitals and book in-person or teleconsultation slots
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            asChild
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-9 px-4 rounded-xl font-medium shadow-sm"
          >
            <Link href="/patient/appointments/book">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Direct Booking
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Filters */}
        <div className="lg:col-span-1 space-y-4">
          <DoctorFilters
            filters={filters}
            onFilterChange={setFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Right Column: Search + Doctor Cards Grid */}
        <div className="lg:col-span-3 space-y-4">
          <DoctorSearch
            initialSearch={search}
            onSearchChange={setSearch}
            placeholder="Search doctors by name, hospital, specialization or city..."
          />

          {isLoading ? (
            <DoctorSkeleton count={6} />
          ) : doctors.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto">
                <Stethoscope className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                No doctors match your criteria
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try modifying your search term or clearing active specialization filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs h-8 px-4"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor.userId} doctor={doctor} />
              ))}
            </div>
          )}

          {pagination && pagination.total > 0 && (
            <div className="text-xs text-slate-500 text-center pt-2">
              Showing {doctors.length} of {pagination.total} verified specialists
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
