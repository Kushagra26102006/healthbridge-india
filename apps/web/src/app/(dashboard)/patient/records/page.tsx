'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { LayoutList, Clock, Upload } from 'lucide-react';
import {
  RecordsHeader,
  RecordsSummary,
  RecordsSearch,
  RecordsFilters,
  RecordsList,
  RecordUploadDialog,
  RecordsSkeleton,
} from '@/components/patient/records';
import { SecureDocumentViewerModal } from '@/components/documents/SecureDocumentViewer';
import { MedicalRecordTimeline } from '@/components/documents/MedicalRecordTimeline';
import { ErrorState } from '@/components/ui/error-state';
import { DiagramVisual } from '@/components/ui/visual-asset';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  useRecords,
  useRecordSummary,
  useDownloadRecord,
  useArchiveRecord,
} from '@/features/records/hooks/use-records';
import { useLiveAnnouncer } from '@/components/accessibility/LiveAnnouncer';
import type {
  IMedicalRecord,
  MedicalRecordType,
  MedicalRecordSource,
  RecordVerificationStatus,
  MedicalRecordFilterQueryDto,
} from '@healthbridge/shared-types';

type DocumentViewMode = 'list' | 'timeline' | 'uploads';

function PatientRecordsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { announce } = useLiveAnnouncer();

  // Parse filters from URL query parameters
  const initialCategory = (searchParams.get('category') as MedicalRecordType) || '';
  const initialSearch = searchParams.get('search') || '';
  const initialSource = (searchParams.get('source') as MedicalRecordSource) || '';
  const initialStatus = (searchParams.get('status') as RecordVerificationStatus) || '';
  const initialProvider = searchParams.get('provider') || '';
  const initialStartDate = searchParams.get('startDate') || '';
  const initialEndDate = searchParams.get('endDate') || '';
  const initialSortBy =
    (searchParams.get('sortBy') as 'recordDate' | 'createdAt' | 'title') || 'recordDate';
  const initialSortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialLimit = parseInt(searchParams.get('limit') || '20', 10);
  const initialView = (searchParams.get('view') as DocumentViewMode) || 'list';

  const [viewMode, setViewMode] = useState<DocumentViewMode>(
    initialView === 'timeline' || initialView === 'uploads' ? initialView : 'list'
  );
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState<MedicalRecordType | ''>(initialCategory);
  const [source, setSource] = useState<MedicalRecordSource | ''>(initialSource);
  const [verificationStatus, setVerificationStatus] = useState<RecordVerificationStatus | ''>(
    initialStatus
  );
  const [provider, setProvider] = useState(initialProvider);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [sortBy, setSortBy] = useState<'recordDate' | 'createdAt' | 'title'>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<IMedicalRecord | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<IMedicalRecord | null>(null);

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

  // Upload History view scopes to MANUAL_ENTRY sorted by newest upload timestamp
  const effectiveSource: MedicalRecordSource | undefined =
    viewMode === 'uploads' ? 'MANUAL_ENTRY' : source || undefined;
  const effectiveSortBy = viewMode === 'uploads' ? 'createdAt' : sortBy;

  const queryFilters: MedicalRecordFilterQueryDto = {
    page,
    limit,
    search: search || undefined,
    category: category || undefined,
    source: effectiveSource,
    verificationStatus: verificationStatus || undefined,
    provider: provider.trim() || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy: effectiveSortBy,
    sortOrder,
  };

  const { records, pagination, isLoading, isFetching, isError, error, refetch } =
    useRecords(queryFilters);
  const { summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useRecordSummary();
  const { download, isDownloading } = useDownloadRecord();
  const archiveMutation = useArchiveRecord({
    onSuccess: () => {
      announce('Medical document archived successfully.');
      refetch();
      refetchSummary();
    },
  });

  const handleViewChange = (nextView: DocumentViewMode) => {
    setViewMode(nextView);
    setPage(1);
    updateQueryParams({ view: nextView === 'list' ? '' : nextView, page: 1 });
  };

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
    provider?: string;
    startDate?: string;
    endDate?: string;
    sortBy: 'recordDate' | 'createdAt' | 'title';
    sortOrder: 'asc' | 'desc';
  }) => {
    setCategory(newFilters.category || '');
    setSource(newFilters.source || '');
    setVerificationStatus(newFilters.verificationStatus || '');
    setProvider(newFilters.provider || '');
    setStartDate(newFilters.startDate || '');
    setEndDate(newFilters.endDate || '');
    setSortBy(newFilters.sortBy);
    setSortOrder(newFilters.sortOrder);
    setPage(1);

    updateQueryParams({
      category: newFilters.category,
      source: newFilters.source,
      status: newFilters.verificationStatus,
      provider: newFilters.provider,
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
    setProvider('');
    setStartDate('');
    setEndDate('');
    setSortBy('recordDate');
    setSortOrder('desc');
    setPage(1);

    router.replace(viewMode === 'list' ? pathname : `${pathname}?view=${viewMode}`, {
      scroll: false,
    });
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
      provider ||
      startDate ||
      endDate ||
      sortBy !== 'recordDate' ||
      sortOrder !== 'desc'
  );

  return (
    <div className="space-y-6">
      {/* 1. Header + Vault Architecture Graphic */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
        <div className="xl:col-span-8">
          <RecordsHeader
            totalCount={pagination?.total ?? summary?.totalRecords ?? records.length}
            onUploadClick={() => setIsUploadOpen(true)}
            onRefreshClick={handleRefresh}
            isRefreshing={isFetching}
          />
        </div>
        <div className="hidden xl:block xl:col-span-4">
          <DiagramVisual asset="documentVaultBanner" className="p-2" />
        </div>
      </div>

      {/* 2. Overview Metric Cards & Real Storage Usage */}
      <RecordsSummary
        summary={summary}
        isLoading={isSummaryLoading}
        selectedCategory={category}
        onSelectCategory={handleCategorySelect}
      />

      {/* 3. Workspace View Tabs (Documents List / Chronological Timeline / Upload History) */}
      <div
        role="tablist"
        aria-label="Medical document views"
        className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2"
      >
        {(
          [
            { id: 'list', label: 'All Documents', icon: LayoutList },
            { id: 'timeline', label: 'Chronological Timeline', icon: Clock },
            { id: 'uploads', label: 'Upload History', icon: Upload },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = viewMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleViewChange(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors focus-ring ${
                active
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Search and Multi-Facet Filter Bar */}
      <div className="space-y-3">
        <RecordsSearch value={search} onChange={handleSearchChange} />
        <RecordsFilters
          filters={{
            category,
            source: viewMode === 'uploads' ? 'MANUAL_ENTRY' : source,
            verificationStatus,
            provider,
            startDate,
            endDate,
            sortBy: effectiveSortBy,
            sortOrder,
          }}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* 5. Active Document Explorer View */}
      {isLoading ? (
        <RecordsSkeleton />
      ) : isError ? (
        <ErrorState
          error={error}
          title="Unable to load medical documents"
          onRetry={handleRefresh}
        />
      ) : viewMode === 'timeline' ? (
        <MedicalRecordTimeline
          records={records}
          onPreview={(rec) => setPreviewRecord(rec)}
          onDownload={handleDownload}
          isDownloading={isDownloading}
          isFiltered={isFiltered}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <RecordsList
          records={records}
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onPreview={(rec) => setPreviewRecord(rec)}
          onDownload={handleDownload}
          onArchive={(rec) => setArchiveTarget(rec)}
          isDownloading={isDownloading}
          isFiltered={isFiltered || viewMode === 'uploads'}
          onResetFilters={handleResetFilters}
          onUploadClick={() => setIsUploadOpen(true)}
        />
      )}

      {/* 6. Multi-File Drag & Drop Upload Dialog */}
      <RecordUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          refetch();
          refetchSummary();
        }}
      />

      {/* 7. 1-Click Secure Document Preview Modal */}
      <SecureDocumentViewerModal
        record={previewRecord}
        onClose={() => setPreviewRecord(null)}
        onDownload={handleDownload}
        isDownloading={isDownloading}
      />

      {/* 8. Safe Archival Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        title="Archive Self-Uploaded Document?"
        description={
          archiveTarget
            ? `"${archiveTarget.title}" will be archived from your active vault while preserving the security audit trail.`
            : ''
        }
        confirmLabel="Archive Document"
        variant="danger"
        loading={archiveMutation.isPending}
        onConfirm={async () => {
          if (!archiveTarget) return;
          await archiveMutation.mutateAsync(archiveTarget.id);
          setArchiveTarget(null);
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
