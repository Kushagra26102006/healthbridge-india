/**
 * HealthBridge India — Narrowly Scoped Dashboard Cache Synchronization (Day 8 Task 04)
 *
 * Maps incoming real-time notification / `dashboard_sync` events to the EXACT TanStack Query
 * keys relevant to the authenticated user's role and changed domain module.
 *
 * Avoids broad `queryClient.invalidateQueries()` sweeps and full-page reloads.
 */

import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type {
  NotificationCategory,
  NotificationEventType,
  UserRole,
} from '@healthbridge/shared-types';

export interface DashboardSyncEventInput {
  role?: UserRole | string;
  category?: NotificationCategory | string;
  eventType?: NotificationEventType | string;
  resourceId?: string;
}

/**
 * Pure deterministic mapper returning the narrowly scoped query keys to invalidate
 * for a given role + notification category/event.
 */
export function resolveDashboardInvalidationKeys(
  input: DashboardSyncEventInput
): QueryKey[] {
  const role = String(input.role || '').toUpperCase();
  const category = String(input.category || '').toUpperCase();
  const eventType = String(input.eventType || '').toUpperCase();
  const keys: QueryKey[] = [];

  if (role === 'PATIENT') {
    if (category === 'APPOINTMENT' || eventType.startsWith('APPOINTMENT_')) {
      keys.push(['patient', 'appointments'], ['appointments'], ['patient', 'dashboard-summary'], ['platform', 'patient-timeline']);
    } else if (category === 'PRESCRIPTION' || eventType.startsWith('PRESCRIPTION_')) {
      keys.push(['patient', 'prescriptions'], ['prescriptions'], ['patient', 'dashboard-summary'], ['platform', 'patient-timeline']);
    } else if (category === 'ORDER' || eventType.startsWith('ORDER_')) {
      keys.push(['patient', 'orders'], ['patient', 'dashboard-summary']);
    } else if (category === 'LAB' || eventType.includes('REPORT') || eventType.includes('LAB_') || eventType.includes('SAMPLE_')) {
      keys.push(['patient', 'lab-reports'], ['lab-reports'], ['patient', 'dashboard-summary'], ['platform', 'patient-timeline']);
    } else if (category === 'CONSENT' || eventType.includes('CONSENT') || eventType.includes('ABHA') || eventType.includes('EXTERNAL_RECORD')) {
      keys.push(['patient', 'consents'], ['consents'], ['abdm', 'consents'], ['platform', 'patient-timeline'], ['platform', 'patient-identity']);
    }
    return keys;
  }

  if (role === 'DOCTOR') {
    if (category === 'APPOINTMENT' || eventType.startsWith('APPOINTMENT_')) {
      keys.push(['doctor', 'appointments'], ['doctor', 'dashboard'], ['doctor', 'queue']);
    } else if (category === 'LAB' || eventType.includes('REPORT') || eventType.includes('LAB_')) {
      keys.push(['doctor', 'lab-reports'], ['doctor', 'patients'], ['doctor', 'dashboard']);
    } else if (category === 'CONSENT' || eventType.includes('CONSENT')) {
      keys.push(['doctor', 'patients'], ['doctor', 'consents'], ['doctor', 'dashboard']);
    } else if (eventType.startsWith('ENCOUNTER_') || category === 'PRESCRIPTION') {
      keys.push(['doctor', 'encounters'], ['doctor', 'prescriptions'], ['doctor', 'dashboard']);
    }
    return keys;
  }

  if (role === 'PHARMACY') {
    if (category === 'PRESCRIPTION' || eventType.startsWith('PRESCRIPTION_')) {
      keys.push(['pharmacy', 'prescriptions'], ['pharmacy', 'dispensing'], ['pharmacy', 'dashboard']);
    } else if (category === 'ORDER' || eventType.startsWith('ORDER_')) {
      keys.push(['pharmacy', 'orders'], ['pharmacy', 'dashboard']);
    } else if (category === 'INVENTORY' || eventType.includes('STOCK') || eventType.includes('EXPIR')) {
      keys.push(['pharmacy', 'inventory'], ['pharmacy', 'inventory-alerts'], ['pharmacy', 'dashboard']);
    } else if (category === 'PROCUREMENT' || eventType.includes('PURCHASE') || eventType.includes('GOODS')) {
      keys.push(['pharmacy', 'procurement'], ['pharmacy', 'dashboard']);
    }
    return keys;
  }

  if (role === 'LABORATORY') {
    if (eventType.startsWith('LAB_ORDER_')) {
      keys.push(['laboratory', 'orders'], ['laboratory', 'dashboard']);
    } else if (eventType.startsWith('SAMPLE_') || eventType === 'RECOLLECTION_REQUESTED') {
      keys.push(['laboratory', 'samples'], ['laboratory', 'dashboard']);
    } else if (eventType.includes('REPORT')) {
      keys.push(['laboratory', 'reports'], ['laboratory', 'dashboard']);
    } else if (eventType.includes('QC_') || eventType.includes('INSTRUMENT_')) {
      keys.push(['laboratory', 'quality'], ['laboratory', 'dashboard']);
    } else if (category === 'LAB') {
      keys.push(['laboratory', 'orders'], ['laboratory', 'dashboard']);
    }
    return keys;
  }

  if (role === 'ADMIN') {
    if (category === 'SYSTEM' || category === 'SECURITY') {
      keys.push(['platform', 'admin-overview'], ['admin', 'events'], ['abdm', 'status']);
    }
    return keys;
  }

  return keys;
}

/**
 * Invalidates ONLY the narrowly scoped dashboard query keys associated with the incoming event.
 */
export function invalidateDashboardQueriesForEvent(
  queryClient: QueryClient,
  input: DashboardSyncEventInput
): QueryKey[] {
  const keys = resolveDashboardInvalidationKeys(input);
  for (const queryKey of keys) {
    void queryClient.invalidateQueries({ queryKey });
  }
  return keys;
}
