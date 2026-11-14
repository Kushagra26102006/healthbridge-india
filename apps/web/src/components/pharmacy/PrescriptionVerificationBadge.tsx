'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PrescriptionVerificationBadgeProps {
  status?: string;
  isEligible?: boolean;
  className?: string;
  showIcon?: boolean;
}

export function PrescriptionVerificationBadge({
  status = 'PENDING',
  isEligible = true,
  className,
  showIcon = true,
}: PrescriptionVerificationBadgeProps) {
  const normalized = status.toUpperCase();

  if (normalized === 'VERIFIED' && isEligible) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 font-medium px-2.5 py-0.5',
          className
        )}
      >
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
        Verified & Eligible
      </Badge>
    );
  }

  if (normalized === 'PARTIALLY_DISPENSED') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-amber-50 text-amber-700 border-amber-200 gap-1.5 font-medium px-2.5 py-0.5',
          className
        )}
      >
        {showIcon && <Clock className="w-3.5 h-3.5 text-amber-600" />}
        Partially Dispensed
      </Badge>
    );
  }

  if (
    normalized === 'FULLY_DISPENSED' ||
    normalized === 'ALREADY_DISPENSED' ||
    normalized === 'DISPENSED'
  ) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-blue-50 text-blue-700 border-blue-200 gap-1.5 font-medium px-2.5 py-0.5',
          className
        )}
      >
        {showIcon && <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
        Fully Dispensed
      </Badge>
    );
  }

  if (normalized === 'EXPIRED') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-rose-50 text-rose-700 border-rose-200 gap-1.5 font-medium px-2.5 py-0.5',
          className
        )}
      >
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
        Prescription Expired
      </Badge>
    );
  }

  if (normalized === 'REVOKED' || normalized === 'CANCELLED') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-slate-100 text-slate-700 border-slate-300 gap-1.5 font-medium px-2.5 py-0.5',
          className
        )}
      >
        {showIcon && <Ban className="w-3.5 h-3.5 text-slate-500" />}
        Cancelled / Revoked
      </Badge>
    );
  }

  if (normalized === 'REJECTED' || !isEligible) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'bg-red-50 text-red-700 border-red-200 gap-1.5 font-medium px-2.5 py-0.5',
          className
        )}
      >
        {showIcon && <XCircle className="w-3.5 h-3.5 text-red-600" />}
        Ineligible / Rejected
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-slate-50 text-slate-600 border-slate-200 gap-1.5 font-medium px-2.5 py-0.5',
        className
      )}
    >
      {showIcon && <Clock className="w-3.5 h-3.5 text-slate-500" />}
      Pending Verification
    </Badge>
  );
}

export default PrescriptionVerificationBadge;
