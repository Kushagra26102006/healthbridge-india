'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Plus,
  RefreshCw,
  Phone,
  Calendar,
  KeyRound,
  FileText,
  History,
  Pill,
  TestTube,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PatientAccessStatus } from './PatientAccessStatus';
import { ConsentRequestDialog } from './ConsentRequestDialog';
import { cn } from '@/lib/utils';
import type { DoctorPatientProfileOverviewDto } from '@healthbridge/shared-types';

interface PatientProfileHeaderProps {
  overview: DoctorPatientProfileOverviewDto;
  onRefresh?: () => void;
}

export const PatientProfileHeader: React.FC<PatientProfileHeaderProps> = ({
  overview,
  onRefresh,
}) => {
  const pathname = usePathname();
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);

  const { patient, accessStatus, accessDetails } = overview;
  const patientId = patient.id;

  const navTabs = [
    { label: 'Clinical Overview', href: `/doctor/patients/${patientId}`, icon: User },
    { label: 'Timeline History', href: `/doctor/patients/${patientId}/history`, icon: History },
    { label: 'Medical Records', href: `/doctor/patients/${patientId}/records`, icon: FileText },
    { label: 'Consultations', href: `/doctor/patients/${patientId}/encounters`, icon: Calendar },
    { label: 'Prescriptions', href: `/doctor/patients/${patientId}/prescriptions`, icon: Pill },
    { label: 'Lab Reports', href: `/doctor/patients/${patientId}/lab-reports`, icon: TestTube },
  ];

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Action CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
            <Link href="/doctor/patients">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              All Patients
            </Link>
          </Button>

          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <User className="h-6 w-6 text-teal-600" />
              {patient.name}
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Ref: {patient.patientReference}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 h-8"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          )}

          <Button
            onClick={() => setConsentDialogOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-8 text-amber-600 border-amber-500/40 hover:bg-amber-50/50"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Request Consent
          </Button>

          <Button asChild size="sm" variant="outline" className="text-xs gap-1.5 h-8">
            <Link href={`/doctor/prescriptions/new?patientId=${patientId}`}>
              <Pill className="h-3.5 w-3.5 text-teal-600" />
              Prescribe
            </Link>
          </Button>

          <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 h-8 shadow-xs">
            <Link href={`/doctor/encounters/new?patientId=${patientId}`}>
              <Plus className="h-3.5 w-3.5" />
              New Encounter
            </Link>
          </Button>
        </div>
      </div>

      {/* Demographics Summary Card */}
      <Card className="border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
              Age & Gender
            </span>
            <span className="font-bold text-foreground block">
              {[patient.gender, patient.age ? `${patient.age} years` : undefined].filter(Boolean).join(' • ') || 'Unspecified'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
              Blood Group
            </span>
            <span className="font-bold text-rose-600 block">
              {patient.bloodGroup || 'Not tested'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
              Contact Phone
            </span>
            <span className="font-mono text-foreground flex items-center gap-1 block truncate">
              <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
              {patient.phone || 'Protected'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
              ABHA Address
            </span>
            <span className="font-mono text-emerald-600 flex items-center gap-1 block truncate">
              <ShieldCheck className="h-3 w-3 shrink-0" />
              {patient.abhaAddress || 'Not linked'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
              Access Status
            </span>
            <div className="mt-0.5">
              <PatientAccessStatus status={accessStatus} compact />
            </div>
          </div>
        </div>
      </Card>

      {/* Access Status Banner (if restricted or has notes) */}
      <PatientAccessStatus
        status={accessStatus}
        expiresAt={accessDetails?.expiresAt}
        reason={accessDetails?.reason}
        onRequestConsent={() => setConsentDialogOpen(true)}
      />

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60">
        {navTabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap border-b-2',
                isActive
                  ? 'border-teal-600 text-teal-600 bg-teal-50/50 dark:bg-teal-950/20'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Consent Request Modal Dialog */}
      <ConsentRequestDialog
        patientId={patientId}
        patientName={patient.name}
        isOpen={consentDialogOpen}
        onClose={() => setConsentDialogOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
};
