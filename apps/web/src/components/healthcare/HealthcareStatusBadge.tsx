import * as React from 'react';
import { Badge, type BadgeProps } from '@/components/ui/badge';

export type HealthcareStatusValue = string;

interface StatusMeta {
  label: string;
  variant: NonNullable<BadgeProps['variant']>;
  dot?: boolean;
}

const STATUS_MAP: Record<string, StatusMeta> = {
  // Verification & Identity
  VERIFIED: { label: 'Verified', variant: 'success', dot: true },
  ACTIVE: { label: 'Active', variant: 'success', dot: true },
  GRANTED: { label: 'Granted', variant: 'success', dot: true },
  APPROVED: { label: 'Approved', variant: 'success', dot: true },
  CONFIRMED: { label: 'Confirmed', variant: 'success', dot: true },
  COMPLETED: { label: 'Completed', variant: 'success', dot: true },
  PUBLISHED: { label: 'Published', variant: 'success', dot: true },
  DISPENSED: { label: 'Dispensed', variant: 'success', dot: true },
  IN_STOCK: { label: 'In Stock', variant: 'success', dot: true },
  NORMAL: { label: 'Normal', variant: 'success', dot: true },

  // Scheduled / In-Progress / Info
  SCHEDULED: { label: 'Scheduled', variant: 'info', dot: true },
  CHECKED_IN: { label: 'Checked In', variant: 'teal', dot: true },
  IN_PROGRESS: { label: 'In Progress', variant: 'teal', dot: true },
  PROCESSING: { label: 'Processing', variant: 'info', dot: true },
  DISPATCHED: { label: 'Dispatched', variant: 'info', dot: true },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', variant: 'teal', dot: true },
  GENERATED: { label: 'Generated', variant: 'info', dot: true },
  UNDER_REVIEW: { label: 'Under Review', variant: 'info', dot: true },
  AMENDED: { label: 'Amended', variant: 'info', dot: true },
  PRELIMINARY: { label: 'Preliminary', variant: 'info', dot: true },
  ACCEPTED: { label: 'Accepted', variant: 'info', dot: true },

  // Pending / Warnings
  PENDING: { label: 'Pending', variant: 'warning', dot: true },
  PENDING_VERIFICATION: { label: 'Pending Verification', variant: 'warning', dot: true },
  PENDING_REVIEW: { label: 'Pending Review', variant: 'warning', dot: true },
  VERIFICATION_IN_PROGRESS: { label: 'Verifying', variant: 'warning', dot: true },
  REQUESTED: { label: 'Requested', variant: 'warning', dot: true },
  PARTIALLY_FULFILLED: { label: 'Partially Fulfilled', variant: 'warning', dot: true },
  LOW_STOCK: { label: 'Low Stock', variant: 'warning', dot: true },
  NEAR_EXPIRY: { label: 'Near Expiry', variant: 'warning', dot: true },
  ABOVE_RANGE: { label: 'Above Range', variant: 'warning', dot: true },
  BELOW_RANGE: { label: 'Below Range', variant: 'warning', dot: true },
  ABNORMAL: { label: 'Abnormal', variant: 'warning', dot: true },

  // Critical / Errors / Revoked
  CRITICAL: { label: 'Critical', variant: 'error', dot: true },
  REJECTED: { label: 'Rejected', variant: 'error', dot: true },
  DENIED: { label: 'Denied', variant: 'error', dot: true },
  REVOKED: { label: 'Revoked', variant: 'error', dot: true },
  REVOKED_OR_UNLINKED: { label: 'Revoked / Unlinked', variant: 'error', dot: true },
  CANCELLED: { label: 'Cancelled', variant: 'error', dot: true },
  EXPIRED: { label: 'Expired', variant: 'error', dot: true },
  FAILED: { label: 'Failed', variant: 'error', dot: true },
  VERIFICATION_FAILED: { label: 'Verification Failed', variant: 'error', dot: true },
  OUT_OF_STOCK: { label: 'Out of Stock', variant: 'error', dot: true },
  QUARANTINED: { label: 'Quarantined', variant: 'error', dot: true },
  NO_SHOW: { label: 'No Show', variant: 'error', dot: true },

  // Neutral / Draft
  DRAFT: { label: 'Draft', variant: 'neutral', dot: false },
  NOT_LINKED: { label: 'Not Linked', variant: 'neutral', dot: false },
  UNLINKED: { label: 'Unlinked', variant: 'neutral', dot: false },
  DISCONTINUED: { label: 'Discontinued', variant: 'neutral', dot: false },
  NOT_AVAILABLE: { label: 'Not Available', variant: 'neutral', dot: false },
};

function formatFallbackStatus(status: string): string {
  return status
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export interface HealthcareStatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: HealthcareStatusValue;
  labelOverride?: string;
}

export function HealthcareStatusBadge({
  status,
  labelOverride,
  dot,
  ...props
}: HealthcareStatusBadgeProps) {
  const normalized = String(status || '').trim().toUpperCase();
  const meta = STATUS_MAP[normalized] ?? {
    label: formatFallbackStatus(normalized || 'Unknown'),
    variant: 'neutral' as const,
    dot: false,
  };

  return (
    <Badge variant={meta.variant} dot={dot ?? meta.dot} {...props}>
      {labelOverride ?? meta.label}
    </Badge>
  );
}
