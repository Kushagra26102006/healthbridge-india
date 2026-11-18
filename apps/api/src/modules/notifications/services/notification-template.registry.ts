/**
 * HealthBridge India — Centralized Privacy-Safe Notification Template Registry (Day 8 Task 04)
 *
 * PRIVACY INVARIANTS:
 *   1. Neutral wording ONLY — NEVER includes diagnoses, numeric lab test results, medication
 *      contents/dosages, full patient names in shared contexts, ABHA/Aadhaar numbers,
 *      private document excerpts, or authentication secrets.
 *   2. Applies `sanitizeNotificationText()` as a defense-in-depth guard on all titles and messages.
 *   3. Maps every role (`PATIENT`, `DOCTOR`, `PHARMACY`, `LABORATORY`, `ADMIN`) to authorized,
 *      role-appropriate navigation routes.
 */

import type {
  NotificationCategory,
  NotificationEventType,
  NotificationPriority,
  UserRole,
} from '@healthbridge/shared-types';
import { redactStringSecrets } from '../../abdm/utils/redaction';

const SENSITIVE_NOTIFICATION_PATTERNS: RegExp[] = [
  /\b\d{2}-\d{4}-\d{4}-\d{4}\b/g, // 14-digit ABHA number
  /\b\d{14}\b/g, // unformatted 14-digit ABHA
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // 12-digit Aadhaar
  /\b\d+(?:\.\d+)?\s*(?:mg\/dL|g\/dL|mmol\/L|IU\/L|U\/L|ng\/mL|pg\/mL|mmHg|%|cells\/uL|mg|mcg|mL)\b/gi,
  /\b(?:HbA1c|Hemoglobin|Cholesterol|Glucose|Creatinine|TSH|HIV|Hepatitis|Biopsy)\s*[:=]\s*[^\s,;]+/gi,
  /\b(?:diagnosis|impression|finding)\s*[:=]\s*[^.;\n]+/gi,
];

export interface RenderedNotificationTemplate {
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  sourceModule: string;
  linkUrl: string;
}

interface TemplateDefinition {
  category: NotificationCategory;
  priority: NotificationPriority;
  sourceModule: string;
  title: string;
  message: string;
  routesByRole: Partial<Record<UserRole, string>>;
}

const NOTIFICATION_TEMPLATES: Partial<Record<NotificationEventType, TemplateDefinition>> = {
  // Appointments
  APPOINTMENT_BOOKED: {
    category: 'APPOINTMENT',
    priority: 'MEDIUM',
    sourceModule: 'APPOINTMENTS',
    title: 'Appointment Scheduled',
    message: 'Your appointment status has been updated. Sign in to view the details.',
    routesByRole: {
      PATIENT: '/patient/appointments',
      DOCTOR: '/doctor/appointments',
    },
  },
  APPOINTMENT_CONFIRMED: {
    category: 'APPOINTMENT',
    priority: 'MEDIUM',
    sourceModule: 'APPOINTMENTS',
    title: 'Appointment Confirmed',
    message: 'Your appointment has been confirmed. Sign in to review the schedule.',
    routesByRole: {
      PATIENT: '/patient/appointments',
      DOCTOR: '/doctor/appointments',
    },
  },
  APPOINTMENT_RESCHEDULED: {
    category: 'APPOINTMENT',
    priority: 'HIGH',
    sourceModule: 'APPOINTMENTS',
    title: 'Appointment Rescheduled',
    message: 'An appointment schedule has been updated. Sign in to view the new time.',
    routesByRole: {
      PATIENT: '/patient/appointments',
      DOCTOR: '/doctor/appointments',
    },
  },
  APPOINTMENT_CANCELLED: {
    category: 'APPOINTMENT',
    priority: 'HIGH',
    sourceModule: 'APPOINTMENTS',
    title: 'Appointment Cancelled',
    message: 'An appointment status has been updated to cancelled. Sign in for details.',
    routesByRole: {
      PATIENT: '/patient/appointments',
      DOCTOR: '/doctor/appointments',
    },
  },
  APPOINTMENT_COMPLETED: {
    category: 'APPOINTMENT',
    priority: 'LOW',
    sourceModule: 'APPOINTMENTS',
    title: 'Appointment Completed',
    message: 'Your consultation appointment has been marked completed.',
    routesByRole: {
      PATIENT: '/patient/appointments',
      DOCTOR: '/doctor/encounters',
    },
  },

  // Prescriptions & Dispensing
  PRESCRIPTION_ISSUED: {
    category: 'PRESCRIPTION',
    priority: 'HIGH',
    sourceModule: 'PRESCRIPTIONS',
    title: 'New Prescription Available',
    message: 'A new prescription is available in your account. Sign in to view the details.',
    routesByRole: {
      PATIENT: '/patient/prescriptions',
      PHARMACY: '/pharmacy/prescriptions',
      DOCTOR: '/doctor/prescriptions',
    },
  },
  PRESCRIPTION_RECEIVED: {
    category: 'PRESCRIPTION',
    priority: 'HIGH',
    sourceModule: 'PHARMACY',
    title: 'Prescription Fulfillment Request',
    message: 'An authorized prescription fulfillment request is available in your queue.',
    routesByRole: {
      PHARMACY: '/pharmacy/prescriptions',
    },
  },
  PRESCRIPTION_DISPENSED: {
    category: 'PRESCRIPTION',
    priority: 'MEDIUM',
    sourceModule: 'PHARMACY',
    title: 'Prescription Dispensing Updated',
    message: 'Your prescription dispensing status has been updated. Sign in to view details.',
    routesByRole: {
      PATIENT: '/patient/prescriptions',
      PHARMACY: '/pharmacy/dispensing',
      DOCTOR: '/doctor/prescriptions',
    },
  },
  PRESCRIPTION_FULLY_DISPENSED: {
    category: 'PRESCRIPTION',
    priority: 'MEDIUM',
    sourceModule: 'PHARMACY',
    title: 'Prescription Dispensed',
    message: 'Your prescription dispensing is complete. Sign in to review your records.',
    routesByRole: {
      PATIENT: '/patient/prescriptions',
      PHARMACY: '/pharmacy/dispensing',
    },
  },
  PRESCRIPTION_PARTIALLY_DISPENSED: {
    category: 'PRESCRIPTION',
    priority: 'MEDIUM',
    sourceModule: 'PHARMACY',
    title: 'Partial Dispensing Recorded',
    message: 'Your prescription has been partially dispensed. Sign in to check remaining items.',
    routesByRole: {
      PATIENT: '/patient/prescriptions',
      PHARMACY: '/pharmacy/dispensing',
    },
  },

  // Pharmacy Operations
  ORDER_CREATED: {
    category: 'ORDER',
    priority: 'HIGH',
    sourceModule: 'PHARMACY',
    title: 'New Pharmacy Order',
    message: 'A new pharmacy order has been received and requires review.',
    routesByRole: {
      PHARMACY: '/pharmacy/orders',
      PATIENT: '/patient/orders',
    },
  },
  LOW_STOCK: {
    category: 'INVENTORY',
    priority: 'HIGH',
    sourceModule: 'PHARMACY',
    title: 'Low Inventory Alert',
    message: 'One or more inventory items have reached low-stock thresholds.',
    routesByRole: {
      PHARMACY: '/pharmacy/inventory',
    },
  },
  NEAR_EXPIRY: {
    category: 'INVENTORY',
    priority: 'HIGH',
    sourceModule: 'PHARMACY',
    title: 'Batch Expiry Alert',
    message: 'Inventory batches are approaching expiry. Review inventory alerts promptly.',
    routesByRole: {
      PHARMACY: '/pharmacy/inventory',
    },
  },
  GOODS_RECEIVED: {
    category: 'PROCUREMENT',
    priority: 'MEDIUM',
    sourceModule: 'PHARMACY',
    title: 'Supplier Delivery Recorded',
    message: 'A supplier goods receipt has been recorded in procurement.',
    routesByRole: {
      PHARMACY: '/pharmacy/procurement',
    },
  },

  // Laboratory Workflow
  LAB_ORDER_CREATED: {
    category: 'LAB',
    priority: 'HIGH',
    sourceModule: 'LABORATORY',
    title: 'New Laboratory Order Assigned',
    message: 'A new laboratory order is available in your laboratory work queue.',
    routesByRole: {
      LABORATORY: '/laboratory/orders',
      PATIENT: '/patient/lab-reports',
      DOCTOR: '/doctor/dashboard',
    },
  },
  SAMPLE_COLLECTED: {
    category: 'LAB',
    priority: 'MEDIUM',
    sourceModule: 'LABORATORY',
    title: 'Sample Collection Updated',
    message: 'A laboratory sample status has been updated to collected.',
    routesByRole: {
      LABORATORY: '/laboratory/samples',
      PATIENT: '/patient/lab-reports',
    },
  },
  SAMPLE_REJECTED: {
    category: 'LAB',
    priority: 'HIGH',
    sourceModule: 'LABORATORY',
    title: 'Sample Requires Attention',
    message: 'A laboratory sample could not be processed. Sign in to review next steps.',
    routesByRole: {
      LABORATORY: '/laboratory/samples',
      PATIENT: '/patient/lab-reports',
      DOCTOR: '/doctor/dashboard',
    },
  },
  LAB_REPORT_REVIEW_SUBMITTED: {
    category: 'LAB',
    priority: 'HIGH',
    sourceModule: 'LABORATORY',
    title: 'Report Review Requested',
    message: 'A laboratory report is ready for authorized clinical review.',
    routesByRole: {
      LABORATORY: '/laboratory/reports',
    },
  },
  REPORT_PUBLISHED: {
    category: 'LAB',
    priority: 'HIGH',
    sourceModule: 'LABORATORY',
    title: 'Laboratory Report Ready',
    message: 'A laboratory report is ready to view in your account. Sign in to review.',
    routesByRole: {
      PATIENT: '/patient/lab-reports',
      DOCTOR: '/doctor/dashboard',
      LABORATORY: '/laboratory/reports',
    },
  },
  REPORT_AMENDED: {
    category: 'LAB',
    priority: 'HIGH',
    sourceModule: 'LABORATORY',
    title: 'Laboratory Report Updated',
    message: 'An updated version of a laboratory report is available. Sign in to review.',
    routesByRole: {
      PATIENT: '/patient/lab-reports',
      DOCTOR: '/doctor/dashboard',
      LABORATORY: '/laboratory/reports',
    },
  },
  QC_INCIDENT_OPENED: {
    category: 'LAB',
    priority: 'CRITICAL',
    sourceModule: 'LABORATORY',
    title: 'Quality-Control Incident Alert',
    message: 'A laboratory quality-control incident requires immediate review.',
    routesByRole: {
      LABORATORY: '/laboratory/quality',
    },
  },
  INSTRUMENT_MAINTENANCE_DUE: {
    category: 'LAB',
    priority: 'HIGH',
    sourceModule: 'LABORATORY',
    title: 'Instrument Maintenance Alert',
    message: 'Scheduled laboratory instrument maintenance or calibration requires attention.',
    routesByRole: {
      LABORATORY: '/laboratory/quality',
    },
  },

  // Consent & ABDM
  CONSENT_REQUEST_RECEIVED: {
    category: 'CONSENT',
    priority: 'HIGH',
    sourceModule: 'CONSENT',
    title: 'Health Information Access Request',
    message: 'A health information access request requires your attention. Sign in to review.',
    routesByRole: {
      PATIENT: '/patient/consents',
    },
  },
  CONSENT_GRANTED: {
    category: 'CONSENT',
    priority: 'MEDIUM',
    sourceModule: 'CONSENT',
    title: 'Consent Status Updated',
    message: 'A health information consent status has been updated.',
    routesByRole: {
      PATIENT: '/patient/consents',
      DOCTOR: '/doctor/patients',
    },
  },
  CONSENT_REVOKED: {
    category: 'CONSENT',
    priority: 'HIGH',
    sourceModule: 'CONSENT',
    title: 'Consent Access Updated',
    message: 'Health information access consent has been revoked and enforced immediately.',
    routesByRole: {
      PATIENT: '/patient/consents',
      DOCTOR: '/doctor/patients',
    },
  },
  ABHA_LINKED: {
    category: 'SECURITY',
    priority: 'MEDIUM',
    sourceModule: 'ABDM',
    title: 'ABHA Linking Status Updated',
    message: 'Your health account identity linking status has been updated. Sign in to verify.',
    routesByRole: {
      PATIENT: '/patient/abdm',
    },
  },
  EXTERNAL_RECORD_IMPORTED: {
    category: 'CONSENT',
    priority: 'MEDIUM',
    sourceModule: 'ABDM',
    title: 'External Health Record Available',
    message: 'An authorized external health record has been added to your timeline.',
    routesByRole: {
      PATIENT: '/patient/timeline',
      DOCTOR: '/doctor/patients',
    },
  },

  // Admin & Operational Security
  SERVICE_FAILURE_ALERT: {
    category: 'SYSTEM',
    priority: 'CRITICAL',
    sourceModule: 'PLATFORM',
    title: 'Platform Service Alert',
    message: 'An operational service alert has been detected. Inspect platform health metrics.',
    routesByRole: {
      ADMIN: '/admin/platform-overview',
    },
  },
  INTEGRATION_FAILURE_ALERT: {
    category: 'SYSTEM',
    priority: 'HIGH',
    sourceModule: 'ABDM',
    title: 'External Integration Alert',
    message: 'An integration workflow reported a failure. Review operational status.',
    routesByRole: {
      ADMIN: '/admin/integrations/abdm',
    },
  },
  EVENT_PROCESSING_FAILED: {
    category: 'SYSTEM',
    priority: 'HIGH',
    sourceModule: 'PLATFORM',
    title: 'Event Processing Alert',
    message: 'One or more background workflow events require operational review.',
    routesByRole: {
      ADMIN: '/admin/platform-overview',
    },
  },
  SECURITY_ALERT: {
    category: 'SECURITY',
    priority: 'CRITICAL',
    sourceModule: 'SECURITY',
    title: 'Security Notice',
    message: 'An important account or security event was recorded. Sign in to review.',
    routesByRole: {
      PATIENT: '/patient/notifications',
      DOCTOR: '/doctor/notifications',
      PHARMACY: '/pharmacy/notifications',
      LABORATORY: '/laboratory/notifications',
      ADMIN: '/admin/notifications',
    },
  },
  SYSTEM_MAINTENANCE: {
    category: 'SYSTEM',
    priority: 'MEDIUM',
    sourceModule: 'SYSTEM',
    title: 'Scheduled System Maintenance',
    message: 'A platform maintenance notice has been published. Review operational status.',
    routesByRole: {
      PATIENT: '/patient/notifications',
      DOCTOR: '/doctor/notifications',
      PHARMACY: '/pharmacy/notifications',
      LABORATORY: '/laboratory/notifications',
      ADMIN: '/admin/notifications',
    },
  },
};

const DEFAULT_ROUTE_BY_ROLE: Record<UserRole, string> = {
  PATIENT: '/patient/notifications',
  DOCTOR: '/doctor/notifications',
  PHARMACY: '/pharmacy/notifications',
  LABORATORY: '/laboratory/notifications',
  ADMIN: '/admin/notifications',
};

/**
 * Strips any accidental PHI, clinical values, diagnoses, ABHA/Aadhaar numbers,
 * or credentials from notification titles and previews.
 */
export function sanitizeNotificationText(rawText: string): string {
  let clean = redactStringSecrets(rawText || '');
  for (const pattern of SENSITIVE_NOTIFICATION_PATTERNS) {
    clean = clean.replace(pattern, '[PROTECTED]');
  }
  return clean.replace(/\s+/g, ' ').trim();
}

/**
 * Renders a privacy-safe neutral notification template for a given event type and recipient role.
 */
export function renderNotificationTemplate(
  eventType: NotificationEventType,
  role: UserRole
): RenderedNotificationTemplate {
  const def = NOTIFICATION_TEMPLATES[eventType];
  if (!def) {
    return {
      title: 'Healthcare Account Update',
      message: 'Your account has a new update. Sign in to view the details.',
      category: 'SYSTEM',
      priority: 'MEDIUM',
      sourceModule: 'SYSTEM',
      linkUrl: DEFAULT_ROUTE_BY_ROLE[role] || '/patient/notifications',
    };
  }

  return {
    title: sanitizeNotificationText(def.title),
    message: sanitizeNotificationText(def.message),
    category: def.category,
    priority: def.priority,
    sourceModule: def.sourceModule,
    linkUrl: def.routesByRole[role] || DEFAULT_ROUTE_BY_ROLE[role] || '/patient/notifications',
  };
}
