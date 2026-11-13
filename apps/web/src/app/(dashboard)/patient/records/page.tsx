'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  RecordsHeader,
  RecordsSummary,
  RecordsSearch,
  RecordsFilters,
  RecordsList,
  RecordUploadDialog,
  RecordsSkeleton,
} from '@/components/patient/records';
import {
  useRecords,
  useRecordSummary,
  useDownloadRecord,
} from '@/features/records/hooks/use-records';
import type {
  MedicalRecordType,
  MedicalRecordSource,
  RecordVerificationStatus,
  MedicalRecordFilterQueryDto,
} from '@healthbridge/shared-types';

function PatientRecordsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse filters from URL query parameters
  const initialCategory = (searchParams.get('category') as MedicalRecordType) || '';
  const initialSearch = searchParams.get('search') || '';
  const initialSource = (searchParams.get('source') as MedicalRecordSource) || '';
  const initialStatus = (searchParams.get('status') as RecordVerificationStatus) || '';
  const initialStartDate = searchParams.get('startDate') || '';
  const initialEndDate = searchParams.get('endDate') || '';
  const initialSortBy =
    (searchParams.get('sortBy') as 'recordDate' | 'createdAt' | 'title') || 'recordDate';
  const initialSortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialLimit = parseInt(searchParams.get('limit') || '20', 10);

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState<MedicalRecordType | ''>(initialCategory);
  const [source, setSource] = useState<MedicalRecordSource | ''>(initialSource);
  const [verificationStatus, setVerificationStatus] = useState<RecordVerificationStatus | ''>(
    initialStatus
  );
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [sortBy, setSortBy] = useState<'recordDate' | 'createdAt' | 'title'>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Sync state with URL query parameters
  const updateQueryParams = useCallback(
    (params: Record<string, string | number | undefined>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          current.set(key, String(val));
        } else {
          current.delete(key);
        }
      });
      const query = current.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // TanStack Query hooks
  const queryFilters: MedicalRecordFilterQueryDto = {
    page,
    limit,
    search: search || undefined,
    category: category || undefined,
    source: source || undefined,
    verificationStatus: verificationStatus || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy,
    sortOrder,
  };

  const { records, pagination, isLoading, isFetching, refetch } = useRecords(queryFilters);
  const { summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useRecordSummary();
  const { download, isDownloading } = useDownloadRecord();

  // Handlers
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
    updateQueryParams({ search: newSearch, page: 1 });
  };

  const handleCategorySelect = (newCategory: MedicalRecordType | '') => {
    setCategory(newCategory);
    setPage(1);
    updateQueryParams({ category: newCategory, page: 1 });
  };

  const handleFilterChange = (newFilters: {
    category?: MedicalRecordType | '';
    source?: MedicalRecordSource | '';
    verificationStatus?: RecordVerificationStatus | '';
    startDate?: string;
    endDate?: string;
    sortBy: 'recordDate' | 'createdAt' | 'title';
    sortOrder: 'asc' | 'desc';
  }) => {
    setCategory(newFilters.category || '');
    setSource(newFilters.source || '');
    setVerificationStatus(newFilters.verificationStatus || '');
    setStartDate(newFilters.startDate || '');
    setEndDate(newFilters.endDate || '');
    setSortBy(newFilters.sortBy);
    setSortOrder(newFilters.sortOrder);
    setPage(1);

    updateQueryParams({
      category: newFilters.category,
      source: newFilters.source,
      status: newFilters.verificationStatus,
      startDate: newFilters.startDate,
      endDate: newFilters.endDate,
      sortBy: newFilters.sortBy,
      sortOrder: newFilters.sortOrder,
      page: 1,
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setSource('');
    setVerificationStatus('');
    setStartDate('');
    setEndDate('');
    setSortBy('recordDate');
    setSortOrder('desc');
    setPage(1);

    router.replace(pathname, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateQueryParams({ page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    updateQueryParams({ limit: newLimit, page: 1 });
  };

  const handleRefresh = () => {
    refetch();
    refetchSummary();
  };

  const handleDownload = (recordId: string, fileName?: string) => {
    download(recordId, fileName);
  };

  const isFiltered = Boolean(
    search ||
    category ||
    source ||
    verificationStatus ||
    startDate ||
    endDate ||
    sortBy !== 'recordDate' ||
    sortOrder !== 'desc'
  );

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <RecordsHeader
        totalCount={pagination?.total ?? summary?.totalRecords ?? records.length}
        onUploadClick={() => setIsUploadOpen(true)}
        onRefreshClick={handleRefresh}
        isRefreshing={isFetching}
      />

      {/* 2. Summary Metric Cards */}
      <RecordsSummary
        summary={summary}
        isLoading={isSummaryLoading}
        selectedCategory={category}
        onSelectCategory={handleCategorySelect}
      />

      {/* 3. Search and Multi-Facet Filter Bar */}
      <div className="space-y-3">
        <RecordsSearch value={search} onChange={handleSearchChange} />
        <RecordsFilters
          filters={{
            category,
            source,
            verificationStatus,
            startDate,
            endDate,
            sortBy,
            sortOrder,
          }}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* 4. Records Explorer List / Table */}
      {isLoading ? (
        <RecordsSkeleton />
      ) : (
        <RecordsList
          records={records}
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onDownload={handleDownload}
          isDownloading={isDownloading}
          isFiltered={isFiltered}
          onResetFilters={handleResetFilters}
          onUploadClick={() => setIsUploadOpen(true)}
        />
      )}

      {/* 5. Document Upload Dialog Modal */}
      <RecordUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          refetch();
          refetchSummary();
        }}
      />
    </div>
  );
}

export default function PatientRecordsPage() {
  return (
    <Suspense fallback={<RecordsSkeleton />}>
      <PatientRecordsContent />
    </Suspense>
  );
}
