import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  NotificationModel,
  NotificationPreferenceModel,
  NotificationDeliveryModel,
  AuditLogModel,
} from '../../src/database/models';
import { notificationService } from '../../src/modules/notifications/services/notification.service';
import { notificationStreamService } from '../../src/modules/notifications/services/notification-stream.service';
import type { NotificationCategory, NotificationEventType } from '@healthbridge/shared-types';

describe('Pharmacy & Patient Notification Center, Preferences & Real-Time Alerts (Day 5 Task 06)', () => {
  const app = createApp();

  const pharmacyUserId = new Types.ObjectId().toString();
  const otherPharmacyUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();
  const otherPatientUserId = new Types.ObjectId().toString();
  const doctorUserId = new Types.ObjectId().toString();

  const pharmacyToken = tokenService.generateAccessToken({
    _id: pharmacyUserId,
    role: 'PHARMACY',
    email: 'apollo.rx@healthbridge.in',
  } as any);

  const otherPharmacyToken = tokenService.generateAccessToken({
    _id: otherPharmacyUserId,
    role: 'PHARMACY',
    email: 'medplus.rx@healthbridge.in',
  } as any);

  const patientToken = tokenService.generateAccessToken({
    _id: patientUserId,
    role: 'PATIENT',
    email: 'patient.arjun@healthbridge.in',
  } as any);

  const otherPatientToken = tokenService.generateAccessToken({
    _id: otherPatientUserId,
    role: 'PATIENT',
    email: 'patient.priya@healthbridge.in',
  } as any);

  const doctorToken = tokenService.generateAccessToken({
    _id: doctorUserId,
    role: 'DOCTOR',
    email: 'dr.sharma@healthbridge.in',
  } as any);

  const mockPharmacyUser = {
    _id: new Types.ObjectId(pharmacyUserId),
    id: pharmacyUserId,
    name: 'Apollo Pharmacy',
    fullName: 'Apollo Pharmacy',
    email: 'apollo.rx@healthbridge.in',
    phone: '9845012345',
    role: 'PHARMACY',
    accountStatus: 'ACTIVE',
  };

  const mockOtherPharmacyUser = {
    _id: new Types.ObjectId(otherPharmacyUserId),
    id: otherPharmacyUserId,
    name: 'MedPlus Pharmacy',
    fullName: 'MedPlus Pharmacy',
    email: 'medplus.rx@healthbridge.in',
    phone: '9845099999',
    role: 'PHARMACY',
    accountStatus: 'ACTIVE',
  };

  const mockPatientUser = {
    _id: new Types.ObjectId(patientUserId),
    id: patientUserId,
    name: 'Arjun Mehta',
    fullName: 'Arjun Mehta',
    email: 'patient.arjun@healthbridge.in',
    phone: '9876543210',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
  };

  const mockOtherPatientUser = {
    _id: new Types.ObjectId(otherPatientUserId),
    id: otherPatientUserId,
    name: 'Priya Sharma',
    fullName: 'Priya Sharma',
    email: 'patient.priya@healthbridge.in',
    phone: '9876549999',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
  };

  const createQueryMock = (data: any) => {
    const q: any = {
      populate: vi.fn().mockImplementation(() => q),
      sort: vi.fn().mockImplementation(() => q),
      skip: vi.fn().mockImplementation(() => q),
      limit: vi.fn().mockImplementation(() => q),
      lean: vi.fn().mockResolvedValue(data),
      exec: vi.fn().mockResolvedValue(data),
      then: (resolve: any) => Promise.resolve(data).then(resolve),
    };
    return q;
  };

  const createMockNotificationDoc = (overrides: Record<string, any> = {}) => {
    const notifId = overrides._id || new Types.ObjectId();
    const doc: any = {
      _id: notifId,
      id: notifId.toString(),
      userId: overrides.userId || new Types.ObjectId(pharmacyUserId),
      userRole: overrides.userRole || 'PHARMACY',
      category: overrides.category || 'ORDER',
      eventType: overrides.eventType || 'ORDER_CREATED',
      title: overrides.title || 'New Pharmacy Order Received',
      message: overrides.message || 'Order #ORD-1001 submitted for prescription #RX-2001.',
      priority: overrides.priority || 'HIGH',
      isRead: overrides.isRead ?? false,
      readAt: overrides.readAt || null,
      type: overrides.type || 'PRESCRIPTION',
      relatedEntity: overrides.relatedEntity || {
        entityType: 'ORDER',
        entityId: 'ord-1001',
        referenceNumber: 'ORD-1001',
      },
      linkUrl: overrides.linkUrl || '/pharmacy/orders',
      idempotencyKey: overrides.idempotencyKey || 'test-key-' + notifId.toString(),
      metadata: overrides.metadata || {},
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
    return doc;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString();
      if (idStr === pharmacyUserId) return Promise.resolve(mockPharmacyUser as any);
      if (idStr === otherPharmacyUserId) return Promise.resolve(mockOtherPharmacyUser as any);
      if (idStr === patientUserId) return Promise.resolve(mockPatientUser as any);
      if (idStr === otherPatientUserId) return Promise.resolve(mockOtherPatientUser as any);
      return Promise.resolve(null);
    }) as any);

    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(NotificationModel, 'countDocuments').mockResolvedValue(0);
    vi.spyOn(NotificationDeliveryModel, 'countDocuments').mockResolvedValue(0);
    vi.spyOn(NotificationDeliveryModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(NotificationPreferenceModel, 'create').mockImplementation(((data: any) => {
      const doc: any = {
        _id: new Types.ObjectId(),
        userId: data.userId,
        userRole: data.userRole || 'PHARMACY',
        channels: data.channels || { inApp: true, email: true, sms: true },
        categoryPreferences: data.categoryPreferences || {},
        mandatoryCategories: data.mandatoryCategories || ['SECURITY'],
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };
      return Promise.resolve(doc);
    }) as any);
  });

  /* ==========================================================================
     1. NOTIFICATION LISTING & PAGINATION TESTS
     ========================================================================== */
  describe('Notification Listing & Filtering (GET /api/v1/notifications)', () => {
    it('should list notifications for authenticated pharmacy with pagination', async () => {
      const notif1 = createMockNotificationDoc({ title: 'Alert 1' });
      const notif2 = createMockNotificationDoc({ title: 'Alert 2' });

      vi.spyOn(NotificationModel, 'find').mockReturnValue(createQueryMock([notif1, notif2]));
      vi.spyOn(NotificationModel, 'countDocuments').mockResolvedValue(2);

      const res = await request(app)
        .get('/api/v1/notifications?page=1&limit=10')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.page).toBe(1);
    });

    it('should filter notifications by category', async () => {
      const notif = createMockNotificationDoc({ category: 'INVENTORY' });
      const findSpy = vi.spyOn(NotificationModel, 'find').mockReturnValue(createQueryMock([notif]));
      vi.spyOn(NotificationModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/notifications?category=INVENTORY')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items[0].category).toBe('INVENTORY');
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'INVENTORY',
        })
      );
    });

    it('should filter notifications by unreadOnly flag', async () => {
      const notif = createMockNotificationDoc({ isRead: false });
      const findSpy = vi.spyOn(NotificationModel, 'find').mockReturnValue(createQueryMock([notif]));
      vi.spyOn(NotificationModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isRead: false,
        })
      );
    });

    it('should search notifications by keyword matching title or message', async () => {
      const notif = createMockNotificationDoc({ title: 'Low Stock Alert' });
      const findSpy = vi.spyOn(NotificationModel, 'find').mockReturnValue(createQueryMock([notif]));
      vi.spyOn(NotificationModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/notifications?search=stock')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            expect.objectContaining({ title: expect.any(RegExp) }),
            expect.objectContaining({ message: expect.any(RegExp) }),
          ]),
        })
      );
    });
  });

  /* ==========================================================================
     2. UNREAD COUNT AGGREGATION TESTS
     ========================================================================== */
  describe('Unread Count Aggregation (GET /api/v1/notifications/unread-count)', () => {
    it('should return aggregated unread counts total and by category', async () => {
      vi.spyOn(NotificationModel, 'countDocuments').mockResolvedValue(5);
      vi.spyOn(NotificationModel, 'aggregate').mockResolvedValue([
        { _id: 'ORDER', count: 3 },
        { _id: 'INVENTORY', count: 2 },
      ]);

      const res = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBe(5);
      expect(res.body.data.categoryCounts.ORDER).toBe(3);
      expect(res.body.data.categoryCounts.INVENTORY).toBe(2);
      expect(res.body.data.categoryCounts.PRESCRIPTION).toBeUndefined();
    });
  });

  /* ==========================================================================
     3. READ / UNREAD LIFECYCLE TESTS
     ========================================================================== */
  describe('Read / Unread Lifecycle', () => {
    it('should mark a single notification as read', async () => {
      const notifId = new Types.ObjectId();
      const mockDoc = createMockNotificationDoc({ _id: notifId, isRead: false });

      vi.spyOn(NotificationModel, 'findOne').mockResolvedValue(mockDoc as any);
      vi.spyOn(NotificationModel, 'countDocuments').mockResolvedValue(0);

      const res = await request(app)
        .patch(`/api/v1/notifications/${notifId.toString()}/read`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDoc.isRead).toBe(true);
      expect(mockDoc.readAt).toBeInstanceOf(Date);
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('should return 404 when marking a non-existent notification as read', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      vi.spyOn(NotificationModel, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/v1/notifications/${nonExistentId}/read`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should mark all notifications as read for current user via PATCH /mark-all-read', async () => {
      const updateManySpy = vi.spyOn(NotificationModel, 'updateMany').mockResolvedValue({
        matchedCount: 4,
        modifiedCount: 4,
      } as any);
      vi.spyOn(NotificationModel, 'countDocuments').mockResolvedValue(0);

      const res = await request(app)
        .patch('/api/v1/notifications/mark-all-read')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.modifiedCount).toBe(4);
      expect(updateManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: new Types.ObjectId(pharmacyUserId),
          isRead: false,
        }),
        expect.objectContaining({
          $set: expect.objectContaining({ isRead: true }),
        })
      );
    });

    it('should mark all notifications of a specific category as read via POST /mark-all-read', async () => {
      const updateManySpy = vi.spyOn(NotificationModel, 'updateMany').mockResolvedValue({
        matchedCount: 2,
        modifiedCount: 2,
      } as any);
      vi.spyOn(NotificationModel, 'countDocuments').mockResolvedValue(0);

      const res = await request(app)
        .post('/api/v1/notifications/mark-all-read')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({ category: 'ORDER' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(updateManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: new Types.ObjectId(pharmacyUserId),
          category: 'ORDER',
          isRead: false,
        }),
        expect.any(Object)
      );
    });
  });

  /* ==========================================================================
     4. NOTIFICATION DELETION & AUTHORIZATION TESTS
     ========================================================================== */
  describe('Notification Deletion (DELETE /api/v1/notifications/:id)', () => {
    it('should delete a notification belonging to the authenticated user', async () => {
      const notifId = new Types.ObjectId();
      vi.spyOn(NotificationModel, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as any);
      vi.spyOn(NotificationModel, 'countDocuments').mockResolvedValue(0);

      const res = await request(app)
        .delete(`/api/v1/notifications/${notifId.toString()}`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.success).toBe(true);
    });

    it('should return 404 when deleting a notification not owned by user', async () => {
      const notifId = new Types.ObjectId();
      vi.spyOn(NotificationModel, 'deleteOne').mockResolvedValue({ deletedCount: 0 } as any);

      const res = await request(app)
        .delete(`/api/v1/notifications/${notifId.toString()}`)
        .set('Authorization', `Bearer ${otherPharmacyToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     5. COMMUNICATION PREFERENCES LIFECYCLE TESTS
     ========================================================================== */
  describe('Communication Preferences Management', () => {
    it('should return default preferences if user has no saved record', async () => {
      vi.spyOn(NotificationPreferenceModel, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(pharmacyUserId);
      expect(res.body.data.channels.inApp).toBe(true);
      expect(res.body.data.channels.email).toBe(true);
      expect(res.body.data.mandatoryCategories).toContain('SECURITY');
    });

    it('should update communication channel and category preferences', async () => {
      const mockPrefDoc: any = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(pharmacyUserId),
        userRole: 'PHARMACY',
        channels: { inApp: true, email: true, sms: false },
        categoryPreferences: {
          ORDER: { inApp: true, email: false, sms: false },
          SECURITY: { inApp: true, email: true, sms: false },
        },
        mandatoryCategories: ['SECURITY'],
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(NotificationPreferenceModel, 'findOne').mockResolvedValue(mockPrefDoc);

      const res = await request(app)
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          channels: { inApp: true, email: false, sms: false },
          categoryPreferences: {
            ORDER: { inApp: true, email: false, sms: false },
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockPrefDoc.channels.email).toBe(false);
      expect(mockPrefDoc.save).toHaveBeenCalled();
    });

    it('should reset user preferences to standard defaults', async () => {
      const mockExistingPref: any = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(pharmacyUserId),
        channels: { inApp: false, email: false, sms: false },
        categoryPreferences: {},
        mandatoryCategories: ['SECURITY'],
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(NotificationPreferenceModel, 'findOne').mockResolvedValue(mockExistingPref);

      const res = await request(app)
        .post('/api/v1/notifications/preferences/reset')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockExistingPref.save).toHaveBeenCalled();
      expect(res.body.data.channels.inApp).toBe(true);
    });
  });

  /* ==========================================================================
     6. MANDATORY SECURITY ALERT ENFORCEMENT TESTS
     ========================================================================== */
  describe('Mandatory Security Alert Policy Enforcement', () => {
    it('should reject disabling inApp notifications for mandatory SECURITY category', async () => {
      const mockPrefDoc: any = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(pharmacyUserId),
        userRole: 'PHARMACY',
        channels: { inApp: true, email: true, sms: false },
        categoryPreferences: {},
        mandatoryCategories: ['SECURITY'],
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(NotificationPreferenceModel, 'findOne').mockResolvedValue(mockPrefDoc);

      const res = await request(app)
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          categoryPreferences: {
            SECURITY: { inApp: false, email: true, sms: false },
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/mandatory/i);
    });

    it('should reject disabling email notifications for mandatory SECURITY category', async () => {
      const mockPrefDoc: any = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(pharmacyUserId),
        userRole: 'PHARMACY',
        channels: { inApp: true, email: true, sms: false },
        categoryPreferences: {},
        mandatoryCategories: ['SECURITY'],
        save: vi.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      vi.spyOn(NotificationPreferenceModel, 'findOne').mockResolvedValue(mockPrefDoc);

      const res = await request(app)
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${pharmacyToken}`)
        .send({
          categoryPreferences: {
            SECURITY: { inApp: true, email: false, sms: false },
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/mandatory/i);
    });
  });

  /* ==========================================================================
     7. MULTI-TENANCY & AUTHORIZATION SECURITY TESTS
     ========================================================================== */
  describe('Multi-Tenancy & Authorization Security', () => {
    it('should strictly isolate notifications between patient A and patient B', async () => {
      const patientNotif = createMockNotificationDoc({
        userId: new Types.ObjectId(patientUserId),
        userRole: 'PATIENT',
        title: 'Patient Arjun Notification',
      });

      const findSpy = vi.spyOn(NotificationModel, 'find').mockReturnValue(createQueryMock([patientNotif]));
      vi.spyOn(NotificationModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: new Types.ObjectId(patientUserId),
        })
      );
    });

    it('should reject requests without authorization header with 401', async () => {
      const res = await request(app).get('/api/v1/notifications');
      expect(res.status).toBe(401);
    });

    it('should reject invalid or malformed tokens with 401', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', 'Bearer invalid-token-xyz');
      expect(res.status).toBe(401);
    });

    it('should prevent marking another user notification as read', async () => {
      const notifId = new Types.ObjectId();
      vi.spyOn(NotificationModel, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/v1/notifications/${notifId.toString()}/read`)
        .set('Authorization', `Bearer ${otherPatientToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     8. EVENT PUBLISHING & IDEMPOTENCY DEDUPLICATION TESTS
     ========================================================================== */
  describe('Event Publishing & Idempotent Deduplication', () => {
    it('should create notification and deliver to active channels', async () => {
      const notifId = new Types.ObjectId();
      const mockCreated = createMockNotificationDoc({
        _id: notifId,
        category: 'ORDER',
        eventType: 'ORDER_CREATED',
        title: 'New Pharmacy Order',
      });

      vi.spyOn(NotificationModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(NotificationModel, 'create').mockResolvedValue(mockCreated as any);
      vi.spyOn(NotificationPreferenceModel, 'findOne').mockResolvedValue(null);

      const result = await notificationService.publishEvent({
        recipientId: pharmacyUserId,
        recipientRole: 'PHARMACY',
        category: 'ORDER',
        eventType: 'ORDER_CREATED',
        title: 'New Pharmacy Order',
        message: 'Order #ORD-9999 has been placed.',
        priority: 'HIGH',
        relatedEntity: {
          entityType: 'ORDER',
          entityId: 'ord-9999',
          referenceNumber: 'ORD-9999',
        },
      });

      expect(result).not.toBeNull();
      expect(result?.title).toBe('New Pharmacy Order');
      expect(result?.category).toBe('ORDER');
      expect(NotificationDeliveryModel.create).toHaveBeenCalled();
    });

    it('should suppress duplicate notifications via deterministic idempotency key', async () => {
      const notifId = new Types.ObjectId();
      const existingDoc = createMockNotificationDoc({
        _id: notifId,
        idempotencyKey: 'existing-key',
        title: 'Low Stock Alert',
      });

      vi.spyOn(NotificationModel, 'findOne').mockResolvedValue(existingDoc as any);
      const createSpy = vi.spyOn(NotificationModel, 'create');

      const result = await notificationService.publishEvent({
        recipientId: pharmacyUserId,
        recipientRole: 'PHARMACY',
        category: 'INVENTORY',
        eventType: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: 'Paracetamol 500mg batch #BATCH-12 is low in stock.',
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe(notifId.toString());
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should discard notification if all channels are disabled and category is non-mandatory', async () => {
      const mockDisabledPrefs: any = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(patientUserId),
        userRole: 'PATIENT',
        channels: { inApp: false, email: false, sms: false },
        categoryPreferences: {
          ORDER: { inApp: false, email: false, sms: false },
        },
        mandatoryCategories: ['SECURITY'],
      };

      vi.spyOn(NotificationModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(NotificationPreferenceModel, 'findOne').mockResolvedValue(mockDisabledPrefs);
      const createSpy = vi.spyOn(NotificationModel, 'create');

      const result = await notificationService.publishEvent({
        recipientId: patientUserId,
        recipientRole: 'PATIENT',
        category: 'ORDER',
        eventType: 'ORDER_PROCESSING',
        title: 'Order Processing',
        message: 'Your order is being processed.',
      });

      expect(result).toBeNull();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should always dispatch mandatory SECURITY notification even if channels are disabled', async () => {
      const mockDisabledPrefs: any = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(pharmacyUserId),
        userRole: 'PHARMACY',
        channels: { inApp: false, email: false, sms: false },
        categoryPreferences: {},
        mandatoryCategories: ['SECURITY'],
      };

      const notifId = new Types.ObjectId();
      const mockCreated = createMockNotificationDoc({
        _id: notifId,
        category: 'SECURITY',
        eventType: 'LOGIN_ALERT',
        title: 'New Login Detected',
      });

      vi.spyOn(NotificationModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(NotificationPreferenceModel, 'findOne').mockResolvedValue(mockDisabledPrefs);
      vi.spyOn(NotificationModel, 'create').mockResolvedValue(mockCreated as any);

      const result = await notificationService.publishEvent({
        recipientId: pharmacyUserId,
        recipientRole: 'PHARMACY',
        category: 'SECURITY',
        eventType: 'LOGIN_ALERT',
        title: 'New Login Detected',
        message: 'A new login from Chrome on macOS was detected.',
        priority: 'HIGH',
      });

      expect(result).not.toBeNull();
      expect(result?.category).toBe('SECURITY');
      expect(NotificationModel.create).toHaveBeenCalled();
    });
  });

  /* ==========================================================================
     9. CHANNEL DELIVERY TRACKING & AUDIT TESTS
     ========================================================================== */
  describe('Channel Delivery Tracking & History (GET /api/v1/notifications/delivery-history)', () => {
    it('should list delivery records for notifications belonging to current user', async () => {
      const mockDelivery = {
        _id: new Types.ObjectId(),
        notificationId: new Types.ObjectId(),
        userId: new Types.ObjectId(pharmacyUserId),
        channel: 'IN_APP',
        status: 'DELIVERED',
        attemptCount: 1,
        deliveredAt: new Date(),
        createdAt: new Date(),
      };

      vi.spyOn(NotificationDeliveryModel, 'find').mockReturnValue(createQueryMock([mockDelivery]));
      vi.spyOn(NotificationDeliveryModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/notifications/delivery-history')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].channel).toBe('IN_APP');
      expect(res.body.data[0].status).toBe('DELIVERED');
    });

    it('should filter delivery history by delivery status', async () => {
      const mockDelivery = {
        _id: new Types.ObjectId(),
        channel: 'EMAIL',
        status: 'SENT',
        attemptCount: 1,
      };

      const findSpy = vi
        .spyOn(NotificationDeliveryModel, 'find')
        .mockReturnValue(createQueryMock([mockDelivery]));
      vi.spyOn(NotificationDeliveryModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/notifications/delivery-history?status=SENT')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(findSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: new Types.ObjectId(pharmacyUserId),
        })
      );
    });
  });

  /* ==========================================================================
     10. REAL-TIME SSE STREAM HANDSHAKE & AUTHENTICATION TESTS
     ========================================================================== */
  describe('Real-Time SSE Stream Handshake & Authentication', () => {
    it('should establish SSE stream connection with appropriate headers', async () => {
      const addClientSpy = vi
        .spyOn(notificationStreamService, 'addClient')
        .mockImplementation((userId: string, res: any) => {
          res.write('event: connected\ndata: {"status":"connected"}\n\n');
          res.end();
        });

      const res = await request(app)
        .get('/api/v1/notifications/stream')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toMatch(/text\/event-stream/);
      expect(addClientSpy).toHaveBeenCalledWith(pharmacyUserId, expect.anything());
    });

    it('should authenticate SSE stream using query parameter token for EventSource', async () => {
      const addClientSpy = vi
        .spyOn(notificationStreamService, 'addClient')
        .mockImplementation((userId: string, res: any) => {
          res.write('event: connected\ndata: {"status":"connected"}\n\n');
          res.end();
        });

      const res = await request(app)
        .get(`/api/v1/notifications/stream?token=${patientToken}`);

      expect(res.status).toBe(200);
      expect(addClientSpy).toHaveBeenCalledWith(patientUserId, expect.anything());
    });

    it('should reject unauthenticated SSE stream connection', async () => {
      const res = await request(app).get('/api/v1/notifications/stream');
      expect(res.status).toBe(401);
    });
  });

  /* ==========================================================================
     11. CROSS-MODULE EVENT DISPATCH VERIFICATION
     ========================================================================== */
  describe('Cross-Module Notification Event Catalogue Verification', () => {
    const testCases: Array<{
      category: NotificationCategory;
      eventType: NotificationEventType;
      title: string;
    }> = [
      { category: 'PRESCRIPTION', eventType: 'PRESCRIPTION_RECEIVED', title: 'New Prescription' },
      { category: 'PRESCRIPTION', eventType: 'PRESCRIPTION_VERIFIED', title: 'Prescription Verified' },
      { category: 'PRESCRIPTION', eventType: 'PRESCRIPTION_FULLY_DISPENSED', title: 'Prescription Dispensed' },
      { category: 'ORDER', eventType: 'ORDER_CREATED', title: 'Order Created' },
      { category: 'ORDER', eventType: 'ORDER_ACCEPTED', title: 'Order Accepted' },
      { category: 'ORDER', eventType: 'ORDER_READY_FOR_PICKUP', title: 'Order Ready' },
      { category: 'ORDER', eventType: 'ORDER_COMPLETED', title: 'Order Handover' },
      { category: 'INVENTORY', eventType: 'LOW_STOCK', title: 'Low Stock Alert' },
      { category: 'INVENTORY', eventType: 'OUT_OF_STOCK', title: 'Out of Stock Alert' },
      { category: 'PROCUREMENT', eventType: 'PURCHASE_ORDER_APPROVED', title: 'PO Approved' },
      { category: 'PROCUREMENT', eventType: 'GOODS_RECEIVED', title: 'GRN Created' },
      { category: 'SECURITY', eventType: 'LOGIN_ALERT', title: 'Security Alert' },
    ];

    testCases.forEach(({ category, eventType, title }) => {
      it(`should successfully publish and catalogue event: ${eventType} (${category})`, async () => {
        const notifId = new Types.ObjectId();
        const mockCreated = createMockNotificationDoc({
          _id: notifId,
          category,
          eventType,
          title,
        });

        vi.spyOn(NotificationModel, 'findOne').mockResolvedValue(null);
        vi.spyOn(NotificationModel, 'create').mockResolvedValue(mockCreated as any);
        vi.spyOn(NotificationPreferenceModel, 'findOne').mockResolvedValue(null);

        const result = await notificationService.publishEvent({
          recipientId: pharmacyUserId,
          recipientRole: 'PHARMACY',
          category,
          eventType,
          title,
          message: `Testing event payload for ${eventType}`,
        });

        expect(result).not.toBeNull();
        expect(result?.eventType).toBe(eventType);
        expect(result?.category).toBe(category);
      });
    });
  });
});
