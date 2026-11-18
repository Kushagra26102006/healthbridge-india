/**
 * HealthBridge India — Privacy Governance Zod Schemas (Day 9 Task 02)
 */

import { z } from 'zod';

export const EXPORT_CATEGORY_VALUES = [
  'PROFILE',
  'APPOINTMENTS',
  'PRESCRIPTIONS',
  'LAB_REPORTS',
  'MEDICAL_RECORDS',
  'CONSENT_HISTORY',
  'ACCESS_HISTORY',
] as const;

export const createExportRequestSchema = z.object({
  categories: z.array(z.enum(EXPORT_CATEGORY_VALUES)).min(1, 'Select at least one data category'),
  format: z.enum(['JSON']).default('JSON'),
  reason: z.string().trim().max(500).optional(),
});

export const createCorrectionRequestSchema = z.object({
  targetResource: z.enum([
    'PATIENT_PROFILE',
    'MEDICAL_RECORD',
    'PRESCRIPTION',
    'LAB_REPORT',
    'APPOINTMENT',
    'ABHA_MAPPING',
  ]),
  targetResourceId: z.string().trim().max(100).optional(),
  fieldOrCategory: z.string().trim().min(2).max(120),
  originalValueSnapshot: z.string().trim().max(500).optional(),
  requestedCorrection: z.string().trim().min(2).max(1000),
  patientExplanation: z.string().trim().min(5).max(1000),
  supportingDocumentRef: z.string().trim().max(200).optional(),
});

export const createDeletionRequestSchema = z.object({
  requestedAction: z.enum([
    'ACCOUNT_DEACTIVATION',
    'ACCOUNT_CLOSURE',
    'DATA_DELETION',
    'DATA_ANONYMIZATION',
  ]),
  reason: z.string().trim().min(5).max(1000),
  acknowledgeRetentionRules: z.boolean().refine((v) => v === true, {
    message: 'You must acknowledge clinical and legal retention rules before submitting.',
  }),
});

export const acknowledgePrivacyNoticeSchema = z.object({
  noticeVersion: z.string().trim().min(1).max(40),
});

export const adminReviewPrivacyRequestSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED']),
  decisionSummary: z.string().trim().min(5).max(1000),
  completionEvidence: z.string().trim().max(1000).optional(),
  appliedAmendmentReference: z.string().trim().max(200).optional(),
  actualDisposalOutcome: z
    .enum([
      'PENDING_REVIEW',
      'PARTIAL_RESTRICTED_RETENTION',
      'ACCOUNT_CLOSED_RECORDS_RETAINED',
      'DEFERRED_LEGAL_HOLD',
      'REJECTED',
    ])
    .optional(),
});

export const createLegalHoldSchema = z.object({
  patientId: z.string().trim().min(12).max(64),
  scopeCategories: z.array(z.string().trim().min(2).max(80)).min(1),
  reason: z.string().trim().min(10).max(1000),
});

export const privacyListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  requestType: z
    .enum(['EXPORT', 'CORRECTION', 'DELETION', 'ACCOUNT_CLOSURE', 'ACCESS_INQUIRY', 'COMPLAINT'])
    .optional(),
  status: z
    .enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED', 'WITHDRAWN'])
    .optional(),
});
