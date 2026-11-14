'use client';

import React, { useState } from 'react';
import {
  EncounterHeader,
  EncounterSummary,
  EncounterFilters,
  EncounterList,
  EncounterSkeleton,
} from '@/components/doctor/encounters';
import {
  useDoctorEncounters,
  useDoctorEncounterSummary,
} from '@/features/doctor/hooks/use-doctor';
import type { EncounterType } from '@healthbridge/shared-types';

export default function DoctorEncountersPage() {
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'draft' | 'completed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [encounterType, setEncounterType] = useState<EncounterType | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useDoctorEncounterSummary();

  const {
    encounters,
    pagination,
    isLoading: isListLoading,
    isFetching,
    refetch: refetchEncounters,
  } = useDoctorEncounters({
    page,
    limit: 15,
    filterTab,
    search: searchQuery || undefined,
    encounterType,
    status,
    startDate,
    endDate,
  });

  const handleRefresh = () => {
    refetchSummary();
    refetchEncounters();
  };

  const handleResetFilters = () => {
    setFilterTab('all');
    setSearchQuery('');
    setEncounterType(undefined);
    setStatus(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* Page Header */}
      <EncounterHeader onRefresh={handleRefresh} isRefreshing={isFetching} />

      {/* Summary Cards */}
      <EncounterSummary
        summary={summary}
        activeFilter={filterTab}
        onFilterSelect={(tab) => {
          setFilterTab(tab);
          setPage(1);
        }}
      />

      {/* Search & Filters */}
      <EncounterFilters
        filterTab={filterTab}
        onFilterTabChange={(tab) => {
          setFilterTab(tab);
          setPage(1);
        }}
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          setSearchQuery(query);
          setPage(1);
        }}
        encounterType={encounterType}
        onEncounterTypeChange={(type) => {
          setEncounterType(type);
          setPage(1);
        }}
        startDate={startDate}
        onStartDateChange={(d) => {
          setStartDate(d);
          setPage(1);
        }}
        endDate={endDate}
        onEndDateChange={(d) => {
          setEndDate(d);
          setPage(1);
        }}
        status={status}
        onStatusChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        onReset={handleResetFilters}
      />

      {/* Main List */}
      {isListLoading || isSummaryLoading ? (
        <EncounterSkeleton />
      ) : (
        <EncounterList
          encounters={encounters}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
