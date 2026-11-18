'use client';

import React, { useState } from 'react';
import { m } from 'framer-motion';
import {
  ShieldCheck,
  FileText,
  Pill,
  Lock,
  Calendar,
  Building2,
  CheckCircle2,
  FlaskConical,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { TiltCard } from '@/components/motion/TiltCard';
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion/tokens';
import { cn } from '@/lib/utils';

type PreviewTab = 'overview' | 'records' | 'consent';

/**
 * Interactive Health Dashboard Preview for the public landing page.
 * Strictly labeled as illustrative sample data — never displays real patient data.
 */
export function AbhaPreviewCard() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('overview');

  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      {/* Subtle Ambient Glows */}
      <div
        aria-hidden="true"
        className="absolute -top-6 -left-6 w-48 h-48 bg-secondary/15 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-8 -right-8 w-56 h-56 bg-primary/15 rounded-full blur-3xl pointer-events-none"
      />

      {/* Main Layered Glass Preview Shell with Subtle Desktop 3D Tilt */}
      <TiltCard maxTilt={3.5}>
        <div className="glass-panel relative rounded-xl p-5 sm:p-6 shadow-lg transition-shadow duration-200 hover:shadow-dialog space-y-5">
        {/* Top Bar: Window Chrome + Explicit Sample Data Disclosure */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/80">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-pill bg-border" />
              <span className="h-2.5 w-2.5 rounded-pill bg-border" />
              <span className="h-2.5 w-2.5 rounded-pill bg-border" />
            </span>
            <span className="text-xs font-semibold text-foreground">
              Patient Health Workspace
            </span>
          </div>

          <Badge variant="info" size="sm">
            Illustrative Sample Data
          </Badge>
        </div>

        {/* Interactive Preview Tabs */}
        <div
          role="tablist"
          aria-label="Dashboard preview views"
          className="grid grid-cols-3 gap-1 rounded-md bg-muted/80 p-1 border border-border/70"
        >
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'records', label: 'Records & Rx' },
              { id: 'consent', label: 'Consent' },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'rounded-sm px-2.5 py-1.5 text-xs font-medium transition-all duration-150 focus-ring',
                  active
                    ? 'bg-surface text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <m.div
            key="overview"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.standard }}
            className="space-y-4"
          >
            {/* Compact KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-md border border-border bg-surface p-3 shadow-xs">
                <p className="text-[11px] text-muted-foreground font-medium">Records</p>
                <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">12</p>
              </div>
              <div className="rounded-md border border-border bg-surface p-3 shadow-xs">
                <p className="text-[11px] text-muted-foreground font-medium">Appointments</p>
                <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">2</p>
              </div>
              <div className="rounded-md border border-border bg-surface p-3 shadow-xs">
                <p className="text-[11px] text-muted-foreground font-medium">Active Rx</p>
                <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">3</p>
              </div>
              <div className="rounded-md border border-border bg-surface p-3 shadow-xs">
                <p className="text-[11px] text-muted-foreground font-medium">Providers</p>
                <p className="text-lg font-bold text-secondary tabular-nums mt-0.5">4</p>
              </div>
            </div>

            {/* Upcoming Appointment Sample Card */}
            <div className="rounded-md border border-border bg-surface p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>Upcoming Consultation (Sample)</span>
                </span>
                <Badge variant="success" size="sm" dot>
                  Confirmed
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <div>
                  <p className="font-medium text-foreground">Dr. Sample Clinician • Cardiology</p>
                  <p className="text-muted-foreground">City Care Multi-Speciality • Teleconsult</p>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                  10:30 AM
                </span>
              </div>
            </div>

            {/* Active Consent Summary */}
            <div className="rounded-md border border-secondary/30 bg-secondary/[0.06] dark:bg-secondary/10 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      Scoped Consent Active (Sample)
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Diagnostic &amp; Rx Access • Expires in 14 days
                    </p>
                  </div>
                </div>
                <StatusIndicator status="verified" label="Revocable" size="sm" />
              </div>
            </div>
          </m.div>
        )}

        {/* Tab 2: Records & Prescriptions */}
        {activeTab === 'records' && (
          <m.div
            key="records"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.standard }}
            className="space-y-2.5"
          >
            <div className="flex items-center justify-between p-3 rounded-md bg-surface border border-border shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FlaskConical className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    Complete Blood Count (Sample Lab)
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    NABL-Aligned Diagnostic Center
                  </p>
                </div>
              </div>
              <Badge variant="success" size="sm">
                Published
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-surface border border-border shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <Pill className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    Digital Prescription #RX-SAMPLE-04
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    2 Medications • Pharmacy Ready
                  </p>
                </div>
              </div>
              <Badge variant="teal" size="sm">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-surface border border-border shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-muted text-foreground flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    OP Consultation Summary (Sample)
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Connected Clinic Network
                  </p>
                </div>
              </div>
              <Badge variant="neutral" size="sm">
                Archived
              </Badge>
            </div>
          </m.div>
        )}

        {/* Tab 3: Consent Status */}
        {activeTab === 'consent' && (
          <m.div
            key="consent"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.standard }}
            className="space-y-3"
          >
            <div className="rounded-md border border-border bg-surface p-3.5 shadow-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-secondary" aria-hidden="true" />
                  <span>Consent Artefact (Illustrative)</span>
                </span>
                <Badge variant="success" size="sm" dot>
                  Granted
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Purpose: Care Management • Scope: Diagnostic Reports &amp; Prescriptions
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/70">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sample Hospital HIP/HIU</span>
                </span>
                <span className="inline-flex items-center gap-1 text-secondary font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Time-Delimited</span>
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              All sample entries above illustrate the interface layout. Actual records appear only
              after account sign-in and verified provider linking.
            </p>
          </m.div>
        )}
        </div>
      </TiltCard>
    </div>
  );
}

export default AbhaPreviewCard;
