'use client';

import * as React from 'react';
import { ShieldCheck, Copy, Check, MapPin, Calendar, UserCheck } from 'lucide-react';
import type { AbhaProfile, AbhaVerificationStatus } from '@healthbridge/shared-types';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HealthcareStatusBadge } from './HealthcareStatusBadge';
import { useInteractionPreferences } from '@/lib/motion/preferences';
import { cn } from '@/lib/utils';

export interface AbhaIdentityCardProps {
  profile?: Partial<AbhaProfile> | null;
  verificationStatus?: AbhaVerificationStatus;
  masked?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

function formatAbhaNumber(value?: string, masked?: boolean): string {
  if (!value) return 'Not linked';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 14) {
    if (masked) {
      return `XX-XXXX-XXXX-${digits.slice(10)}`;
    }
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10)}`;
  }
  return value;
}

export function AbhaIdentityCard({
  profile,
  verificationStatus,
  masked = false,
  actions,
  className,
}: AbhaIdentityCardProps) {
  const [copied, setCopied] = React.useState(false);
  const { triggerFeedback } = useInteractionPreferences();

  const status: AbhaVerificationStatus =
    verificationStatus ?? (profile?.isKycVerified ? 'VERIFIED' : profile?.abhaNumber ? 'PENDING_VERIFICATION' : 'NOT_LINKED');

  const handleCopy = async () => {
    const target = profile?.abhaAddress || profile?.abhaNumber;
    if (!target || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      triggerFeedback('copy');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      triggerFeedback('error');
    }
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Subtle ABDM tricolor hairline */}
      <div
        aria-hidden="true"
        className="h-1 w-full bg-gradient-to-r from-brand-indiaOrange via-brand-blue to-brand-indiaGreen"
      />

      <div className="p-5 sm:p-6 flex flex-col gap-5">
        {/* Top Row: Identity Badge + Verification Status */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-secondary shrink-0" aria-hidden="true" />
            <span>Ayushman Bharat Health Account (ABHA)</span>
          </div>
          <HealthcareStatusBadge status={status} size="sm" />
        </div>

        {/* Holder Row */}
        <div className="flex items-start gap-4">
          <Avatar
            src={profile?.kycPhotoUrl}
            name={profile?.fullName}
            size="lg"
            status={status === 'VERIFIED' ? 'verified' : undefined}
          />
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <h3 className="text-card-heading truncate">
              {profile?.fullName || 'ABHA Account Not Linked'}
            </h3>
            {profile?.abhaAddress && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-xs sm:text-sm font-medium text-primary break-all">
                  {profile.abhaAddress}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCopy}
                  aria-label="Copy ABHA address"
                  className="h-6 w-6"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  )}
                </Button>
              </div>
            )}
            <p className="font-mono text-xs text-muted-foreground tracking-wider">
              ABHA No: <span className="text-foreground font-medium">{formatAbhaNumber(profile?.abhaNumber, masked)}</span>
            </p>
          </div>
        </div>

        {/* Metadata Grid */}
        {(profile?.dateOfBirth || profile?.gender || profile?.address?.state) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/80 text-xs">
            {profile?.dateOfBirth && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  DOB: <strong className="font-medium text-foreground">{profile.dateOfBirth}</strong>
                </span>
              </div>
            )}
            {profile?.gender && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  Gender:{' '}
                  <strong className="font-medium text-foreground">
                    {profile.gender === 'M' ? 'Male' : profile.gender === 'F' ? 'Female' : 'Other'}
                  </strong>
                </span>
              </div>
            )}
            {profile?.address?.state && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  <strong className="font-medium text-foreground">
                    {[profile.address.district, profile.address.state].filter(Boolean).join(', ')}
                  </strong>
                </span>
              </div>
            )}
          </div>
        )}

        {actions && <div className="flex flex-wrap items-center gap-2 pt-1">{actions}</div>}
      </div>
    </Card>
  );
}
