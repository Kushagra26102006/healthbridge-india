import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  DoctorProfileModel,
  PatientProfileModel,
  AppointmentModel,
  EncounterModel,
  PrescriptionModel,
  FacilityModel,
} from '../../src/database/models';
import { Types } from 'mongoose';

describe('Doctor Dashboard, Professional Profile & Clinical Overview Tests', () => {
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

  const mockDoctorUserDoc = {
    _id: new Types.ObjectId(doctorUserId),
    id: doctorUserId,
    name: 'Vikram Sharma',
    email: 'dr.sharma@healthbridge.in',
    phone: '9876543210',
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  };

  const mockFacilityDoc = {
    _id: new Types.ObjectId(facilityId),
    id: facilityId,
    name: 'AIIMS New Delhi — Cardiology Block',
    facilityType: 'HOSPITAL',
    address: {
      line1: 'Ansari Nagar East',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110029',
    },
  };

  const mockDoctorProfileDoc = {
    _id: new Types.ObjectId(doctorProfileId),
    id: doctorProfileId,
    userId: new Types.ObjectId(doctorUserId),
    registrationNumber: 'MCI-2015-884920',
    specialization: ['Cardiology', 'Internal Medicine'],
    qualifications: ['MBBS', 'MD (Cardiology)'],
    experience: 12,
    verificationStatus: 'VERIFIED',
    facilityId: mockFacilityDoc,
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
    bio: 'Experienced cardiologist specializing in preventive cardiology and hypertension.',
    languages: ['English', 'Hindi'],
    consultationFee: 800,
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    workingHours: {
      start: '09:00',
      end: '17:00',
    },
    save: vi.fn().mockResolvedValue(true),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-06-15'),
  };

  const mockPatientUserDoc = {
    _id: new Types.ObjectId(patientUserId),
    id: patientUserId,
    name: 'Aarav Patel',
    email: 'patient.aarav@healthbridge.in',
    phone: '9876500000',
    role: 'PATIENT',
    accountStatus: 'ACTIVE',
  };

  const mockPatientProfileDoc = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(patientUserId),
    gender: 'MALE',
    dateOfBirth: new Date('1990-01-01'),
  };

  const createQueryMock = (data: any) => {
    const q: any = {
      populate: vi.fn().mockImplementation(() => q),
      sort: vi.fn().mockImplementation(() => q),
      limit: vi.fn().mockImplementation(() => q),
      lean: vi.fn().mockImplementation(() => Promise.resolve(data)),
      then: (resolve: any, reject: any) => Promise.resolve(data).then(resolve, reject),
    };
    return q;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    mockDoctorProfileDoc.workingHours = {
      start: '09:00',
      end: '17:00',
    };
    mockDoctorProfileDoc.consultationFee = 800;

    // Mock UserModel
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString() || String(id);
      if (idStr === doctorUserId) {
        return Promise.resolve(mockDoctorUserDoc);
      }
      if (idStr === patientUserId) {
        return Promise.resolve(mockPatientUserDoc);
      }
      return Promise.resolve(null);
    }) as any);

    vi.spyOn(UserModel, 'find').mockImplementation(() =>
      createQueryMock([mockPatientUserDoc])
    );

    // Mock DoctorProfileModel
    vi.spyOn(DoctorProfileModel, 'findOne').mockImplementation(((filter: any) => {
      const uId = filter?.userId?.toString?.() || filter?.userId;
      if (uId === doctorUserId) {
        return createQueryMock(mockDoctorProfileDoc);
      }
      return createQueryMock(null);
    }) as any);

    // Mock PatientProfileModel
    vi.spyOn(PatientProfileModel, 'findOne').mockImplementation(() =>
      createQueryMock(mockPatientProfileDoc)
    );

    // Mock FacilityModel
    vi.spyOn(FacilityModel, 'findById').mockResolvedValue(mockFacilityDoc as any);

    // Mock AppointmentModel
    vi.spyOn(AppointmentModel, 'find').mockImplementation(() => createQueryMock([]));
    vi.spyOn(AppointmentModel, 'findOne').mockImplementation(() => createQueryMock(null));
    vi.spyOn(AppointmentModel, 'countDocuments').mockResolvedValue(0);
    vi.spyOn(AppointmentModel, 'distinct').mockResolvedValue([]);

    // Mock EncounterModel & PrescriptionModel counts
    vi.spyOn(EncounterModel, 'countDocuments').mockResolvedValue(0);
    vi.spyOn(PrescriptionModel, 'countDocuments').mockResolvedValue(0);
  });

  describe('RBAC & Route Protection', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/doctors/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects PATIENT users from doctor portal endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/me')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('forbidden');
    });

    it('rejects PATIENT users from doctor summary with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/dashboard/summary')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/doctors/me & GET /api/v1/doctors/profile', () => {
    it('returns doctor professional profile with credentials and practice settings', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/profile')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const data = res.body.data;
      expect(data.name).toBe('Vikram Sharma');
      expect(data.registrationNumber).toContain('XXXX');
      expect(data.verificationStatus).toBe('VERIFIED');
      expect(data.specialization).toContain('Cardiology');
      expect(data.qualifications).toContain('MBBS');
      expect(data.experience).toBe(12);
      expect(data.consultationFee).toBe(800);
      expect(data.languages).toEqual(['English', 'Hindi']);
      expect(data.facility?.name).toBe('AIIMS New Delhi — Cardiology Block');
    });
  });

  describe('PATCH /api/v1/doctors/profile', () => {
    it('updates permitted professional profile fields successfully', async () => {
      const updatePayload = {
        bio: 'Updated cardiology specialist bio.',
        consultationFee: 1000,
        languages: ['English', 'Hindi', 'Punjabi'],
        workingHours: {
          start: '08:30',
          end: '16:30',
        },
      };

      const res = await request(app)
        .patch('/api/v1/doctors/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bio).toBe('Updated cardiology specialist bio.');
      expect(res.body.data.consultationFee).toBe(1000);
      expect(res.body.data.languages).toContain('Punjabi');
      expect(res.body.data.workingHours.start).toBe('08:30');
    });

    it('rejects invalid consultation fee with 422 validation error', async () => {
      const res = await request(app)
        .patch('/api/v1/doctors/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          consultationFee: -100, // Invalid negative fee
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/doctors/dashboard/summary', () => {
    it('aggregates doctor clinical metrics and appointment overview', async () => {
      const todayDate = new Date();
      const mockAppointments = [
        {
          _id: new Types.ObjectId(),
          doctorId: new Types.ObjectId(doctorProfileId),
          patientId: mockPatientUserDoc,
          scheduledAt: todayDate,
          startTime: '09:00',
          endTime: '09:30',
          consultationType: 'IN_PERSON',
          status: 'CONFIRMED',
          reason: 'Blood pressure check',
          facilityId: mockFacilityDoc,
        },
      ];

      vi.spyOn(AppointmentModel, 'find').mockImplementation(() =>
        createQueryMock(mockAppointments)
      );
      vi.spyOn(AppointmentModel, 'countDocuments').mockResolvedValue(1);
      vi.spyOn(AppointmentModel, 'distinct').mockResolvedValue([patientUserId]);
      vi.spyOn(EncounterModel, 'countDocuments').mockResolvedValue(2);
      vi.spyOn(PrescriptionModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/doctors/dashboard/summary')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.todayAppointments).toBeDefined();
      expect(res.body.data.upcomingAppointments).toBeDefined();
      expect(res.body.data.recentActivities).toBeDefined();
    });
  });

  describe('GET /api/v1/doctors/appointments/today & upcoming', () => {
    it('returns today consultations for authenticated doctor', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/appointments/today?status=ALL')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('returns upcoming consultations for authenticated doctor', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/appointments/upcoming?limit=5')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/doctors/patients', () => {
    it('returns assigned patient roster scoped to doctor clinical relationship', async () => {
      vi.spyOn(AppointmentModel, 'distinct').mockResolvedValue([patientUserId]);

      const res = await request(app)
        .get('/api/v1/doctors/patients')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/doctors/schedule', () => {
    it('returns clinical working hours, days and slot configurations', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/schedule')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workingDays).toEqual(mockDoctorProfileDoc.workingDays);
      expect(res.body.data.workingHours.start).toBe('09:00');
      expect(res.body.data.slotDurationMinutes).toBe(30);
    });
  });
});
