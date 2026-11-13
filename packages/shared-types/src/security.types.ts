/**
 * Security, Audit, and Notification Types
 */

export interface DeviceInfo {
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
}

export interface IRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date | string;
  revokedAt?: Date | string;
  deviceInfo?: DeviceInfo;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type AuditOutcome = 'SUCCESS' | 'FAILURE' | 'BLOCKED';

export interface IAuditLog {
  id: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  timestamp: Date | string;
  requestId: string;
  outcome: AuditOutcome;
  metadata?: Record<string, unknown>;
}

export type NotificationType =
  | 'APPOINTMENT'
  | 'CONSENT_REQUEST'
  | 'LAB_REPORT'
  | 'PRESCRIPTION'
  | 'SYSTEM_ALERT';

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  readAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

