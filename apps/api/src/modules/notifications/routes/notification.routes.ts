import { Router, Request, Response, NextFunction } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateRequest } from '../../../middleware/validate';
import { createRateLimiter } from '../../../middleware/rate-limit';
import { AppError } from '../../../shared/errors/app-error';
import {
  notificationFilterSchema,
  updateUserNotificationPreferencesSchema,
  notificationIdParamSchema,
  createNotificationEventSchema,
} from '@healthbridge/validation';

/**
 * Security Guard (Day 8 Task 04):
 * Access tokens MUST NEVER be accepted via URL query strings (`?token=` or `?access_token=`).
 * SSE streams authenticate securely via HTTP-only session cookies (`withCredentials: true`)
 * or standard `Authorization: Bearer` headers.
 */
const rejectUrlAccessToken = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.query && (req.query.token !== undefined || req.query.access_token !== undefined)) {
    return next(
      AppError.unauthorized(
        'Access tokens in URL query parameters are prohibited. Authenticate using HTTP-only cookies or Authorization header.'
      )
    );
  }
  next();
};

const notificationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute sliding window
  max: 180,
  message: 'Too many notification requests. Please wait briefly before retrying.',
  keyGenerator: (req: Request) =>
    req.user?.userId
      ? `notif:user:${req.user.userId}`
      : `notif:ip:${req.ip || req.socket.remoteAddress || 'unknown'}`,
});

export const notificationRoutes = Router();

// Reject URL tokens BEFORE authentication, then require strict JWT session & rate limiting
notificationRoutes.use(rejectUrlAccessToken);
notificationRoutes.use(authenticate);
notificationRoutes.use(notificationRateLimiter);

/**
 * @route   GET /api/v1/notifications/stream
 * @desc    Establish Server-Sent Events (SSE) live notification stream
 * @access  Private (All authenticated roles, scoped strictly to req.user.userId)
 */
notificationRoutes.get('/stream', (req, res) =>
  notificationController.streamNotifications(req, res)
);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get total unread count and category breakdown
 * @access  Private (All authenticated roles)
 */
notificationRoutes.get('/unread-count', (req, res, next) =>
  notificationController.getUnreadCount(req, res, next)
);

/**
 * @route   GET /api/v1/notifications/preferences
 * @desc    Get user notification and communication preferences + configured channels
 * @access  Private (All authenticated roles)
 */
notificationRoutes.get('/preferences', (req, res, next) =>
  notificationController.getPreferences(req, res, next)
);

/**
 * @route   PATCH /api/v1/notifications/preferences
 * @route   PUT /api/v1/notifications/preferences
 * @desc    Update notification channels and category preferences
 * @access  Private (All authenticated roles)
 */
notificationRoutes.patch(
  '/preferences',
  validateRequest({ body: updateUserNotificationPreferencesSchema }),
  (req, res, next) => notificationController.updatePreferences(req, res, next)
);
notificationRoutes.put(
  '/preferences',
  validateRequest({ body: updateUserNotificationPreferencesSchema }),
  (req, res, next) => notificationController.updatePreferences(req, res, next)
);

/**
 * @route   POST /api/v1/notifications/preferences/reset
 * @desc    Reset notification preferences to default configuration
 * @access  Private (All authenticated roles)
 */
notificationRoutes.post('/preferences/reset', (req, res, next) =>
  notificationController.resetPreferences(req, res, next)
);

/**
 * @route   GET /api/v1/notifications/delivery-history
 * @desc    Get notification delivery logs and tracking details
 * @access  Private (All authenticated roles)
 */
notificationRoutes.get('/delivery-history', (req, res, next) =>
  notificationController.getDeliveryHistory(req, res, next)
);

/**
 * @route   POST /api/v1/notifications/mark-all-read
 * @route   PATCH /api/v1/notifications/mark-all-read
 * @route   PATCH /api/v1/notifications/read-all
 * @route   POST /api/v1/notifications/read-all
 * @desc    Mark all unread notifications (or per category) as read
 * @access  Private (All authenticated roles)
 */
notificationRoutes.post('/mark-all-read', (req, res, next) =>
  notificationController.markAllAsRead(req, res, next)
);
notificationRoutes.patch('/mark-all-read', (req, res, next) =>
  notificationController.markAllAsRead(req, res, next)
);
notificationRoutes.patch('/read-all', (req, res, next) =>
  notificationController.markAllAsRead(req, res, next)
);
notificationRoutes.post('/read-all', (req, res, next) =>
  notificationController.markAllAsRead(req, res, next)
);

/**
 * @route   POST /api/v1/notifications/events
 * @desc    Publish an operational notification event (strictly ADMIN-only)
 * @access  Private (ADMIN only — non-admin clients cannot forge notifications to other users)
 */
notificationRoutes.post(
  '/events',
  authorize(['ADMIN']),
  validateRequest({ body: createNotificationEventSchema }),
  (req, res, next) => notificationController.publishEvent(req, res, next)
);

/**
 * @route   GET /api/v1/notifications
 * @desc    List notifications for current user with filtering and pagination
 * @access  Private (All authenticated roles)
 */
notificationRoutes.get(
  '/',
  validateRequest({ query: notificationFilterSchema }),
  (req, res, next) => notificationController.getNotifications(req, res, next)
);

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark specific notification as read
 * @access  Private (All authenticated roles)
 */
notificationRoutes.patch(
  '/:id/read',
  validateRequest({ params: notificationIdParamSchema }),
  (req, res, next) => notificationController.markAsRead(req, res, next)
);

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete/dismiss a notification
 * @access  Private (All authenticated roles)
 */
notificationRoutes.delete(
  '/:id',
  validateRequest({ params: notificationIdParamSchema }),
  (req, res, next) => notificationController.deleteNotification(req, res, next)
);

export default notificationRoutes;
