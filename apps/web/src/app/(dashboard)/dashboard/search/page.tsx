'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  SlidersHorizontal,
  ExternalLink,
  X,
  Calendar,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { searchApi } from '@/features/search/api/search-api';
import {
  getQuickActionsForRole,
  getRoleDashboardHome,
} from '@/features/search/lib/quick-actions';
import { HighlightMatch } from '@/components/search/HighlightMatch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useLiveAnnouncer } from '@/components/accessibility/LiveAnnouncer';
import type {
  GlobalSearchResourceType,
  GlobalSearchSortField,
  GlobalSearchSortOrder,
} from '@healthbridge/shared-types';

function GlobalSearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { announce } = useLiveAnnouncer();

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

  // Scoped strictly by user?.id to prevent any cross-user cache reuse
  const queryResult = useQuery({
    queryKey: [
      'global-search',
      user?.id ?? 'anon',
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
    enabled: Boolean(user?.id) && submittedQ.trim().length > 0,
    retry: 1,
  });

  const data = queryResult.data;
  const allowedTypes = data?.allowedTypes || [];
  const results = data?.results || [];
  const pagination = data?.pagination;

  useEffect(() => {
    if (!submittedQ.trim() || queryResult.isLoading || queryResult.isError || !data) return;
    const total = data.pagination?.total ?? 0;
    announce(
      total === 0
        ? `No authorized search results found for ${submittedQ}.`
        : `Found ${total} authorized search result${total === 1 ? '' : 's'} for ${submittedQ}.`
    );
  }, [data, submittedQ, queryResult.isLoading, queryResult.isError, announce]);

  const roleHome = getRoleDashboardHome(user?.role);
  const roleQuickActions = getQuickActionsForRole(user?.role).slice(0, 6);

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    sortBy !== 'relevance' ||
    sortOrder !== 'desc' ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    Boolean(status.trim());

  const resetFilters = () => {
    setSelectedTypes([]);
    setSortBy('relevance');
    setSortOrder('desc');
    setFromDate('');
    setToDate('');
    setStatus('');
    setPage(1);
    announce('Search filters cleared.');
  };

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-safe">
      {/* Header & Role Dashboard Return Link */}
      <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href={roleHome.href}
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors focus-ring rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{roleHome.label}</span>
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground font-medium">Global Search</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Global Healthcare Search
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Role-scoped discovery across your authorized HealthBridge India records.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted/40 text-xs text-muted-foreground self-start sm:self-center">
          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
          <span>{user?.role ? `${user.role} Scope` : 'Authorized Scope'} • No clinical previews</span>
        </div>
      </div>

      {/* Search Form & Filter Controls */}
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Global healthcare search filters"
        className="space-y-3.5 rounded-xl border border-border bg-card p-4 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              maxLength={100}
              placeholder="Search doctors, appointments, prescriptions, lab reports, orders..."
              aria-label="Global search keyword"
              className="w-full h-11 sm:h-10 pl-10 pr-9 rounded-lg border border-border bg-surface text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  setSubmittedQ('');
                  router.replace('/dashboard/search');
                }}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded focus-ring"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <Button type="submit" variant="primary" className="h-11 sm:h-10 px-6 shrink-0">
            <Search className="w-4 h-4" aria-hidden="true" />
            <span>Search</span>
          </Button>
        </div>

        {/* Sorting, Date Range & Status Filters */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs pt-1">
          <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Filters:</span>
          </span>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as GlobalSearchSortField)}
            aria-label="Sort field"
            className="h-9 px-2.5 rounded-lg border border-border bg-surface text-foreground text-xs focus-ring"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="date">Sort: Date</option>
            <option value="title">Sort: Title</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as GlobalSearchSortOrder)}
            aria-label="Sort direction"
            className="h-9 px-2.5 rounded-lg border border-border bg-surface text-foreground text-xs focus-ring"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <div className="inline-flex flex-wrap items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              aria-label="Filter from date"
              className="h-9 px-2 rounded-lg border border-border bg-surface text-foreground text-xs focus-ring"
            />
            <span>to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              aria-label="Filter to date"
              className="h-9 px-2 rounded-lg border border-border bg-surface text-foreground text-xs focus-ring"
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
            aria-label="Filter by record status"
            className="h-9 px-2.5 rounded-lg border border-border bg-surface text-foreground text-xs w-44 focus-ring"
          />

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset filters</span>
            </Button>
          )}
        </div>

        {/* Dynamic Server-Driven Allowed Resource Type Filter Pills */}
        {allowedTypes.length > 0 && (
          <div
            role="group"
            aria-label="Filter by authorized resource category"
            className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60"
          >
            <button
              type="button"
              onClick={() => {
                setSelectedTypes([]);
                setPage(1);
              }}
              aria-pressed={selectedTypes.length === 0}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus-ring ${
                selectedTypes.length === 0
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-surface text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              All ({pagination?.total ?? results.length})
            </button>
            {allowedTypes.map((type) => {
              const active = selectedTypes.includes(type);
              const count = data?.typeCounts?.[type] || 0;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus-ring ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-surface text-muted-foreground border-border hover:text-foreground'
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
        <div className="space-y-6">
          <EmptyState
            icon={<Search className="w-5 h-5" />}
            title="Start searching your authorized workspace"
            description="Enter a keyword above or press Cmd+K / Ctrl+K from any dashboard page to search records, jump to quick actions, or revisit recent pages."
          />

          {roleQuickActions.length > 0 && (
            <section aria-label="Role quick navigation" className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span>Quick Navigation ({user?.role})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {roleQuickActions.map((action) => (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="group p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/30 transition-all focus-ring"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {action.label}
                      </span>
                      <Badge variant="outline" size="sm">
                        {action.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {action.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : queryResult.isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Searching authorized records">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-card space-y-2.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : queryResult.isError ? (
        <ErrorState
          error={queryResult.error}
          title="Search could not be completed"
          onRetry={() => queryResult.refetch()}
          backHref={roleHome.href}
          backLabel={`Back to ${roleHome.label}`}
        />
      ) : results.length === 0 ? (
        <EmptyState
          illustration="no-search-results"
          title={`No authorized results for "${submittedQ}"`}
          description="Try broadening your keyword, clearing active category or date filters, or verifying that you have permission to view the target record."
          action={
            hasActiveFilters ? (
              <Button variant="primary" size="sm" onClick={resetFilters}>
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset Filters</span>
              </Button>
            ) : undefined
          }
          secondaryAction={
            <Button variant="outline" size="sm" asChild>
              <Link href={roleHome.href}>Return to {roleHome.label}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
            <span>
              Found <strong className="text-foreground">{pagination?.total || 0}</strong> authorized
              result{(pagination?.total || 0) === 1 ? '' : 's'} for{' '}
              <strong className="text-foreground">&ldquo;{submittedQ}&rdquo;</strong> in{' '}
              {data?.executionTimeMs ?? 0}ms
            </span>
            {selectedTypes.length > 0 && (
              <span>
                Filtered by {selectedTypes.map((t) => t.replace(/_/g, ' ')).join(', ')}
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {results.map((item) => (
              <article
                key={`${item.resourceType}:${item.id}`}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/45 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="info" size="sm">
                      {item.resourceType.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">
                      {item.categoryGroup.replace(/_/g, ' ')}
                    </span>
                    {item.status && (
                      <Badge variant="outline" size="sm">
                        {item.status}
                      </Badge>
                    )}
                    {item.date && (
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm sm:text-base font-semibold text-foreground break-words">
                    <HighlightMatch text={item.title} query={submittedQ} />
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <HighlightMatch text={item.description} query={submittedQ} />
                  </p>
                </div>

                <Button variant="outline" size="sm" asChild className="shrink-0 self-start sm:self-center">
                  <Link href={item.destinationRoute}>
                    <span>Open</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </article>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <nav
              aria-label="Search results pagination"
              className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"
            >
              <span>
                Page <strong className="text-foreground">{pagination.page}</strong> of{' '}
                <strong className="text-foreground">{pagination.totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Previous</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
              </div>
            </nav>
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
      <Suspense
        fallback={
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        }
      >
        <GlobalSearchResultsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
