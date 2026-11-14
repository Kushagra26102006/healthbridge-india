import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  DoctorProfileModel,
  FacilityModel,
  RefreshTokenModel,
  AuditLogModel,
} from '../../src/database/models';
import { Types } from 'mongoose';
import bcryptjs from 'bcryptjs';

describe('Doctor Profile, Practice Settings, Security & Credential Integration Tests', () => {
  const app = createApp();

  const doctorUserId = new Types.ObjectId().toString();
  const doctorProfileId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();
  const facilityId = new Types.ObjectId().toString();

  const doctorToken = tokenService.generateAccessToken({
    _id: doctorUserId,
    role: 'DOCTOR',
    email: 'dr.sharma@healthbridge.in',
  } as any);

  const patientToken = tokenService.generateAccessToken({
    _id: patientUserId,
    role: 'PATIENT',
    email: 'patient.aarav@healthbridge.in',
  } as any);

  const existingPasswordHash = bcryptjs.hashSync('CurrentValid123!', 10);

  const mockDoctorUserDoc: any = {
    _id: new Types.ObjectId(doctorUserId),
    id: doctorUserId,
    name: 'Dr. Vikram Sharma',
    email: 'dr.sharma@healthbridge.in',
    phone: '9876543210',
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
    passwordHash: existingPasswordHash,
    emailVerified: true,
    phoneVerified: true,
    save: vi.fn().mockResolvedValue(true),
  };

  const mockPatientUserDoc: any = {
    _id: new Types.ObjectId(patientUserId),
    id: patientUserId,
    name: 'Aarav Patel',
    email: 'patient.aarav@healthbridge.in',
    phone: '9876500000',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
    passwordHash: existingPasswordHash,
    emailVerified: true,
    phoneVerified: true,
  };

  const mockFacilityDoc: any = {
    _id: new Types.ObjectId(facilityId),
    id: facilityId,
    name: 'Apollo Hospital — Delhi',
    facilityType: 'HOSPITAL',
    address: {
      line1: 'Sarita Vihar',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110076',
    },
    isActive: true,
  };

  const pendingDocId = new Types.ObjectId();
  const verifiedDocId = new Types.ObjectId();

  const mockDoctorProfileDoc: any = {
    _id: new Types.ObjectId(doctorProfileId),
    id: doctorProfileId,
    userId: new Types.ObjectId(doctorUserId),
    registrationNumber: 'MCI-DEL-2015-884920',
    specialization: ['Cardiology'],
    qualifications: ['MBBS', 'MD'],
    experience: 12,
    verificationStatus: 'VERIFIED',
    facilityId: new Types.ObjectId(facilityId),
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
    bio: 'Senior Interventional Cardiologist with extensive clinical experience.',
    languages: ['English', 'Hindi'],
    consultationFee: 750,
    slotDurationMinutes: 30,
    professionalInterests: ['Preventive Cardiology', 'Heart Failure'],
    documents: [
      {
        _id: pendingDocId,
        id: pendingDocId.toString(),
        documentType: 'MEDICAL_REGISTRATION',
        title: 'Delhi Medical Council Certificate',
        fileName: 'dmc-cert-2024.pdf',
        fileUrl: `/secure-credentials/doctors/${doctorUserId}/${pendingDocId.toString()}-dmc-cert-2024.pdf`,
        mimeType: 'application/pdf',
        fileSize: 1024 * 500,
        verificationStatus: 'PENDING',
        uploadedAt: new Date(),
      },
      {
        _id: verifiedDocId,
        id: verifiedDocId.toString(),
        documentType: 'QUALIFICATION',
        title: 'MD Degree Certificate',
        fileName: 'md-degree.pdf',
        fileUrl: `/secure-credentials/doctors/${doctorUserId}/${verifiedDocId.toString()}-md-degree.pdf`,
        mimeType: 'application/pdf',
        fileSize: 1024 * 700,
        verificationStatus: 'VERIFIED',
        uploadedAt: new Date(),
      },
    ],
    notificationPreferences: {
      newAppointmentRequests: { inApp: true, email: true, sms: false },
      appointmentChanges: { inApp: true, email: true, sms: false },
      patientCheckIns: { inApp: true, email: false, sms: false },
      consultationReminders: { inApp: true, email: true, sms: false },
      clinicalWorkflowAlerts: { inApp: true, email: false, sms: false },
      securityAlerts: { inApp: true, email: true, sms: true },
    },
    practiceSettings: {
      autoConfirmAppointments: false,
      maxDailyPatients: 25,
      teleconsultationLink: 'https://meet.healthbridge.in/dr-sharma',
    },
    save: vi.fn().mockResolvedValue(true),
    populate: vi.fn().mockImplementation(function (this: any) {
      this.facilityId = mockFacilityDoc;
      return Promise.resolve(this);
    }),
  };

  const sessionId1 = new Types.ObjectId();
  const sessionId2 = new Types.ObjectId();

  const mockSessionDocs = [
    {
      _id: sessionId1,
      id: sessionId1.toString(),
      userId: new Types.ObjectId(doctorUserId),
      tokenHash: 'hash-session-1',
      deviceInfo: {
        deviceName: 'Google Chrome on macOS',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0',
        ipAddress: '192.168.1.100',
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      createdAt: new Date(Date.now() - 3600 * 1000),
      updatedAt: new Date(Date.now() - 60 * 1000),
      save: vi.fn().mockResolvedValue(true),
    },
    {
      _id: sessionId2,
      id: sessionId2.toString(),
      userId: new Types.ObjectId(doctorUserId),
      tokenHash: 'hash-session-2',
      deviceInfo: {
        deviceName: 'Safari on iPhone',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        ipAddress: '10.0.0.50',
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      createdAt: new Date(Date.now() - 86400 * 1000),
      updatedAt: new Date(Date.now() - 3600 * 1000),
      save: vi.fn().mockResolvedValue(true),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockDoctorProfileDoc.save = vi.fn().mockResolvedValue(true);
    mockDoctorProfileDoc.verificationStatus = 'VERIFIED';
    mockDoctorProfileDoc.registrationNumber = 'MCI-DEL-2015-884920';
    mockDoctorProfileDoc.consultationFee = 750;
    mockDoctorProfileDoc.slotDurationMinutes = 30;
    mockDoctorProfileDoc.documents = [
      {
        _id: pendingDocId,
        id: pendingDocId.toString(),
        documentType: 'MEDICAL_REGISTRATION',
        title: 'Delhi Medical Council Certificate',
        fileName: 'dmc-cert-2024.pdf',
        fileUrl: `/secure-credentials/doctors/${doctorUserId}/${pendingDocId.toString()}-dmc-cert-2024.pdf`,
        mimeType: 'application/pdf',
        fileSize: 1024 * 500,
        verificationStatus: 'PENDING',
        uploadedAt: new Date(),
      },
      {
        _id: verifiedDocId,
        id: verifiedDocId.toString(),
        documentType: 'QUALIFICATION',
        title: 'MD Degree Certificate',
        fileName: 'md-degree.pdf',
        fileUrl: `/secure-credentials/doctors/${doctorUserId}/${verifiedDocId.toString()}-md-degree.pdf`,
        mimeType: 'application/pdf',
        fileSize: 1024 * 700,
        verificationStatus: 'VERIFIED',
        uploadedAt: new Date(),
      },
    ];

    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString();
      let doc = null;
      if (idStr === doctorUserId) doc = mockDoctorUserDoc;
      else if (idStr === patientUserId) doc = mockPatientUserDoc;

      return {
        select: vi.fn().mockResolvedValue(doc),
        then: (resolve: any) => Promise.resolve(doc).then(resolve),
      } as any;
    }) as any);

    vi.spyOn(UserModel, 'updateOne').mockResolvedValue({} as any);

    vi.spyOn(DoctorProfileModel, 'findOne').mockImplementation((() => {
      return {
        populate: vi.fn().mockImplementation((field: string) => {
          if (field === 'facilityId') {
            mockDoctorProfileDoc.facilityId = mockFacilityDoc;
          }
          return Promise.resolve(mockDoctorProfileDoc);
        }),
        then: (resolve: any) => Promise.resolve(mockDoctorProfileDoc).then(resolve),
      } as any;
    }) as any);

    vi.spyOn(FacilityModel, 'findById').mockImplementation(((id: any) => {
      if (id?.toString() === facilityId) {
        return Promise.resolve(mockFacilityDoc) as any;
      }
      return Promise.resolve(null) as any;
    }) as any);

    vi.spyOn(RefreshTokenModel, 'find').mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockSessionDocs),
      }),
    } as any);

    vi.spyOn(RefreshTokenModel, 'findOne').mockImplementation(((query: any) => {
      const session = mockSessionDocs.find(
        (s) => s._id.toString() === query._id?.toString()
      );
      return Promise.resolve(session || null) as any;
    }) as any);

    vi.spyOn(RefreshTokenModel, 'updateMany').mockResolvedValue({ modifiedCount: 1 } as any);

    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
  });

  /* ==========================================================================
     1. Role-Based Access Control (RBAC) & Route Protection
     ========================================================================== */
  describe('RBAC & Route Protection', () => {
    it('should reject unauthenticated request to /api/v1/doctors/me with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/doctors/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should forbid PATIENT role from accessing doctor settings routes with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/me/settings/practice')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should forbid PATIENT role from accessing doctor credential documents with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/me/documents')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     2. Doctor Professional Profile & Immutability Security Guards
     ========================================================================== */
  describe('Professional Profile Management & Security Guards', () => {
    it('should retrieve doctor professional profile with masked registration and credentials', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/me')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Dr. Vikram Sharma');
      expect(res.body.data.registrationNumber).toContain('XXXX');
      expect(res.body.data.specialization).toContain('Cardiology');
      expect(res.body.data.documents).toHaveLength(2);
      expect(res.body.data.practiceSettings).toBeDefined();
      expect(res.body.data.notificationPreferences).toBeDefined();
    });

    it('should update permitted fields: bio, languages, consultationFee, and professionalInterests', async () => {
      const res = await request(app)
        .patch('/api/v1/doctors/me')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          bio: 'Updated clinical biography focusing on preventive cardiology.',
          consultationFee: 800,
          languages: ['English', 'Hindi', 'Punjabi'],
          professionalInterests: ['Echocardiography', 'Hypertension'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDoctorProfileDoc.save).toHaveBeenCalled();
    });

    it('should ignore and omit unauthorized mutation of role, verificationStatus, or registrationNumber', async () => {
      const res = await request(app)
        .patch('/api/v1/doctors/me')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          role: 'ADMIN',
          verificationStatus: 'REJECTED',
          registrationNumber: 'HACKED-REG-999',
          bio: 'Legitimate bio update',
        });

      expect(res.status).toBe(200);
      expect(mockDoctorProfileDoc.verificationStatus).toBe('VERIFIED');
      expect(mockDoctorProfileDoc.registrationNumber).toBe('MCI-DEL-2015-884920');
      expect(mockDoctorUserDoc.role).toBe('DOCTOR');
    });
  });

  /* ==========================================================================
     3. Practice & Facility Settings
     ========================================================================== */
  describe('Practice & Facility Settings', () => {
    it('should retrieve doctor practice settings', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/me/settings/practice')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.facilityName).toBe('Apollo Hospital — Delhi');
      expect(res.body.data.consultationFee).toBe(750);
      expect(res.body.data.slotDurationMinutes).toBe(30);
    });

    it('should update practice settings successfully', async () => {
      const res = await request(app)
        .patch('/api/v1/doctors/me/settings/practice')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          consultationFee: 900,
          slotDurationMinutes: 45,
          autoConfirmAppointments: true,
          maxDailyPatients: 35,
          teleconsultationLink: 'https://meet.healthbridge.in/tele-sharma',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDoctorProfileDoc.save).toHaveBeenCalled();
    });

    it('should reject practice settings update with non-existent facilityId (400)', async () => {
      const res = await request(app)
        .patch('/api/v1/doctors/me/settings/practice')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          facilityId: new Types.ObjectId().toString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Specified healthcare facility does not exist');
    });
  });

  /* ==========================================================================
     4. Notification Preferences & Mandatory Security Policy
     ========================================================================== */
  describe('Notification Preferences & Security Policy', () => {
    it('should retrieve doctor notification preferences', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/me/settings/notifications')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.newAppointmentRequests.inApp).toBe(true);
      expect(res.body.data.securityAlerts.inApp).toBe(true);
    });

    it('should update notification preferences for optional categories', async () => {
      const res = await request(app)
        .patch('/api/v1/doctors/me/settings/notifications')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientCheckIns: { inApp: true, email: true, sms: false },
          consultationReminders: { inApp: false, email: true, sms: false },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDoctorProfileDoc.save).toHaveBeenCalled();
    });

    it('should enforce mandatory security alert policy: inApp and email remain permanently enabled', async () => {
      const res = await request(app)
        .patch('/api/v1/doctors/me/settings/notifications')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          securityAlerts: { inApp: false, email: false, sms: false },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.securityAlerts.inApp).toBe(true);
      expect(res.body.data.securityAlerts.email).toBe(true);
    });
  });

  /* ==========================================================================
     5. Credential Documents Management & Private Storage
     ========================================================================== */
  describe('Credential Document Management', () => {
    it('should list uploaded credential documents', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/me/documents')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].documentType).toBe('MEDICAL_REGISTRATION');
      expect(res.body.data[0].fileUrl).toContain('/secure-credentials/');
    });

    it('should upload a new credential document in PENDING review status (201)', async () => {
      const res = await request(app)
        .post('/api/v1/doctors/me/documents')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          documentType: 'IDENTITY',
          title: 'Aadhaar Photo ID',
          fileName: 'aadhaar-doc.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024 * 300,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationStatus).toBe('PENDING');
      expect(res.body.data.fileUrl).toContain('/secure-credentials/doctors/');
      expect(mockDoctorProfileDoc.save).toHaveBeenCalled();
    });

    it('should reject credential document exceeding 10MB limit (422)', async () => {
      const res = await request(app)
        .post('/api/v1/doctors/me/documents')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          documentType: 'IDENTITY',
          title: 'Oversized File',
          fileName: 'huge.pdf',
          mimeType: 'application/pdf',
          fileSize: 15 * 1024 * 1024, // 15MB
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject unsupported document MIME type (e.g. text/html) (422)', async () => {
      const res = await request(app)
        .post('/api/v1/doctors/me/documents')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          documentType: 'OTHER',
          title: 'HTML Script File',
          fileName: 'exploit.html',
          mimeType: 'text/html',
          fileSize: 1024,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should delete pending credential document successfully', async () => {
      const res = await request(app)
        .delete(`/api/v1/doctors/me/documents/${pendingDocId.toString()}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDoctorProfileDoc.save).toHaveBeenCalled();
    });

    it('should reject deletion of already VERIFIED credential document without administrative authorization (400)', async () => {
      const res = await request(app)
        .delete(`/api/v1/doctors/me/documents/${verifiedDocId.toString()}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cannot delete a verified credential document');
    });
  });

  /* ==========================================================================
     6. Active Sessions & Device Management
     ========================================================================== */
  describe('Active Sessions & Authentication Security', () => {
    it('should list active doctor sessions without exposing raw refresh tokens', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/me/sessions')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].deviceName).toContain('Google Chrome');
      expect(res.body.data[0].tokenHash).toBeUndefined(); // Zero secret leakage
    });

    it('should terminate individual session by sessionId', async () => {
      const res = await request(app)
        .delete(`/api/v1/doctors/me/sessions/${sessionId2.toString()}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockSessionDocs[1]!.save).toHaveBeenCalled();
    });

    it('should terminate all other active sessions', async () => {
      const res = await request(app)
        .post('/api/v1/doctors/me/sessions/revoke-others')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.revokedCount).toBe(1);
    });
  });

  /* ==========================================================================
     7. Password Security Controls
     ========================================================================== */
  describe('Password Security Controls', () => {
    it('should reject password change with incorrect current password (400)', async () => {
      const res = await request(app)
        .post('/api/v1/doctors/me/change-password')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          currentPassword: 'WrongPassword999!',
          newPassword: 'BrandNewPassword123#',
          confirmPassword: 'BrandNewPassword123#',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Current password is incorrect');
    });

    it('should reject password change when new password is identical to current password (400)', async () => {
      const res = await request(app)
        .post('/api/v1/doctors/me/change-password')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          currentPassword: 'CurrentValid123!',
          newPassword: 'CurrentValid123!',
          confirmPassword: 'CurrentValid123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('New password cannot be identical');
    });

    it('should reject password change when passwords do not match (422)', async () => {
      const res = await request(app)
        .post('/api/v1/doctors/me/change-password')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          currentPassword: 'CurrentValid123!',
          newPassword: 'BrandNewPassword123#',
          confirmPassword: 'DifferentPassword123#',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should update account password successfully with high entropy password (200)', async () => {
      const res = await request(app)
        .post('/api/v1/doctors/me/change-password')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          currentPassword: 'CurrentValid123!',
          newPassword: 'BrandNewPassword123#',
          confirmPassword: 'BrandNewPassword123#',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDoctorUserDoc.save).toHaveBeenCalled();
    });
  });
});
