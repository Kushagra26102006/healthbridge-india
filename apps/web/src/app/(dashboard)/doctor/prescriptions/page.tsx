'use client';

import React, { useState } from 'react';
import {
  PrescriptionHeader,
  PrescriptionSummary,
  PrescriptionFilters,
  PrescriptionList,
  PrescriptionListSkeleton,
} from '@/components/doctor/prescriptions';
import {
  useDoctorPrescriptionSummary,
  useDoctorPrescriptions,
} from '@/features/doctor/hooks/use-doctor';

export default function DoctorPrescriptionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const {
    summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useDoctorPrescriptionSummary();

  const {
    prescriptions,
    meta,
    isLoading: isPrescriptionsLoading,
    refetch: refetchPrescriptions,
  } = useDoctorPrescriptions({
    page,
    limit: 10,
    search: search.trim() || undefined,
    status: status !== 'ALL' ? status : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const handleRefresh = () => {
    refetchSummary();
    refetchPrescriptions();
  };

  const handleSelectStatusFromCard = (selectedStatus: string) => {
    if (selectedStatus === 'RECENT') {
      setStatus('ALL');
      const pastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] ?? '';
      setStartDate(pastWeek);
      setEndDate('');
    } else {
      setStatus(selectedStatus);
      setStartDate('');
      setEndDate('');
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header */}
      <PrescriptionHeader
        onRefresh={handleRefresh}
        isRefreshing={isSummaryLoading || isPrescriptionsLoading}
      />

      {/* Summary KPI Cards */}
      <PrescriptionSummary
        summary={summary}
        isLoading={isSummaryLoading}
        activeStatus={status}
        onSelectStatus={handleSelectStatusFromCard}
      />

      {/* Search & Filter Toolbar */}
      <PrescriptionFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        startDate={startDate}
        onStartDateChange={(val) => {
          setStartDate(val);
          setPage(1);
        }}
        endDate={endDate}
        onEndDateChange={(val) => {
          setEndDate(val);
          setPage(1);
        }}
        onReset={handleResetFilters}
      />

      {/* Prescription List */}
      {isPrescriptionsLoading ? (
        <PrescriptionListSkeleton />
      ) : (
        <PrescriptionList
          prescriptions={prescriptions}
          meta={meta}
          onPageChange={setPage}
          isLoading={isPrescriptionsLoading}
        />
      )}
    </div>
  );
}