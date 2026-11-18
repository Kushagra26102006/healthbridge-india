'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Video,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Headphones,
  RefreshCw,
  Lock,
  CheckCircle2,
  Server,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { telemedicineApi } from '@/features/telemedicine/api/telemedicine-api';

export default function AdminTelemedicinePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'telemedicine', 'telemetry'],
    queryFn: () => telemedicineApi.getAdminTelemetry(),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-muted/60" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-24 rounded-xl bg-muted/60" />
          <div className="h-24 rounded-xl bg-muted/60" />
          <div className="h-24 rounded-xl bg-muted/60" />
          <div className="h-24 rounded-xl bg-muted/60" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Alert
          variant="error"
          title="Unable to Load Video Consultation Telemetry"
          description="Verify API connectivity and Super Admin authorization, then retry."
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const { configuration, usage, recentTechnicalEvents } = data;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Video className="h-6 w-6 text-teal-600" aria-hidden="true" />
            <span>Video Consultation Operations &amp; Configuration</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Privacy-preserving telemedicine configuration, aggregate usage metrics, and anonymized
            technical health telemetry. Zero clinical notes or patient PHI are accessible here.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh Telemetry
        </Button>
      </div>

      {/* Honest Readiness Notice */}
      <Alert
        variant={configuration.productionSfuReady ? 'info' : 'warning'}
        title={
          configuration.productionSfuReady
            ? 'LiveKit SFU Provider Configured'
            : 'Development Signaling Mode Active (LiveKit SFU Not Yet Provisioned)'
        }
        description={configuration.readinessNotice}
      />

      {/* Aggregate Usage KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Teleconsult Appointments</span>
            <Video className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {usage.totalTeleconsultAppointments}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {usage.totalVideoSessions} video room sessions initialized
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Active / Completed Rooms</span>
            <Activity className="h-4 w-4 text-teal-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {usage.activeSessions} / {usage.completedSessions}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Avg duration: {usage.averageDurationSeconds}s
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Audio-Only Fallbacks</span>
            <Headphones className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {usage.audioFallbackSessions}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Low-bandwidth or camera-unavailable fallbacks
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Reconnects / Tech Failures</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {usage.totalReconnectEvents} / {usage.totalTechnicalFailures}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {usage.failedSessions} failed room session(s)
          </p>
        </Card>
      </div>

      {/* Configuration Posture & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Infrastructure &amp; Security Configuration</span>
          </h2>

          <div className="divide-y divide-border/60 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-muted-foreground">Active Video Provider</span>
              <Badge variant="outline" className="font-mono">
                {configuration.activeProvider}
              </Badge>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-muted-foreground">Room Token TTL</span>
              <span className="font-semibold text-foreground">
                {configuration.tokenTtlSeconds} seconds (Short-Lived HS256)
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-muted-foreground">Call Recording Default</span>
              <Badge variant="success" size="sm">
                <Lock className="h-3 w-3 mr-1" />
                Disabled by Default
              </Badge>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-muted-foreground">Patient Telemedicine Consent</span>
              <Badge variant="success" size="sm">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Enforced Server-Side
              </Badge>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-muted-foreground">Media Encryption</span>
              <span className="font-medium text-foreground text-right">
                {configuration.encryptionTransport}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-muted-foreground">Configured ICE Servers</span>
              <span className="font-mono font-semibold text-foreground">
                {configuration.iceServerCount}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden="true" />
            <span>Consultation Lifecycle Distribution</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(usage.statusBreakdown).map(([status, count]) => (
              <div
                key={status}
                className="rounded-xl border border-border/70 bg-muted/30 p-3 space-y-1"
              >
                <p className="text-[10px] font-semibold text-muted-foreground truncate">{status}</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{count}</p>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground pt-2 border-t border-border/60">
            <strong>Privacy Guardrail:</strong> Administrators cannot join private consultation
            rooms, issue participant tokens, or read doctor clinical notes from this console.
          </p>
        </Card>
      </div>

      {/* Anonymized Technical Failure / Reconnection Table */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Anonymized Technical Failure &amp; Reconnection Log
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Displays non-PHI session references and network diagnostics only.
          </p>
        </div>

        {recentTechnicalEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No technical failures or reconnection events recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2.5 pr-4 font-semibold">Session Ref</th>
                  <th className="py-2.5 pr-4 font-semibold">Provider</th>
                  <th className="py-2.5 pr-4 font-semibold">Status</th>
                  <th className="py-2.5 pr-4 font-semibold">Mode</th>
                  <th className="py-2.5 pr-4 font-semibold">Reconnects</th>
                  <th className="py-2.5 pr-4 font-semibold">Failure Category</th>
                  <th className="py-2.5 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {recentTechnicalEvents.map((ev) => (
                  <tr key={ev.sessionRef}>
                    <td className="py-2.5 pr-4 font-mono font-semibold text-foreground">
                      {ev.sessionRef}
                    </td>
                    <td className="py-2.5 pr-4 font-mono">{ev.provider}</td>
                    <td className="py-2.5 pr-4">
                      <Badge variant={ev.status === 'FAILED' ? 'error' : 'warning'} size="sm">
                        {ev.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4">{ev.mode}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{ev.reconnectCount}</td>
                    <td className="py-2.5 pr-4 font-mono text-[11px]">
                      {ev.failureCategory} ({ev.failureCode})
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {new Date(ev.updatedAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
