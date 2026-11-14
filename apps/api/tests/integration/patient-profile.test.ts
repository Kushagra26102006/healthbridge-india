import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcryptjs from 'bcryptjs';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel } from '../../src/modules/users/models/user.model';
import { PatientProfileModel } from '../../src/modules/users/models/patient-profile.model';
import { RefreshTokenModel } from '../../src/modules/security/models/refresh-token.model';
import { Types } from 'mongoose';

describe('Patient Profile, Account Settings & Sessions Integration Tests', () => {
  const app = createApp();

  const patientId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();

  const patientToken = tokenService.generateAccessToken({
    _id: patientId,
    role: 'PATIENT',
    email: 'patient.sharma@healthbridge.in',
  } as any);

  const doctorToken = tokenService.generateAccessToken({
    _id: doctorId,
    role: 'DOCTOR',
    email: 'doctor.verma@aiims.gov.in',
  } as any);

  const mockPasswordHash = bcryptjs.hashSync('ExistingPass@123', 8);

  const mockUserDoc = {
    _id: new Types.ObjectId(patientId),
    id: patientId,
    name: 'Aarav Sharma',
    email: 'patient.sharma@healthbridge.in',
    phone: '9876543210',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
    passwordHash: mockPasswordHash,
    save: vi.fn().mockResolvedValue(true),
    toJSON: () => ({
      id: patientId,
      name: 'Aarav Sharma',
      email: 'patient.sharma@healthbridge.in',
      phone: '9876543210',
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    }),
  };

  const mockProfileDoc = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(patientId),
    dateOfBirth: new Date('1994-06-15'),
    gender: 'MALE',
    bloodGroup: 'B+',
    address: {
      line1: 'Flat 302, Green Avenue',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      postalCode: '560001',
    },
    emergencyContact: {
      name: 'Pooja Sharma',
      relationship: 'Spouse',
      phone: '9876500000',
    },
    abhaLinkageStatus: 'LINKED',
    abhaAddress: 'aarav.sharma@abdm',
    abhaNumber: '14-1234-5678-9102',
    notificationPreferences: {
      appointmentUpdates: { inApp: true, email: true, sms: true },
      prescriptionUpdates: { inApp: true, email: true, sms: false },
      labReportAlerts: { inApp: true, email: true, sms: false },
      consentRequests: { inApp: true, email: true, sms: true },
      securityAlerts: { inApp: true, email: true, sms: true },
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
    save: vi.fn().mockResolvedValue(true),
    toJSON: () => ({
      id: 'prof-123',
      userId: patientId,
      dateOfBirth: '1994-06-15',
      gender: 'MALE',
      bloodGroup: 'B+',
      address: {
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560001',
      },
      emergencyContact: {
        name: 'Pooja Sharma',
        relationship: 'Spouse',
        phone: '9876500000',
      },
      abhaLinkageStatus: 'LINKED',
    }),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockUserDoc.passwordHash = mockPasswordHash;

    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString() || String(id);
      if (idStr === patientId) {
        return {
          ...mockUserDoc,
          select: vi.fn().mockResolvedValue(mockUserDoc),
        } as any;
      }
      if (idStr === doctorId) {
        return Promise.resolve({
          _id: new Types.ObjectId(doctorId),
          id: doctorId,
          role: 'DOCTOR',
          accountStatus: 'ACTIVE',
          email: 'doctor.verma@aiims.gov.in',
        } as any);
      }
      return Promise.resolve(null);
    }) as any);

    vi.spyOn(PatientProfileModel, 'findOne').mockResolvedValue(mockProfileDoc as any);
  });

  // 1. Profile Retrieval & RBAC
  describe('GET /api/v1/patients/me — Patient Profile Retrieval', () => {
    it('should reject unauthenticated request with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/patients/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-patient role (DOCTOR) with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/patients/me')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return complete patient profile for authenticated PATIENT', async () => {
      const res = await request(app)
        .get('/api/v1/patients/me')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Aarav Sharma');
      expect(res.body.data.email).toBe('patient.sharma@healthbridge.in');
      expect(res.body.data.gender).toBe('MALE');
      expect(res.body.data.bloodGroup).toBe('B+');
      expect(res.body.data.address.city).toBe('Bengaluru');
      expect(res.body.data.emergencyContact.name).toBe('Pooja Sharma');
      expect(res.body.data.abhaLinkageStatus).toBe('LINKED');
      expect(res.body.data.completionPercentage).toBeGreaterThanOrEqual(50);
      // Ensure ABHA number is masked
      expect(res.body.data.abhaNumber).toMatch(/^14-XXXX-XXXX-\d{4}$/);
    });

    it('should also respond at alias route GET /api/v1/patients/profile', async () => {
      const res = await request(app)
        .get('/api/v1/patients/profile')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Aarav Sharma');
    });
  });

  // 2. Profile Editing & Validation
  describe('PATCH /api/v1/patients/me — Patient Profile Editing', () => {
    it('should update permitted fields (name, dateOfBirth, address, bloodGroup)', async () => {
      const res = await request(app)
        .patch('/api/v1/patients/me')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          name: 'Aarav Sharma Updated',
          dateOfBirth: '1993-05-20',
          gender: 'MALE',
          bloodGroup: 'O+',
          address: {
            city: 'Mysuru',
            district: 'Mysuru',
            state: 'Karnataka',
            postalCode: '570001',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockProfileDoc.save).toHaveBeenCalled();
    });

    it('should reject invalid 5-digit postal code with 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .patch('/api/v1/patients/me')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          address: {
            postalCode: '12345', // Invalid: Indian PIN must be 6 digits
          },
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid emergency phone format with 422', async () => {
      const res = await request(app)
        .patch('/api/v1/patients/me')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          emergencyContact: {
            phone: '12345', // Invalid
          },
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  // 3. Password Change Workflow & Security
  describe('POST /api/v1/patients/me/change-password — Password Security', () => {
    it('should reject change password when unauthenticated with 401', async () => {
      const res = await request(app).post('/api/v1/patients/me/change-password').send({
        currentPassword: 'ExistingPass@123',
        newPassword: 'BrandNewPass@999',
      });

      expect(res.status).toBe(401);
    });

    it('should reject change password when current password is wrong with 400', async () => {
      const res = await request(app)
        .post('/api/v1/patients/me/change-password')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          currentPassword: 'IncorrectOldPassword!123',
          newPassword: 'BrandNewPass@999',
          confirmPassword: 'BrandNewPass@999',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Current password is incorrect/i);
    });

    it('should reject change password when new password is identical to current password with 400', async () => {
      const res = await request(app)
        .post('/api/v1/patients/me/change-password')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          currentPassword: 'ExistingPass@123',
          newPassword: 'ExistingPass@123',
          confirmPassword: 'ExistingPass@123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot be identical/i);
    });

    it('should reject weak new password (no uppercase or special char) with 422', async () => {
      const res = await request(app)
        .post('/api/v1/patients/me/change-password')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          currentPassword: 'ExistingPass@123',
          newPassword: 'weakpassword123',
          confirmPassword: 'weakpassword123',
        });

      expect(res.status).toBe(422);
    });

    it('should successfully update password with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/patients/me/change-password')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          currentPassword: 'ExistingPass@123',
          newPassword: 'BrandNewPassword@2026',
          confirmPassword: 'BrandNewPassword@2026',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/Password changed successfully/i);
      expect(mockUserDoc.save).toHaveBeenCalled();
    });

    it('should also work at auth route POST /api/v1/auth/change-password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          currentPassword: 'ExistingPass@123',
          newPassword: 'BrandNewPassword@2026',
          confirmPassword: 'BrandNewPassword@2026',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // 4. Active Sessions Management
  describe('Active Sessions API (/api/v1/auth/sessions & /api/v1/patients/me/sessions)', () => {
    const sessionId1 = new Types.ObjectId().toString();
    const sessionId2 = new Types.ObjectId().toString();

    const mockSessions = [
      {
        _id: new Types.ObjectId(sessionId1),
        userId: new Types.ObjectId(patientId),
        tokenHash: 'hash-abc-123',
        deviceInfo: {
          ipAddress: '103.21.244.2',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          deviceName: 'Google Chrome on macOS',
        },
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new Types.ObjectId(sessionId2),
        userId: new Types.ObjectId(patientId),
        tokenHash: 'hash-def-456',
        deviceInfo: {
          ipAddress: '49.205.120.5',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
          deviceName: 'Apple Safari on iOS Mobile',
        },
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should list active sessions without leaking raw token hashes', async () => {
      vi.spyOn(RefreshTokenModel, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockSessions),
        }),
      } as any);

      const res = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].ipAddress).toBe('103.21.244.2');
      expect(res.body.data[0].browser).toBe('Google Chrome');
      expect(res.body.data[0].os).toBe('macOS');
      expect(res.body.data[0].isCurrent).toBe(true);
      // Ensure zero tokenHash leakage
      expect(res.body.data[0].tokenHash).toBeUndefined();
    });

    it('should revoke individual session with DELETE /api/v1/auth/sessions/:sessionId', async () => {
      const mockSessionToRevoke = {
        _id: new Types.ObjectId(sessionId2),
        userId: new Types.ObjectId(patientId),
        revokedAt: undefined,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(RefreshTokenModel, 'findOne').mockResolvedValue(mockSessionToRevoke as any);

      const res = await request(app)
        .delete(`/api/v1/auth/sessions/${sessionId2}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockSessionToRevoke.save).toHaveBeenCalled();
    });

    it('should return 404 when revoking a non-existent or already revoked session', async () => {
      vi.spyOn(RefreshTokenModel, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/v1/auth/sessions/${new Types.ObjectId().toString()}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should revoke other sessions with POST /api/v1/auth/logout-others', async () => {
      vi.spyOn(RefreshTokenModel, 'updateMany').mockResolvedValue({
        acknowledged: true,
        matchedCount: 2,
        modifiedCount: 2,
        upsertedCount: 0,
        upsertedId: null as any,
      });

      const res = await request(app)
        .post('/api/v1/auth/logout-others')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(2);
    });
  });

  // 5. Notification Preferences
  describe('Notification Preferences API', () => {
    it('should retrieve notification preferences with operational channels', async () => {
      const res = await request(app)
        .get('/api/v1/patients/me/notification-preferences')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointmentUpdates.inApp).toBe(true);
      expect(res.body.data.securityAlerts.inApp).toBe(true);
      expect(res.body.data.securityAlerts.email).toBe(true);
      expect(res.body.data.channelAvailability.emailConfigured).toBe(true);
    });

    it('should update notification preferences and enforce mandatory security alerts', async () => {
      const res = await request(app)
        .patch('/api/v1/patients/me/notification-preferences')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentUpdates: { inApp: true, email: false, sms: true },
          // Attempting to turn off mandatory security email alerts
          securityAlerts: { email: false, inApp: false, sms: false },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockProfileDoc.save).toHaveBeenCalled();
      // Enforced to true: mandatory security alerts cannot be disabled
      expect(res.body.data.securityAlerts.inApp).toBe(true);
      expect(res.body.data.securityAlerts.email).toBe(true);
    });
  });
});
