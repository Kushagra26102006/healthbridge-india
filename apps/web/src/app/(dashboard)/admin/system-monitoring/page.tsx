'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Server,
  Database,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { EventHealthMetricsDto } from '@healthbridge/shared-types';
import { useSystemHealth } from '@/features/system/hooks/use-system-health';
import { eventsApi } from '@/features/events/api/events-api';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StaggerList, StaggerItem } from '@/components/motion/MotionPrimitives';

function formatUptime(seconds?: number): string {
  if (seconds === undefined || Number.isNaN(seconds)) return '—';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export default function AdminSystemMonitoringPage() {
  const { health, isLoading: healthLoading, isError: healthError, refetch: refetchHealth } =
    useSystemHealth();
  const [eventHealth, setEventHealth] = useState<EventHealthMetricsDto | null>(null);
  const [eventLoading, setEventLoading] = useState(true);

  const loadEventHealth = useCallback(async () => {
    setEventLoading(true);
    try {
      const res = await eventsApi.getHealth();
      setEventHealth(res);
    } catch {
      setEventHealth(null);
    } finally {
      setEventLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEventHealth();
  }, [loadEventHealth]);

  const handleRefreshAll = () => {
    void refetchHealth();
    void loadEventHealth();
  };

  const apiHealthy = health?.status === 'healthy';
  const dbStatus = health?.services?.database?.status ?? 'uninitialized';
  const dbConnected = dbStatus === 'connected';
  const primaryWorker = eventHealth?.workers?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant={apiHealthy && dbConnected ? 'success' : 'warning'} size="sm" dot>
              {healthLoading ? 'Checking Services' : health?.status?.toUpperCase() || 'UNKNOWN'}
            </Badge>
            <Badge variant="outline" size="sm" className="font-mono">
              Env: {health?.environment || '—'} · v{health?.version || '—'}
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Server className="h-6 w-6 text-secondary" aria-hidden="true" />
            <span>System Health &amp; Monitoring</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Live backend API health, MongoDB connectivity, and transactional outbox worker telemetry — explicitly separating monitored signals from unavailable APM metrics.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={healthLoading || eventLoading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${healthLoading || eventLoading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Refresh Telemetry</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/admin/platform/events">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Outbox Queue</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/security/data-protection">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Storage &amp; Backups</span>
            </Link>
          </Button>
        </div>
      </div>

      {healthError && (
        <Alert variant="error" title="Backend Health Endpoint Unreachable">
          Could not reach <code className="font-mono">GET /api/v1/health</code>. Verify the Express API server is running and accessible.
        </Alert>
      )}

      {/* Live Monitored Health KPIs */}
      <StaggerList inView={false} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <AdminStatCard
            label="API Service Status"
            value={health?.status ? health.status.toUpperCase() : 'UNKNOWN'}
            helperText={`Uptime: ${formatUptime(health?.uptime)}`}
            icon={Server}
            tone={apiHealthy ? 'success' : 'error'}
            loading={healthLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AdminStatCard
            label="MongoDB Connectivity"
            value={dbStatus.toUpperCase()}
            helperText={`Ping latency: ${health?.services?.database?.latencyMs ?? '—'} ms`}
            icon={Database}
            tone={dbConnected ? 'success' : 'error'}
            loading={healthLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AdminStatCard
            label="Background Worker Status"
            value={primaryWorker?.status || 'STOPPED'}
            helperText={
              primaryWorker
                ? `${primaryWorker.workerId} · Processed: ${primaryWorker.processedCount}`
                : 'No active outbox workers reported'
            }
            icon={Cpu}
            tone={primaryWorker?.status === 'RUNNING' ? 'success' : 'warning'}
            href="/admin/platform/events"
            loading={eventLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <AdminStatCard
            label="Dead-Letter & Retrying Jobs"
            value={(eventHealth?.counts.deadLetter ?? 0) + (eventHealth?.counts.retrying ?? 0)}
            helperText={`${eventHealth?.counts.deadLetter ?? 0} dead-letter · ${eventHealth?.handlerFailureRate ?? 0}% failure rate`}
            icon={AlertTriangle}
            tone={(eventHealth?.counts.deadLetter ?? 0) > 0 ? 'error' : 'info'}
            href="/admin/platform/events"
            loading={eventLoading}
          />
        </StaggerItem>
      </StaggerList>

      {/* Outbox Activity & Telemetry Availability Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Background Job &amp; Outbox Telemetry</CardTitle>
                <CardDescription>Live data from GET /api/v1/events/health</CardDescription>
              </div>
              <Link
                href="/admin/platform/events"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Inspect</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/35 border border-border/70">
                <p className="text-muted-foreground">Pending</p>
                <p className="text-lg font-bold tabular-nums">{eventHealth?.counts.pending ?? 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/35 border border-border/70">
                <p className="text-muted-foreground">Processing</p>
                <p className="text-lg font-bold tabular-nums">
                  {eventHealth?.counts.processing ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-emerald-700 dark:text-emerald-300">Processed</p>
                <p className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {eventHealth?.counts.processed ?? 0}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-muted-foreground">
              <span>
                Avg Processing Duration:{' '}
                <strong className="font-mono text-foreground">
                  {eventHealth?.averageProcessingDurationMs ?? 0} ms
                </strong>
              </span>
              <span>
                Atomicity Mode:{' '}
                <strong className="font-mono text-foreground">
                  {eventHealth?.topologyTransactionSupport || 'UNKNOWN'}
                </strong>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monitored vs. Unavailable Telemetry</CardTitle>
            <CardDescription>
              Honest distinction between active server probes and unconfigured external observability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            {[
              { name: 'API Health & Uptime (/api/v1/health)', available: true },
              { name: 'MongoDB Connectivity & Ping Latency', available: true },
              { name: 'Transactional Outbox Workers & Dead-Letter Queue', available: true },
              { name: 'Data Protection, KMS & Private Document Store Status', available: true },
              { name: 'Host CPU / Memory / Container Infrastructure Metrics', available: false },
              { name: 'External APM Distributed Tracing & 24/7 Pager Alerting', available: false },
            ].map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/70 bg-muted/20"
              >
                <span className="text-foreground flex items-center gap-2">
                  {row.available ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  )}
                  <span>{row.name}</span>
                </span>
                <Badge variant={row.available ? 'success' : 'neutral'} size="sm">
                  {row.available ? 'LIVE MONITORED' : 'NOT CONFIGURED'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
