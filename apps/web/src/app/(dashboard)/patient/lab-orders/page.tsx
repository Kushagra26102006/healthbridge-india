'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardList,
  Search,
  ArrowLeft,
  FlaskConical,
  Filter,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LabOrderList } from '@/components/patient/lab-reports/LabOrderList';
import { LabReportsSkeleton } from '@/components/patient/lab-reports/LabReportsSkeleton';
import { useLabOrders } from '@/features/lab-reports/hooks/use-lab-reports';
import type { LabOrderStatus, LabOrderFilterQueryDto } from '@healthbridge/shared-types';

const STATUS_TABS: Array<{ key: LabOrderStatus | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'ORDERED', label: 'Ordered' },
  { key: 'SAMPLE_COLLECTED', label: 'Sample Collected' },
  { key: 'IN_ANALYSIS', label: 'In Analysis' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

function PatientLabOrdersContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialStatus = (searchParams.get('status') as LabOrderStatus | 'ALL') || 'ALL';
  const initialSearch = searchParams.get('search') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [status, setStatus] = useState<LabOrderStatus | 'ALL'>(initialStatus);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);

  const updateQueryParams = useCallback(
    (params: Record<string, string | number | undefined>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '' && val !== 'ALL') {
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

  const queryFilters: LabOrderFilterQueryDto = {
    page,
    limit: 10,
    search: search || undefined,
    status: status === 'ALL' ? undefined : status,
  };

  const { orders, pagination, isLoading, isError, refetch } = useLabOrders(queryFilters);

  const handleStatusChange = (newStatus: LabOrderStatus | 'ALL') => {
    setStatus(newStatus);
    setPage(1);
    updateQueryParams({ status: newStatus, page: 1, search });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateQueryParams({ search, page: 1, status });
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setPage(1);
    router.replace(pathname, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateQueryParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <Link href="/patient/lab-reports">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mt-0.5 sm:mt-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              <span>Diagnostic Test Orders</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track your diagnostic test requests, sample collection stages, and report progress.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs h-9 px-3.5 rounded-xl border-slate-200 dark:border-slate-800"
          >
            <Link href="/patient/lab-reports">
              <FlaskConical className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
              View Ready Reports
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Status Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by test name, order number, doctor, or laboratory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs rounded-xl border-slate-200 dark:border-slate-800"
            />
          </div>
          <Button type="submit" size="sm" className="rounded-xl text-xs px-4">
            Search
          </Button>
        </form>

        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            Status:
          </span>
          {STATUS_TABS.map((tab) => {
            const isActive = status === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleStatusChange(tab.key)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List / Loading / Error */}
      {isLoading ? (
        <LabReportsSkeleton count={3} />
      ) : isError ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Unable to load diagnostic orders
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            An error occurred while communicating with the orders service.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      ) : (
        <LabOrderList
          orders={orders}
          pagination={pagination}
          onPageChange={handlePageChange}
          onResetFilters={handleResetFilters}
        />
      )}
    </div>
  );
}

export default function PatientLabOrdersPage() {
  return (
    <Suspense fallback={<LabReportsSkeleton count={3} />}>
      <PatientLabOrdersContent />
    </Suspense>
  );
}
