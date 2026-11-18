/**
 * HealthBridge India — Security Monitoring Types, Permissions & Zod Schemas (Day 9 Task 04)
 */

import { z } from 'zod';

export const SECURITY_OPS_PERMISSIONS = [
  'SECURITY_EVENTS_READ',
  'SECURITY_ALERTS_READ',
  'SECURITY_ALERTS_MANAGE',
  'SECURITY_INCIDENTS_READ',
  'SECURITY_INCIDENTS_MANAGE',
  'SECURITY_INCIDENTS_RESPOND',
  'SECURITY_VULNERABILITIES_READ',
  'SECURITY_VULNERABILITIES_MANAGE',
] as const;

export type SecurityOpsPermission = (typeof SECURITY_OPS_PERMISSIONS)[number];

export const SECURITY_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export type SecuritySeverity = (typeof SECURITY_SEVERITIES)[number];

export const SECURITY_EVENT_CATEGORIES = [
  'AUTHENTICATION',
  'AUTHORIZATION',
  'API_SECURITY',
  'DATA_PROTECTION',
  'INTEGRATION',
] as const;
export type SecurityEventCategory = (typeof SECURITY_EVENT_CATEGORIES)[number];

export const SECURITY_EVENT_TYPES = [
  // Authentication
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'ACCOUNT_LOCKOUT',
  'TOKEN_REUSE_DETECTED',
  'SESSION_REVOKED',
  'PASSWORD_RESET_REQUESTED',
  // Authorization
  'ACCESS_DENIED',
  'CROSS_PATIENT_ACCESS_ATTEMPT',
  'CROSS_TENANT_ACCESS_ATTEMPT',
  'ROLE_PERMISSION_CHANGE',
  'CONSENT_VALIDATION_FAILURE',
  // API security
  'RATE_LIMIT_EXCEEDED',
  'INVALID_REQUEST_PATTERN',
  'SUSPICIOUS_QUERY_PATTERN',
  'INPUT_VALIDATION_FAILURE',
  'UNUSUAL_API_ACTIVITY',
  // Data protection
  'SENSITIVE_DOCUMENT_ACCESS',
  'UNAUTHORIZED_DOCUMENT_DOWNLOAD',
  'EXPORT_REQUEST_CREATED',
  'BULK_DATA_ACCESS_ATTEMPT',
  'DECRYPTION_FAILURE',
  'KEY_ROTATION_FAILURE',
  // Integration
  'ABDM_CALLBACK_VALIDATION_FAILURE',
  'EXTERNAL_TRANSFER_FAILURE',
  'EVENT_REPLAY_ATTEMPT',
  'EVENT_SIGNATURE_VALIDATION_FAILURE',
] as const;
export type SecurityEventType = (typeof SECURITY_EVENT_TYPES)[number];

export const ALERT_STATUSES = [
  'OPEN',
  'ACKNOWLEDGED',
  'INVESTIGATING',
  'RESOLVED',
  'FALSE_POSITIVE',
  'CLOSED',
] as const;
export type SecurityAlertStatus = (typeof ALERT_STATUSES)[number];

export const INCIDENT_STATUSES = [
  'DETECTED',
  'TRIAGED',
  'INVESTIGATING',
  'CONTAINMENT',
  'ERADICATION',
  'RECOVERY',
  'RESOLVED',
  'CLOSED',
] as const;
export type SecurityIncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_RESPONSE_RESTRICTED_STATUSES: ReadonlySet<SecurityIncidentStatus> = new Set([
  'CONTAINMENT',
  'ERADICATION',
  'RECOVERY',
]);

export const VULNERABILITY_STATUSES = [
  'OPEN',
  'TRIAGED',
  'IN_PROGRESS',
  'FIXED',
  'ACCEPTED_RISK',
  'FALSE_POSITIVE',
] as const;
export type VulnerabilityStatus = (typeof VULNERABILITY_STATUSES)[number];

// Forbidden metadata keys that MUST NEVER appear in security event payloads
export const FORBIDDEN_EVENT_METADATA_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'encryptionkey',
  'keymaterial',
  'privatekey',
  'diagnosis',
  'clinicalnotes',
  'prescriptiontext',
  'medicalrecords',
  'abhanumber',
  'aadhaar',
  'otp',
]);

export function containsForbiddenSensitiveKeys(obj?: Record<string, unknown>): string | null {
  if (!obj || typeof obj !== 'object') return null;
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_EVENT_METADATA_KEYS.has(key.toLowerCase())) {
      return key;
    }
    const val = obj[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const nested = containsForbiddenSensitiveKeys(val as Record<string, unknown>);
      if (nested) return `${key}.${nested}`;
    }
  }
  return null;
}

export const securityEventInputSchema = z
  .object({
    eventId: z.string().trim().min(4).max(80).optional(),
    dedupeKey: z.string().trim().max(120).optional(),
    eventType: z.enum(SECURITY_EVENT_TYPES),
    category: z.enum(SECURITY_EVENT_CATEGORIES),
    severity: z.enum(SECURITY_SEVERITIES).default('LOW'),
    actorId: z.string().trim().max(80).optional(),
    actorRole: z.string().trim().max(40).optional(),
    sourceIp: z.string().trim().max(64).optional(),
    sourceModule: z.string().trim().min(2).max(80),
    requestId: z.string().trim().max(80).optional(),
    correlationId: z.string().trim().max(80).optional(),
    resourceCategory: z.string().trim().max(80).optional(),
    resourceReference: z.string().trim().max(120).optional(),
    outcome: z.enum(['SUCCESS', 'FAILURE', 'BLOCKED']),
    metadata: z.record(z.unknown()).optional(),
  })
  .superRefine((data, ctx) => {
    const badKey = containsForbiddenSensitiveKeys(data.metadata);
    if (badKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['metadata'],
        message: `Security event metadata must not contain sensitive credential or clinical key '${badKey}'.`,
      });
    }
  });

export type SecurityEventInput = z.infer<typeof securityEventInputSchema>;

export const alertUpdateSchema = z
  .object({
    status: z.enum(ALERT_STATUSES).optional(),
    assignedReviewerId: z.string().trim().max(80).optional(),
    resolutionNotes: z.string().trim().max(1000).optional(),
    incidentId: z.string().trim().max(80).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.status === 'RESOLVED' || data.status === 'FALSE_POSITIVE') &&
      (!data.resolutionNotes || data.resolutionNotes.trim().length < 5)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resolutionNotes'],
        message: 'Resolution notes (min 5 characters) are required when resolving or dismissing an alert.',
      });
    }
  });

export const incidentCreateSchema = z.object({
  title: z.string().trim().min(5).max(160),
  category: z.enum(SECURITY_EVENT_CATEGORIES),
  severity: z.enum(SECURITY_SEVERITIES),
  description: z.string().trim().min(10).max(2000),
  relatedAlertIds: z.array(z.string().trim().min(1)).default([]),
  affectedModules: z.array(z.string().trim().min(1)).default([]),
  affectedSystems: z.array(z.string().trim().min(1)).default([]),
  assignedResponderId: z.string().trim().max(80).optional(),
  evidenceReferences: z.array(z.string().trim().min(1)).default([]),
});

export const incidentUpdateSchema = z.object({
  status: z.enum(INCIDENT_STATUSES).optional(),
  severity: z.enum(SECURITY_SEVERITIES).optional(),
  assignedResponderId: z.string().trim().max(80).optional(),
  containmentAction: z.string().trim().min(5).max(1000).optional(),
  evidenceReference: z.string().trim().min(2).max(200).optional(),
  resolution: z.string().trim().max(2000).optional(),
  lessonsLearned: z.string().trim().max(2000).optional(),
  note: z.string().trim().min(3).max(1000).optional(),
});

export const vulnerabilityCreateSchema = z.object({
  component: z.string().trim().min(2).max(120),
  advisoryReference: z.string().trim().min(3).max(120),
  severity: z.enum(SECURITY_SEVERITIES),
  affectedVersion: z.string().trim().min(1).max(60),
  fixedVersion: z.string().trim().max(60).optional(),
  exploitability: z.string().trim().max(500).optional(),
  remediation: z.string().trim().min(5).max(1000),
  owner: z.string().trim().min(2).max(100),
});

export const vulnerabilityUpdateSchema = z
  .object({
    status: z.enum(VULNERABILITY_STATUSES).optional(),
    owner: z.string().trim().max(100).optional(),
    fixedVersion: z.string().trim().max(60).optional(),
    remediation: z.string().trim().max(1000).optional(),
    acceptedRiskJustification: z.string().trim().max(1000).optional(),
    verificationResult: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.status === 'ACCEPTED_RISK' &&
      (!data.acceptedRiskJustification || data.acceptedRiskJustification.trim().length < 15)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['acceptedRiskJustification'],
        message: 'Documented risk-acceptance justification (min 15 characters) is mandatory for ACCEPTED_RISK.',
      });
    }
  });

export const securityListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  severity: z.enum(SECURITY_SEVERITIES).optional(),
  category: z.enum(SECURITY_EVENT_CATEGORIES).optional(),
  status: z.string().trim().max(40).optional(),
  search: z.string().trim().max(100).optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
});
