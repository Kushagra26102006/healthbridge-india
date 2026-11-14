import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import {
  UserModel,
  DoctorProfileModel,
  AppointmentModel,
  FacilityModel,
  DoctorScheduleModel,
} from '../../src/database/models';
import { Types } from 'mongoose';

describe('Doctor Schedule & Availability Management System Integration Tests', () => {
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
    name: 'Dr. Vikram Sharma',
    email: 'dr.sharma@healthbridge.in',
    phone: '9876543210',
    role: 'DOCTOR',
    accountStatus: 'ACTIVE',
    emailVerified: true,
    phoneVerified: true,
  };

  const mockPatientUserDoc = {
    _id: new Types.ObjectId(patientUserId),
    id: patientUserId,
    name: 'Aarav Patel',
    email: 'patient.aarav@healthbridge.in',
    phone: '9876500000',
    role: 'PATIENT',
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
    isActive: true,
  };

  const mockDoctorProfileDoc = {
    _id: new Types.ObjectId(doctorProfileId),
    id: doctorProfileId,
    userId: new Types.ObjectId(doctorUserId),
    registrationNumber: 'MCI-2015-884920',
    specialization: ['Cardiology'],
    qualifications: ['MBBS', 'MD'],
    experience: 12,
    verificationStatus: 'VERIFIED',
    facilityId: new Types.ObjectId(facilityId),
    consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    workingHours: { start: '09:00', end: '17:00' },
    slotDurationMinutes: 30,
    blockedSlots: [],
  };

  let mockScheduleDoc: any;

  const createQueryMock = (data: any) => {
    const q: any = {
      populate: vi.fn().mockImplementation(() => q),
      select: vi.fn().mockImplementation(() => q),
      sort: vi.fn().mockImplementation(() => q),
      limit: vi.fn().mockImplementation(() => q),
      lean: vi.fn().mockImplementation(() => Promise.resolve(data)),
      then: (resolve: any, reject: any) => Promise.resolve(data).then(resolve, reject),
    };
    return q;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    mockScheduleDoc = {
      _id: new Types.ObjectId(),
      doctorId: new Types.ObjectId(doctorUserId),
      facilityId: new Types.ObjectId(facilityId),
      timezone: 'Asia/Kolkata',
      slotDurationMinutes: 30,
      bufferMinutes: 5,
      weeklySchedule: [
        {
          day: 'MONDAY',
          isEnabled: true,
          workingWindows: [{ start: '09:00', end: '17:00' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
          slotDurationMinutes: 30,
          bufferMinutes: 5,
          consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
        },
        {
          day: 'TUESDAY',
          isEnabled: true,
          workingWindows: [{ start: '09:00', end: '17:00' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
          slotDurationMinutes: 30,
          bufferMinutes: 5,
          consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
        },
        {
          day: 'WEDNESDAY',
          isEnabled: true,
          workingWindows: [{ start: '09:00', end: '17:00' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
          slotDurationMinutes: 30,
          bufferMinutes: 5,
          consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
        },
        {
          day: 'THURSDAY',
          isEnabled: true,
          workingWindows: [{ start: '09:00', end: '17:00' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
          slotDurationMinutes: 30,
          bufferMinutes: 5,
          consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
        },
        {
          day: 'FRIDAY',
          isEnabled: true,
          workingWindows: [{ start: '09:00', end: '17:00' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
          slotDurationMinutes: 30,
          bufferMinutes: 5,
          consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
        },
        {
          day: 'SATURDAY',
          isEnabled: true,
          workingWindows: [{ start: '09:00', end: '13:00' }],
          breaks: [],
          slotDurationMinutes: 30,
          bufferMinutes: 5,
          consultationModes: ['IN_PERSON'],
        },
        {
          day: 'SUNDAY',
          isEnabled: false,
          workingWindows: [],
          breaks: [],
          slotDurationMinutes: 30,
          bufferMinutes: 5,
          consultationModes: ['IN_PERSON'],
        },
      ],
      consultationTypes: [
        {
          type: 'IN_PERSON',
          name: 'In-Person Consultation',
          isEnabled: true,
          durationMinutes: 30,
          fee: 500,
          bufferMinutes: 5,
          description: 'Standard in-clinic consultation',
        },
        {
          type: 'TELECONSULTATION',
          name: 'Video Teleconsultation',
          isEnabled: true,
          durationMinutes: 20,
          fee: 400,
          bufferMinutes: 5,
          description: 'Remote video consultation',
        },
      ],
      blockedDates: [],
      overrides: [],
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

    // Mock DoctorProfileModel
    vi.spyOn(DoctorProfileModel, 'findOne').mockImplementation((() =>
      createQueryMock(mockDoctorProfileDoc)
    ) as any);
    vi.spyOn(DoctorProfileModel, 'updateOne').mockResolvedValue({} as any);

    // Mock DoctorScheduleModel
    vi.spyOn(DoctorScheduleModel, 'findOne').mockImplementation((() =>
      Promise.resolve(mockScheduleDoc)
    ) as any);
    vi.spyOn(DoctorScheduleModel, 'create').mockImplementation(((data: any) =>
      Promise.resolve({ ...mockScheduleDoc, ...data })
    ) as any);

    // Mock FacilityModel
    vi.spyOn(FacilityModel, 'findById').mockImplementation((() =>
      createQueryMock(mockFacilityDoc)
    ) as any);
    vi.spyOn(FacilityModel, 'find').mockImplementation((() =>
      createQueryMock([mockFacilityDoc])
    ) as any);

    // Mock AppointmentModel
    vi.spyOn(AppointmentModel, 'find').mockImplementation((() =>
      createQueryMock([])
    ) as any);
    vi.spyOn(AppointmentModel, 'countDocuments').mockResolvedValue(0);
  });

  describe('RBAC & Security Verification', () => {
    it('rejects unauthenticated requests to /api/v1/doctors/schedule with 401', async () => {
      const res = await request(app).get('/api/v1/doctors/schedule');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects PATIENT users from accessing doctor schedule endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/schedule')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/doctors/schedule', () => {
    it('returns full doctor schedule configuration including weekly schedule and breaks', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/schedule')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.timezone).toBe('Asia/Kolkata');
      expect(res.body.data.weeklySchedule).toHaveLength(7);

      const monday = res.body.data.weeklySchedule.find((d: any) => d.day === 'MONDAY');
      expect(monday).toBeDefined();
      expect(monday.isEnabled).toBe(true);
      expect(monday.workingWindows).toEqual([{ start: '09:00', end: '17:00' }]);
      expect(monday.breaks).toEqual([{ start: '13:00', end: '14:00', label: 'Lunch Break' }]);
      expect(monday.slotDurationMinutes).toBe(30);
      expect(monday.bufferMinutes).toBe(5);
    });
  });

  describe('PUT /api/v1/doctors/schedule', () => {
    it('successfully updates weekly schedule with customized working windows and breaks', async () => {
      const updatePayload = {
        timezone: 'Asia/Kolkata',
        slotDurationMinutes: 20,
        bufferMinutes: 10,
        weeklySchedule: [
          {
            day: 'MONDAY',
            isEnabled: true,
            workingWindows: [{ start: '08:00', end: '16:00' }],
            breaks: [{ start: '12:00', end: '13:00', label: 'Midday Rest' }],
            slotDurationMinutes: 20,
            bufferMinutes: 10,
            consultationModes: ['IN_PERSON', 'TELECONSULTATION'],
          },
          {
            day: 'TUESDAY',
            isEnabled: false,
            workingWindows: [],
            breaks: [],
            slotDurationMinutes: 20,
            bufferMinutes: 10,
            consultationModes: ['IN_PERSON'],
          },
        ],
      };

      const res = await request(app)
        .put('/api/v1/doctors/schedule')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockScheduleDoc.save).toHaveBeenCalled();
    });

    it('rejects schedule update when working window start time is after end time (422)', async () => {
      const invalidPayload = {
        weeklySchedule: [
          {
            day: 'MONDAY',
            isEnabled: true,
            workingWindows: [{ start: '18:00', end: '09:00' }], // invalid start >= end
            breaks: [],
            slotDurationMinutes: 30,
            bufferMinutes: 5,
            consultationModes: ['IN_PERSON'],
          },
        ],
      };

      const res = await request(app)
        .put('/api/v1/doctors/schedule')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidPayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('rejects schedule update when break interval is outside working hours (422)', async () => {
      const invalidBreakPayload = {
        weeklySchedule: [
          {
            day: 'MONDAY',
            isEnabled: true,
            workingWindows: [{ start: '09:00', end: '17:00' }],
            breaks: [{ start: '18:00', end: '19:00', label: 'Evening Snack' }], // Outside 09:00-17:00
            slotDurationMinutes: 30,
            bufferMinutes: 5,
            consultationModes: ['IN_PERSON'],
          },
        ],
      };

      const res = await request(app)
        .put('/api/v1/doctors/schedule')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidBreakPayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/doctors/schedule/overview', () => {
    it('returns summary metrics including today working hours, slot counts, and weekly summary', async () => {
      const res = await request(app)
        .get('/api/v1/doctors/schedule/overview')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('todayWorkingHours');
      expect(res.body.data).toHaveProperty('todayAppointmentsCount');
      expect(res.body.data).toHaveProperty('todayAvailableSlotsCount');
      expect(res.body.data).toHaveProperty('weeklyScheduleSummary');
      expect(res.body.data.weeklyScheduleSummary.totalWorkingDays).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/doctors/schedule/availability', () => {
    it('generates discrete consultation slots and excludes lunch break', async () => {
      // 2026-11-20 is a Friday
      const res = await request(app)
        .get('/api/v1/doctors/schedule/availability?date=2026-11-20')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.date).toBe('2026-11-20');
      expect(Array.isArray(res.body.data.slots)).toBe(true);
      expect(res.body.data.slots.length).toBeGreaterThan(0);

      // Verify that NO slot starts within the lunch break (13:00 to 14:00)
      const lunchSlot = res.body.data.slots.find(
        (s: any) => s.startTime >= '13:00' && s.startTime < '14:00'
      );
      expect(lunchSlot).toBeUndefined();
    });

    it('returns empty slots array on a day configured as disabled (e.g. Sunday)', async () => {
      // 2026-11-22 is a Sunday (isEnabled: false in default weekly schedule)
      const res = await request(app)
        .get('/api/v1/doctors/schedule/availability?date=2026-11-22')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slots).toEqual([]);
    });

    it('marks booked appointments as unavailable in slot listing', async () => {
      // Mock an existing confirmed appointment on 2026-11-20 at 10:00 AM (04:30 UTC)
      const bookedDate = new Date('2026-11-20T04:30:00.000Z');
      vi.spyOn(AppointmentModel, 'find').mockImplementation((() =>
        createQueryMock([
          {
            _id: new Types.ObjectId(),
            doctorId: new Types.ObjectId(doctorUserId),
            scheduledAt: bookedDate,
            startTime: '10:00',
            endTime: '10:30',
            status: 'CONFIRMED',
          },
        ])
      ) as any);

      const res = await request(app)
        .get('/api/v1/doctors/schedule/availability?date=2026-11-20')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      const slot10am = res.body.data.slots.find((s: any) => s.startTime === '10:00');
      if (slot10am) {
        expect(slot10am.isAvailable).toBe(false);
      }
    });
  });

  describe('Calendar View: GET /api/v1/doctors/schedule/calendar', () => {
    it('aggregates appointments, breaks, and blocks in a week view with masked patient names', async () => {
      vi.spyOn(AppointmentModel, 'find').mockImplementation((() =>
        createQueryMock([
          {
            _id: new Types.ObjectId(),
            doctorId: new Types.ObjectId(doctorUserId),
            patientId: { name: 'Aarav Sharma' },
            scheduledAt: new Date('2026-11-20T04:30:00.000Z'),
            startTime: '10:00',
            endTime: '10:30',
            consultationType: 'IN_PERSON',
            status: 'CONFIRMED',
            reason: 'Cardiology consultation',
          },
        ])
      ) as any);

      const res = await request(app)
        .get('/api/v1/doctors/schedule/calendar?view=week&date=2026-11-20')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.view).toBe('week');

      const apptItem = res.body.data.items.find((i: any) => i.type === 'APPOINTMENT');
      expect(apptItem).toBeDefined();
      expect(apptItem.patientMasked).toBe('Aarav S.');
    });
  });

  describe('Blocked Dates and Leave: Conflict Detection & Workflows', () => {
    it('successfully creates a blocked date period when no conflicting appointments exist', async () => {
      vi.spyOn(AppointmentModel, 'find').mockImplementation((() =>
        createQueryMock([])
      ) as any);

      const res = await request(app)
        .post('/api/v1/doctors/schedule/blocked-dates')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          startDate: '2026-12-24',
          endDate: '2026-12-26',
          isAllDay: true,
          reason: 'Christmas Holiday and Annual Leave',
          forceWithConflicts: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasConflicts).toBe(false);
      expect(res.body.data.blockedDate).toBeDefined();
    });

    it('detects conflicting booked appointments and returns 409 Conflict with affected appointments when not forced', async () => {
      vi.spyOn(AppointmentModel, 'find').mockImplementation((() =>
        createQueryMock([
          {
            _id: new Types.ObjectId(),
            patientId: { name: 'Sunita Mehra' },
            scheduledAt: new Date('2026-12-24T05:00:00.000Z'),
            startTime: '10:30',
            endTime: '11:00',
            consultationType: 'IN_PERSON',
            status: 'CONFIRMED',
          },
        ])
      ) as any);

      const res = await request(app)
        .post('/api/v1/doctors/schedule/blocked-dates')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          startDate: '2026-12-24',
          endDate: '2026-12-24',
          isAllDay: true,
          reason: 'Emergency Medical Conference',
          forceWithConflicts: false,
        });

      expect(res.status).toBe(409);
      expect(res.body.data.hasConflicts).toBe(true);
      expect(res.body.data.affectedAppointments).toHaveLength(1);
      expect(res.body.data.affectedAppointments[0].patientNameMasked).toBe('Sunita M.');
    });

    it('creates blocked date when forceWithConflicts is true after doctor confirmation', async () => {
      vi.spyOn(AppointmentModel, 'find').mockImplementation((() =>
        createQueryMock([
          {
            _id: new Types.ObjectId(),
            patientId: { name: 'Sunita Mehra' },
            scheduledAt: new Date('2026-12-24T05:00:00.000Z'),
            startTime: '10:30',
            endTime: '11:00',
            status: 'CONFIRMED',
          },
        ])
      ) as any);

      const res = await request(app)
        .post('/api/v1/doctors/schedule/blocked-dates')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          startDate: '2026-12-24',
          endDate: '2026-12-24',
          isAllDay: true,
          reason: 'Emergency Medical Conference (Confirmed Override)',
          forceWithConflicts: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasConflicts).toBe(true);
      expect(res.body.data.blockedDate).toBeDefined();
    });

    it('deletes a blocked date successfully', async () => {
      const blockId = new Types.ObjectId().toString();
      mockScheduleDoc.blockedDates = [
        {
          _id: new Types.ObjectId(blockId),
          startDate: '2026-12-24',
          endDate: '2026-12-24',
          isAllDay: true,
          reason: 'Personal Leave',
          createdAt: new Date(),
        },
      ];

      const res = await request(app)
        .delete(`/api/v1/doctors/schedule/blocked-dates/${blockId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockScheduleDoc.blockedDates).toHaveLength(0);
    });
  });

  describe('Special Working Day Overrides', () => {
    it('creates special working day override and takes precedence over weekly schedule', async () => {
      const res = await request(app)
        .post('/api/v1/doctors/schedule/overrides')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          date: '2026-11-22', // Sunday (normally disabled)
          isWorkingDay: true,
          reason: 'Sunday Morning Free Health Camp',
          workingWindows: [{ start: '08:00', end: '12:00' }],
          breaks: [],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.date).toBe('2026-11-22');
      expect(res.body.data.isWorkingDay).toBe(true);

      // Verify that slot availability now generates slots for this Sunday
      mockScheduleDoc.overrides = [
        {
          _id: new Types.ObjectId(res.body.data.id),
          date: '2026-11-22',
          isWorkingDay: true,
          reason: 'Sunday Morning Free Health Camp',
          workingWindows: [{ start: '08:00', end: '12:00' }],
          breaks: [],
          createdAt: new Date(),
        },
      ];

      const availRes = await request(app)
        .get('/api/v1/doctors/schedule/availability?date=2026-11-22')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(availRes.status).toBe(200);
      expect(availRes.body.data.slots.length).toBeGreaterThan(0);
      expect(availRes.body.data.slots[0].startTime).toBe('08:00');
    });

    it('deletes special working day override successfully', async () => {
      const overrideId = new Types.ObjectId().toString();
      mockScheduleDoc.overrides = [
        {
          _id: new Types.ObjectId(overrideId),
          date: '2026-11-22',
          isWorkingDay: true,
          reason: 'Temporary override',
          workingWindows: [{ start: '08:00', end: '12:00' }],
          breaks: [],
          createdAt: new Date(),
        },
      ];

      const res = await request(app)
        .delete(`/api/v1/doctors/schedule/overrides/${overrideId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockScheduleDoc.overrides).toHaveLength(0);
    });
  });

  describe('Patient Booking Synchronization', () => {
    it('public availability endpoint /api/v1/doctors/:doctorId/availability returns synchronized slots matching doctor schedule', async () => {
      const res = await request(app)
        .get(`/api/v1/doctors/${doctorUserId}/availability?date=2026-11-20`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slots.length).toBeGreaterThan(0);

      // Excludes break time 13:00 - 14:00
      const breakSlot = res.body.data.slots.find(
        (s: any) => s.startTime >= '13:00' && s.startTime < '14:00'
      );
      expect(breakSlot).toBeUndefined();
    });
  });

  describe('Concurrency & Double-Booking Protection', () => {
    it('rejects concurrent duplicate booking on the exact same doctor and timestamp with 409 Conflict', async () => {
      const scheduledAt = new Date('2026-11-25T04:30:00.000Z'); // 10:00 AM IST

      // Mock an existing confirmed appointment for the slot
      vi.spyOn(AppointmentModel, 'findOne').mockImplementation(((query: any) => {
        if (query.doctorId && query.status) {
          return Promise.resolve({
            _id: new Types.ObjectId(),
            doctorId: query.doctorId,
            scheduledAt,
            status: 'CONFIRMED',
          });
        }
        return Promise.resolve(null);
      }) as any);

      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: doctorUserId,
          scheduledAt: scheduledAt.toISOString(),
          startTime: '10:00',
          endTime: '10:30',
          consultationType: 'IN_PERSON',
          reason: 'Follow-up cardiology consultation',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already been booked');
    });
  });
});
