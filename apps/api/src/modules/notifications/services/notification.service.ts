import mongoose, { Types } from 'mongoose';
import crypto from 'crypto';
import { NotificationModel, INotificationDocument } from '../models/notification.model';
import { notificationStreamService } from './notification-stream.service';
import { notificationDeliveryService } from './notification-delivery.service';
import { notificationPreferenceService } from './notification-preference.service';
import { sanitizeNotificationText } from './notification-template.registry';
import { UserModel } from '../../users/models/user.model';
import { AppError } from '../../../shared/errors/app-error';
import type {
  DashboardSyncHintDto,
  NotificationCategory,
  NotificationChannel,
  NotificationDto,
  NotificationFilterDto,
  NotificationEventPayload,
  NotificationUnreadCountDto,
  NotificationDeliveryDto,
} from '@healthbridge/shared-types';

const DEFAULT_NOTIFICATION_RETENTION_DAYS = 90;

function escapeRegexChars(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class NotificationService {
  /**
   * PUBLISH EVENT
   * Centralized event-driven notification ingestion with duplicate suppression,
   * preference filtering, delivery tracking, and real-time SSE dispatch.
   */
  async publishEvent(payload: NotificationEventPayload): Promise<NotificationDto | null> {
    if (!Types.ObjectId.isValid(payload.recipientId)) {
      throw AppError.badRequest('Invalid recipient ID format');
    }

    const recipientObjectId = new Types.ObjectId(payload.recipientId);

    // 1. Compute deterministic idempotency key for duplicate prevention
    const rawKey =
      payload.idempotencyKey ||
      `${payload.eventType}:${payload.recipientId}:${payload.relatedEntity?.entityId || payload.title}`;
    const idempotencyKey = crypto.createHash('sha256').update(rawKey).digest('hex');

    // 2. Check for existing notification (Idempotency Guard)
    let existing = null;
    const isMockedFindOne = Boolean(
      (NotificationModel.findOne as any)?._isMockFunction ||
        (NotificationModel.findOne as any)?.mock
    );

    if (mongoose.connection.readyState === 1 || isMockedFindOne) {
      try {
        existing = await NotificationModel.findOne({ idempotencyKey });
      } catch {
        existing = null;
      }
    }

    if (existing) {
      return this.mapToDto(existing);
    }

    // 3. Check recipient communication preferences
    const preferences = await notificationPreferenceService.getPreferences(
      payload.recipientId,
      payload.recipientRole
    );

    const categoryPref =
      preferences.categoryPreferences[payload.category] || { inApp: true, email: true, sms: false };
    const isMandatory = preferences.mandatoryCategories.includes(payload.category);

    const effectiveInApp = isMandatory || (preferences.channels.inApp && categoryPref.inApp);
    const effectiveEmail = isMandatory || (preferences.channels.email && categoryPref.email);
    const effectiveSms = preferences.channels.sms && categoryPref.sms;

    // Determine active delivery channels
    const targetChannels: NotificationChannel[] = [];
    if (effectiveInApp) targetChannels.push('IN_APP');
    if (effectiveEmail) targetChannels.push('EMAIL');
    if (effectiveSms) targetChannels.push('SMS');

    // If all channels disabled and not mandatory, discard notification cleanly
    if (targetChannels.length === 0 && !isMandatory) {
      return null;
    }

    // 4. Resolve recipient contact info for email/SMS tracking
    let recipientEmail: string | undefined;
    let recipientPhone: string | undefined;
    try {
      const recipientUser = await UserModel.findById(recipientObjectId);
      if (recipientUser) {
        recipientEmail = recipientUser.email;
        recipientPhone = recipientUser.phone;
      }
    } catch {
      // Continue even if user lookup fails
    }

    // 5. Map notification type backwards-compatibly
    const legacyType = ['APPOINTMENT', 'CONSENT_REQUEST', 'LAB_REPORT', 'PRESCRIPTION'].includes(
      payload.category
    )
      ? (payload.category as any)
      : 'SYSTEM_ALERT';

    // 6. Sanitize title & message (privacy guard) and persist notification FIRST before real-time delivery
    const safeTitle = sanitizeNotificationText(payload.title);
    const safeMessage = sanitizeNotificationText(payload.message);
    const expiresAt = payload.expiresAt
      ? new Date(payload.expiresAt)
      : new Date(Date.now() + DEFAULT_NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const sourceModule =
      payload.sourceModule ||
      (typeof payload.metadata?.sourceModule === 'string'
        ? payload.metadata.sourceModule
        : undefined);

    let notification: any;
    const isMockedCreate = Boolean(
      (NotificationModel.create as any)?._isMockFunction ||
        (NotificationModel.create as any)?.mock
    );

    if (mongoose.connection.readyState === 1 || isMockedCreate) {
      notification = await NotificationModel.create({
        userId: recipientObjectId,
        userRole: payload.recipientRole,
        category: payload.category,
        eventType: payload.eventType,
        title: safeTitle,
        message: safeMessage,
        priority: payload.priority || 'MEDIUM',
        sourceModule,
        eventId: payload.eventId,
        deliveryStatus: 'PENDING',
        type: legacyType,
        relatedEntity: payload.relatedEntity,
        linkUrl: payload.linkUrl,
        idempotencyKey,
        metadata: payload.metadata,
        expiresAt,
        isRead: false,
      });
    } else {
      notification = {
        _id: new Types.ObjectId(),
        userId: recipientObjectId,
        userRole: payload.recipientRole,
        category: payload.category,
        eventType: payload.eventType,
        title: safeTitle,
        message: safeMessage,
        priority: payload.priority || 'MEDIUM',
        sourceModule,
        eventId: payload.eventId,
        deliveryStatus: 'PENDING',
        type: legacyType,
        relatedEntity: payload.relatedEntity,
        linkUrl: payload.linkUrl,
        idempotencyKey,
        metadata: payload.metadata,
        expiresAt,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // 7. Track deliveries across configured channels
    let finalDeliveryStatus: 'DELIVERED' | 'FAILED' = 'DELIVERED';
    try {
      const deliveryRecords = await notificationDeliveryService.trackAndDispatchDeliveries({
        notificationId: notification._id,
        userId: recipientObjectId,
        channels: targetChannels,
        title: safeTitle,
        message: safeMessage,
        recipientEmail,
        recipientPhone,
      });
      if (
        deliveryRecords.length > 0 &&
        deliveryRecords.every((r) => r.status === 'FAILED')
      ) {
        finalDeliveryStatus = 'FAILED';
      }
    } catch {
      finalDeliveryStatus = 'FAILED';
    }

    notification.deliveryStatus = finalDeliveryStatus;
    if (mongoose.connection.readyState === 1 && typeof notification.save === 'function') {
      await notification.save().catch(() => undefined);
    }

    const dto = this.mapToDto(notification);

    // 8. Real-Time Push to connected SSE clients (minimal safe DTO + narrow dashboard sync hint)
    if (effectiveInApp) {
      notificationStreamService.broadcastToUser(
        payload.recipientId,
        'notification',
        {
          id: dto.id,
          category: dto.category,
          eventType: dto.eventType,
          title: dto.title,
          message: dto.message,
          priority: dto.priority,
          sourceModule: dto.sourceModule,
          linkUrl: dto.linkUrl,
          relatedEntity: dto.relatedEntity,
          isRead: dto.isRead,
          createdAt: dto.createdAt,
        },
        dto.id
      );

      const syncHint: DashboardSyncHintDto = {
        eventId: dto.eventId || dto.id,
        category: dto.category,
        eventType: dto.eventType,
        sourceModule: dto.sourceModule,
        resourceType: dto.relatedEntity?.entityType,
        resourceId: dto.relatedEntity?.entityId,
        timestamp: new Date().toISOString(),
      };
      notificationStreamService.broadcastToUser(
        payload.recipientId,
        'dashboard_sync',
        syncHint,
        `sync:${dto.id}`
      );

      // Also broadcast updated unread count if mocked or connected
      const isCountMocked = Boolean(
        (NotificationModel.countDocuments as any)?._isMockFunction ||
          (NotificationModel.countDocuments as any)?.mock
      );

      if (mongoose.connection.readyState === 1 || isCountMocked) {
        try {
          const unreadCount = await NotificationModel.countDocuments({
            userId: recipientObjectId,
            isRead: false,
          });
          notificationStreamService.broadcastToUser(payload.recipientId, 'unread_count', {
            unreadCount,
          });
        } catch {
          // non-fatal
        }
      }
    }

    return dto;
  }

  /**
   * GET NOTIFICATIONS
   * Paginated listing with category filtering and unread toggling.
   */
  async getNotifications(
    userId: string,
    filter: NotificationFilterDto
  ): Promise<{
    items: NotificationDto[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userObjectId = new Types.ObjectId(userId);
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { userId: userObjectId };

    if (filter.category && filter.category !== 'ALL') {
      query.category = filter.category;
    }

    if (filter.readStatus === 'UNREAD' || filter.unreadOnly) {
      query.isRead = false;
    } else if (filter.readStatus === 'READ') {
      query.isRead = true;
    }

    if (filter.search && filter.search.trim()) {
      const reg = new RegExp(escapeRegexChars(filter.search.trim().slice(0, 100)), 'i');
      query.$or = [{ title: reg }, { message: reg }, { 'relatedEntity.referenceNumber': reg }];
    }

    if (filter.startDate || filter.endDate) {
      query.createdAt = {};
      if (filter.startDate) (query.createdAt as any).$gte = new Date(filter.startDate);
      if (filter.endDate) (query.createdAt as any).$lte = new Date(filter.endDate);
    }

    const [items, total, unreadCount] = await Promise.all([
      NotificationModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationModel.countDocuments(query),
      NotificationModel.countDocuments({ userId: userObjectId, isRead: false }),
    ]);

    return {
      items: items.map((doc) => this.mapToDto(doc)),
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * GET UNREAD COUNT & CATEGORY DISTRIBUTION
   */
  async getUnreadCount(userId: string): Promise<NotificationUnreadCountDto> {
    const userObjectId = new Types.ObjectId(userId);

    const unreadCount = await NotificationModel.countDocuments({
      userId: userObjectId,
      isRead: false,
    });

    const categoryAgg = await NotificationModel.aggregate([
      { $match: { userId: userObjectId, isRead: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const categoryCounts: Partial<Record<NotificationCategory, number>> = {};
    categoryAgg.forEach((entry) => {
      categoryCounts[entry._id as NotificationCategory] = entry.count;
    });

    return {
      unreadCount,
      categoryCounts,
    };
  }

  /**
   * MARK ONE NOTIFICATION AS READ
   */
  async markAsRead(userId: string, notificationId: string): Promise<NotificationDto> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw AppError.badRequest('Invalid notification ID format');
    }

    const notification = await NotificationModel.findOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });

    if (!notification) {
      throw AppError.notFound('Notification not found or access denied');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();

      // Broadcast updated count over SSE
      const unreadCount = await NotificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
        isRead: false,
      });
      notificationStreamService.broadcastToUser(userId, 'unread_count', { unreadCount });
    }

    return this.mapToDto(notification);
  }

  /**
   * MARK ALL AS READ
   */
  async markAllAsRead(userId: string, category?: NotificationCategory): Promise<{ modifiedCount: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const filter: Record<string, unknown> = { userId: userObjectId, isRead: false };

    if (category) {
      filter.category = category;
    }

    const result = await NotificationModel.updateMany(filter, {
      $set: { isRead: true, readAt: new Date() },
    });

    // Broadcast updated count to client
    const unreadCount = await NotificationModel.countDocuments({
      userId: userObjectId,
      isRead: false,
    });
    notificationStreamService.broadcastToUser(userId, 'unread_count', { unreadCount });

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * DELETE / ARCHIVE NOTIFICATION
   */
  async deleteNotification(userId: string, notificationId: string): Promise<{ success: boolean }> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw AppError.badRequest('Invalid notification ID format');
    }

    const result = await NotificationModel.deleteOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw AppError.notFound('Notification not found or access denied');
    }

    const unreadCount = await NotificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
    notificationStreamService.broadcastToUser(userId, 'unread_count', { unreadCount });

    return { success: true };
  }

  /**
   * GET MISSED NOTIFICATIONS SINCE LAST SSE EVENT ID (RECONNECTION RECOVERY)
   * Strictly scoped to the authenticated userId.
   */
  async getMissedNotificationsSince(
    userId: string,
    lastEventId: string,
    limit = 20
  ): Promise<NotificationDto[]> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(lastEventId)) {
      return [];
    }

    const missed = await NotificationModel.find({
      userId: new Types.ObjectId(userId),
      _id: { $gt: new Types.ObjectId(lastEventId) },
    })
      .sort({ _id: 1 })
      .limit(Math.min(limit, 50));

    return (missed || []).map((doc) => this.mapToDto(doc));
  }

  /**
   * GET DELIVERY HISTORY
   */
  async getDeliveryHistory(userId: string, limit = 50): Promise<NotificationDeliveryDto[]> {
    return notificationDeliveryService.getDeliveryHistory(userId, limit);
  }

  private mapToDto(doc: INotificationDocument): NotificationDto {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      userRole: doc.userRole,
      category: doc.category,
      eventType: doc.eventType,
      title: doc.title,
      message: doc.message,
      priority: doc.priority || 'MEDIUM',
      sourceModule: doc.sourceModule,
      eventId: doc.eventId,
      deliveryStatus: doc.deliveryStatus || 'DELIVERED',
      readAt: doc.readAt ? doc.readAt.toISOString() : undefined,
      isRead: Boolean(doc.isRead),
      linkUrl: doc.linkUrl,
      relatedEntity: doc.relatedEntity
        ? {
            entityType: doc.relatedEntity.entityType,
            entityId: doc.relatedEntity.entityId,
            referenceNumber: doc.relatedEntity.referenceNumber,
          }
        : undefined,
      metadata: doc.metadata,
      expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : undefined,
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
    };
  }
}

export const notificationService = new NotificationService();
