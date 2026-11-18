'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Pill,
  Search,
  Calendar,
  Download,
  RefreshCw,
  ShoppingBag,
  FileText,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { usePatientDashboard } from '@/features/patient/hooks/use-patient-dashboard';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Dialog, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { HealthcareStatusBadge } from '@/components/healthcare';
import { useInteractionPreferences } from '@/lib/motion/preferences';
import type { PatientDashboardSummaryDto } from '@healthbridge/shared-types';

type PrescriptionItem = PatientDashboardSummaryDto['recentPrescriptions'][number];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const { summary, isLoading, isError, error, refetch, isFetching } = usePatientDashboard();
  const { triggerFeedback } = useInteractionPreferences();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedRx, setSelectedRx] = useState<PrescriptionItem | null>(null);

  const prescriptions = useMemo(
    () => summary?.recentPrescriptions ?? [],
    [summary?.recentPrescriptions]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...prescriptions]
      .filter((rx) => {
        if (statusFilter !== 'ALL' && rx.status.toUpperCase() !== statusFilter) {
          return false;
        }
        if (!q) return true;
        return (
          rx.doctorName.toLowerCase().includes(q) ||
          rx.medicationsSummary.toLowerCase().includes(q) ||
          rx.status.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const diff = new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [prescriptions, searchQuery, statusFilter, sortOrder]);

  const handleDownloadSummary = (rx: PrescriptionItem) => {
    const lines = [
      'HEALTHBRIDGE INDIA — DIGITAL PRESCRIPTION SUMMARY',
      '=================================================',
      `Patient: ${user?.name || 'Authenticated Patient'}`,
      `Prescribing Doctor: ${rx.doctorName}`,
      `Issued Date: ${formatDate(rx.issuedAt)}`,
      `Status: ${rx.status}`,
      '',
      'Prescribed Medications & Instructions:',
      rx.medicationsSummary,
      '',
      'Note: Generated from your authenticated Patient Portal for personal reference.',
    ];
    try {
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${rx.id.slice(0, 8)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerFeedback('confirm');
    } catch {
      triggerFeedback('error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-page-heading flex items-center gap-2.5">
            <Pill className="h-6 w-6 text-primary" aria-hidden="true" />
            <span>Digital Prescriptions</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review electronic prescriptions issued during consultations and track pharmacy orders
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/patient/orders">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span>Pharmacy Orders</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <Alert
          variant="error"
          title="Unable to load prescriptions"
          description={error?.message || 'Please retry syncing your patient records.'}
        />
      )}

      {/* Search & Filter Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by doctor name or medication..."
              leftIcon={<Search className="h-4 w-4" />}
              aria-label="Search prescriptions"
            />
          </div>
          <div className="sm:col-span-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by prescription status"
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Completed', value: 'COMPLETED' },
                { label: 'Expired', value: 'EXPIRED' },
              ]}
            />
          </div>
          <div className="sm:col-span-3">
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              aria-label="Sort by date"
              options={[
                { label: 'Newest First', value: 'desc' },
                { label: 'Oldest First', value: 'asc' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Prescription List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Pill className="h-6 w-6" />}
          title={
            prescriptions.length === 0
              ? 'No Prescriptions Recorded Yet'
              : 'No Prescriptions Match Your Filters'
          }
          description={
            prescriptions.length === 0
              ? 'Electronic prescriptions issued by your doctor during a consultation will appear here automatically.'
              : 'Try clearing your search term or selecting a different status filter.'
          }
          action={
            prescriptions.length === 0 ? (
              <Button variant="primary" size="sm" asChild>
                <Link href="/patient/appointments/book">Book a Consultation</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
              >
                Reset Filters
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((rx) => (
            <Card key={rx.id} className="p-5 flex flex-col justify-between gap-4 hover-lift">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-card-heading truncate">{rx.doctorName}</h2>
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5 tabular-nums">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Issued {formatDate(rx.issuedAt)}</span>
                      </p>
                    </div>
                  </div>
                  <HealthcareStatusBadge status={rx.status} size="sm" />
                </div>

                <div className="rounded-md border border-border/80 bg-muted/35 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Medication Details &amp; Instructions
                  </p>
                  <p className="text-sm text-foreground mt-1 leading-relaxed">
                    {rx.medicationsSummary}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-border/70">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRx(rx)}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>View Details</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadSummary(rx)}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Download Summary</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Privacy & Data Source Notice */}
      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          Prescriptions displayed here are loaded from your authenticated patient summary. To
          review pharmacy dispensation receipts and pickup statuses, visit{' '}
          <Link href="/patient/orders" className="text-primary font-medium hover:underline">
            Pharmacy Orders
          </Link>
          .
        </p>
      </div>

      {/* Accessible Prescription Preview Modal */}
      <Dialog
        open={Boolean(selectedRx)}
        onClose={() => setSelectedRx(null)}
        title="Digital Prescription Summary"
        description={
          selectedRx
            ? `Issued by ${selectedRx.doctorName} on ${formatDate(selectedRx.issuedAt)}`
            : undefined
        }
        size="md"
      >
        {selectedRx && (
          <>
            <DialogBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <HealthcareStatusBadge status={selectedRx.status} />
              </div>

              <div className="rounded-md border border-border bg-muted/40 p-4 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Medications &amp; Dosage Summary
                </p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedRx.medicationsSummary}
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Follow the dosing schedule provided by your treating physician. Contact your clinic
                before modifying any prescription regimen.
              </p>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedRx(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownloadSummary(selectedRx)}
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Download Summary</span>
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
