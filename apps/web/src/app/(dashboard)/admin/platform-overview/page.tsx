'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Users,
  Stethoscope,
  Building2,
  FlaskConical,
  Calendar,
  Pill,
  Bell,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import type { AdminPlatformOverviewDto } from '@healthbridge/shared-types';
import { platformApi } from '@/features/platform/api/platform-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminPlatformOverviewPage() {
  const [data, setData] = useState<AdminPlatformOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await platformApi.getAdminPlatformOverview();
      setData(res);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Unable to load platform overview. Ensure you are authenticated as ADMIN.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-teal-600" />
            HealthBridge India — Unified Platform Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live server-side aggregate operational metrics across Patients, Doctors, Pharmacies, Laboratories, Notifications, and ABDM (zero patient PII).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/integrations/abdm">
            <Button size="sm" variant="outline">
              ABDM Governance <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground">
          Aggregating platform metrics from MongoDB...
        </div>
      ) : data ? (
        <>
          {/* 1. Ecosystem Participants */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Registered Patients</span>
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{data.users.registeredPatients}</p>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Active Doctors</span>
                <Stethoscope className="h-4 w-4 text-teal-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{data.users.activeDoctors}</p>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Active Pharmacies</span>
                <Building2 className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{data.users.activePharmacies}</p>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Active Laboratories</span>
                <FlaskConical className="h-4 w-4 text-cyan-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{data.users.activeLaboratories}</p>
            </div>
          </div>

          {/* 2. Clinical Operations */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Cross-Module Clinical Operations
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Appointments</p>
                <p className="text-lg font-bold mt-0.5">{data.clinicalOperations.totalAppointments}</p>
                <p className="text-[11px] text-muted-foreground">
                  Upcoming: {data.clinicalOperations.upcomingAppointments}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Clinical Encounters</p>
                <p className="text-lg font-bold mt-0.5">{data.clinicalOperations.totalEncounters}</p>
                <p className="text-[11px] text-muted-foreground">
                  Finalized: {data.clinicalOperations.finalizedEncounters}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground flex items-center gap-1">
                  <Pill className="h-3.5 w-3.5" /> Prescriptions
                </p>
                <p className="text-lg font-bold mt-0.5">{data.clinicalOperations.totalPrescriptions}</p>
                <p className="text-[11px] text-muted-foreground">
                  Active: {data.clinicalOperations.activePrescriptions} &bull; Dispensed:{' '}
                  {data.clinicalOperations.dispensingRecords}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Lab Orders</p>
                <p className="text-lg font-bold mt-0.5">{data.clinicalOperations.totalLabOrders}</p>
                <p className="text-[11px] text-muted-foreground">Doctor-to-Lab pipeline</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Published Lab Reports</p>
                <p className="text-lg font-bold mt-0.5">{data.clinicalOperations.publishedLabReports}</p>
                <p className="text-[11px] text-muted-foreground">
                  Amended: {data.clinicalOperations.amendedLabReports}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Notifications & ABDM Readiness */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-600" />
                Unified Notification Delivery Status
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{data.notifications.totalSent}</p>
                </div>
                <div className="rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 p-3">
                  <p className="text-emerald-700 dark:text-emerald-300">Delivered</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {data.notifications.delivered}
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50/70 dark:bg-amber-950/30 p-3">
                  <p className="text-amber-700 dark:text-amber-300">Pending</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                    {data.notifications.pending}
                  </p>
                </div>
                <div className="rounded-lg bg-rose-50/70 dark:bg-rose-950/30 p-3">
                  <p className="text-rose-700 dark:text-rose-300">Failed</p>
                  <p className="text-lg font-bold text-rose-700 dark:text-rose-300">
                    {data.notifications.failed}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  ABDM Integration Readiness
                </h2>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {data.abdm.overallStatus}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Verified ABHA</p>
                  <p className="text-lg font-bold">{data.abdm.verifiedAbhaLinks}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Active Artefacts</p>
                  <p className="text-lg font-bold">{data.abdm.activeAbdmArtefacts}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">HIP/HIU Transfers</p>
                  <p className="text-lg font-bold">{data.abdm.hipHiuTransfersTotal}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-muted-foreground">Imported External</p>
                  <p className="text-lg font-bold">{data.abdm.importedExternalRecords}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sandbox Status: <span className="font-mono">{data.abdm.sandboxConnectivityStatus}</span> &bull; Live Production Exchange: Disabled
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
