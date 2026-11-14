'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PatientAccessStatus as StatusType } from '@healthbridge/shared-types';

interface PatientAccessStatusProps {
  status: StatusType;
  expiresAt?: string;
  reason?: string;
  onRequestConsent?: () => void;
  compact?: boolean;
  className?: string;
}

export const PatientAccessStatus: React.FC<PatientAccessStatusProps> = ({
  status,
  expiresAt,
  reason,
  onRequestConsent,
  compact = false,
  className = '',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'GRANTED':
      case 'ACTIVE_CONSENT':
        return {
          label: 'ABDM Consent Active',
          icon: ShieldCheck,
          badgeClass: 'border-emerald-500/40 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30',
          bannerClass: 'border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200',
          description: expiresAt
            ? `Authorized under active digital consent valid until ${new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`
            : 'Authorized under active digital consent artifact.',
          isAuthorized: true,
        };
      case 'ENCOUNTER_BOUND':
        return {
          label: 'Encounter Bound',
          icon: ShieldCheck,
          badgeClass: 'border-blue-500/40 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30',
          bannerClass: 'border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200',
          description: 'Access authorized through clinical encounter / appointment care relationship.',
          isAuthorized: true,
        };
      case 'ACCESS_EXPIRED':
        return {
          label: 'Consent Expired',
          icon: Clock,
          badgeClass: 'border-amber-500/40 text-amber-600 bg-amber-50/50 dark:bg-amber-950/30',
          bannerClass: 'border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200',
          description: 'Previous electronic consent has expired. Please request renewed patient consent to view clinical charts.',
          isAuthorized: false,
        };
      case 'ACCESS_REVOKED':
        return {
          label: 'Consent Revoked',
          icon: AlertTriangle,
          badgeClass: 'border-rose-500/40 text-rose-600 bg-rose-50/50 dark:bg-rose-950/30',
          bannerClass: 'border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20 text-rose-800 dark:text-rose-200',
          description: reason || 'Patient has explicitly revoked electronic data access permissions.',
          isAuthorized: false,
        };
      case 'CONSENT_REQUIRED':
      case 'ACCESS_RESTRICTED':
      default:
        return {
          label: 'Consent Required',
          icon: ShieldAlert,
          badgeClass: 'border-amber-500/40 text-amber-600 bg-amber-50/50 dark:bg-amber-950/30',
          bannerClass: 'border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200',
          description: 'You lack active electronic consent or an active appointment with this patient. Full clinical data remains protected.',
          isAuthorized: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <Badge variant="outline" className={cn('text-[10px] px-2 py-0 gap-1 font-semibold', config.badgeClass, className)}>
        <Icon className="h-3 w-3 shrink-0" />
        {config.label}
      </Badge>
    );
  }

  return (
    <div className={cn('rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs', config.bannerClass, className)}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight">{config.label}</span>
            <Badge variant="outline" className={cn('text-[10px] px-2 py-0', config.badgeClass)}>
              {status}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-xl">
            {config.description}
          </p>
        </div>
      </div>

      {!config.isAuthorized && onRequestConsent && (
        <Button
          onClick={onRequestConsent}
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 h-8 shrink-0 self-start sm:self-center shadow-xs"
        >
          <KeyRound className="h-3.5 w-3.5" />
          Request Patient Consent
        </Button>
      )}
    </div>
  );
};
