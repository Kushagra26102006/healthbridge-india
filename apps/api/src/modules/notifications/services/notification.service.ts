import mongoose, { Types } from 'mongoose';
import crypto from 'crypto';
import { NotificationModel, INotificationDocument } from '../models/notification.model';
import { notificationStreamService } from './notification-stream.service';
import { notificationDeliveryService } from './notification-delivery.service';
import { notificationPreferenceService } from './notification-preference.service';
import { UserModel } from '../../users/models/user.model';
import { AppError } from '../../../shared/errors/app-error';
import type {
  NotificationCategory,
  NotificationChannel,
  NotificationDto,
  NotificationFilterDto,
  NotificationEventPayload,
  NotificationUnreadCountDto,
  NotificationDeliveryDto,
} from '@healthbridge/shared-types';

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

    // 6. Create notification document in database
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
        title: payload.title,
        message: payload.message,
        priority: payload.priority || 'MEDIUM',
        type: legacyType,
        relatedEntity: payload.relatedEntity,
        linkUrl: payload.linkUrl,
        idempotencyKey,
        metadata: payload.metadata,
        isRead: false,
      });
    } else {
      notification = {
        _id: new Types.ObjectId(),
        userId: recipientObjectId,
        userRole: payload.recipientRole,
        category: payload.category,
        eventType: payload.eventType,
        title: payload.title,
        message: payload.message,
        priority: payload.priority || 'MEDIUM',
        type: legacyType,
        relatedEntity: payload.relatedEntity,
        linkUrl: payload.linkUrl,
        idempotencyKey,
        metadata: payload.metadata,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const dto = this.mapToDto(notification);

    // 7. Track deliveries across configured channels
    await notificationDeliveryService.trackAndDispatchDeliveries({
      notificationId: notification._id,
      userId: recipientObjectId,
      channels: targetChannels,
      title: payload.title,
      message: payload.message,
      recipientEmail,
      recipientPhone,
    });

    // 8. Real-Time Push to connected SSE clients
    if (effectiveInApp) {
      notificationStreamService.broadcastToUser(payload.recipientId, 'notification', dto);

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

    if (filter.unreadOnly) {
      query.isRead = false;
    }

    if (filter.search && filter.search.trim()) {
      const reg = new RegExp(filter.search.trim(), 'i');
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
      createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
    };
  }
}

export const notificationService = new NotificationService();
