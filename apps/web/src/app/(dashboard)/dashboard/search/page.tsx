'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  SlidersHorizontal,
  ExternalLink,
  AlertCircle,
  X,
  Calendar,
} from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { searchApi } from '@/features/search/api/search-api';
import type {
  GlobalSearchResourceType,
  GlobalSearchSortField,
  GlobalSearchSortOrder,
} from '@healthbridge/shared-types';

function GlobalSearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQ = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(initialQ);
  const [submittedQ, setSubmittedQ] = useState(initialQ);
  const [selectedTypes, setSelectedTypes] = useState<GlobalSearchResourceType[]>([]);
  const [sortBy, setSortBy] = useState<GlobalSearchSortField>('relevance');
  const [sortOrder, setSortOrder] = useState<GlobalSearchSortOrder>('desc');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    setInputValue(qParam);
    setSubmittedQ(qParam);
    setPage(1);
  }, [searchParams]);

  const queryResult = useQuery({
    queryKey: [
      'global-search',
      submittedQ,
      selectedTypes,
      sortBy,
      sortOrder,
      fromDate,
      toDate,
      status,
      page,
    ],
    queryFn: ({ signal }) =>
      searchApi.search(
        {
          q: submittedQ,
          types: selectedTypes.length > 0 ? selectedTypes : undefined,
          page,
          limit: 15,
          sortBy,
          sortOrder,
          from: fromDate ? new Date(`${fromDate}T00:00:00.000Z`).toISOString() : undefined,
          to: toDate ? new Date(`${toDate}T23:59:59.999Z`).toISOString() : undefined,
          status: status.trim() || undefined,
        },
        signal
      ),
    enabled: submittedQ.trim().length > 0,
    retry: 1,
  });

  const data = queryResult.data;
  const allowedTypes = data?.allowedTypes || [];
  const results = data?.results || [];
  const pagination = data?.pagination;

  const toggleType = (t: GlobalSearchResourceType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
    setPage(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputValue.trim();
    if (!clean) return;
    setSubmittedQ(clean);
    setPage(1);
    router.replace(`/dashboard/search?q=${encodeURIComponent(clean)}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="pb-4 border-b border-border space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Global Healthcare Search
        </h1>
        <p className="text-xs text-muted-foreground">
          Role-scoped discovery across your authorized HealthBridge India records. Sensitive clinical values are never displayed in search previews.
        </p>
      </div>

      {/* Search Form & Filters */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              maxLength={100}
              placeholder="Search doctors, appointments, prescriptions, lab reports, orders..."
              aria-label="Global search input"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  setSubmittedQ('');
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
          >
            Search
          </button>
        </div>

        {/* Sorting & Date Filters */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </span>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as GlobalSearchSortField)}
            aria-label="Sort field"
            className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="date">Sort: Date</option>
            <option value="title">Sort: Title</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as GlobalSearchSortOrder)}
            aria-label="Sort direction"
            className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <div className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              aria-label="From date"
              className="px-2 py-1.5 rounded-lg border border-border bg-card text-foreground"
            />
            <span>to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              aria-label="To date"
              className="px-2 py-1.5 rounded-lg border border-border bg-card text-foreground"
            />
          </div>

          <input
            type="text"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            placeholder="Status (e.g. PUBLISHED)"
            aria-label="Filter by status"
            className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground w-40"
          />
        </div>

        {/* Dynamic Server-Driven Allowed Resource Type Filter Pills */}
        {allowedTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {allowedTypes.map((type) => {
              const active = selectedTypes.includes(type);
              const count = data?.typeCounts?.[type] || 0;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                    active
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  {type.replace(/_/g, ' ')} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>
        )}
      </form>

      {/* Results Area */}
      {!submittedQ.trim() ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
          Enter a search keyword above (or press <kbd className="font-mono px-1 border rounded">⌘K</kbd>) to search your authorized records.
        </div>
      ) : queryResult.isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : queryResult.isError ? (
        <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 text-center space-y-2 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-5 h-5 mx-auto" />
          <p>Search could not be completed. Please adjust your query and retry.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-border bg-card text-xs text-muted-foreground">
          No authorized results matched &ldquo;{submittedQ}&rdquo;.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Found <strong className="text-foreground">{pagination?.total || 0}</strong> authorized result(s) in {data?.executionTimeMs ?? 0}ms
            </span>
          </div>

          {results.map((item) => (
            <article
              key={`${item.resourceType}:${item.id}`}
              className="p-4 rounded-xl border border-border bg-card hover:border-teal-500/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900">
                    {item.resourceType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    {item.categoryGroup.replace(/_/g, ' ')}
                  </span>
                  {item.status && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground">
                      {item.status}
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-bold text-foreground truncate">{item.title}</h2>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>

              <Link
                href={item.destinationRoute}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-teal-600 dark:text-teal-400 shrink-0 self-start sm:self-center"
              >
                <span>Open</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </article>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!pagination.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GlobalSearchPage() {
  return (
    <ProtectedRoute
      allowedRoles={['PATIENT', 'DOCTOR', 'PHARMACY', 'LABORATORY', 'ADMIN']}
      redirectUnauth
    >
      <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading search...</div>}>
        <GlobalSearchResultsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
