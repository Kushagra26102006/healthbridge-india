'use client';

import React, { useState } from 'react';
import {
  AppointmentHeader,
  AppointmentSummary,
  AppointmentFilters,
  AppointmentList,
} from '@/components/doctor/appointments';
import {
  useDoctorAppointments,
  useDoctorAppointmentSummary,
} from '@/features/doctor/hooks/use-doctor';
import type { ConsultationType } from '@healthbridge/shared-types';

export default function DoctorAppointmentsPage() {
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'upcoming' | 'history' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [consultationType, setConsultationType] = useState<ConsultationType | undefined>(undefined);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const {
    summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useDoctorAppointmentSummary();

  const {
    appointments,
    pagination,
    isLoading: listLoading,
    isFetching,
    refetch: refetchList,
  } = useDoctorAppointments({
    page,
    limit: 15,
    filterTab,
    search: searchQuery || undefined,
    consultationType,
    startDate,
    endDate,
  });

  const handleRefresh = () => {
    refetchSummary();
    refetchList();
  };

  const handleSummarySelect = (key: string) => {
    if (key === 'today') setFilterTab('today');
    else if (key === 'upcoming') setFilterTab('upcoming');
    else if (key === 'pending') setFilterTab('pending');
    else if (key === 'completed' || key === 'cancelled') setFilterTab('history');
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilterTab('all');
    setSearchQuery('');
    setConsultationType(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* 1. Page Header */}
      <AppointmentHeader onRefresh={handleRefresh} isRefreshing={isFetching} />

      {/* 2. Overview Summary Cards */}
      <AppointmentSummary
        summary={summary}
        isLoading={summaryLoading}
        activeFilter={filterTab}
        onSelectFilter={handleSummarySelect}
      />

      {/* 3. Search & Multi-Filter Controls */}
      <AppointmentFilters
        filterTab={filterTab}
        onFilterTabChange={(tab) => {
          setFilterTab(tab);
          setPage(1);
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        consultationType={consultationType}
        onConsultationTypeChange={(type) => {
          setConsultationType(type);
          setPage(1);
        }}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={(d) => {
          setStartDate(d);
          setPage(1);
        }}
        onEndDateChange={(d) => {
          setEndDate(d);
          setPage(1);
        }}
        onReset={handleResetFilters}
      />

      {/* 4. Appointments Responsive List */}
      <AppointmentList
        appointments={appointments}
        pagination={pagination}
        isLoading={listLoading}
        onPageChange={setPage}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
