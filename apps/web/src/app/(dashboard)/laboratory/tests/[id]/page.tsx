'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLabTestDetail } from '@/features/laboratory/hooks/use-laboratory';
import { SpecimenTypeBadge } from '@/components/laboratory';
import {
  ArrowLeft,
  Clock,
  Layers,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function LabTestDetailPage() {
  const params = useParams();
  const testId = params.id as string;

  const { data: test, isLoading, error } = useLabTestDetail(testId);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-muted-foreground">
        Loading diagnostic test specifications...
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border border-destructive/20 my-6 shadow-xs max-w-lg mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-foreground mb-1">
          Test Specification Not Found
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          The requested diagnostic test profile does not exist or has been archived.
        </p>
        <Link
          href="/laboratory/tests"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/laboratory/tests"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {test.testName}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  test.isActive
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {test.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Code: <span className="text-teal-600 font-bold">{test.testCode}</span> • Category: {test.category}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-muted-foreground block">Test Fee</span>
          <span className="text-xl font-extrabold font-mono text-foreground">
            ₹{test.price.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Specimen Type
          </span>
          <SpecimenTypeBadge specimenType={test.specimenType} />
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Fasting Requirement
          </span>
          {test.fastingRequirement ? (
            <span className="text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {test.fastingDurationHours
                ? `${test.fastingDurationHours} Hours Required`
                : 'Fasting Required'}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs font-medium">None (Non-Fasting)</span>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Turnaround Time
          </span>
          <span className="text-xs font-mono font-bold text-foreground">
            {test.expectedTurnaroundTime}
          </span>
        </div>
      </div>

      {/* Pre-Analytical Handling */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-600" />
          Pre-Analytical Handling & Instructions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-foreground block mb-1">
              Container / Tube Specifications
            </span>
            <p className="text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border">
              {test.containerRequirements || 'Standard sterile diagnostic container.'}
            </p>
          </div>
          <div>
            <span className="font-semibold text-foreground block mb-1">
              Patient Preparation Instructions
            </span>
            <p className="text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border">
              {test.preparationInstructions || 'No special patient preparation instructions required.'}
            </p>
          </div>
        </div>

        {test.description && (
          <div className="text-xs">
            <span className="font-semibold text-foreground block mb-1">
              Clinical Indications
            </span>
            <p className="text-muted-foreground">{test.description}</p>
          </div>
        )}
      </div>

      {/* Parameters & Reference Ranges */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-600" />
          Test Parameters & Biomarkers ({test.parameters?.length || 0})
        </h2>

        {!test.parameters || test.parameters.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No individual parameter breakdown defined. Overall diagnostic report applies.
          </p>
        ) : (
          <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden">
            {test.parameters.map((param) => (
              <div key={param.parameterCode} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {param.parameterName}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-teal-600 font-semibold">
                      {param.parameterCode}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    Type: <span className="font-medium text-foreground">{param.dataType}</span>
                    {param.unit && ` • Unit: ${param.unit}`}
                  </span>
                </div>

                <div className="text-right">
                  {param.referenceRanges && param.referenceRanges.length > 0 && param.referenceRanges[0] ? (
                    <div className="text-[11px] font-mono text-muted-foreground">
                      Ref: {param.referenceRanges[0].normalMin ?? '—'} -{' '}
                      {param.referenceRanges[0].normalMax ?? '—'} {param.unit}
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">
                      Standard Reference
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
