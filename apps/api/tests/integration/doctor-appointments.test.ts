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
  FacilityModel,
  AuditLogModel,
  NotificationModel,
} from '../../src/database/models';
import mongoose, { Types } from 'mongoose';

describe('Doctor Appointment Management & Patient Queue Integration Tests', () => {
  const app = createApp();

  const doctorUserId = new Types.ObjectId().toString();
  const doctorProfileId = new Types.ObjectId().toString();
  const otherDoctorUserId = new Types.ObjectId().toString();
  const patientUserId = new Types.ObjectId().toString();
  const facilityId = new Types.ObjectId().toString();
  const appointmentId = new Types.ObjectId().toString();
  const encounterId = new Types.ObjectId().toString();

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
    name: 'Dr. Vikram Sharma',
    email: 'dr.sharma@healthbridge.in',
    phone: '9876543210',
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
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

  const mockDoctorProfileDoc: any = {
    _id: new Types.ObjectId(doctorProfileId),
    id: doctorProfileId,
    userId: new Types.ObjectId(doctorUserId),
    registrationNumber: 'MCI-2015-884920',
    specialization: ['Cardiology'],
    qualifications: ['MBBS', 'MD (Cardiology)'],
    experience: 12,
    verificationStatus: 'VERIFIED',
    facilityId: mockFacilityDoc,
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    workingHours: {
      start: '09:00',
      end: '17:00',
    },
    slotDurationMinutes: 30,
    blockedSlots: [],
    save: vi.fn().mockResolvedValue(true),
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
      skip: vi.fn().mockImplementation(() => q),
      limit: vi.fn().mockImplementation(() => q),
      select: vi.fn().mockImplementation(() => q),
      lean: vi.fn().mockImplementation(() => Promise.resolve(data)),
      then: (resolve: any, reject: any) => Promise.resolve(data).then(resolve, reject),
    };
    return q;
  };

  let mockAppointmentDoc: any;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockDoctorProfileDoc.workingDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    mockDoctorProfileDoc.workingHours = { start: '09:00', end: '17:00' };
    mockDoctorProfileDoc.slotDurationMinutes = 30;
    mockDoctorProfileDoc.blockedSlots = [];
    mockDoctorProfileDoc.save = vi.fn().mockResolvedValue(true);

    mockAppointmentDoc = {
      _id: new Types.ObjectId(appointmentId),
      id: appointmentId,
      doctorId: new Types.ObjectId(doctorUserId),
      patientId: new Types.ObjectId(patientUserId),
      facilityId: new Types.ObjectId(facilityId),
      scheduledAt: new Date(),
      startTime: '09:30',
      endTime: '10:00',
      consultationType: 'IN_PERSON',
      status: 'REQUESTED',
      reason: 'Routine cardiac follow-up and ECG check',
      queueNumber: null,
      checkedInAt: null,
      consultationStartedAt: null,
      completedAt: null,
      cancelledAt: null,
      rejectionReason: null,
      cancellationReason: null,
      encounterId: null,
      createdAt: new Date('2024-06-01T08:00:00Z'),
      updatedAt: new Date('2024-06-01T08:00:00Z'),
      save: vi.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    // Mock UserModel
    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString() || String(id);
      if (idStr === doctorUserId) return Promise.resolve(mockDoctorUserDoc);
      if (idStr === patientUserId) return Promise.resolve(mockPatientUserDoc);
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

    // Mock AppointmentModel defaults
    vi.spyOn(AppointmentModel, 'find').mockImplementation(() => createQueryMock([]));
    vi.spyOn(AppointmentModel, 'findOne').mockImplementation(() => createQueryMock(mockAppointmentDoc));
    vi.spyOn(AppointmentModel, 'findById').mockResolvedValue(mockAppointmentDoc as any);
    vi.spyOn(AppointmentModel, 'countDocuments').mockResolvedValue(1);

    // Mock EncounterModel
    vi.spyOn(EncounterModel, 'create').mockResolvedValue({
      _id: new Types.ObjectId(encounterId),
      patientId: new Types.ObjectId(patientUserId),
      practitionerId: new Types.ObjectId(doctorUserId),
      facilityId: new Types.ObjectId(facilityId),
      appointmentId: new Types.ObjectId(appointmentId),
      status: 'IN_PROGRESS',
      startTime: new Date(),
    } as any);

    vi.spyOn(EncounterModel, 'findById').mockResolvedValue(null);
    vi.spyOn(EncounterModel, 'findByIdAndUpdate').mockResolvedValue({
      _id: new Types.ObjectId(encounterId),
      status: 'COMPLETED',
    } as any);
    vi.spyOn(EncounterModel, 'findOne').mockImplementation(() => createQueryMock(null));

    // Mock Audit & Notification
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1 as any);
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(NotificationModel, 'create').mockResolvedValue({} as any);
  });

  /* ==========================================================================
     1. RBAC & ROUTE PROTECTION
     ========================================================================== */
  describe('RBAC & Security Protection', () => {
    it('rejects unauthenticated requests to appointment endpoints with 401', async () => {
      const endpoints = [
        '/api/v1/doctors/appointments/summary',
        '/api/v1/doctors/appointments',
        `/api/v1/doctors/appointments/${appointmentId}`,
        '/api/v1/doctors/queue',
        '/api/v1/doctors/schedule',
      ];

      for (const endpoint of endpoints) {
        const res = await request(app).get(endpoint);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      }
    });

    it('rejects PATIENT role from accessing doctor appointment endpoints with 403 Forbidden', async () => {
      const endpoints = [
        '/api/v1/doctors/appointments/summary',
        '/api/v1/doctors/appointments',
        `/api/v1/doctors/appointments/${appointmentId}`,
        '/api/v1/doctors/queue',
      ];

      for (const endpoint of endpoints) {
        const res = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${patientToken}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message.toLowerCase()).toContain('forbidden');
      }
    });

    it('rejects invalid ObjectId parameters with 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/appointments/not-a-valid-object-id')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     2. GET /api/v1/doctors/appointments/summary
     ========================================================================== */
  describe('GET /api/v1/doctors/appointments/summary', () => {
    it('returns aggregated consultation metrics for today, upcoming, pending, completed, cancelled', async () => {
      vi.spyOn(AppointmentModel, 'countDocuments')
        .mockResolvedValueOnce(5)  // today
        .mockResolvedValueOnce(12) // upcoming
        .mockResolvedValueOnce(3)  // pending
        .mockResolvedValueOnce(25) // completed
        .mockResolvedValueOnce(2)  // cancelled
        .mockResolvedValueOnce(47); // total

      const res = await request(app)
        .get('/api/v1/doctors/appointments/summary')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        today: 5,
        upcoming: 12,
        pending: 3,
        completed: 25,
        cancelled: 2,
        total: 47,
      });
    });
  });

  /* ==========================================================================
     3. GET /api/v1/doctors/appointments
     ========================================================================== */
  describe('GET /api/v1/doctors/appointments', () => {
    it('returns paginated appointments matching filter criteria', async () => {
      const mockListAppointment = {
        _id: new Types.ObjectId(appointmentId),
        patientId: mockPatientUserDoc,
        facilityId: mockFacilityDoc,
        scheduledAt: new Date(),
        startTime: '10:00',
        endTime: '10:30',
        consultationType: 'IN_PERSON',
        reason: 'Post-op cardiac evaluation',
        status: 'CONFIRMED',
        queueNumber: 1,
      };

      vi.spyOn(AppointmentModel, 'find').mockImplementation(() =>
        createQueryMock([mockListAppointment])
      );
      vi.spyOn(AppointmentModel, 'countDocuments').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/doctors/appointments?filterTab=today&page=1&limit=10')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].patientName).toBe('Aarav Patel');
      expect(res.body.data[0].status).toBe('CONFIRMED');
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.total).toBe(1);
    });

    it('filters consultations by search query matching patient name', async () => {
      vi.spyOn(UserModel, 'find').mockImplementation(() =>
        createQueryMock([{ _id: new Types.ObjectId(patientUserId) }])
      );
      vi.spyOn(AppointmentModel, 'find').mockImplementation(() => createQueryMock([]));
      vi.spyOn(AppointmentModel, 'countDocuments').mockResolvedValue(0);

      const res = await request(app)
        .get('/api/v1/doctors/appointments?search=Aarav')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  /* ==========================================================================
     4. GET /api/v1/doctors/appointments/:appointmentId
     ========================================================================== */
  describe('GET /api/v1/doctors/appointments/:appointmentId', () => {
    it('returns authorized appointment details with demographic and clinical context', async () => {
      const detailedMock = {
        ...mockAppointmentDoc,
        patientId: mockPatientUserDoc,
        facilityId: mockFacilityDoc,
      };

      vi.spyOn(AppointmentModel, 'findOne').mockImplementation(() =>
        createQueryMock(detailedMock)
      );

      const res = await request(app)
        .get(`/api/v1/doctors/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(appointmentId);
      expect(res.body.data.patientName).toBe('Aarav Patel');
      expect(res.body.data.patientGender).toBe('MALE');
      expect(res.body.data.patientAge).toBeGreaterThan(0);
      expect(res.body.data.facility?.name).toBe('AIIMS New Delhi — Cardiology Block');
    });

    it('returns 404 when appointment does not exist or belongs to another doctor', async () => {
      vi.spyOn(AppointmentModel, 'findOne').mockImplementation(() =>
        createQueryMock(null)
      );

      const res = await request(app)
        .get(`/api/v1/doctors/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  /* ==========================================================================
     5. STATE TRANSITIONS & CLINICAL ACTIONS
     ========================================================================== */
  describe('State Transitions & Clinical Actions', () => {
    describe('PATCH /api/v1/doctors/appointments/:appointmentId/confirm', () => {
      it('confirms a REQUESTED appointment and sends patient notification', async () => {
        mockAppointmentDoc.status = 'REQUESTED';

        // findOne for the action, then findOne for getAppointmentById
        vi.spyOn(AppointmentModel, 'findOne')
          .mockResolvedValueOnce(mockAppointmentDoc as any)
          .mockImplementation(() =>
            createQueryMock({
              ...mockAppointmentDoc,
              status: 'CONFIRMED',
              patientId: mockPatientUserDoc,
              facilityId: mockFacilityDoc,
            })
          );

        const res = await request(app)
          .patch(`/api/v1/doctors/appointments/${appointmentId}/confirm`)
          .set('Authorization', `Bearer ${doctorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(mockAppointmentDoc.status).toBe('CONFIRMED');
        expect(mockAppointmentDoc.save).toHaveBeenCalled();
        expect(AuditLogModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'APPOINTMENT_CONFIRMED',
            resourceId: appointmentId,
          })
        );
        expect(NotificationModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Appointment Confirmed',
          })
        );
      });

      it('rejects confirmation if appointment is already COMPLETED with 400', async () => {
        mockAppointmentDoc.status = 'COMPLETED';
        vi.spyOn(AppointmentModel, 'findOne').mockResolvedValue(mockAppointmentDoc as any);

        const res = await request(app)
          .patch(`/api/v1/doctors/appointments/${appointmentId}/confirm`)
          .set('Authorization', `Bearer ${doctorToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('PATCH /api/v1/doctors/appointments/:appointmentId/reject', () => {
      it('rejects a pending appointment with reason and cancels slot reservation', async () => {
        mockAppointmentDoc.status = 'REQUESTED';

        vi.spyOn(AppointmentModel, 'findOne')
          .mockResolvedValueOnce(mockAppointmentDoc as any)
          .mockImplementation(() =>
            createQueryMock({
              ...mockAppointmentDoc,
              status: 'CANCELLED',
              rejectionReason: 'Emergency OT scheduled at this hour',
              patientId: mockPatientUserDoc,
              facilityId: mockFacilityDoc,
            })
          );

        const res = await request(app)
          .patch(`/api/v1/doctors/appointments/${appointmentId}/reject`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ reason: 'Emergency OT scheduled at this hour' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(mockAppointmentDoc.status).toBe('CANCELLED');
        expect(mockAppointmentDoc.rejectionReason).toBe('Emergency OT scheduled at this hour');
        expect(AuditLogModel.create).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'APPOINTMENT_REJECTED' })
        );
      });

      it('rejects rejection when appointment is in an active non-pending state with 400', async () => {
        mockAppointmentDoc.status = 'IN_PROGRESS';
        vi.spyOn(AppointmentModel, 'findOne').mockResolvedValue(mockAppointmentDoc as any);

        const res = await request(app)
          .patch(`/api/v1/doctors/appointments/${appointmentId}/reject`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ reason: 'Emergency OT scheduled' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('rejects rejection with reason exceeding 500 characters with 422', async () => {
        const res = await request(app)
          .patch(`/api/v1/doctors/appointments/${appointmentId}/reject`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ reason: 'a'.repeat(501) });

        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);
      });
    });

    describe('PATCH /api/v1/doctors/appointments/:appointmentId/check-in', () => {
      it('checks in patient, assigns queue token number and records check-in timestamp', async () => {
        mockAppointmentDoc.status = 'CONFIRMED';
        mockAppointmentDoc.queueNumber = null;

        // Sequence: findOne for checkIn, findOne for maxQueueApt, findOne for getAppointmentById
        vi.spyOn(AppointmentModel, 'findOne')
          .mockResolvedValueOnce(mockAppointmentDoc as any)
          .mockImplementationOnce(() => createQueryMock({ queueNumber: 4 }))
          .mockImplementation(() =>
            createQueryMock({
              ...mockAppointmentDoc,
              status: 'CHECKED_IN',
              queueNumber: 5,
              patientId: mockPatientUserDoc,
              facilityId: mockFacilityDoc,
            })
          );

        const res = await request(app)
          .patch(`/api/v1/doctors/appointments/${appointmentId}/check-in`)
          .set('Authorization', `Bearer ${doctorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(mockAppointmentDoc.status).toBe('CHECKED_IN');
        expect(mockAppointmentDoc.queueNumber).toBe(5);
        expect(mockAppointmentDoc.checkedInAt).toBeDefined();
      });

      it('fails check-in when appointment is in CANCELLED state with 400', async () => {
        mockAppointmentDoc.status = 'CANCELLED';
        vi.spyOn(AppointmentModel, 'findOne').mockResolvedValue(mockAppointmentDoc as any);

        const res = await request(app)
          .patch(`/api/v1/doctors/appointments/${appointmentId}/check-in`)
          .set('Authorization', `Bearer ${doctorToken}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('PATCH /api/v1/doctors/appointments/:appointmentId/start', () => {
      it('starts consultation, transitions to IN_PROGRESS, and creates linked Encounter', async () => {
        mockAppointmentDoc.status = 'CHECKED_IN';
        mockAppointmentDoc.encounterId = null;

        vi.spyOn(AppointmentModel, 'findOne')
          .mockResolvedValueOnce(mockAppointmentDoc as any)
          .mockImplementation(() =>
            createQueryMock({
              ...mockAppointmentDoc,
              status: 'IN_PROGRESS',
              encounterId: new Types.ObjectId(encounterId),
              patientId: mockPatientUserDoc,
              facilityId: mockFacilityDoc,
            })
          );

        const res = await request(app)
          .patch(`/api/v1/doctors/appointments/${appointmentId}/start`)
          .set('Authorization', `Bearer ${doctorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(mockAppointmentDoc.status).toBe('IN_PROGRESS');
        expect(mockAppointmentDoc.consultationStartedAt).toBeDefined();
        expect(EncounterModel.create).toHaveBeenCalled();
      });
    });

    describe('PATCH /api/v1/doctors/appointments/:appointmentId/complete', () => {
      it('completes consultation, updates linked encounter to COMPLETED and notifies patient', async () => {
        mockAppointmentDoc.status = 'IN_PROGRESS';
        mockAppointmentDoc.encounterId = new Types.ObjectId(encounterId);

        vi.spyOn(AppointmentModel, 'findOne')
          .mockResolvedValueOnce(mockAppointmentDoc as any)
          .mockImplementation(() =>
            createQueryMock({
              ...mockAppointmentDoc,
              status: 'COMPLETED',
              patientId: mockPatientUserDoc,
              facilityId: mockFacilityDoc,
            })
          );

        const res = await request(app)
          .patch(`/api/v1/doctors/appointments/${appointmentId}/complete`)
          .set('Authorization', `Bearer ${doctorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(mockAppointmentDoc.status).toBe('COMPLETED');
        expect(mockAppointmentDoc.completedAt).toBeDefined();
        expect(EncounterModel.findByIdAndUpdate).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ status: 'COMPLETED' })
        );
        expect(NotificationModel.create).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Consultation Completed' })
        );
      });
    });

    describe('PATCH /api/v1/doctors/appointments/:appointmentId/cancel', () => {
      it('cancels appointment with captured clinical reason', async () => {
        mockAppointmentDoc.status = 'CONFIRMED';
        mockAppointmentDoc.encounterId = new Types.ObjectId(encounterId);

        vi.spyOn(AppointmentModel, 'findOne')
          .mockResolvedValueOnce(mockAppointmentDoc as any)
          .mockImplementation(() =>
            createQueryMock({
              ...mockAppointmentDoc,
              status: 'CANCELLED',
              cancellationReason: 'Doctor called away on emergency patient rounds',
              patientId: mockPatientUserDoc,
              facilityId: mockFacilityDoc,
            })
          );

        const res = await request(app)
          .patch(`/api/v1/doctors/appointments/${appointmentId}/cancel`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ reason: 'Doctor called away on emergency patient rounds' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(mockAppointmentDoc.status).toBe('CANCELLED');
        expect(mockAppointmentDoc.cancellationReason).toBe(
          'Doctor called away on emergency patient rounds'
        );
        expect(EncounterModel.findByIdAndUpdate).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ status: 'CANCELLED' })
        );
      });

      it('rejects cancellation without reason with 422 validation error', async () => {
        const res = await request(app)
          .patch(`/api/v1/doctors/appointments/${appointmentId}/cancel`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({});

        expect(res.status).toBe(422);
      });
    });
  });

  /* ==========================================================================
     6. GET /api/v1/doctors/queue
     ========================================================================== */
  describe('GET /api/v1/doctors/queue', () => {
    it('returns prioritized patient queue with live waiting duration', async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60000);
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60000);

      const mockQueueAppointments = [
        {
          _id: new Types.ObjectId(),
          patientId: { ...mockPatientUserDoc, name: 'Patient In Consultation' },
          scheduledAt: new Date(),
          startTime: '09:00',
          endTime: '09:30',
          consultationType: 'IN_PERSON',
          status: 'IN_PROGRESS',
          queueNumber: 1,
        },
        {
          _id: new Types.ObjectId(),
          patientId: { ...mockPatientUserDoc, name: 'Patient Waiting Longest' },
          scheduledAt: new Date(),
          startTime: '09:30',
          endTime: '10:00',
          consultationType: 'IN_PERSON',
          status: 'CHECKED_IN',
          checkedInAt: thirtyMinutesAgo,
          queueNumber: 2,
        },
        {
          _id: new Types.ObjectId(),
          patientId: { ...mockPatientUserDoc, name: 'Patient Just Arrived' },
          scheduledAt: new Date(),
          startTime: '10:00',
          endTime: '10:30',
          consultationType: 'IN_PERSON',
          status: 'CHECKED_IN',
          checkedInAt: tenMinutesAgo,
          queueNumber: 3,
        },
      ];

      vi.spyOn(AppointmentModel, 'find').mockImplementation(() =>
        createQueryMock(mockQueueAppointments)
      );

      const res = await request(app)
        .get('/api/v1/doctors/queue')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);

      // Verify Priority Order: IN_PROGRESS first, then CHECKED_IN with longer wait first
      expect(res.body.data[0].status).toBe('IN_PROGRESS');
      expect(res.body.data[1].patientName).toBe('Patient Waiting Longest');
      expect(res.body.data[1].waitingMinutes).toBeGreaterThanOrEqual(29);
      expect(res.body.data[2].patientName).toBe('Patient Just Arrived');
      expect(res.body.data[2].waitingMinutes).toBeLessThan(res.body.data[1].waitingMinutes);
    });
  });

  /* ==========================================================================
     7. PUT /api/v1/doctors/schedule
     ========================================================================== */
  describe('PUT /api/v1/doctors/schedule', () => {
    it('updates doctor consultation availability, slot duration, and temporary blocked dates', async () => {
      const schedulePayload = {
        workingDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        workingHours: {
          start: '10:00',
          end: '16:00',
        },
        slotDurationMinutes: 20,
        consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
        blockedSlots: [
          {
            date: '2026-11-20',
            startTime: '14:00',
            endTime: '16:00',
            reason: 'Cardiology Department Review Meeting',
          },
        ],
      };

      vi.spyOn(AppointmentModel, 'find').mockImplementation(() => createQueryMock([]));

      const res = await request(app)
        .put('/api/v1/doctors/schedule')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(schedulePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workingDays).toEqual(['MONDAY', 'WEDNESDAY', 'FRIDAY']);
      expect(res.body.data.workingHours.start).toBe('10:00');
      expect(res.body.data.slotDurationMinutes).toBe(20);
      expect(res.body.data.existingBlocks.length).toBe(1);
      expect(res.body.data.existingBlocks[0].reason).toBe(
        'Cardiology Department Review Meeting'
      );
      expect(mockDoctorProfileDoc.save).toHaveBeenCalled();
    });

    it('rejects invalid schedule format with 422', async () => {
      const invalidPayload = {
        workingHours: {
          start: 'invalid-time',
          end: '18:00',
        },
      };

      const res = await request(app)
        .put('/api/v1/doctors/schedule')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });
});
