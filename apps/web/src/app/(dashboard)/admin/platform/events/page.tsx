'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  ShieldAlert,
  X,
} from 'lucide-react';
import { eventsApi } from '@/features/events/api/events-api';
import type {
  DomainEventOutboxDto,
  DomainEventSourceModule,
  DomainEventStatus,
} from '@healthbridge/shared-types';

const STATUS_BADGE_MAP: Record<DomainEventStatus, string> = {
  PENDING: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900',
  PROCESSING: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-900',
  PROCESSED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  RETRYING: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900',
  DEAD_LETTER: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-900',
};

const SOURCE_MODULES: DomainEventSourceModule[] = [
  'APPOINTMENTS',
  'ENCOUNTERS',
  'PRESCRIPTIONS',
  'PHARMACY',
  'LABORATORY',
  'CONSENT',
  'ABDM',
  'PLATFORM',
  'SYSTEM',
];

export default function AdminPlatformEventsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'ALL' | 'DEAD_LETTER'>('ALL');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DomainEventStatus | ''>('');
  const [moduleFilter, setModuleFilter] = useState<DomainEventSourceModule | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [retryTarget, setRetryTarget] = useState<DomainEventOutboxDto | null>(null);
  const [retryReason, setRetryReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const healthQuery = useQuery({
    queryKey: ['admin', 'events', 'health'],
    queryFn: () => eventsApi.getHealth(),
    refetchInterval: 15_000,
  });

  const listParams = {
    search: search.trim() || undefined,
    status: viewMode === 'DEAD_LETTER' ? undefined : (statusFilter || undefined),
    sourceModule: moduleFilter || undefined,
    from: fromDate ? new Date(`${fromDate}T00:00:00.000Z`).toISOString() : undefined,
    to: toDate ? new Date(`${toDate}T23:59:59.999Z`).toISOString() : undefined,
    page,
    limit: 20,
    deadLetterOnly: viewMode === 'DEAD_LETTER',
  };

  const eventsQuery = useQuery({
    queryKey: ['admin', 'events', 'list', listParams],
    queryFn: () => eventsApi.listEvents(listParams),
    refetchInterval: 15_000,
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'events', 'detail', selectedEventId],
    queryFn: () => eventsApi.getEventDetail(selectedEventId!),
    enabled: Boolean(selectedEventId),
  });

  const retryMutation = useMutation({
    mutationFn: ({ eventId, reason }: { eventId: string; reason: string }) =>
      eventsApi.retryEvent(eventId, reason),
    onSuccess: (res) => {
      setFeedback({ type: 'success', text: `Event ${res.eventId} queued for replay (attempt #${res.replayCount}).` });
      setRetryTarget(null);
      setRetryReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Failed to schedule event replay.',
      });
    },
  });

  const health = healthQuery.data;
  const events = eventsQuery.data?.events || [];
  const pagination = eventsQuery.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            <Activity className="w-3.5 h-3.5" />
            <span>Operational Event Observability</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
            Cross-Module Event Processing &amp; Outbox Monitor
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Admin-only redacted telemetry for transactional outbox processing, worker heartbeats, and controlled dead-letter recovery. Zero patient clinical PHI is exposed.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void healthQuery.refetch();
            void eventsQuery.refetch();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg bg-card hover:bg-muted transition-colors self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${eventsQuery.isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} aria-label="Dismiss notice">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Health Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Pending', value: health?.counts.pending ?? 0, icon: Clock, tone: 'text-sky-600' },
          { label: 'Processing', value: health?.counts.processing ?? 0, icon: Activity, tone: 'text-indigo-600' },
          { label: 'Processed', value: health?.counts.processed ?? 0, icon: CheckCircle2, tone: 'text-emerald-600' },
          { label: 'Retrying', value: health?.counts.retrying ?? 0, icon: RotateCcw, tone: 'text-amber-600' },
          { label: 'Dead-Letter', value: health?.counts.deadLetter ?? 0, icon: ShieldAlert, tone: 'text-rose-600' },
          {
            label: 'Avg Duration',
            value: `${health?.averageProcessingDurationMs ?? 0} ms`,
            icon: Server,
            tone: 'text-teal-600',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="p-3.5 rounded-xl border border-border bg-card shadow-xs space-y-1"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{card.label}</span>
                <Icon className={`w-4 h-4 ${card.tone}`} />
              </div>
              <div className="text-lg font-bold text-foreground">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Worker Heartbeat & Topology Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-teal-600 shrink-0" />
            <div>
              <div className="font-semibold text-foreground">MongoDB Outbox Atomicity Mode</div>
              <div className="text-[11px] text-muted-foreground">
                Failure Rate: {health?.handlerFailureRate ?? 0}% • Total Retries: {health?.totalRetries ?? 0}
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full font-semibold text-[11px] bg-muted text-foreground">
            {health?.topologyTransactionSupport || 'UNKNOWN'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <div className="font-semibold text-foreground">Background Worker Heartbeat</div>
              <div className="text-[11px] text-muted-foreground">
                {health?.workers?.[0]
                  ? `${health.workers[0].workerId} • Processed ${health.workers[0].processedCount}`
                  : 'No active workers reported'}
              </div>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full font-semibold text-[11px] ${
              health?.workers?.[0]?.status === 'RUNNING'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            {health?.workers?.[0]?.status || 'STOPPED'}
          </span>
        </div>
      </div>

      {/* Mode Tabs & Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => {
              setViewMode('ALL');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === 'ALL'
                ? 'bg-slate-900 dark:bg-teal-600 text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            All Outbox Events
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('DEAD_LETTER');
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === 'DEAD_LETTER'
                ? 'bg-rose-600 text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Dead-Letter Review ({health?.counts.deadLetter ?? 0})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search eventId, correlationId, aggregateId..."
              aria-label="Search domain events"
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-card text-foreground"
            />
          </div>

          {viewMode === 'ALL' && (
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as DomainEventStatus | '');
                setPage(1);
              }}
              aria-label="Filter by status"
              className="px-2.5 py-2 rounded-lg border border-border bg-card text-foreground"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="PROCESSED">PROCESSED</option>
              <option value="RETRYING">RETRYING</option>
              <option value="FAILED">FAILED</option>
              <option value="DEAD_LETTER">DEAD_LETTER</option>
            </select>
          )}

          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value as DomainEventSourceModule | '');
              setPage(1);
            }}
            aria-label="Filter by source module"
            className="px-2.5 py-2 rounded-lg border border-border bg-card text-foreground"
          >
            <option value="">All Modules</option>
            {SOURCE_MODULES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              aria-label="From date"
              className="w-full px-2 py-2 rounded-lg border border-border bg-card text-foreground"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              aria-label="To date"
              className="w-full px-2 py-2 rounded-lg border border-border bg-card text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground">
              <th className="py-3 px-3.5 font-semibold">Event Type</th>
              <th className="py-3 px-3 font-semibold">Module</th>
              <th className="py-3 px-3 font-semibold">Status</th>
              <th className="py-3 px-3 font-semibold">Created</th>
              <th className="py-3 px-3 font-semibold">Retries</th>
              <th className="py-3 px-3 font-semibold">Duration</th>
              <th className="py-3 px-3 font-semibold">Error Category</th>
              <th className="py-3 px-3 font-semibold">Correlation ID</th>
              <th className="py-3 px-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {eventsQuery.isLoading ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-muted-foreground">
                  Loading outbox telemetry...
                </td>
              </tr>
            ) : eventsQuery.isError ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-rose-600">
                  Failed to fetch event telemetry. Verify administrator authorization.
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-muted-foreground">
                  No domain events match the active filters.
                </td>
              </tr>
            ) : (
              events.map((evt) => (
                <tr key={evt.eventId} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3.5 font-mono font-semibold text-foreground">
                    {evt.eventType}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{evt.sourceModule}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        STATUS_BADGE_MAP[evt.status]
                      }`}
                    >
                      {evt.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                    {new Date(evt.createdAt).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {evt.retryCount}/{evt.maxRetries}
                  </td>
                  <td className="py-3 px-3 font-mono text-muted-foreground">
                    {evt.processingDurationMs !== undefined ? `${evt.processingDurationMs}ms` : '—'}
                  </td>
                  <td className="py-3 px-3 font-mono text-rose-600 dark:text-rose-400">
                    {evt.errorCategory || '—'}
                  </td>
                  <td className="py-3 px-3 font-mono text-muted-foreground max-w-[140px] truncate">
                    {evt.correlationId}
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedEventId(evt.eventId)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border hover:bg-muted text-foreground"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                    {evt.isReplayEligible && (
                      <button
                        type="button"
                        onClick={() => setRetryTarget(evt)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total events)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Safe Redacted Event Details Modal */}
      {selectedEventId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Redacted event details"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-bold text-foreground">Redacted Event Inspection</h2>
                <p className="text-[11px] font-mono text-muted-foreground">{selectedEventId}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventId(null)}
                className="p-1.5 rounded-lg hover:bg-muted"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailQuery.isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading redacted details...</div>
            ) : detailQuery.data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                  <div>
                    <span className="text-muted-foreground">Event Type:</span>{' '}
                    <strong className="font-mono">{detailQuery.data.eventType}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{' '}
                    <strong>{detailQuery.data.status}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Aggregate:</span>{' '}
                    <span className="font-mono">
                      {detailQuery.data.aggregateType}:{detailQuery.data.aggregateId}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Transaction Mode:</span>{' '}
                    <span className="font-mono">{detailQuery.data.transactionMode}</span>
                  </div>
                </div>

                {detailQuery.data.lastErrorSummary && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200">
                    <div className="font-bold mb-1">
                      Last Error ({detailQuery.data.errorCategory || 'ERROR'})
                    </div>
                    <p className="font-mono text-[11px]">{detailQuery.data.lastErrorSummary}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-foreground mb-1.5">
                    Redacted Payload Summary (Identifiers Masked)
                  </h3>
                  <pre className="p-3 rounded-xl bg-muted text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(detailQuery.data.redactedPayloadSummary, null, 2)}
                  </pre>
                </div>

                {detailQuery.data.handlerExecutions && detailQuery.data.handlerExecutions.length > 0 && (
                  <div>
                    <h3 className="font-bold text-foreground mb-1.5">Handler Idempotency Ledger</h3>
                    <div className="space-y-1.5">
                      {detailQuery.data.handlerExecutions.map((h) => (
                        <div
                          key={h.executionKey}
                          className="p-2.5 rounded-lg border border-border flex items-center justify-between"
                        >
                          <span className="font-mono font-semibold">{h.handlerName}</span>
                          <span className="text-muted-foreground">
                            {h.status} • {h.attempts} attempt(s)
                            {h.durationMs !== undefined ? ` • ${h.durationMs}ms` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Controlled Retry Confirmation Modal */}
      {retryTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Schedule controlled event replay"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs">
            <h2 className="text-sm font-bold text-foreground">Controlled Event Replay</h2>
            <p className="text-muted-foreground">
              Re-queue <span className="font-mono font-semibold">{retryTarget.eventType}</span>{' '}
              while preserving its original event ID so already-completed handlers remain idempotent.
            </p>
            <div className="space-y-1">
              <label htmlFor="replay-reason" className="font-semibold text-foreground">
                Operational Audit Reason (min 5 chars)
              </label>
              <textarea
                id="replay-reason"
                rows={3}
                value={retryReason}
                onChange={(e) => setRetryReason(e.target.value)}
                placeholder="e.g., Downstream notification service recovered after transient outage"
                className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRetryTarget(null);
                  setRetryReason('');
                }}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={retryReason.trim().length < 5 || retryMutation.isPending}
                onClick={() =>
                  retryMutation.mutate({
                    eventId: retryTarget.eventId,
                    reason: retryReason.trim(),
                  })
                }
                className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50"
              >
                {retryMutation.isPending ? 'Scheduling...' : 'Confirm Safe Replay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
