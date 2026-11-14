'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  usePharmacyDashboardSummary,
  usePharmacyProfile,
} from '@/features/pharmacy/hooks/use-pharmacy';
import {
  DashboardStatCard,
  PrescriptionQueuePreview,
  InventoryAlertsCard,
  RecentActivityList,
  CreateInventoryModal,
} from '@/components/pharmacy';
import {
  Pill,
  AlertTriangle,
  XCircle,
  FileText,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';

export default function PharmacyDashboardPage() {
  const { data: summary, error, refetch } = usePharmacyDashboardSummary();
  const { data: profile } = usePharmacyProfile();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200 my-6 shadow-xs">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <XCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          Unable to Load Pharmacy Dashboard
        </h3>
        <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
          An error occurred while communicating with the pharmacy service. Please check your network connection and try again.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const metrics = summary?.metrics;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-sky-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                {profile?.verificationStatus === 'VERIFIED'
                  ? 'ABDM Verified Pharmacy'
                  : 'Verification Under Review'}
              </span>
              {profile?.pharmacyLicenseNumber && (
                <span className="text-xs text-slate-300 font-mono">
                  DL: {profile.pharmacyLicenseNumber}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {profile?.pharmacyName || 'Pharmacy Dispensation Portal'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Track real-time inventory batches, review doctor e-prescriptions, and manage medication fulfillments in accordance with CDSCO statutory standards.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Stock Batch
            </button>
            <Link
              href="/pharmacy/prescriptions"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-white text-xs font-medium rounded-xl border border-slate-700 transition-colors"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              View Queue
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Active Medicines"
          value={metrics?.totalActiveMedicines ?? 0}
          icon={Pill}
          subtext="Catalog batches in stock"
          variant="blue"
        />
        <DashboardStatCard
          title="Low Stock Alert"
          value={metrics?.lowStockMedicines ?? 0}
          icon={AlertTriangle}
          subtext="At or below reorder level"
          variant="amber"
        />
        <DashboardStatCard
          title="Out of Stock"
          value={metrics?.outOfStockMedicines ?? 0}
          icon={XCircle}
          subtext="Zero inventory balance"
          variant="red"
        />
        <DashboardStatCard
          title="Expiring Soon"
          value={metrics?.expiringMedicines ?? 0}
          icon={Clock}
          subtext="Near-expiry batches"
          variant="purple"
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardStatCard
          title="Pending Prescriptions"
          value={metrics?.pendingPrescriptions ?? 0}
          icon={FileText}
          subtext="Awaiting dispensation"
          variant="blue"
        />
        <DashboardStatCard
          title="Processing Orders"
          value={metrics?.processingOrders ?? 0}
          icon={ShoppingCart}
          subtext="In fulfillment pipeline"
          variant="teal"
        />
        <DashboardStatCard
          title="Completed Dispensing"
          value={metrics?.completedDispensing ?? 0}
          icon={CheckCircle2}
          subtext="Fulfilled prescriptions"
          variant="emerald"
        />
      </div>

      {/* Two Column Section: Queue & Alerts on Left, Activity & Profile on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prescription Queue Preview */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                Active Prescription Queue
              </h3>
              <Link
                href="/pharmacy/prescriptions"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
              >
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <PrescriptionQueuePreview
              prescriptions={summary?.prescriptionQueuePreview || []}
            />
          </div>

          {/* Inventory Critical Alerts */}
          <InventoryAlertsCard alerts={summary?.inventoryAlerts || []} />
        </div>

        {/* Right Column (1 Col wide on desktop) */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Quick Shortcuts
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      Record Batch Intake
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Log new stock into inventory
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <Link
                href="/pharmacy/inventory"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      Inventory Catalog
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Search and filter all medicine stock
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/pharmacy/orders"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      Manage Orders
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Pickup and home delivery orders
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Recent Audit / Dispensation Activity */}
          <RecentActivityList activities={summary?.recentActivity || []} />

          {/* Statutory Registration Card */}
          <div className="bg-slate-900 rounded-xl p-5 text-white shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-sky-400">
              <Building2 className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Statutory License Info
              </span>
            </div>
            <div className="text-xs text-slate-300 space-y-1.5 mt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Drug License:</span>
                <span className="font-mono text-white">
                  {profile?.pharmacyLicenseNumber || 'DL-PENDING'}
                </span>
              </div>
              {profile?.gstin && (
                <div className="flex justify-between">
                  <span className="text-slate-400">GSTIN:</span>
                  <span className="font-mono text-white">{profile.gstin}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Operational:</span>
                <span className="text-white">
                  {profile?.is24Hours
                    ? '24 Hours Open'
                    : `${profile?.openingTime || '09:00'} - ${profile?.closingTime || '21:00'}`}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Compliant with CDSCO</span>
              <Link
                href="/pharmacy/profile"
                className="text-sky-400 hover:text-sky-300 underline"
              >
                Manage Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal to add inventory batch */}
      <CreateInventoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
