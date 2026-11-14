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
  | 'LAB_REPORT_READY'
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
  readAt?: string;
  isRead: boolean;
  linkUrl?: string;
  relatedEntity?: NotificationRelatedEntity;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilterDto {
  page?: number;
  limit?: number;
  category?: NotificationCategory | 'ALL';
  unreadOnly?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
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
  relatedEntity?: NotificationRelatedEntity;
  linkUrl?: string;
  idempotencyKey?: string;
  channels?: NotificationChannel[];
  metadata?: Record<string, unknown>;
}
