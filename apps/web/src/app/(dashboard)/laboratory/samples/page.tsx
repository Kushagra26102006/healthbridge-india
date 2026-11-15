'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  useLabSamples,
} from '@/features/laboratory/hooks/use-laboratory';
import {
  LabSampleStatusBadge,
  SpecimenTypeBadge,
  PrintableSampleLabelModal,
  AccessionSampleModal,
} from '@/components/laboratory';
import {
  FlaskConical,
  Search,
  Plus,
  Scan,
  Printer,
  PackageCheck,
  Eye,
} from 'lucide-react';
import type { LabSampleStatus, SpecimenType } from '@healthbridge/shared-types';

const SAMPLE_STATUS_TABS: { key: string; label: string }[] = [
  { key: '', label: 'All Samples' },
  { key: 'COLLECTION_PENDING', label: 'Pending Collection' },
  { key: 'COLLECTED', label: 'Collected' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'RECEIVED', label: 'Received' },
  { key: 'ACCESSIONED', label: 'Accessioned' },
  { key: 'REJECTED', label: 'Rejected' },
];

export default function LaboratorySamplesPage() {
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [specimenFilter, setSpecimenFilter] = useState('');

  // Selected sample for modals
  const [labelModalSampleId, setLabelModalSampleId] = useState<string | null>(null);
  const [accessionBarcode, setAccessionBarcode] = useState<string | null>(null);

  const { data: samples, isLoading, refetch } = useLabSamples({
    status: (activeTab as LabSampleStatus) || undefined,
    specimenType: (specimenFilter as SpecimenType) || undefined,
    search: search.trim() || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FlaskConical className="w-6 h-6 text-teal-600" />
            Specimen Management & Accessioning
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track multi-specimen collections, print barcode labels, perform pre-analytical checks, and accession samples
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/laboratory/samples/scan"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-slate-800 transition-colors"
          >
            <Scan className="w-4 h-4 text-teal-400" />
            Barcode Scan Station
          </Link>
          <Link
            href="/laboratory/samples/collect"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Collect Sample
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border">
        {SAMPLE_STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-card text-teal-600 dark:text-teal-400 border-t-2 border-teal-500 border-x border-border shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by sample number, barcode, or patient name..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-muted/40 border border-border focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={specimenFilter}
            onChange={(e) => setSpecimenFilter(e.target.value)}
            className="text-xs rounded-xl bg-background border border-border px-3 py-2 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Specimen Types</option>
            <option value="BLOOD">BLOOD</option>
            <option value="SERUM">SERUM</option>
            <option value="PLASMA">PLASMA</option>
            <option value="URINE">URINE</option>
            <option value="STOOL">STOOL</option>
            <option value="SWAB">SWAB</option>
            <option value="SPUTUM">SPUTUM</option>
            <option value="CSF">CSF</option>
            <option value="BIOPSY">BIOPSY</option>
          </select>
        </div>
      </div>

      {/* Samples Table */}
      <div className="rounded-2xl bg-card border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-muted-foreground">
              Loading specimen repository...
            </div>
          ) : !samples || samples.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <FlaskConical className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">
                No specimen records found matching the criteria.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                <tr>
                  <th className="py-3 px-4">Sample Ref #</th>
                  <th className="py-3 px-4">Barcode</th>
                  <th className="py-3 px-4">Specimen</th>
                  <th className="py-3 px-4">Associated Tests</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Center / Location</th>
                  <th className="py-3 px-4">Collected At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {samples.map((sample) => (
                  <tr key={sample.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {sample.sampleNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-teal-600 dark:text-teal-400">
                      {sample.barcode}
                    </td>
                    <td className="py-3.5 px-4">
                      <SpecimenTypeBadge specimenType={sample.specimenType} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-foreground font-mono block">
                        {sample.testCodes?.join(', ') || 'N/A'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Order #{sample.orderNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <LabSampleStatusBadge status={sample.status} />
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {sample.collectionCenterName || 'Main Laboratory'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {sample.collectedAt
                        ? new Date(sample.collectedAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setLabelModalSampleId(sample.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-teal-600 hover:bg-muted transition-colors"
                          title="Print Barcode Tag"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {sample.status !== 'ACCESSIONED' &&
                          sample.status !== 'REJECTED' &&
                          sample.status !== 'COMPLETED' && (
                            <button
                              onClick={() => setAccessionBarcode(sample.barcode)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-muted transition-colors"
                              title="Accession Sample"
                            >
                              <PackageCheck className="w-4 h-4" />
                            </button>
                          )}
                        <Link
                          href={`/laboratory/samples/${sample.id}`}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="View Sample Details & Timeline"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {labelModalSampleId && (
        <PrintableSampleLabelModal
          sampleId={labelModalSampleId}
          isOpen={true}
          onClose={() => setLabelModalSampleId(null)}
        />
      )}

      {accessionBarcode && (
        <AccessionSampleModal
          initialBarcode={accessionBarcode}
          isOpen={true}
          onClose={() => setAccessionBarcode(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
