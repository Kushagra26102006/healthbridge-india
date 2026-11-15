import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  PharmacyProfileModel,
  PharmacyStaffModel,
  RefreshTokenModel,
  AuditLogModel,
} from '../../src/database/models';
import { Types } from 'mongoose';
import bcryptjs from 'bcryptjs';

describe('Pharmacy Settings, Staff Management & Security Audit Tests (Day 5 Task 07)', () => {
  const app = createApp();

  const pharmacyAUserId = new Types.ObjectId().toString();
  const pharmacyBUserId = new Types.ObjectId().toString();
  const doctorUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();

  const pharmacyAToken = tokenService.generateAccessToken({
    _id: pharmacyAUserId,
    role: 'PHARMACY',
    email: 'apollo.cp@healthbridge.in',
  } as any);

  const pharmacyBToken = tokenService.generateAccessToken({
    _id: pharmacyBUserId,
    role: 'PHARMACY',
    email: 'medplus.delhi@healthbridge.in',
  } as any);

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

  const mockPharmacyAUser: any = {
    _id: new Types.ObjectId(pharmacyAUserId),
    id: pharmacyAUserId,
    name: 'Apollo Pharmacy — Connaught Place',
    email: 'apollo.cp@healthbridge.in',
    phone: '9811223344',
    role: 'PHARMACY',
    accountStatus: 'ACTIVE',
    passwordHash: '',
  };

  const mockPharmacyBUser: any = {
    _id: new Types.ObjectId(pharmacyBUserId),
    id: pharmacyBUserId,
    name: 'MedPlus Pharmacy',
    email: 'medplus.delhi@healthbridge.in',
    phone: '9822334455',
    role: 'PHARMACY',
    accountStatus: 'ACTIVE',
    passwordHash: '',
  };

  const mockDoctorUser: any = {
    _id: new Types.ObjectId(doctorUserId),
    id: doctorUserId,
    name: 'Dr. Vikram Sharma',
    email: 'dr.sharma@healthbridge.in',
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
  };

  const mockPatientUser: any = {
    _id: new Types.ObjectId(patientUserId),
    id: patientUserId,
    name: 'Aarav Patel',
    email: 'patient.aarav@healthbridge.in',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
  };

  const mockPharmacyAProfileId = new Types.ObjectId();
  const mockPharmacyBProfileId = new Types.ObjectId();

  const mockPharmacyAProfile: any = {
    _id: mockPharmacyAProfileId,
    id: mockPharmacyAProfileId.toString(),
    userId: new Types.ObjectId(pharmacyAUserId),
    pharmacyName: 'Apollo Pharmacy Connaught Place',
    pharmacyLicenseNumber: 'DL-DEL-2024-99881',
    registrationNumber: 'REG-DEL-001',
    gstin: '07AAAAA0000A1Z5',
    issuingAuthority: 'Drugs Control Department, Govt of NCT of Delhi',
    verificationStatus: 'VERIFIED',
    documentSubmissionStatus: 'VERIFIED',
    timezone: 'Asia/Kolkata',
    openingTime: '08:00',
    closingTime: '22:00',
    is24Hours: false,
    weeklyAvailability: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    supportedServices: ['IN_STORE_PICKUP', 'PRESCRIPTION_REFILL'],
    operatingHoursSchedule: [
      {
        dayOfWeek: 'MONDAY',
        isOpen: true,
        is24Hours: false,
        openTime: '08:00',
        closeTime: '22:00',
        breaks: [{ breakName: 'Lunch', startTime: '13:00', endTime: '14:00' }],
      },
      { dayOfWeek: 'TUESDAY', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '22:00', breaks: [] },
      { dayOfWeek: 'WEDNESDAY', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '22:00', breaks: [] },
      { dayOfWeek: 'THURSDAY', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '22:00', breaks: [] },
      { dayOfWeek: 'FRIDAY', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '22:00', breaks: [] },
      { dayOfWeek: 'SATURDAY', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '22:00', breaks: [] },
      { dayOfWeek: 'SUNDAY', isOpen: false, is24Hours: false, openTime: '08:00', closeTime: '22:00', breaks: [] },
    ],
    temporaryClosure: { isTemporarilyClosed: false },
    holidays: [],
    serviceSettings: {
      dispensingEnabled: true,
      inStorePickupEnabled: true,
      deliveryReady: false,
      emergencyPrescriptionSupport: true,
      scheduleHDispensingEnabled: true,
      scheduleXDispensingEnabled: false,
      chronicRefillProgramEnabled: true,
      compoundingAvailable: false,
      homeDeliveryRadiusKm: 5,
      minimumOrderValueForDelivery: 200,
      deliveryFee: 30,
      freeDeliveryAbove: 500,
      estimatedPickupReadyMinutes: 30,
    },
    documents: [],
    save: vi.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  const mockStaffId = new Types.ObjectId().toString();
  const mockStaffRecord: any = {
    _id: new Types.ObjectId(mockStaffId),
    id: mockStaffId,
    pharmacyId: mockPharmacyAProfileId,
    fullName: 'Priya Nair',
    email: 'priya.nair@apollo.in',
    phone: '9876543210',
    staffId: 'STF-202611-101',
    designation: 'Senior Clinical Pharmacist',
    role: 'PHARMACIST',
    permissions: ['VIEW_DASHBOARD', 'VERIFY_PRESCRIPTIONS', 'DISPENSE_MEDICINES'],
    status: 'INVITED',
    pharmacistRegistrationNumber: 'DPC-88912',
    isOwner: false,
    invitationToken: 'test-invite-token-1234567890',
    invitationSentAt: new Date(),
    invitationExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vi.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  const mockSessionId = new Types.ObjectId().toString();
  const mockSessionDoc: any = {
    _id: new Types.ObjectId(mockSessionId),
    userId: new Types.ObjectId(pharmacyAUserId),
    tokenHash: 'sample-token-hash-1',
    deviceInfo: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0 Safari/537.36',
      ipAddress: '192.168.1.100',
      deviceName: 'Chrome on macOS',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    save: vi.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  const createQueryMock = (data: any) => {
    const q: any = {
      populate: vi.fn().mockImplementation(() => q),
      sort: vi.fn().mockImplementation(() => q),
      skip: vi.fn().mockImplementation(() => q),
      limit: vi.fn().mockImplementation(() => q),
      select: vi.fn().mockImplementation(() => q),
      lean: vi.fn().mockImplementation(() => Promise.resolve(data)),
      then: (resolve: any, reject: any) => Promise.resolve(data).then(resolve, reject),
    };
    return q;
  };

  beforeEach(async () => {
    vi.restoreAllMocks();

    const hash = await bcryptjs.hash('SecurePassword#2026', 10);
    mockPharmacyAUser.passwordHash = hash;
    mockPharmacyBUser.passwordHash = hash;

    // Reset profile documents and closure
    mockPharmacyAProfile.documents = [];
    mockPharmacyAProfile.temporaryClosure = { isTemporarilyClosed: false };
    mockPharmacyAProfile.verificationStatus = 'VERIFIED';
    mockPharmacyAProfile.documentSubmissionStatus = 'VERIFIED';

    // Mock UserModel
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString() || String(id);
      let userObj: any = null;
      if (idStr === pharmacyAUserId) userObj = { ...mockPharmacyAUser };
      if (idStr === pharmacyBUserId) userObj = { ...mockPharmacyBUser };
      if (idStr === doctorUserId) userObj = { ...mockDoctorUser };
      if (idStr === patientUserId) userObj = { ...mockPatientUser };

      if (userObj) {
        userObj.save = vi.fn().mockResolvedValue(userObj);
        const q: any = {
          select: vi.fn().mockResolvedValue(userObj),
          then: (resolve: any, reject: any) => Promise.resolve(userObj).then(resolve, reject),
        };
        return q;
      }
      return createQueryMock(null);
    }) as any);

    vi.spyOn(UserModel, 'findOne').mockImplementation(((filter: any) => {
      if (filter.email === 'apollo.cp@healthbridge.in') return Promise.resolve(mockPharmacyAUser);
      return Promise.resolve(null);
    }) as any);

    vi.spyOn(UserModel, 'updateOne').mockResolvedValue({ acknowledged: true, modifiedCount: 1 } as any);

    // Mock PharmacyProfileModel
    vi.spyOn(PharmacyProfileModel, 'findOne').mockImplementation(((filter: any) => {
      const uId = filter.userId?.toString() || filter.userId?._id?.toString();
      if (uId === pharmacyAUserId) return Promise.resolve(mockPharmacyAProfile);
      if (uId === pharmacyBUserId) {
        return Promise.resolve({
          ...mockPharmacyAProfile,
          _id: mockPharmacyBProfileId,
          userId: new Types.ObjectId(pharmacyBUserId),
          pharmacyName: 'MedPlus Pharmacy',
          save: vi.fn().mockImplementation(function (this: any) {
            return Promise.resolve(this);
          }),
        });
      }
      return Promise.resolve(null);
    }) as any);

    // Mock AuditLogModel
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);

    // Default PharmacyStaffModel mocks
    vi.spyOn(PharmacyStaffModel, 'find').mockImplementation(((filter: any) => {
      return createQueryMock([mockStaffRecord]);
    }) as any);

    vi.spyOn(PharmacyStaffModel, 'countDocuments').mockResolvedValue(1);

    vi.spyOn(PharmacyStaffModel, 'findOne').mockImplementation(((filter: any) => {
      if (filter.invitationToken === 'test-invite-token-1234567890') {
        return Promise.resolve(mockStaffRecord);
      }
      if (filter.email === 'duplicate@apollo.in') {
        return Promise.resolve(mockStaffRecord);
      }
      if (filter._id?.toString() === mockStaffId || filter._id === mockStaffId) {
        return Promise.resolve(mockStaffRecord);
      }
      return Promise.resolve(null);
    }) as any);

    vi.spyOn(PharmacyStaffModel, 'create').mockImplementation(((data: any) => {
      return Promise.resolve({
        ...mockStaffRecord,
        ...data,
        _id: new Types.ObjectId(),
        save: vi.fn().mockResolvedValue(true),
      });
    }) as any);

    // Default RefreshTokenModel mocks
    vi.spyOn(RefreshTokenModel, 'find').mockImplementation(((filter: any) => {
      return createQueryMock([mockSessionDoc]);
    }) as any);

    vi.spyOn(RefreshTokenModel, 'findOne').mockImplementation(((filter: any) => {
      if (filter._id === mockSessionId || filter._id?.toString() === mockSessionId) {
        return Promise.resolve(mockSessionDoc);
      }
      return Promise.resolve(null);
    }) as any);

    vi.spyOn(RefreshTokenModel, 'updateMany').mockResolvedValue({ acknowledged: true, modifiedCount: 2 } as any);
  });

  /* ==========================================================================
     1. ROLE-BASED ACCESS CONTROL & BOUNDARY ENFORCEMENT
     ========================================================================== */

  describe('1. RBAC & Security Boundary Enforcement', () => {
    it('should reject unauthenticated requests to pharmacy settings with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/pharmacy/settings/operating-hours');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-pharmacy roles (PATIENT) with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/settings/operating-hours')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-pharmacy roles (DOCTOR) with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/staff')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow authenticated PHARMACY role to access settings endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/settings/operating-hours')
        .set('Authorization', `Bearer ${pharmacyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.timezone).toBe('Asia/Kolkata');
    });
  });

  /* ==========================================================================
     2. PHARMACY PROFILE, LICENSING & ZERO SELF-APPROVAL INVARIANT
     ========================================================================== */

  describe('2. Pharmacy Profile, Licensing & Zero Self-Approval Invariant', () => {
    it('should retrieve full profile with registration numbers, timezone and documents', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/profile')
        .set('Authorization', `Bearer ${pharmacyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.pharmacyLicenseNumber).toBe('DL-DEL-2024-99881');
      expect(res.body.data.timezone).toBe('Asia/Kolkata');
    });

    it('should update permitted business fields (name, phone, registration number)', async () => {
      const res = await request(app)
        .patch('/api/v1/pharmacy/profile')
        .set('Authorization', `Bearer ${pharmacyAToken}`)
        .send({
          pharmacyName: 'Apollo 24/7 Dispensary Hub',
          phone: '9811223355',
          registrationNumber: 'REG-NEW-2026',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should strictly reject self-approval of verificationStatus (403 Forbidden)', async () => {
      const res = await request(app)
        .patch('/api/v1/pharmacy/profile')
        .set('Authorization', `Bearer ${pharmacyAToken}`)
        .send({
          verificationStatus: 'VERIFIED',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Self-approval');
    });

    it('should upload statutory verification document and set submission status to SUBMITTED', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/profile/documents')
        .set('Authorization', `Bearer ${pharmacyAToken}`)
        .send({
          documentType: 'DRUG_LICENSE',
          documentNumber: 'DL-DEL-2024-99881',
          documentUrl: 'https://storage.healthbridge.in/docs/dl-cert.pdf',
          fileName: 'Drug_License_Certified.pdf',
          fileSize: 1024 * 512,
          mimeType: 'application/pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verificationStatus).toBe('PENDING');
      expect(mockPharmacyAProfile.documentSubmissionStatus).toBe('SUBMITTED');
    });

    it('should delete a statutory verification document by ID', async () => {
      const docId = new Types.ObjectId().toString();
      mockPharmacyAProfile.documents = [
        {
          _id: new Types.ObjectId(docId),
          id: docId,
          documentType: 'GST_CERTIFICATE',
          documentUrl: 'https://storage.healthbridge.in/docs/gst.pdf',
          fileName: 'GST.pdf',
          verificationStatus: 'PENDING',
        },
      ];

      const res = await request(app)
        .delete(`/api/v1/pharmacy/profile/documents/${docId}`)
        .set('Authorization', `Bearer ${pharmacyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('removed successfully');
    });
  });

  /* ==========================================================================
     3. OPERATING HOURS, BREAKS & REAL-TIME EVALUATION
     ========================================================================== */

  describe('3. Dispensary Operating Hours & Timezone Evaluation', () => {
    it('should retrieve weekly operating hours and compute real-time status', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/settings/operating-hours')
        .set('Authorization', `Bearer ${pharmacyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('isOpenNow');
      expect(res.body.data.weeklySchedule.length).toBe(7);
    });

    it('should update operating schedule with valid open/close times and breaks', async () => {
      const updatedSchedule = [
        {
          dayOfWeek: 'MONDAY',
          isOpen: true,
          is24Hours: false,
          openTime: '09:00',
          closeTime: '21:00',
          breaks: [{ breakName: 'Tea Break', startTime: '16:00', endTime: '16:30' }],
        },
      ];

      const res = await request(app)
        .put('/api/v1/pharmacy/settings/operating-hours')
        .set('Authorization', `Bearer ${pharmacyAToken}`)
        .send({
          timezone: 'Asia/Kolkata',
          weeklySchedule: updatedSchedule,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.timezone).toBe('Asia/Kolkata');
    });

    it('should reject schedule where opening time >= closing time (422 Unprocessable Entity)', async () => {
      const invalidSchedule = [
        {
          dayOfWeek: 'MONDAY',
          isOpen: true,
          is24Hours: false,
          openTime: '20:00',
          closeTime: '08:00', // invalid: close earlier than open
          breaks: [],
        },
      ];

      const res = await request(app)
        .put('/api/v1/pharmacy/settings/operating-hours')
        .set('Authorization', `Bearer ${pharmacyAToken}`)
        .send({
          weeklySchedule: invalidSchedule,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reflect temporary store closure and set isOpenNow to false', async () => {
      mockPharmacyAProfile.temporaryClosure = {
        isTemporarilyClosed: true,
        reason: 'Annual Stocktake and Audit',
      };

      const res = await request(app)
        .get('/api/v1/pharmacy/settings/operating-hours')
        .set('Authorization', `Bearer ${pharmacyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isOpenNow).toBe(false);
      expect(res.body.data.currentStatusReason).toContain('Annual Stocktake');
    });
  });

  /* ==========================================================================
     4. PHARMACY SERVICE SETTINGS & DISPENSING RULES
     ========================================================================== */

  describe('4. Pharmacy Service Settings & Capabilities', () => {
    it('should retrieve pharmacy service settings', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/settings/services')
        .set('Authorization', `Bearer ${pharmacyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dispensingEnabled).toBe(true);
      expect(res.body.data.inStorePickupEnabled).toBe(true);
    });

    it('should update service settings including delivery radius and pickup lead times', async () => {
      const res = await request(app)
        .put('/api/v1/pharmacy/settings/services')
        .set('Authorization', `Bearer ${pharmacyAToken}`)
        .send({
          dispensingEnabled: true,
          deliveryReady: true,
          homeDeliveryRadiusKm: 8,
          minimumOrderValueForDelivery: 300,
          estimatedPickupReadyMinutes: 20,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.homeDeliveryRadiusKm).toBe(8);
      expect(res.body.data.estimatedPickupReadyMinutes).toBe(20);
    });
  });

  /* ==========================================================================
     5. DISPENSARY STAFF MANAGEMENT & PERMISSIONS
     ========================================================================== */

  describe('5. Dispensary Staff Management & Scoped Roles', () => {
    it('should list staff members scoped to the authenticated pharmacy', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/staff')
        .set('Authorization', `Bearer ${pharmacyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.staff.length).toBeGreaterThan(0);
      expect(res.body.data.staff[0].fullName).toBe('Priya Nair');
    });

    it('should invite a new staff member and assign role-appropriate permissions', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/staff/invite')
        .set('Authorization', `Bearer ${pharmacyAToken}`)
        .send({
          fullName: 'Karan Mehra',
          email: 'karan.mehra@apollo.in',
          phone: '9811223344',
          designation: 'Inventory Associate',
          role: 'INVENTORY_STAFF',
          pharmacistRegistrationNumber: 'REG-9912',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('INVITED');
    });

    it('should reject inviting staff with an email that already exists in this pharmacy (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/staff/invite')
        .set('Authorization', `Bearer ${pharmacyAToken}`)
        .send({
          fullName: 'Duplicate User',
          email: 'duplicate@apollo.in',
          designation: 'Pharmacist',
          role: 'PHARMACIST',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should retrieve single staff member details by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/pharmacy/staff/${mockStaffId}`)
        .set('Authorization', `Bearer ${pharmacyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.staffId).toBe('STF-202611-101');
    });

    it('should update staff member role and permissions', async () => {
      const res = await request(app)
        .patch(`/api/v1/pharmacy/staff/${mockStaffId}`)
        .set('Authorization', `Bearer ${pharmacyAToken}`)
        .send({
          designation: 'Lead Clinical Pharmacist',
          permissions: ['VIEW_DASHBOARD', 'VERIFY_PRESCRIPTIONS', 'DISPENSE_MEDICINES', 'VIEW_REPORTS'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should suspend staff access and revoke active refresh tokens', async () => {
      const res = await request(app)
        .post(`/api/v1/pharmacy/staff/${mockStaffId}/suspend`)
        .set('Authorization', `Bearer ${pharmacyAToken}`)
        .send({ reason: 'Audit pending' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockStaffRecord.status).toBe('SUSPENDED');
    });

    it('should reactivate a suspended staff member', async () => {
      mockStaffRecord.status = 'SUSPENDED';

      const res = await request(app)
        .post(`/api/v1/pharmacy/staff/${mockStaffId}/reactivate`)
        .set('Authorization', `Bearer ${pharmacyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockStaffRecord.status).toBe('ACTIVE');
    });

    it('should accept staff invitation via invitation token', async () => {
      mockStaffRecord.status = 'INVITED';

      const res = await request(app)
        .post('/api/v1/pharmacy/staff/accept-invite')
        .set('Authorization', `Bearer ${pharmacyAToken}`)
        .send({
          invitationToken: 'test-invite-token-1234567890',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.staffId).toBe('STF-202611-101');
    });
  });

  /* ==========================================================================
     6. SESSIONS & ACCOUNT SECURITY
     ========================================================================== */

  describe('6. Account Security, Password Change & Active Sessions', () => {
    it('should list active browser sessions for the pharmacy user', async () => {
      const res = await request(app)
        .get('/api/v1/pharmacy/sessions')
        .set('Authorization', `Bearer ${pharmacyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].ipAddress).toBe('192.168.1.100');
    });

    it('should revoke a specific active session', async () => {
      const res = await request(app)
        .delete(`/api/v1/pharmacy/sessions/${mockSessionId}`)
        .set('Authorization', `Bearer ${pharmacyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('revoked successfully');
      expect(mockSessionDoc.revokedAt).toBeDefined();
    });

    it('should revoke all other active sessions', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/sessions/revoke-others')
        .set('Authorization', `Bearer ${pharmacyAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.revokedCount).toBe(2);
    });

    it('should change password verifying current password and policy constraints', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/change-password')
        .set('Authorization', `Bearer ${pharmacyAToken}`)
        .send({
          currentPassword: 'SecurePassword#2026',
          newPassword: 'BrandNewSecure#2026',
          confirmPassword: 'BrandNewSecure#2026',
          revokeOtherSessions: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Password changed successfully');
    });

    it('should reject password change with incorrect current password', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/change-password')
        .set('Authorization', `Bearer ${pharmacyAToken}`)
        .send({
          currentPassword: 'WrongPassword#123',
          newPassword: 'BrandNewSecure#2026',
          confirmPassword: 'BrandNewSecure#2026',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Current password is incorrect');
    });

    it('should reject password change when new password does not match confirmation', async () => {
      const res = await request(app)
        .post('/api/v1/pharmacy/change-password')
        .set('Authorization', `Bearer ${pharmacyAToken}`)
        .send({
          currentPassword: 'SecurePassword#2026',
          newPassword: 'BrandNewSecure#2026',
          confirmPassword: 'MismatchPassword#2026',
        });

      expect(res.status).toBe(422); // Handled by Zod refine
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     7. CROSS-PHARMACY TENANT ISOLATION
     ========================================================================== */

  describe('7. Cross-Pharmacy Tenant Isolation', () => {
    it('should isolate Pharmacy A staff from Pharmacy B', async () => {
      let queriedPharmacyId: any = null;
      vi.spyOn(PharmacyStaffModel, 'find').mockImplementation(((filter: any) => {
        queriedPharmacyId = filter.pharmacyId;
        return createQueryMock([]);
      }) as any);

      const res = await request(app)
        .get('/api/v1/pharmacy/staff')
        .set('Authorization', `Bearer ${pharmacyBToken}`);

      expect(res.status).toBe(200);
      expect(queriedPharmacyId.toString()).toBe(mockPharmacyBProfileId.toString());
    });

    it('should prevent Pharmacy B from updating or revoking Pharmacy A staff member (404 Not Found)', async () => {
      const foreignStaffId = new Types.ObjectId().toString();
      vi.spyOn(PharmacyStaffModel, 'findOne').mockResolvedValue(null); // Not found under Pharmacy B

      const res = await request(app)
        .patch(`/api/v1/pharmacy/staff/${foreignStaffId}`)
        .set('Authorization', `Bearer ${pharmacyBToken}`)
        .send({ designation: 'Malicious Promotion' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
