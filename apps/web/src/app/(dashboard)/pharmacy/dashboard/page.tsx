'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { m } from 'framer-motion';
import {
  usePharmacyDashboardSummary,
  usePharmacyProfile,
  usePharmacyInventoryAnalytics,
} from '@/features/pharmacy/hooks/use-pharmacy';
import {
  DashboardStatCard,
  PrescriptionQueuePreview,
  InventoryAlertsCard,
  RecentActivityList,
  CreateInventoryModal,
} from '@/components/pharmacy';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditorialVisual } from '@/components/ui/visual-asset';
import { Alert } from '@/components/ui/alert';
import { SkeletonStatGrid } from '@/components/ui/skeleton';
import { StaggerList, StaggerItem, useClinicalActionFeedback } from '@/components/motion';
import { MOTION_EASE } from '@/lib/motion/tokens';
import {
  Pill,
  AlertTriangle,
  FileText,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  RefreshCw,
  BarChart3,
  Truck,
} from 'lucide-react';

export default function PharmacyDashboardPage() {
  const { data: summary, isLoading, error, refetch } = usePharmacyDashboardSummary();
  const { data: profile } = usePharmacyProfile();
  const { data: analytics } = usePharmacyInventoryAnalytics();
  const feedback = useClinicalActionFeedback();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Alert
          variant="error"
          title="Unable to Load Pharmacy Dashboard"
          description="An error occurred while communicating with the pharmacy service. Please check connectivity and retry."
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Retry</span>
            </Button>
          }
        />
      </div>
    );
  }

  const metrics = summary?.metrics;
  const maxStockCount = Math.max(
    1,
    ...(analytics?.stockStatusDistribution?.map((d) => d.count) ?? [1])
  );
  const maxDosageUnits = Math.max(
    1,
    ...(analytics?.dosageFormDistribution?.map((d) => d.units) ?? [1])
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#080F1E] via-[#111C30] to-[#0D3B4C] p-6 sm:p-8 text-white shadow-lg border border-slate-700/50">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-secondary/15 blur-3xl pointer-events-none"
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge
                variant={profile?.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}
                size="sm"
                className="bg-white/10 text-teal-200 border-white/15"
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {profile?.verificationStatus === 'VERIFIED'
                    ? 'Verified Pharmacy'
                    : `Status: ${profile?.verificationStatus || 'UNDER REVIEW'}`}
                </span>
              </Badge>
              {profile?.pharmacyLicenseNumber && (
                <span className="text-xs text-slate-300 font-mono">
                  DL: {profile.pharmacyLicenseNumber}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {profile?.pharmacyName || 'Pharmacy Management Workspace'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Monitor batch inventory, verify clinician e-prescriptions, track expiry windows, and
              manage patient medication orders in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="h-9 sm:h-10 px-4 font-semibold"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add Stock Batch</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 sm:h-10 px-4 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
              >
                <Link href="/pharmacy/prescriptions">
                  <FileText className="w-4 h-4 text-teal-300" aria-hidden="true" />
                  <span>Prescription Queue</span>
                </Link>
              </Button>
            </div>
            <div className="hidden xl:block w-44 shrink-0">
              <EditorialVisual
                asset="ecosystemPharmacyDispensing"
                aspectClassName="aspect-[16/10]"
                sizes="176px"
                className="rounded-lg border-white/15 bg-white/5 shadow-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary 6 Real-Data Pharmacy KPI Cards */}
      {isLoading ? (
        <SkeletonStatGrid count={6} className="lg:grid-cols-3" />
      ) : (
        <StaggerList
          inView={false}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <StaggerItem>
            <Link href="/pharmacy/inventory" className="block focus-ring rounded-lg h-full">
              <DashboardStatCard
                title="Total Active Medicines"
                value={metrics?.totalActiveMedicines ?? 0}
                icon={Pill}
                subtext={`${metrics?.outOfStockMedicines ?? 0} out of stock`}
                variant="blue"
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/pharmacy/prescriptions" className="block focus-ring rounded-lg h-full">
              <DashboardStatCard
                title="Pending Prescriptions"
                value={metrics?.pendingPrescriptions ?? 0}
                icon={FileText}
                subtext="Awaiting verification & dispensing"
                variant="teal"
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/pharmacy/dispensing" className="block focus-ring rounded-lg h-full">
              <DashboardStatCard
                title="Completed Dispensing"
                value={metrics?.completedDispensing ?? 0}
                icon={CheckCircle2}
                subtext="Fulfilled prescriptions"
                variant="emerald"
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/pharmacy/inventory/alerts" className="block focus-ring rounded-lg h-full">
              <DashboardStatCard
                title="Low Stock Medicines"
                value={metrics?.lowStockMedicines ?? 0}
                icon={AlertTriangle}
                subtext="At or below reorder level"
                variant="amber"
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/pharmacy/inventory/expiry" className="block focus-ring rounded-lg h-full">
              <DashboardStatCard
                title="Expiring Medicines"
                value={metrics?.expiringMedicines ?? 0}
                icon={Clock}
                subtext="Near-expiry inventory batches"
                variant="red"
              />
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link href="/pharmacy/orders" className="block focus-ring rounded-lg h-full">
              <DashboardStatCard
                title="Pending & Processing Orders"
                value={metrics?.processingOrders ?? 0}
                icon={ShoppingCart}
                subtext="Active order fulfillment pipeline"
                variant="purple"
              />
            </Link>
          </StaggerItem>
        </StaggerList>
      )}

      {/* 3. Main Two-Column Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-card-heading flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>Active Prescription Queue</span>
              </h3>
              <Link
                href="/pharmacy/prescriptions"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
            <PrescriptionQueuePreview
              prescriptions={summary?.prescriptionQueuePreview || []}
            />
          </Card>

          <InventoryAlertsCard alerts={summary?.inventoryAlerts || []} />

          {/* 4. Verified Pharmacy Inventory Analytics (#analytics) */}
          <Card id="analytics" className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-card-heading flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-secondary" aria-hidden="true" />
                  <span>Inventory &amp; Stock Analytics</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Computed directly from live batch inventory and stock transaction records
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/pharmacy/inventory/transactions">Transaction Ledger</Link>
              </Button>
            </div>

            {analytics ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-md border border-border bg-muted/35 p-3.5">
                    <p className="text-xs text-muted-foreground">Active Stock Batches</p>
                    <p className="text-xl font-bold text-foreground tabular-nums mt-0.5">
                      {analytics.totalActiveBatches}
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/35 p-3.5">
                    <p className="text-xs text-muted-foreground">Total Available Units</p>
                    <p className="text-xl font-bold text-foreground tabular-nums mt-0.5">
                      {analytics.totalAvailableUnits.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/35 p-3.5">
                    <p className="text-xs text-muted-foreground">Estimated Stock Value</p>
                    <p className="text-xl font-bold text-secondary tabular-nums mt-0.5">
                      ₹{analytics.estimatedValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Stock Status Distribution */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Stock Health Distribution
                    </p>
                    {(analytics.stockStatusDistribution ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No inventory batches recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.stockStatusDistribution.map((item) => (
                          <div key={item.status} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-foreground">
                                {item.status.replace(/_/g, ' ')}
                              </span>
                              <span className="tabular-nums text-muted-foreground">
                                {item.count}
                              </span>
                            </div>
                            <div className="h-2 rounded-pill bg-muted overflow-hidden">
                              <m.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: Math.max(0.05, item.count / maxStockCount) }}
                                transition={{ duration: 0.35, ease: MOTION_EASE.standard }}
                                style={{ transformOrigin: 'left' }}
                                className="h-full w-full rounded-pill bg-primary"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dosage Form Distribution */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Units by Dosage Form
                    </p>
                    {(analytics.dosageFormDistribution ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No dosage distribution yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.dosageFormDistribution.slice(0, 5).map((item) => (
                          <div key={item.dosageForm} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-foreground truncate">
                                {item.dosageForm}
                              </span>
                              <span className="tabular-nums text-muted-foreground">
                                {item.units.toLocaleString('en-IN')} units
                              </span>
                            </div>
                            <div className="h-2 rounded-pill bg-muted overflow-hidden">
                              <m.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: Math.max(0.05, item.units / maxDosageUnits) }}
                                transition={{ duration: 0.35, ease: MOTION_EASE.standard }}
                                style={{ transformOrigin: 'left' }}
                                className="h-full w-full rounded-pill bg-secondary"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Analytics populate automatically as stock batches and transactions are recorded.
              </p>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <Card className="p-5 space-y-3">
            <h3 className="text-card-heading">Quick Shortcuts</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-md border border-border bg-surface hover:border-primary/40 hover:bg-muted/50 text-left transition-colors group focus-ring"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-primary/12 text-primary flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground">Record Batch Intake</div>
                    <div className="text-xs text-muted-foreground truncate">
                      Log new stock into inventory
                    </div>
                  </div>
                </div>
                <ArrowRight
                  className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                  aria-hidden="true"
                />
              </button>

              <Link
                href="/pharmacy/inventory/medicines"
                className="w-full flex items-center justify-between p-3 rounded-md border border-border bg-surface hover:border-secondary/40 hover:bg-muted/50 text-left transition-colors group focus-ring"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-secondary/12 text-secondary flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground">Medicine Catalogue</div>
                    <div className="text-xs text-muted-foreground truncate">
                      Search &amp; manage stock catalog
                    </div>
                  </div>
                </div>
                <ArrowRight
                  className="w-4 h-4 text-muted-foreground group-hover:text-secondary group-hover:translate-x-0.5 transition-all shrink-0"
                  aria-hidden="true"
                />
              </Link>

              <Link
                href="/pharmacy/suppliers"
                className="w-full flex items-center justify-between p-3 rounded-md border border-border bg-surface hover:border-primary/40 hover:bg-muted/50 text-left transition-colors group focus-ring"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-amber-500/12 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground">
                      Suppliers &amp; Purchase Orders
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Manage vendor replenishment
                    </div>
                  </div>
                </div>
                <ArrowRight
                  className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </Card>

          <RecentActivityList activities={summary?.recentActivity || []} />

          {/* Statutory License Card */}
          <div className="rounded-xl bg-[#080F1E] border border-slate-700/60 p-5 text-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-teal-300">
              <Building2 className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Statutory License Info
              </span>
            </div>
            <div className="text-xs text-slate-300 space-y-2 mt-3">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Drug License:</span>
                <span className="font-mono text-white truncate">
                  {profile?.pharmacyLicenseNumber || 'Pending Registration'}
                </span>
              </div>
              {profile?.gstin && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">GSTIN:</span>
                  <span className="font-mono text-white">{profile.gstin}</span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Hours:</span>
                <span className="text-white">
                  {profile?.is24Hours
                    ? '24 Hours Open'
                    : `${profile?.openingTime || '09:00'} – ${profile?.closingTime || '21:00'}`}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">CDSCO-aligned records</span>
              <Link href="/pharmacy/profile" className="text-teal-300 hover:underline font-medium">
                Manage Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Batch Modal */}
      <CreateInventoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
          feedback.notifyPharmacyStockUpdated();
        }}
      />
    </div>
  );
}
