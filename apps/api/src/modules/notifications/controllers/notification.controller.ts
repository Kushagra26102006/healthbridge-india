import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { notificationPreferenceService } from '../services/notification-preference.service';
import { notificationStreamService } from '../services/notification-stream.service';
import { sendSuccess } from '../../../utils/api-response';
import type {
  NotificationFilterDto,
  UpdateUserNotificationPreferencesDto,
  NotificationCategory,
  NotificationEventPayload,
} from '@healthbridge/shared-types';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   */
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await notificationService.getNotifications(
        userId,
        req.query as unknown as NotificationFilterDto
      );
      sendSuccess(res, result, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await notificationService.getUnreadCount(userId);
      sendSuccess(res, result, 'Unread notification count retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/stream
   * Real-Time Server-Sent Events (SSE) Stream
   */
  async streamNotifications(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    notificationStreamService.addClient(userId, res);
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const notification = await notificationService.markAsRead(userId, req.params.id as string);
      sendSuccess(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/notifications/mark-all-read
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const category = (req.query.category || req.body?.category) as NotificationCategory | undefined;
      const result = await notificationService.markAllAsRead(userId, category);
      sendSuccess(res, result, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/notifications/:id
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await notificationService.deleteNotification(userId, req.params.id as string);
      sendSuccess(res, result, 'Notification removed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/preferences
   */
  async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const prefs = await notificationPreferenceService.getPreferences(user.userId, user.role);
      sendSuccess(res, prefs, 'Notification preferences retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/notifications/preferences
   */
  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const prefs = await notificationPreferenceService.updatePreferences(
        user.userId,
        user.role,
        req.body as UpdateUserNotificationPreferencesDto
      );
      sendSuccess(res, prefs, 'Notification preferences updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/notifications/preferences/reset
   */
  async resetPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const prefs = await notificationPreferenceService.restoreDefaults(user.userId, user.role);
      sendSuccess(res, prefs, 'Notification preferences reset to defaults');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/delivery-history
   */
  async getDeliveryHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const limit = Number(req.query.limit) || 50;
      const history = await notificationService.getDeliveryHistory(userId, limit);
      sendSuccess(res, history, 'Notification delivery history retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/notifications/events
   * Internal / Administrative Event Ingestion
   */
  async publishEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notification = await notificationService.publishEvent(
        req.body as NotificationEventPayload
      );
      sendSuccess(res, notification, 'Notification event processed successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
