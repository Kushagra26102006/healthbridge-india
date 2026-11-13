import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel } from '../../src/modules/users/models/user.model';
import { AppointmentModel } from '../../src/modules/healthcare/models/appointment.model';
import { Types } from 'mongoose';

describe('Patient Appointment Booking, Concurrency & Management Integration Tests', () => {
  const app = createApp();

  const patientAId = new Types.ObjectId().toString();
  const patientBId = new Types.ObjectId().toString();
  const doctorId = '650000000000000000000201'; // Dr. Rajesh Verma

  const patientAToken = tokenService.generateAccessToken({
    _id: patientAId,
    role: 'PATIENT',
    email: 'patient.a@healthbridge.in',
  } as any);

  const patientBToken = tokenService.generateAccessToken({
    _id: patientBId,
    role: 'PATIENT',
    email: 'patient.b@healthbridge.in',
  } as any);

  const futureSlotTimestamp = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(UserModel, 'findById').mockImplementation(((id: any) => {
      const idStr = id?.toString() || String(id);
      if (idStr === patientAId) {
        return Promise.resolve({
          _id: new Types.ObjectId(patientAId),
          role: 'PATIENT',
          accountStatus: 'ACTIVE',
          email: 'patient.a@healthbridge.in',
        } as any);
      }
      if (idStr === patientBId) {
        return Promise.resolve({
          _id: new Types.ObjectId(patientBId),
          role: 'PATIENT',
          accountStatus: 'ACTIVE',
          email: 'patient.b@healthbridge.in',
        } as any);
      }
      return Promise.resolve(null);
    }) as any);
  });

  describe('Doctor Discovery & Availability', () => {
    it('should reject unauthenticated request to /api/v1/doctors with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/api/v1/doctors');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should allow authenticated patient to discover doctors with specialization filter', async () => {
      const res = await request(app)
        .get('/api/v1/doctors?specialization=Cardiology')
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].specialization).toContain('Cardiology');
    });

    it('should retrieve doctor profile by ID with qualifications and verified status', async () => {
      const res = await request(app)
        .get(`/api/v1/doctors/${doctorId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Dr. Rajesh Verma');
      expect(res.body.data.verificationStatus).toBe('VERIFIED');
      expect(res.body.data.qualifications.length).toBeGreaterThan(0);
      expect(res.body.data.facility).toBeDefined();
    });

    it('should query real-time doctor availability slots for a specific date', async () => {
      const targetDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const res = await request(app)
        .get(`/api/v1/doctors/${doctorId}/availability?date=${targetDate}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.doctorId).toBe(doctorId);
      expect(res.body.data.date).toBe(targetDate);
      expect(Array.isArray(res.body.data.slots)).toBe(true);
      expect(res.body.data.slots.length).toBeGreaterThan(0);
      expect(res.body.data.slots[0]).toHaveProperty('isAvailable');
      expect(res.body.data.slots[0]).toHaveProperty('startTime');
    });
  });

  describe('Appointment Booking & Concurrency Protection', () => {
    it('should allow authenticated patient to book a valid appointment slot', async () => {
      const payload = {
        doctorId,
        scheduledAt: futureSlotTimestamp,
        startTime: '10:00',
        consultationType: 'IN_PERSON',
        reason: 'Regular cardiac follow-up and prescription refill',
      };

      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.patientId).toBe(patientAId);
      expect(res.body.data.status).toBe('CONFIRMED');
      expect(res.body.data.startTime).toBe('10:00');
    });

    it('should reject booking with past schedule time (expired slot)', async () => {
      const pastPayload = {
        doctorId,
        scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        startTime: '10:00',
        consultationType: 'IN_PERSON',
        reason: 'Attempting to book in the past',
      };

      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientAToken}`)
        .send(pastPayload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should prevent double booking: return 409 CONFLICT if the slot is already booked', async () => {
      const slotTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      // Mock AppointmentModel.findOne to simulate an existing active reservation for the doctor
      vi.spyOn(AppointmentModel, 'findOne').mockResolvedValue({
        _id: new Types.ObjectId(),
        doctorId: new Types.ObjectId(doctorId),
        scheduledAt: slotTime,
        status: 'CONFIRMED',
      } as any);

      const bookingPayload = {
        doctorId,
        scheduledAt: slotTime.toISOString(),
        startTime: '11:00',
        consultationType: 'IN_PERSON',
        reason: 'Second patient trying to take the same slot',
      };

      const res = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientBToken}`)
        .send(bookingPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('CONFLICT');
      expect(res.body.message).toContain('already been booked');
    });
  });

  describe('Patient Ownership, Privacy & Cancellation', () => {
    it("should strictly forbid Patient A from viewing Patient B's appointment details (403 FORBIDDEN)", async () => {
      const appointmentBId = new Types.ObjectId().toString();

      vi.spyOn(AppointmentModel, 'findById').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue({
            _id: new Types.ObjectId(appointmentBId),
            patientId: new Types.ObjectId(patientBId), // Belongs to Patient B!
            doctorId: new Types.ObjectId(doctorId),
            scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            startTime: '14:00',
            endTime: '14:30',
            consultationType: 'IN_PERSON',
            reason: 'Confidential appointment',
            status: 'CONFIRMED',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        }),
      } as any);

      const res = await request(app)
        .get(`/api/v1/appointments/${appointmentBId}`)
        .set('Authorization', `Bearer ${patientAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it("should strictly forbid Patient A from cancelling Patient B's appointment (403 FORBIDDEN)", async () => {
      const appointmentBId = new Types.ObjectId().toString();

      vi.spyOn(AppointmentModel, 'findById').mockResolvedValue({
        _id: new Types.ObjectId(appointmentBId),
        patientId: new Types.ObjectId(patientBId), // Belongs to Patient B
        doctorId: new Types.ObjectId(doctorId),
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'CONFIRMED',
      } as any);

      const res = await request(app)
        .patch(`/api/v1/appointments/${appointmentBId}/cancel`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({ reason: 'Malicious cancellation attempt' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow patient to cancel their own upcoming appointment with valid reason', async () => {
      const ownAppointmentId = new Types.ObjectId().toString();
      const saveMock = vi.fn().mockResolvedValue(true);

      vi.spyOn(AppointmentModel, 'findById').mockImplementation(((id: any) => {
        return Promise.resolve({
          _id: new Types.ObjectId(ownAppointmentId),
          patientId: new Types.ObjectId(patientAId), // Belongs to Patient A
          doctorId: new Types.ObjectId(doctorId),
          scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          startTime: '09:30',
          endTime: '10:00',
          consultationType: 'IN_PERSON',
          reason: 'Routine checkup',
          status: 'CONFIRMED',
          createdAt: new Date(),
          updatedAt: new Date(),
          save: saveMock,
        } as any);
      }) as any);

      const res = await request(app)
        .patch(`/api/v1/appointments/${ownAppointmentId}/cancel`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({ reason: 'Family emergency, unable to travel' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('cancelled successfully');
    });

    it('should allow patient to reschedule an appointment to a free future slot', async () => {
      const ownAppointmentId = new Types.ObjectId().toString();
      const newTime = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const saveMock = vi.fn().mockResolvedValue(true);

      vi.spyOn(AppointmentModel, 'findById').mockImplementation(((id: any) => {
        return Promise.resolve({
          _id: new Types.ObjectId(ownAppointmentId),
          patientId: new Types.ObjectId(patientAId),
          doctorId: new Types.ObjectId(doctorId),
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          startTime: '09:30',
          endTime: '10:00',
          consultationType: 'IN_PERSON',
          reason: 'Routine checkup',
          status: 'CONFIRMED',
          rescheduleCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          save: saveMock,
        } as any);
      }) as any);

      // Concurrency check finds no conflict on new slot
      vi.spyOn(AppointmentModel, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/v1/appointments/${ownAppointmentId}/reschedule`)
        .set('Authorization', `Bearer ${patientAToken}`)
        .send({
          newScheduledAt: newTime.toISOString(),
          newStartTime: '11:00',
          reason: 'Doctor requested time shift',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('rescheduled successfully');
    });
  });
});

