'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ScrollText,
  RefreshCw,
  Search,
  Eye,
  Activity,
  Lock,
  Info,
  Download,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import {
  securityMonitoringApi,
  type AuditLogItemDto,
  type AuditLogSummaryDto,
  type SecurityEventDto,
} from '@/features/security-monitoring/api/security-monitoring-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Dialog } from '@/components/ui/dialog';
import { useLiveAnnouncer } from '@/components/accessibility/LiveAnnouncer';

type AuditViewTab = 'immutable-audit' | 'security-events';

const SEVERITY_BADGE: Record<string, 'error' | 'warning' | 'info' | 'neutral'> = {
  CRITICAL: 'error',
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'info',
};

const OUTCOME_BADGE: Record<string, 'success' | 'warning' | 'error'> = {
  SUCCESS: 'success',
  FAILURE: 'warning',
  BLOCKED: 'error',
};

interface InspectedEntry {
  id: string;
  title: string;
  categoryOrResource: string;
  severity?: string;
  outcome: string;
  actorRole: string;
  actorId?: string;
  requestId?: string;
  correlationId?: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export default function AdminAuditLogsPage() {
  const { announce } = useLiveAnnouncer();

  const [tab, setTab] = useState<AuditViewTab>('immutable-audit');
  const [auditLogs, setAuditLogs] = useState<AuditLogItemDto[]>([]);
  const [auditSummary, setAuditSummary] = useState<AuditLogSummaryDto | null>(null);
  const [events, setEvents] = useState<SecurityEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unified filters
  const [search, setSearch] = useState('');
  const [actorRole, setActorRole] = useState('');
  const [outcome, setOutcome] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<InspectedEntry | null>(null);

  const buildDateParams = useCallback(() => {
    return {
      from: fromDate ? new Date(`${fromDate}T00:00:00.000Z`).toISOString() : undefined,
      to: toDate ? new Date(`${toDate}T23:59:59.999Z`).toISOString() : undefined,
    };
  }, [fromDate, toDate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { from, to } = buildDateParams();
    try {
      if (tab === 'immutable-audit') {
        const [res, summary] = await Promise.all([
          securityMonitoringApi.listAuditLogs({
            page,
            limit: 20,
            actorRole: actorRole || undefined,
            outcome: outcome || undefined,
            resourceType: category || undefined,
            search: search.trim() || undefined,
            from,
            to,
          }),
          securityMonitoringApi.getAuditSummary().catch(() => null),
        ]);
        setAuditLogs(res.items || []);
        setTotalPages(res.pagination?.totalPages ?? 1);
        setTotalCount(res.pagination?.total ?? 0);
        if (summary) setAuditSummary(summary);
      } else {
        const res = await securityMonitoringApi.listEvents({
          page,
          limit: 20,
          category: category || undefined,
          severity: severity || undefined,
          actorRole: actorRole || undefined,
          outcome: outcome || undefined,
          search: search.trim() || undefined,
          from,
          to,
        });
        setEvents(res.items || []);
        setTotalPages(res.pagination?.totalPages ?? 1);
        setTotalCount(res.pagination?.total ?? 0);
      }
    } catch {
      setError(
        tab === 'immutable-audit'
          ? 'Unable to load immutable audit logs. Verify your ADMIN account holds admin:audit:read permission.'
          : 'Unable to load security detection events. Server policy requires explicit SECURITY_EVENTS_READ permission on your AdminProfile.'
      );
      setAuditLogs([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page, actorRole, outcome, category, severity, search, buildDateParams]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const { from, to } = buildDateParams();
      await securityMonitoringApi.exportAuditLogsCsv({
        actorRole: actorRole || undefined,
        outcome: outcome || undefined,
        resourceType: category || undefined,
        search: search.trim() || undefined,
        from,
        to,
      });
      announce('Redacted audit log CSV exported. Export event recorded in audit trail.');
    } catch {
      setError('Audit log CSV export failed. Please verify permissions and retry.');
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setActorRole('');
    setOutcome('');
    setCategory('');
    setSeverity('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const hasFilters = Boolean(search || actorRole || outcome || category || severity || fromDate || toDate);

  const auditColumns: DataTableColumn<AuditLogItemDto>[] = [
    {
      key: 'action',
      header: 'Action',
      cell: (row) => (
        <div>
          <p className="font-mono font-semibold text-foreground text-xs">{row.action}</p>
          <p className="text-[11px] text-muted-foreground font-mono">
            {row.resourceType}
            {row.resourceId ? ` · ${row.resourceId.slice(0, 14)}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'outcome',
      header: 'Outcome',
      cell: (row) => (
        <Badge variant={OUTCOME_BADGE[row.outcome] ?? 'neutral'} size="sm">
          {row.outcome}
        </Badge>
      ),
    },
    {
      key: 'actor',
      header: 'Actor Role / ID',
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.actorRole}
          {row.actorId ? ` · ${row.actorId.slice(0, 10)}` : ''}
        </span>
      ),
    },
    {
      key: 'requestId',
      header: 'Correlation ID',
      cell: (row) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {(row.correlationId || row.requestId || '—').slice(0, 18)}
        </span>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      cell: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(row.timestamp).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'inspect',
      header: 'Inspect',
      align: 'right',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setSelectedEntry({
              id: row.id,
              title: row.action,
              categoryOrResource: `${row.resourceType}${row.resourceId ? ` (${row.resourceId})` : ''}`,
              outcome: row.outcome,
              actorRole: row.actorRole,
              actorId: row.actorId,
              requestId: row.requestId,
              correlationId: row.correlationId,
              timestamp: row.timestamp,
              metadata: row.metadata || {},
            })
          }
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Details</span>
        </Button>
      ),
    },
  ];

  const securityEventColumns: DataTableColumn<SecurityEventDto>[] = [
    {
      key: 'eventType',
      header: 'Event',
      cell: (ev) => (
        <div>
          <p className="font-mono font-semibold text-foreground text-xs">{ev.eventType}</p>
          <p className="text-[11px] text-muted-foreground font-mono">{ev.sourceModule}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (ev) => (
        <Badge variant="outline" size="sm" className="font-mono">
          {ev.category}
        </Badge>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      cell: (ev) => (
        <Badge variant={SEVERITY_BADGE[ev.severity] ?? 'neutral'} size="sm">
          {ev.severity}
        </Badge>
      ),
    },
    {
      key: 'outcome',
      header: 'Outcome',
      cell: (ev) => (
        <Badge variant={OUTCOME_BADGE[ev.outcome] ?? 'neutral'} size="sm">
          {ev.outcome}
        </Badge>
      ),
    },
    {
      key: 'actor',
      header: 'Actor Role / Ref',
      cell: (ev) => (
        <span className="font-mono text-xs text-muted-foreground">
          {ev.actorRole || 'SYSTEM'}
          {ev.actorId ? ` · ${ev.actorId.slice(0, 10)}` : ''}
        </span>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      cell: (ev) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(ev.timestamp).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Inspect',
      align: 'right',
      cell: (ev) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setSelectedEntry({
              id: ev.eventId,
              title: ev.eventType,
              categoryOrResource: `${ev.category} · ${ev.sourceModule}`,
              severity: ev.severity,
              outcome: ev.outcome,
              actorRole: ev.actorRole || 'SYSTEM',
              actorId: ev.actorId,
              requestId: ev.requestId,
              correlationId: ev.correlationId,
              timestamp: ev.timestamp,
              metadata: ev.metadata || {},
            })
          }
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Details</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">
              Append-Only Immutable Audit Trail
            </Badge>
            <Badge variant="outline" size="sm">
              <Lock className="h-3 w-3 mr-1" aria-hidden="true" />
              Read-Only • Zero Credentials / Clinical PHI
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-secondary" aria-hidden="true" />
            <span>Audit &amp; Security Event Logs</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Search authentication, authorization, document access, consent, and ABDM audit records.
            Records cannot be edited or deleted from the console.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleExportCsv()}
            disabled={exporting}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{exporting ? 'Exporting...' : 'Export Redacted CSV'}</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/admin/platform/events">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Event Outbox</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Audit Summary Strip */}
      {auditSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-border bg-card p-3.5">
            <span className="text-muted-foreground">Total Persisted Audit Records</span>
            <p className="text-xl font-bold text-foreground mt-1">{auditSummary.totalEvents}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5">
            <span className="text-muted-foreground">Events (Last 24h)</span>
            <p className="text-xl font-bold text-foreground mt-1">{auditSummary.last24hTotal}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5">
            <span className="text-muted-foreground">Blocked Attempts (24h)</span>
            <p className="text-xl font-bold text-error mt-1">{auditSummary.last24hBlocked}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5">
            <span className="text-muted-foreground">Immutability Policy</span>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Schema Append-Only
            </p>
          </div>
        </div>
      )}

      {/* Source Tabs */}
      <div role="tablist" aria-label="Audit log streams" className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'immutable-audit'}
          onClick={() => {
            setTab('immutable-audit');
            setCategory('');
            setSeverity('');
            setPage(1);
          }}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors focus-ring ${
            tab === 'immutable-audit'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          Immutable Audit Logs (/api/v1/audit/logs)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'security-events'}
          onClick={() => {
            setTab('security-events');
            setCategory('');
            setPage(1);
          }}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors focus-ring ${
            tab === 'security-events'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          Security Detection Events (/api/v1/admin/security/events)
        </button>
      </div>

      {error && (
        <ErrorState
          compact
          title="Audit Log Access Restricted"
          message={error}
          onRetry={() => void loadData()}
        />
      )}

      {/* Multi-Facet Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
        <div className="relative lg:col-span-2">
          <Search
            className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search action, resource, correlation ID..."
            aria-label="Search audit events"
            className="pl-9"
          />
        </div>

        <select
          value={actorRole}
          onChange={(e) => {
            setActorRole(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by actor role"
          className="h-11 sm:h-10 rounded-md border border-input bg-surface px-3 text-base sm:text-xs text-foreground focus-ring"
        >
          <option value="">All Roles</option>
          <option value="PATIENT">Patient</option>
          <option value="DOCTOR">Doctor</option>
          <option value="PHARMACY">Pharmacy</option>
          <option value="LABORATORY">Laboratory</option>
          <option value="ADMIN">Admin</option>
          <option value="SYSTEM">System</option>
          <option value="ANONYMOUS">Anonymous</option>
        </select>

        <select
          value={outcome}
          onChange={(e) => {
            setOutcome(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by outcome"
          className="h-11 sm:h-10 rounded-md border border-input bg-surface px-3 text-base sm:text-xs text-foreground focus-ring"
        >
          <option value="">All Outcomes</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILURE">Failure</option>
          <option value="BLOCKED">Blocked</option>
        </select>

        {tab === 'security-events' ? (
          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by severity"
            className="h-11 sm:h-10 rounded-md border border-input bg-surface px-3 text-base sm:text-xs text-foreground focus-ring"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        ) : (
          <input
            type="text"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            placeholder="Resource (e.g. MEDICAL_RECORD)"
            aria-label="Filter by resource category"
            className="h-11 sm:h-10 rounded-md border border-input bg-surface px-3 text-base sm:text-xs text-foreground focus-ring"
          />
        )}

        <input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPage(1);
          }}
          aria-label="Filter from date"
          className="h-11 sm:h-10 rounded-md border border-input bg-surface px-2.5 text-base sm:text-xs text-foreground focus-ring"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(1);
          }}
          aria-label="Filter to date"
          className="h-11 sm:h-10 rounded-md border border-input bg-surface px-2.5 text-base sm:text-xs text-foreground focus-ring"
        />
      </div>

      {hasFilters && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="text-xs gap-1">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Filters</span>
          </Button>
        </div>
      )}

      {/* Responsive Event DataTable */}
      {tab === 'immutable-audit' ? (
        <DataTable
          columns={auditColumns}
          data={auditLogs}
          getRowId={(row) => row.id}
          loading={loading}
          emptyState={
            <div className="py-10 text-center text-sm text-muted-foreground">
              No immutable audit log entries match the active filters yet.
            </div>
          }
        />
      ) : (
        <DataTable
          columns={securityEventColumns}
          data={events}
          getRowId={(ev) => ev.eventId}
          loading={loading}
          emptyState={
            <div className="py-10 text-center text-sm text-muted-foreground">
              No security detection events match the active filters yet.
            </div>
          }
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages} ({totalCount} total entries)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Alert variant="info" title="Audit Immutability & Export Governance">
        <div className="flex items-start gap-2 text-xs">
          <Info className="h-4 w-4 shrink-0 mt-0.5 hidden sm:block" aria-hidden="true" />
          <span>
            Audit logs are enforced as append-only at the Mongoose schema layer and expose strictly
            read-only APIs (<code className="font-mono">/api/v1/audit/logs</code> &amp;{' '}
            <code className="font-mono">/api/v1/admin/security/events</code>). Every CSV export
            strips credentials/PHI, neutralizes spreadsheet formulas, and logs an{' '}
            <code className="font-mono">AUDIT_LOG_EXPORTED</code> event.
          </span>
        </div>
      </Alert>

      {/* Redacted Detail Dialog */}
      <Dialog
        open={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        title={selectedEntry ? `Audit Entry: ${selectedEntry.title}` : 'Audit Entry Detail'}
        description={selectedEntry ? `Event ID: ${selectedEntry.id}` : undefined}
        size="lg"
      >
        {selectedEntry && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <div>
                <span className="text-muted-foreground">Resource / Category:</span>{' '}
                <strong className="font-mono">{selectedEntry.categoryOrResource}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Outcome:</span>{' '}
                <strong className="font-mono">
                  {selectedEntry.severity ? `${selectedEntry.severity} · ` : ''}
                  {selectedEntry.outcome}
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground">Actor:</span>{' '}
                <span className="font-mono">
                  {selectedEntry.actorRole} ({selectedEntry.actorId || 'N/A'})
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Correlation / Request ID:</span>{' '}
                <span className="font-mono">
                  {selectedEntry.correlationId || selectedEntry.requestId || '—'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Timestamp:</span>{' '}
                <span>{new Date(selectedEntry.timestamp).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1.5">
                Sanitized Metadata (Zero Credentials / Zero Clinical PHI)
              </p>
              <pre className="p-3 rounded-lg bg-muted font-mono text-[11px] overflow-x-auto max-h-60">
                {JSON.stringify(selectedEntry.metadata ?? {}, null, 2)}
              </pre>
            </div>
            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedEntry(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
