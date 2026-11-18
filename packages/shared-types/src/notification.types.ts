/**
 * HealthBridge India — Unified Notification, Preferences & Real-Time Alerts Types
 */

export type NotificationCategory =
  | 'PRESCRIPTION'
  | 'ORDER'
  | 'INVENTORY'
  | 'PROCUREMENT'
  | 'SECURITY'
  | 'APPOINTMENT'
  | 'CONSENT'
  | 'LAB'
  | 'SYSTEM';

export type NotificationEventType =
  // Prescription Notifications
  | 'PRESCRIPTION_RECEIVED'
  | 'PRESCRIPTION_VERIFIED'
  | 'PRESCRIPTION_REJECTED'
  | 'PRESCRIPTION_READY_FOR_DISPENSING'
  | 'PRESCRIPTION_PARTIALLY_DISPENSED'
  | 'PRESCRIPTION_FULLY_DISPENSED'
  | 'PRESCRIPTION_CANCELLED'
  // Order Notifications
  | 'ORDER_CREATED'
  | 'ORDER_ACCEPTED'
  | 'ORDER_REJECTED'
  | 'ORDER_PROCESSING'
  | 'ORDER_PARTIALLY_FULFILLED'
  | 'ORDER_READY_FOR_PICKUP'
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELLED'
  // Inventory Notifications
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'NEAR_EXPIRY'
  | 'EXPIRED_BATCH'
  | 'STOCK_ADJUSTMENT'
  | 'STOCK_RECEIVED'
  // Procurement Notifications
  | 'PURCHASE_REQUISITION_SUBMITTED'
  | 'PURCHASE_ORDER_APPROVAL_REQUIRED'
  | 'PURCHASE_ORDER_APPROVED'
  | 'PURCHASE_ORDER_REJECTED'
  | 'GOODS_RECEIVED'
  | 'INVOICE_RECONCILIATION_REQUIRED'
  // Account & Security Notifications
  | 'LOGIN_ALERT'
  | 'PASSWORD_CHANGED'
  | 'SESSION_REVOKED'
  | 'SECURITY_ALERT'
  | 'PROFILE_UPDATED'
  // Clinical & System Notifications
  | 'APPOINTMENT_SCHEDULED'
  | 'CONSENT_GRANTED'
  | 'LAB_ORDER_ACCEPTED'
  | 'LAB_ORDER_REJECTED'
  | 'LAB_ORDER_CLARIFICATION_REQUESTED'
  | 'SAMPLE_COLLECTED'
  | 'SAMPLE_RECEIVED'
  | 'SAMPLE_REJECTED'
  | 'RECOLLECTION_REQUESTED'
  | 'LAB_REPORT_READY'
  | 'LAB_REPORT_GENERATED'
  | 'LAB_REPORT_REVIEW_SUBMITTED'
  | 'LAB_REPORT_APPROVED'
  | 'LAB_REPORT_PUBLISHED'
  | 'LAB_REPORT_AMENDED'
  | 'LAB_REPORT_REJECTED'
  | 'LAB_REPORT_CORRECTION_REQUESTED'
  // Workforce & Scheduling Notifications
  | 'STAFF_INVITED'
  | 'STAFF_INVITATION_EXPIRED'
  | 'SHIFT_ASSIGNED'
  | 'SHIFT_CHANGED'
  | 'SHIFT_SWAP_REQUESTED'
  | 'SHIFT_SWAP_APPROVED'
  | 'SHIFT_SWAP_REJECTED'
  | 'LEAVE_REQUEST_SUBMITTED'
  | 'LEAVE_REQUEST_APPROVED'
  | 'LEAVE_REQUEST_REJECTED'
  | 'TASK_ASSIGNED'
  | 'TASK_REASSIGNED'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  // ABDM / ABHA Identity Notifications
  | 'ABHA_LINKING_INITIATED'
  | 'ABHA_VERIFICATION_PENDING'
  | 'ABHA_LINKING_COMPLETED'
  | 'ABHA_VERIFICATION_FAILED'
  | 'ABHA_UNLINKED'
  // ABDM Consent Manager Notifications (Day 7 Task 03)
  | 'ABDM_CONSENT_REQUEST_CREATED'
  | 'ABDM_CONSENT_REQUEST_SUBMITTED'
  | 'ABDM_CONSENT_APPROVED'
  | 'ABDM_CONSENT_REJECTED'
  | 'ABDM_CONSENT_NEARING_EXPIRY'
  | 'ABDM_CONSENT_EXPIRED'
  | 'ABDM_CONSENT_REVOCATION_INITIATED'
  | 'ABDM_CONSENT_REVOCATION_CONFIRMED'
  | 'ABDM_CONSENT_SYNC_FAILED'
  // ABDM HIP / HIU Health Information Exchange Notifications (Day 7 Task 04)
  | 'ABDM_DISCOVERY_COMPLETED'
  | 'ABDM_RECORD_LINKED'
  | 'ABDM_HI_TRANSFER_COMPLETED'
  | 'ABDM_HI_TRANSFER_FAILED'
  | 'ABDM_IMPORTED_RECORD_REVIEW_REQUIRED'
  // Unified Platform Domain Events (Day 8 Task 01)
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_COMPLETED'
  | 'ENCOUNTER_STARTED'
  | 'ENCOUNTER_FINALIZED'
  | 'FOLLOW_UP_REQUIRED'
  | 'PRESCRIPTION_ISSUED'
  | 'PRESCRIPTION_CANCELLED'
  | 'PRESCRIPTION_DISPENSED'
  | 'LAB_ORDER_CREATED'
  | 'TEST_COMPLETED'
  | 'REPORT_PUBLISHED'
  | 'REPORT_AMENDED'
  | 'ABHA_LINKED'
  | 'CONSENT_REQUEST_RECEIVED'
  | 'CONSENT_APPROVED'
  | 'CONSENT_REVOKED'
  | 'EXTERNAL_RECORD_IMPORTED'
  // Admin & Operational Notifications (Day 8 Task 04)
  | 'SERVICE_FAILURE_ALERT'
  | 'INTEGRATION_FAILURE_ALERT'
  | 'EVENT_PROCESSING_FAILED'
  | 'QC_INCIDENT_OPENED'
  | 'INSTRUMENT_MAINTENANCE_DUE'
  | 'SYSTEM_MAINTENANCE'
  | 'SYSTEM_ALERT';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS';

export type DeliveryStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETRYING';

export interface NotificationRelatedEntity {
  entityType: string;
  entityId: string;
  referenceNumber?: string;
}

export interface NotificationDto {
  id: string;
  userId: string;
  userRole?: string;
  category: NotificationCategory;
  eventType: NotificationEventType;
  title: string;
  message: string;
  priority: NotificationPriority;
  sourceModule?: string;
  eventId?: string;
  deliveryStatus?: DeliveryStatus;
  readAt?: string;
  isRead: boolean;
  linkUrl?: string;
  relatedEntity?: NotificationRelatedEntity;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationReadStatusFilter = 'ALL' | 'UNREAD' | 'READ';

export interface NotificationFilterDto {
  page?: number;
  limit?: number;
  category?: NotificationCategory | 'ALL';
  unreadOnly?: boolean;
  readStatus?: NotificationReadStatusFilter;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface NotificationChannelAvailabilityDto {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  realTimeTransport: 'SSE_WITH_POLLING_FALLBACK';
}

export interface NotificationChannelPreferences {
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

export interface UserNotificationPreferencesDto {
  userId: string;
  userRole?: string;
  channels: NotificationChannelPreferences;
  availableChannels?: NotificationChannelAvailabilityDto;
  categoryPreferences: Record<NotificationCategory, NotificationChannelPreferences>;
  mandatoryCategories: NotificationCategory[];
  updatedAt: string;
}

export interface UpdateUserNotificationPreferencesDto {
  channels?: Partial<NotificationChannelPreferences>;
  categoryPreferences?: Partial<Record<NotificationCategory, Partial<NotificationChannelPreferences>>>;
}

export interface NotificationDeliveryDto {
  id: string;
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  provider: string;
  status: DeliveryStatus;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  createdAt: string;
}

export interface NotificationUnreadCountDto {
  unreadCount: number;
  categoryCounts: Partial<Record<NotificationCategory, number>>;
}

export interface NotificationEventPayload {
  eventType: NotificationEventType;
  category: NotificationCategory;
  recipientId: string;
  recipientRole?: string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  sourceModule?: string;
  eventId?: string;
  relatedEntity?: NotificationRelatedEntity;
  linkUrl?: string;
  idempotencyKey?: string;
  channels?: NotificationChannel[];
  metadata?: Record<string, unknown>;
  expiresAt?: string;
}

export interface DashboardSyncHintDto {
  eventId: string;
  category: NotificationCategory;
  eventType: NotificationEventType;
  sourceModule?: string;
  resourceType?: string;
  resourceId?: string;
  timestamp: string;
}
