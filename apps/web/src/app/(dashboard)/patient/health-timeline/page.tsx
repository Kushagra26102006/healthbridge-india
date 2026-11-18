'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Search,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type {
  PatientTimelineResponseDto,
  UnifiedTimelineEventType,
  UnifiedTimelineSourceModule,
} from '@healthbridge/shared-types';
import { platformApi } from '@/features/platform/api/platform-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const MODULE_OPTIONS: Array<{ value: '' | UnifiedTimelineSourceModule; label: string }> = [
  { value: '', label: 'All Modules' },
  { value: 'APPOINTMENTS', label: 'Appointments' },
  { value: 'ENCOUNTERS', label: 'Clinical Encounters' },
  { value: 'PRESCRIPTIONS', label: 'Prescriptions' },
  { value: 'PHARMACY', label: 'Pharmacy Dispensing' },
  { value: 'LABORATORY', label: 'Laboratory' },
  { value: 'RECORDS', label: 'Medical Documents' },
  { value: 'CONSENT', label: 'Consent' },
  { value: 'ABDM', label: 'ABDM External' },
];

const EVENT_TYPE_OPTIONS: Array<{ value: '' | UnifiedTimelineEventType; label: string }> = [
  { value: '', label: 'All Event Types' },
  { value: 'APPOINTMENT_BOOKED', label: 'Appointment Booked' },
  { value: 'APPOINTMENT_COMPLETED', label: 'Appointment Completed' },
  { value: 'CLINICAL_ENCOUNTER', label: 'Clinical Encounter' },
  { value: 'DIAGNOSIS_RECORDED', label: 'Diagnosis Recorded' },
  { value: 'PRESCRIPTION_ISSUED', label: 'Prescription Issued' },
  { value: 'PRESCRIPTION_DISPENSED', label: 'Prescription Dispensed' },
  { value: 'LAB_ORDER_CREATED', label: 'Lab Order Created' },
  { value: 'SAMPLE_COLLECTED', label: 'Sample Collected' },
  { value: 'LAB_REPORT_PUBLISHED', label: 'Lab Report Published' },
  { value: 'LAB_REPORT_AMENDED', label: 'Lab Report Amended' },
  { value: 'DOCUMENT_UPLOADED', label: 'Document Uploaded' },
  { value: 'CONSENT_GRANTED', label: 'Consent Granted' },
  { value: 'CONSENT_REVOKED', label: 'Consent Revoked' },
  { value: 'EXTERNAL_RECORD_IMPORTED', label: 'ABDM External Record Imported' },
];

export default function PatientHealthTimelinePage() {
  const [timeline, setTimeline] = useState<PatientTimelineResponseDto | null>(null);
  const [page, setPage] = useState(1);
  const [sourceModule, setSourceModule] = useState<'' | UnifiedTimelineSourceModule>('');
  const [eventType, setEventType] = useState<'' | UnifiedTimelineEventType>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await platformApi.getPatientTimeline({
        page,
        limit: 15,
        sourceModule: sourceModule || undefined,
        eventType: eventType || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        search: search.trim() || undefined,
      });
      setTimeline(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load your unified health timeline.');
    } finally {
      setLoading(false);
    }
  }, [page, sourceModule, eventType, fromDate, toDate, search]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-6 w-6 text-teal-600" />
            Unified Health Record Timeline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chronological view of your appointments, finalized clinical encounters, prescriptions, pharmacy dispensing, published lab reports, consents, and authorized ABDM imports.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadTimeline} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filter &amp; Search Timeline
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search title, facility, ref..."
              className="w-full rounded-md border bg-background pl-9 pr-3 py-1.5 text-sm"
            />
          </div>
          <select
            aria-label="Filter by source module"
            value={sourceModule}
            onChange={(e) => {
              setPage(1);
              setSourceModule(e.target.value as '' | UnifiedTimelineSourceModule);
            }}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            {MODULE_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by event type"
            value={eventType}
            onChange={(e) => {
              setPage(1);
              setEventType(e.target.value as '' | UnifiedTimelineEventType);
            }}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            aria-label="From date"
            value={fromDate}
            onChange={(e) => {
              setPage(1);
              setFromDate(e.target.value);
            }}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
          <input
            type="date"
            aria-label="To date"
            value={toDate}
            onChange={(e) => {
              setPage(1);
              setToDate(e.target.value);
            }}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          Loading chronological health timeline...
        </div>
      ) : !timeline || timeline.items.length === 0 ? (
        <div className="rounded-xl border p-10 text-center space-y-2">
          <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="font-medium">No Matching Timeline Events</p>
          <p className="text-sm text-muted-foreground">
            Only finalized, published, and authorized clinical activity appears here. Draft notes and unapproved lab reports remain hidden.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {timeline.items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {item.sourceModule}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {item.status}
                    </Badge>
                    {item.provenance.origin === 'ABDM_EXTERNAL_IMPORT' && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-none text-[10px]">
                        ABDM EXTERNAL
                      </Badge>
                    )}
                    {item.provenance.isMocked && (
                      <Badge className="bg-purple-100 text-purple-800 border-none text-[10px]">
                        MOCKED
                      </Badge>
                    )}
                    {item.provenance.isAmended && (
                      <Badge className="bg-amber-100 text-amber-800 border-none text-[10px]">
                        AMENDED
                      </Badge>
                    )}
                  </div>
                  <h2 className="font-semibold text-sm">{item.title}</h2>
                  <p className="text-xs text-muted-foreground">{item.summary}</p>
                  <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 pt-1">
                    <span>{new Date(item.occurredAt).toLocaleString()}</span>
                    {item.provenance.sourceOrganization && (
                      <span>Source: {item.provenance.sourceOrganization}</span>
                    )}
                    {item.provenance.actorName && <span>By: {item.provenance.actorName}</span>}
                    {item.recordReference.referenceNumber && (
                      <span className="font-mono">Ref: {item.recordReference.referenceNumber}</span>
                    )}
                  </div>
                </div>

                {item.authorizedAction && (
                  <Link href={item.authorizedAction.href} className="shrink-0">
                    <Button size="sm" variant="outline">
                      {item.authorizedAction.label}
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Server-side Pagination */}
          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
            <span>
              Page {timeline.pagination.page} of {timeline.pagination.totalPages} ({timeline.pagination.total} total events)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!timeline.pagination.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!timeline.pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
