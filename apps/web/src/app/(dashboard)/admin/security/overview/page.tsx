'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { m } from 'framer-motion';
import {
  ShieldAlert,
  Bell,
  Activity,
  Bug,
  ShieldCheck,
  RefreshCw,
  ScrollText,
  Lock,
} from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import {
  securityMonitoringApi,
  type SecurityOverviewDto,
} from '@/features/security-monitoring/api/security-monitoring-api';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditorialVisual } from '@/components/ui/visual-asset';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StaggerList, StaggerItem } from '@/components/motion/MotionPrimitives';
import { RolePrivacyBanner } from '@/components/security/RolePrivacyBanner';
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion/tokens';

const SEVERITY_BADGE: Record<string, 'error' | 'warning' | 'info' | 'neutral'> = {
  CRITICAL: 'error',
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'info',
};

export default function AdminSecurityOverviewPage() {
  const [overview, setOverview] = useState<SecurityOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await securityMonitoringApi.getOverview();
      setOverview(data);
    } catch {
      setError(
        'Access restricted or unable to load SecOps overview. Server-side policy requires explicit SECURITY_EVENTS_READ permission on your AdminProfile.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const categoryEntries = Object.entries(overview?.eventsByCategory ?? {});
  const maxCategoryCount = Math.max(1, ...categoryEntries.map(([, count]) => count));

  return (
    <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauth>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="teal" size="sm" className="font-mono">
                {overview?.monitoringMode || 'RULE_BASED_SECURITY_TELEMETRY'}
              </Badge>
              <Badge variant="outline" size="sm">
                <Lock className="h-3 w-3 mr-1" aria-hidden="true" />
                Zero Plaintext PHI / Credentials
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-secondary" aria-hidden="true" />
              <span>Security Operations Center (SecOps)</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Server-side security event monitoring, deduplicated rule alerts, incident response, and vulnerability tracking under least-privilege RBAC.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void loadOverview()} disabled={loading}>
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Refresh</span>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/audit-logs">
                <ScrollText className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Event Logs</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/security/alerts">
                <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Alerts</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/security/incidents">
                <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Incidents</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/security/vulnerabilities">
                <Bug className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Vulnerabilities</span>
              </Link>
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/admin/security/data-protection">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Data Protection</span>
              </Link>
            </Button>
            </div>
            <div className="hidden xl:block w-36 shrink-0">
              <EditorialVisual
                asset="privacyConsentShield"
                aspectClassName="aspect-[16/9]"
                sizes="144px"
                className="rounded-lg shadow-xs"
              />
            </div>
          </div>
        </div>

        <RolePrivacyBanner role="ADMIN" />

        {error && (
          <Alert variant="error" title="SecOps Access Restricted">
            {error}
          </Alert>
        )}

        {/* Top KPI Cards */}
        <StaggerList inView={false} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <AdminStatCard
              label="Total Security Events"
              value={overview?.totalSecurityEvents ?? 0}
              helperText={`${overview?.detectionRulesActive ?? 0} active rule detectors`}
              icon={ScrollText}
              tone="primary"
              href="/admin/audit-logs"
              loading={loading}
            />
          </StaggerItem>
          <StaggerItem>
            <AdminStatCard
              label="Open Alerts"
              value={overview?.openAlertCount ?? 0}
              helperText={`${overview?.criticalAndHighOpenAlerts ?? 0} Critical / High severity`}
              icon={Bell}
              tone={(overview?.criticalAndHighOpenAlerts ?? 0) > 0 ? 'error' : 'warning'}
              href="/admin/security/alerts"
              loading={loading}
            />
          </StaggerItem>
          <StaggerItem>
            <AdminStatCard
              label="Active Incidents"
              value={overview?.activeIncidentCount ?? 0}
              helperText={`${overview?.criticalActiveIncidents ?? 0} Critical severity`}
              icon={Activity}
              tone={(overview?.activeIncidentCount ?? 0) > 0 ? 'error' : 'success'}
              href="/admin/security/incidents"
              loading={loading}
            />
          </StaggerItem>
          <StaggerItem>
            <AdminStatCard
              label="Tracked Vulnerabilities"
              value={overview?.vulnerabilitySummary.totalTracked ?? 0}
              helperText={`${overview?.vulnerabilitySummary.openBySeverity.CRITICAL ?? 0} Critical · ${overview?.vulnerabilitySummary.openBySeverity.HIGH ?? 0} High open`}
              icon={Bug}
              tone="info"
              href="/admin/security/vulnerabilities"
              loading={loading}
            />
          </StaggerItem>
        </StaggerList>

        {/* Indicators + Event Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Security Indicators &amp; SLA Metrics</CardTitle>
              <CardDescription>
                Authentication failures, authorization denials, rate limits &amp; response timing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
                  <p className="text-muted-foreground">Failed Login Attempts</p>
                  <p className="text-xl font-bold mt-1 tabular-nums">
                    {overview?.indicators.failedLoginCount ?? 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Failure Rate:{' '}
                    {overview?.indicators.failedLoginRatePercent !== null &&
                    overview?.indicators.failedLoginRatePercent !== undefined
                      ? `${overview.indicators.failedLoginRatePercent}%`
                      : 'N/A'}
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
                  <p className="text-muted-foreground">Unauthorized Access Denials</p>
                  <p className="text-xl font-bold mt-1 tabular-nums">
                    {overview?.indicators.unauthorizedAccessAttempts ?? 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Blocked by RBAC &amp; ownership policy
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
                  <p className="text-muted-foreground">Rate-Limit Breaches</p>
                  <p className="text-xl font-bold mt-1 tabular-nums">
                    {overview?.indicators.rateLimitEvents ?? 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Crypto/Doc Alerts: {overview?.indicators.documentAndCryptoAlertEvents ?? 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60">
                  <p className="text-muted-foreground">MTTA / MTTR</p>
                  <p className="text-base font-bold mt-1.5 tabular-nums">
                    {overview?.slaMetrics.meanTimeToAcknowledgeSec ?? 'N/A'}s /{' '}
                    {overview?.slaMetrics.meanTimeToResolveSec ?? 'N/A'}s
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Backup/KMS Alerts: {overview?.indicators.backupAndKeyManagementAlerts ?? 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Events by Security Category</CardTitle>
              <CardDescription>
                Real distribution from server-side security event store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {categoryEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">
                  No security events recorded across categories yet.
                </p>
              ) : (
                categoryEntries.map(([category, count]) => (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-medium text-foreground">{category}</span>
                      <span className="font-mono text-muted-foreground tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 w-full rounded-pill bg-muted overflow-hidden">
                      <m.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: Math.max(0.03, count / maxCategoryCount) }}
                        transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.standard }}
                        style={{ transformOrigin: 'left center' }}
                        className="h-full w-full rounded-pill bg-secondary"
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Suspicious Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Recent Suspicious &amp; Security Activity</CardTitle>
                <CardDescription>
                  Sanitized telemetry records — no raw tokens, passwords, or clinical data
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/audit-logs">View Full Log</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {(overview?.recentSuspiciousActivity || []).length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                No recent suspicious security events recorded.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {overview!.recentSuspiciousActivity.map((ev) => (
                  <div
                    key={ev.eventId}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-semibold text-foreground">
                          {ev.eventType}
                        </span>
                        <Badge variant={SEVERITY_BADGE[ev.severity] ?? 'neutral'} size="sm">
                          {ev.severity}
                        </Badge>
                        <Badge variant="outline" size="sm" className="font-mono">
                          {ev.outcome}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Module: <span className="font-mono">{ev.sourceModule}</span> · Category:{' '}
                        <span className="font-mono">{ev.category}</span>
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                      {new Date(ev.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
