import { z } from 'zod';
import { objectIdRegex } from './appointment.schema';

export const notificationCategoryEnum = z.enum([
  'PRESCRIPTION',
  'ORDER',
  'INVENTORY',
  'PROCUREMENT',
  'SECURITY',
  'APPOINTMENT',
  'CONSENT',
  'LAB',
  'SYSTEM',
]);

export const notificationEventTypeEnum = z.enum([
  'PRESCRIPTION_RECEIVED',
  'PRESCRIPTION_VERIFIED',
  'PRESCRIPTION_REJECTED',
  'PRESCRIPTION_READY_FOR_DISPENSING',
  'PRESCRIPTION_PARTIALLY_DISPENSED',
  'PRESCRIPTION_FULLY_DISPENSED',
  'PRESCRIPTION_CANCELLED',
  'ORDER_CREATED',
  'ORDER_ACCEPTED',
  'ORDER_REJECTED',
  'ORDER_PROCESSING',
  'ORDER_PARTIALLY_FULFILLED',
  'ORDER_READY_FOR_PICKUP',
  'ORDER_COMPLETED',
  'ORDER_CANCELLED',
  'LOW_STOCK',
  'OUT_OF_STOCK',
  'NEAR_EXPIRY',
  'EXPIRED_BATCH',
  'STOCK_ADJUSTMENT',
  'STOCK_RECEIVED',
  'PURCHASE_REQUISITION_SUBMITTED',
  'PURCHASE_ORDER_APPROVAL_REQUIRED',
  'PURCHASE_ORDER_APPROVED',
  'PURCHASE_ORDER_REJECTED',
  'GOODS_RECEIVED',
  'INVOICE_RECONCILIATION_REQUIRED',
  'LOGIN_ALERT',
  'PASSWORD_CHANGED',
  'SESSION_REVOKED',
  'SECURITY_ALERT',
  'PROFILE_UPDATED',
  'APPOINTMENT_SCHEDULED',
  'APPOINTMENT_BOOKED',
  'APPOINTMENT_CONFIRMED',
  'APPOINTMENT_RESCHEDULED',
  'APPOINTMENT_CANCELLED',
  'APPOINTMENT_COMPLETED',
  'ENCOUNTER_STARTED',
  'ENCOUNTER_FINALIZED',
  'PRESCRIPTION_ISSUED',
  'PRESCRIPTION_DISPENSED',
  'CONSENT_GRANTED',
  'CONSENT_REQUEST_RECEIVED',
  'CONSENT_APPROVED',
  'CONSENT_REVOKED',
  'ABHA_LINKED',
  'EXTERNAL_RECORD_IMPORTED',
  'LAB_ORDER_CREATED',
  'LAB_ORDER_ACCEPTED',
  'SAMPLE_COLLECTED',
  'SAMPLE_REJECTED',
  'LAB_REPORT_READY',
  'REPORT_PUBLISHED',
  'REPORT_AMENDED',
  'QC_INCIDENT_OPENED',
  'INSTRUMENT_MAINTENANCE_DUE',
  'SERVICE_FAILURE_ALERT',
  'INTEGRATION_FAILURE_ALERT',
  'EVENT_PROCESSING_FAILED',
  'SYSTEM_MAINTENANCE',
  'SYSTEM_ALERT',
]);

export const notificationPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const notificationChannelEnum = z.enum(['IN_APP', 'EMAIL', 'SMS']);
export const deliveryStatusEnum = z.enum([
  'PENDING',
  'QUEUED',
  'SENT',
  'DELIVERED',
  'FAILED',
  'RETRYING',
]);

export const notificationReadStatusEnum = z.enum(['ALL', 'UNREAD', 'READ']);

export const notificationFilterSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  category: z
    .union([notificationCategoryEnum, z.literal('ALL')])
    .optional()
    .default('ALL'),
  unreadOnly: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => val === true || val === 'true'),
  readStatus: notificationReadStatusEnum.optional(),
  search: z.string().trim().max(100).optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string()).optional(),
  endDate: z.string().datetime({ offset: true }).or(z.string()).optional(),
});

export const channelPreferenceSchema = z.object({
  inApp: z.boolean().optional(),
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
});

export const updateUserNotificationPreferencesSchema = z.object({
  channels: channelPreferenceSchema.optional(),
  categoryPreferences: z
    .record(
      notificationCategoryEnum,
      z.object({
        inApp: z.boolean().optional(),
        email: z.boolean().optional(),
        sms: z.boolean().optional(),
      })
    )
    .optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid notification ID format'),
});

export const createNotificationEventSchema = z.object({
  eventType: notificationEventTypeEnum,
  category: notificationCategoryEnum,
  recipientId: z.string().regex(objectIdRegex, 'Invalid recipient ID format'),
  recipientRole: z.string().optional(),
  title: z.string().trim().min(3).max(200),
  message: z.string().trim().min(3).max(1000),
  priority: notificationPriorityEnum.optional().default('MEDIUM'),
  relatedEntity: z
    .object({
      entityType: z.string().trim(),
      entityId: z.string().trim(),
      referenceNumber: z.string().trim().optional(),
    })
    .optional(),
  linkUrl: z.string().trim().optional(),
  idempotencyKey: z.string().trim().optional(),
  channels: z.array(notificationChannelEnum).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>;
export type UpdateUserNotificationPreferencesInput = z.infer<typeof updateUserNotificationPreferencesSchema>;
export type NotificationIdParamInput = z.infer<typeof notificationIdParamSchema>;
export type CreateNotificationEventInput = z.infer<typeof createNotificationEventSchema>;
