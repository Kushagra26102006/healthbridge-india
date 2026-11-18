'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  RefreshCw,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
} from 'lucide-react';
import type { AbdmConsentAdminAnalyticsDto } from '@healthbridge/shared-types';
import { abdmConsentApi } from '@/features/abdm/api/abdm-consent-api';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { StaggerList, StaggerItem } from '@/components/motion/MotionPrimitives';

export default function AdminConsentOversightPage() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AbdmConsentAdminAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await abdmConsentApi.getAdminAnalytics();
      setAnalytics(res);
    } catch {
      setError('Unable to retrieve administrative consent oversight analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      const summary = await abdmConsentApi.triggerAdminSync();
      toast({
        variant: 'success',
        title: 'Consent synchronization completed',
        description: `Expired requests marked: ${summary.expiredRequestsMarked}, expired artefacts marked: ${summary.expiredArtefactsMarked}, external checks: ${summary.externalStatusChecked}.`,
      });
      setSyncDialogOpen(false);
      await loadAnalytics();
    } catch {
      toast({
        variant: 'error',
        title: 'Consent sync failed',
        description: 'Verify administrator authorization and ABDM consent sync readiness.',
      });
    } finally {
      setSyncing(false);
    }
  };

  const m = analytics?.metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="teal" size="sm" className="font-mono">
              {analytics?.consentReadiness ?? 'CHECKING'}
            </Badge>
            <Badge variant="outline" size="sm">
              <Lock className="h-3 w-3 mr-1" aria-hidden="true" />
              Admin Consent Bypass: Prohibited
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileCheck2 className="h-6 w-6 text-secondary" aria-hidden="true" />
            <span>Consent Oversight &amp; Governance</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregate monitoring of patient consent requests, active artefacts, expirations, revocations, and synchronization health. Administrators cannot approve or bypass patient consent.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadAnalytics()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setSyncDialogOpen(true)}>
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Run Expiration Sync</span>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/privacy-requests">
              <span>Privacy Requests</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Consent Oversight Unavailable">
          {error}
        </Alert>
      )}

      {/* Primary Consent Metrics */}
      <StaggerList inView={false} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <AdminStatCard
            label="Pending Consent Requests"
            value={m?.pendingRequests ?? 0}
            helperText={`Approved: ${m?.approvedRequests ?? 0} · Rejected: ${m?.rejectedRequests ?? 0}`}
            icon={Clock}
            tone="warning"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <AdminStatCard
            label="Active Consent Artefacts"
            value={m?.activeArtefacts ?? 0}
            helperText="Valid granted patient artefacts"
            icon={CheckCircle2}
            tone="success"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <AdminStatCard
            label="Expired Consents"
            value={(m?.expiredArtefacts ?? 0) + (m?.expiredRequests ?? 0)}
            helperText={`${m?.expiredArtefacts ?? 0} artefacts · ${m?.expiredRequests ?? 0} requests`}
            icon={AlertTriangle}
            tone="info"
            loading={loading}
          />
        </StaggerItem>
        <StaggerItem>
          <AdminStatCard
            label="Revoked Consents"
            value={m?.revokedArtefacts ?? 0}
            helperText={`Pending revocation confirmations: ${m?.pendingRevocationConfirmations ?? 0}`}
            icon={XCircle}
            tone="error"
            loading={loading}
          />
        </StaggerItem>
      </StaggerList>

      {/* Environment Breakdown & Sync Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Consent Volume by Environment</CardTitle>
            <CardDescription>
              Strict separation of mocked development, sandbox, and production consent records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {[
              {
                label: 'Mocked Development',
                requests: analytics?.environmentBreakdown.mockedDevelopment.requests ?? 0,
                artefacts: analytics?.environmentBreakdown.mockedDevelopment.artefacts ?? 0,
              },
              {
                label: 'ABDM Sandbox',
                requests: analytics?.environmentBreakdown.sandbox.requests ?? 0,
                artefacts: analytics?.environmentBreakdown.sandbox.artefacts ?? 0,
              },
              {
                label: 'Production (Live Exchange Disabled)',
                requests: analytics?.environmentBreakdown.production.requests ?? 0,
                artefacts: analytics?.environmentBreakdown.production.artefacts ?? 0,
              },
            ].map((envRow) => (
              <div
                key={envRow.label}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/25"
              >
                <span className="font-medium text-foreground">{envRow.label}</span>
                <span className="font-mono text-muted-foreground tabular-nums">
                  {envRow.requests} requests · {envRow.artefacts} artefacts
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Synchronization &amp; Callback Integrity</CardTitle>
            <CardDescription>
              Operational telemetry for consent expiry sweeps and external webhook callbacks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/35 border border-border/70">
                <p className="text-muted-foreground">Sync Failures</p>
                <p className="text-xl font-bold mt-1 tabular-nums">{m?.syncFailures ?? 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/35 border border-border/70">
                <p className="text-muted-foreground">Callback Processing Failures</p>
                <p className="text-xl font-bold mt-1 tabular-nums">
                  {m?.callbackProcessingFailures ?? 0}
                </p>
              </div>
            </div>
            <div className="space-y-1 text-muted-foreground pt-1">
              <p>
                Last Successful Sync:{' '}
                <span className="font-mono text-foreground">
                  {analytics?.lastSuccessfulSyncAt
                    ? new Date(analytics.lastSuccessfulSyncAt).toLocaleString('en-IN')
                    : 'Not yet executed'}
                </span>
              </p>
              {analytics?.lastSyncError && (
                <p className="text-error">Last Sync Error: {analytics.lastSyncError}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Boundary Notice */}
      <Alert variant="info" title="Patient Consent Privacy Boundary">
        Only aggregate consent lifecycle metrics and synchronization status are surfaced here. Individual patient clinical records and unconsented PHI remain inaccessible to administrators; consent grants can only be issued or revoked by the patient.
      </Alert>

      {/* Sync Confirmation Dialog */}
      <Dialog
        open={syncDialogOpen}
        onClose={() => !syncing && setSyncDialogOpen(false)}
        title="Run Administrative Consent Expiration Sync"
        description="Sweep expired consent requests and artefacts to keep lifecycle statuses accurate."
      >
        <p className="text-xs text-muted-foreground leading-relaxed">
          This sweep updates expired consent states only. It never grants, modifies, or bypasses active patient consent artefacts.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSyncDialogOpen(false)}
            disabled={syncing}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleTriggerSync()}
            disabled={syncing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{syncing ? 'Running Sync...' : 'Confirm Sync Sweep'}</span>
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
