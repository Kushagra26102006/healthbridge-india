'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Bell, Activity, Bug, ShieldCheck, AlertCircle } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import {
  securityMonitoringApi,
  type SecurityOverviewDto,
} from '@/features/security-monitoring/api/security-monitoring-api';

export default function AdminSecurityOverviewPage() {
  const [overview, setOverview] = useState<SecurityOverviewDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    securityMonitoringApi
      .getOverview()
      .then(setOverview)
      .catch(() =>
        setError('Access restricted or unable to load SecOps overview (requires SECURITY_EVENTS_READ permission).')
      );
  }, []);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']} redirectUnauth>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-teal-600" />
              <span>Security Operations Center (SecOps) Overview</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Real server-side security telemetry — zero hardcoded metrics, zero plaintext PHI or secrets.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href="/admin/security/alerts" className="px-3 py-2 rounded-xl border border-border bg-card font-semibold hover:bg-muted inline-flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              <span>Alerts</span>
            </Link>
            <Link href="/admin/security/incidents" className="px-3 py-2 rounded-xl border border-border bg-card font-semibold hover:bg-muted inline-flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Incidents</span>
            </Link>
            <Link href="/admin/security/vulnerabilities" className="px-3 py-2 rounded-xl border border-border bg-card font-semibold hover:bg-muted inline-flex items-center gap-1.5">
              <Bug className="w-3.5 h-3.5" />
              <span>Vulnerabilities</span>
            </Link>
            <Link href="/admin/security/data-protection" className="px-3 py-2 rounded-xl border border-border bg-card font-semibold hover:bg-muted inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Data Protection</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">Total Security Events</p>
            <p className="text-2xl font-bold mt-1">{overview?.totalSecurityEvents ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {overview?.detectionRulesActive ?? 0} active detection rules
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">Open Alerts</p>
            <p className="text-2xl font-bold mt-1">{overview?.openAlertCount ?? 0}</p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
              {overview?.criticalAndHighOpenAlerts ?? 0} Critical / High
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">Active Incidents</p>
            <p className="text-2xl font-bold mt-1">{overview?.activeIncidentCount ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {overview?.criticalActiveIncidents ?? 0} Critical severity
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">Tracked Vulnerabilities</p>
            <p className="text-2xl font-bold mt-1">{overview?.vulnerabilitySummary.totalTracked ?? 0}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {overview?.vulnerabilitySummary.openBySeverity.CRITICAL ?? 0} Critical •{' '}
              {overview?.vulnerabilitySummary.openBySeverity.HIGH ?? 0} High open
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3 text-xs">
            <h2 className="text-sm font-bold">Security Indicators & SLA Metrics</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-muted-foreground">Failed Logins</p>
                <p className="text-lg font-bold">{overview?.indicators.failedLoginCount ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">
                  Rate: {overview?.indicators.failedLoginRatePercent !== null && overview?.indicators.failedLoginRatePercent !== undefined ? `${overview.indicators.failedLoginRatePercent}%` : 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-muted-foreground">Unauthorized Access Denials</p>
                <p className="text-lg font-bold">{overview?.indicators.unauthorizedAccessAttempts ?? 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-muted-foreground">Rate-Limit Breaches</p>
                <p className="text-lg font-bold">{overview?.indicators.rateLimitEvents ?? 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40">
                <p className="text-muted-foreground">MTTA / MTTR</p>
                <p className="text-sm font-bold mt-1">
                  {overview?.slaMetrics.meanTimeToAcknowledgeSec ?? 'N/A'}s /{' '}
                  {overview?.slaMetrics.meanTimeToResolveSec ?? 'N/A'}s
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-3 text-xs">
            <h2 className="text-sm font-bold">Recent Suspicious Activity</h2>
            {(overview?.recentSuspiciousActivity || []).length === 0 ? (
              <p className="text-muted-foreground py-6 text-center">No recent security events recorded.</p>
            ) : (
              <div className="space-y-2">
                {overview!.recentSuspiciousActivity.map((ev) => (
                  <div key={ev.eventId} className="p-2.5 rounded-xl border border-border flex justify-between gap-2">
                    <div>
                      <span className="font-mono font-semibold mr-2">{ev.eventType}</span>
                      <span className="text-muted-foreground">{ev.sourceModule}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {ev.severity} • {ev.outcome}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
