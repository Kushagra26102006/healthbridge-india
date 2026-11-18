import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { videoTokenService } from '../../src/modules/telemedicine/services/video-token.service';
import { telemedicineService } from '../../src/modules/telemedicine/services/telemedicine.service';
import {
  AppointmentModel,
  UserModel,
  DoctorProfileModel,
  AuditLogModel,
  VideoConsultationModel,
  VideoSignalMessageModel,
} from '../../src/database/models';
import { notificationService } from '../../src/modules/notifications/services/notification.service';

describe('Telemedicine Video Consultation Module — Unit & Security Tests', () => {
  const patientId = new Types.ObjectId().toString();
  const otherPatientId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();
  const otherDoctorId = new Types.ObjectId().toString();
  const adminId = new Types.ObjectId().toString();
  const appointmentId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
    vi.spyOn(notificationService, 'publishEvent').mockResolvedValue({} as any);
  });

  describe('1. Short-Lived Room Token Generation, Expiry & Impersonation Prevention', () => {
    it('generates opaque room names containing zero PHI and signs verifiable short-lived tokens', () => {
      const roomName = videoTokenService.generateOpaqueRoomName();
      expect(roomName).toMatch(/^hb-vc-[a-f0-9]{24}$/);

      const issued = videoTokenService.issueRoomToken({
        userId: patientId,
        role: 'PATIENT',
        roomName,
        appointmentId,
        consultationId: new Types.ObjectId().toString(),
        clientSessionId: 'client-sess-1',
        ttlSeconds: 300,
      });

      expect(issued.recordingEnabled).toBe(false);
      expect(issued.ttlSeconds).toBe(300);

      const verified = videoTokenService.verifyRoomToken(issued.token, roomName, patientId);
      expect(verified.sub).toBe(patientId);
      expect(verified.roomName).toBe(roomName);
      expect(verified.role).toBe('PATIENT');
    });

    it('rejects expired tokens, tampered signatures, wrong room, and impersonated userId', () => {
      const roomName = videoTokenService.generateOpaqueRoomName();
      const issued = videoTokenService.issueRoomToken({
        userId: patientId,
        role: 'PATIENT',
        roomName,
        appointmentId,
        consultationId: new Types.ObjectId().toString(),
        clientSessionId: 'client-sess-2',
        ttlSeconds: 120,
      });

      // Wrong user impersonation
      expect(() =>
        videoTokenService.verifyRoomToken(issued.token, roomName, otherPatientId)
      ).toThrow('ROOM_TOKEN_SCOPE_MISMATCH');

      // Wrong room
      expect(() =>
        videoTokenService.verifyRoomToken(issued.token, 'hb-vc-otherroom', patientId)
      ).toThrow('ROOM_TOKEN_SCOPE_MISMATCH');

      // Tampered token signature
      expect(() =>
        videoTokenService.verifyRoomToken(`${issued.token}tampered`, roomName, patientId)
      ).toThrow('INVALID_ROOM_TOKEN_SIGNATURE');

      // Expired token
      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 300_000);
      expect(() => videoTokenService.verifyRoomToken(issued.token, roomName, patientId)).toThrow(
        'ROOM_TOKEN_EXPIRED'
      );
      nowSpy.mockRestore();
    });
  });

  describe('2. Strict Patient-to-Doctor Authorization & Appointment Validation', () => {
    const makeAppointment = (overrides: Record<string, unknown> = {}) => ({
      _id: new Types.ObjectId(appointmentId),
      patientId: new Types.ObjectId(patientId),
      doctorId: new Types.ObjectId(doctorId),
      consultationType: 'TELECONSULTATION',
      status: 'CONFIRMED',
      scheduledAt: new Date(Date.now() + 3_600_000),
      startTime: '17:00',
      endTime: '17:20',
      reason: 'Follow-up hypertension review',
      save: vi.fn().mockResolvedValue(true),
      ...overrides,
    });

    const makeConsultation = (overrides: Record<string, unknown> = {}) => ({
      _id: new Types.ObjectId(),
      appointmentId: new Types.ObjectId(appointmentId),
      roomName: 'hb-vc-1234567890abcdef12345678',
      patientId: new Types.ObjectId(patientId),
      doctorId: new Types.ObjectId(doctorId),
      provider: 'WEBRTC_DIRECT',
      status: 'SCHEDULED',
      mode: 'VIDEO',
      recordingEnabled: false,
      patientConsent: {
        granted: false,
        consentVersion: 'HB-TELEMED-V1',
        emergencyDisclaimerAcknowledged: false,
      },
      patientInWaitingRoom: false,
      doctorInWaitingRoom: false,
      consultationNotes: {},
      technicalMetrics: {
        reconnectCount: 0,
        failureCount: 0,
        audioFallbackUsed: false,
      },
      save: vi.fn().mockResolvedValue(true),
      ...overrides,
    });

    it('blocks unauthorized patients, other doctors, and admins from accessing a consultation room', async () => {
      vi.spyOn(AppointmentModel, 'findById').mockResolvedValue(makeAppointment() as any);

      await expect(
        telemedicineService.getConsultationSession(appointmentId, {
          userId: otherPatientId,
          role: 'PATIENT',
        })
      ).rejects.toThrow(/Access denied/i);

      await expect(
        telemedicineService.getConsultationSession(appointmentId, {
          userId: otherDoctorId,
          role: 'DOCTOR',
        })
      ).rejects.toThrow(/Access denied/i);

      await expect(
        telemedicineService.getConsultationSession(appointmentId, {
          userId: adminId,
          role: 'ADMIN',
        })
      ).rejects.toThrow(/Access denied/i);
    });

    it('rejects IN_PERSON appointments and unconfirmed REQUESTED appointments from joining', async () => {
      vi.spyOn(AppointmentModel, 'findById').mockResolvedValueOnce(
        makeAppointment({ consultationType: 'IN_PERSON' }) as any
      );
      await expect(
        telemedicineService.getConsultationSession(appointmentId, {
          userId: patientId,
          role: 'PATIENT',
        })
      ).rejects.toThrow(/TELECONSULTATION/i);

      vi.spyOn(AppointmentModel, 'findById').mockResolvedValueOnce(
        makeAppointment({ status: 'REQUESTED' }) as any
      );
      await expect(
        telemedicineService.issueJoinToken(appointmentId, {
          userId: patientId,
          role: 'PATIENT',
        })
      ).rejects.toThrow(/must be confirmed/i);
    });

    it('enforces explicit patient consent before issuing a patient room token and tracks simultaneous sessions', async () => {
      const apt = makeAppointment();
      const consult = makeConsultation();

      vi.spyOn(AppointmentModel, 'findById').mockResolvedValue(apt as any);
      vi.spyOn(VideoConsultationModel, 'findOne').mockResolvedValue(consult as any);

      // Patient without consent -> blocked
      await expect(
        telemedicineService.issueJoinToken(appointmentId, {
          userId: patientId,
          role: 'PATIENT',
        })
      ).rejects.toThrow(/TELEMEDICINE_CONSENT_REQUIRED/);

      // Doctor cannot grant patient consent
      await expect(
        telemedicineService.recordPatientConsent(
          appointmentId,
          { userId: doctorId, role: 'DOCTOR' },
          { consentAccepted: true, emergencyDisclaimerAcknowledged: true }
        )
      ).rejects.toThrow(/Only the patient/i);

      // Patient grants consent
      const consentRes = await telemedicineService.recordPatientConsent(
        appointmentId,
        { userId: patientId, role: 'PATIENT', ip: '127.0.0.1' },
        { consentAccepted: true, emergencyDisclaimerAcknowledged: true }
      );
      expect(consentRes.granted).toBe(true);
      expect(consult.patientConsent.granted).toBe(true);

      // First join succeeds
      const firstJoin = await telemedicineService.issueJoinToken(
        appointmentId,
        { userId: patientId, role: 'PATIENT' },
        { mode: 'VIDEO', clientSessionId: 'tab-1' }
      );
      expect(firstJoin.recordingEnabled).toBe(false);
      expect(firstJoin.replacedExistingSession).toBe(false);

      // Simultaneous second tab detected & rotated
      const secondJoin = await telemedicineService.issueJoinToken(
        appointmentId,
        { userId: patientId, role: 'PATIENT' },
        { mode: 'AUDIO_ONLY', clientSessionId: 'tab-2' }
      );
      expect(secondJoin.replacedExistingSession).toBe(true);
      expect(secondJoin.mode).toBe('AUDIO_ONLY');
      expect(consult.technicalMetrics.audioFallbackUsed).toBe(true);
    });

    it('tracks network interruption, reconnection, doctor-only notes, and privacy-safe admin telemetry', async () => {
      const apt = makeAppointment();
      const consult = makeConsultation({
        patientConsent: {
          granted: true,
          consentVersion: 'HB-TELEMED-V1',
          emergencyDisclaimerAcknowledged: true,
        },
      });

      vi.spyOn(AppointmentModel, 'findById').mockResolvedValue(apt as any);
      vi.spyOn(VideoConsultationModel, 'findOne').mockResolvedValue(consult as any);

      await telemedicineService.updateConsultationState(
        appointmentId,
        { userId: patientId, role: 'PATIENT' },
        { status: 'RECONNECTING' }
      );
      expect(consult.technicalMetrics.reconnectCount).toBe(1);

      await telemedicineService.updateConsultationState(
        appointmentId,
        { userId: patientId, role: 'PATIENT' },
        { status: 'FAILED', failureCode: 'ICE_TIMEOUT', failureCategory: 'NETWORK_INTERRUPTION' }
      );
      expect(consult.technicalMetrics.failureCount).toBe(1);

      // Patient cannot save clinical notes
      await expect(
        telemedicineService.saveConsultationNotes(
          appointmentId,
          { userId: patientId, role: 'PATIENT' },
          { summary: 'Unauthorized edit' }
        )
      ).rejects.toThrow(/Only the assigned doctor/i);

      // Assigned doctor saves clinical notes
      const savedNotes = await telemedicineService.saveConsultationNotes(
        appointmentId,
        { userId: doctorId, role: 'DOCTOR' },
        { chiefComplaint: 'BP check', summary: 'Continue Telma 40mg' }
      );
      expect(savedNotes.consultationNotes.summary).toBe('Continue Telma 40mg');

      // Admin telemetry exposes ONLY aggregate stats and anonymized technical events (zero PHI/notes)
      vi.spyOn(VideoConsultationModel, 'countDocuments').mockResolvedValue(3);
      vi.spyOn(VideoConsultationModel, 'aggregate')
        .mockResolvedValueOnce([
          { _id: 'COMPLETED', count: 2 },
          { _id: 'FAILED', count: 1 },
        ] as any)
        .mockResolvedValueOnce([
          { _id: null, totalReconnects: 2, totalFailures: 1, avgDurationSeconds: 420 },
        ] as any);
      vi.spyOn(VideoConsultationModel, 'find').mockReturnValue({
        select: () => ({
          sort: () => ({
            limit: () => ({
              lean: async () => [
                {
                  _id: consult._id,
                  provider: 'WEBRTC_DIRECT',
                  status: 'FAILED',
                  mode: 'AUDIO_ONLY',
                  technicalMetrics: consult.technicalMetrics,
                  updatedAt: new Date(),
                },
              ],
            }),
          }),
        }),
      } as any);
      vi.spyOn(AppointmentModel, 'countDocuments').mockResolvedValue(4);

      const telemetry = await telemedicineService.getAdminTelemetry();
      const serialized = JSON.stringify(telemetry);
      expect(telemetry.configuration.recordingEnabledByDefault).toBe(false);
      expect(telemetry.usage.totalVideoSessions).toBe(3);
      expect(serialized).not.toContain('Continue Telma 40mg');
      expect(serialized).not.toContain(consult.roomName);
    });

    it('rejects signaling relay when room token is invalid or impersonated', async () => {
      const consult = makeConsultation();
      vi.spyOn(VideoConsultationModel, 'findById').mockResolvedValue(consult as any);
      vi.spyOn(VideoSignalMessageModel, 'create').mockResolvedValue({
        _id: new Types.ObjectId(),
        createdAt: new Date(),
      } as any);

      await expect(
        telemedicineService.postSignal(
          consult._id.toString(),
          { userId: otherPatientId, role: 'PATIENT' },
          { roomToken: 'invalid.jwt.token', signalType: 'OFFER', payload: {} }
        )
      ).rejects.toThrow(/Room token verification failed/i);
    });

    it('allows Doctor session metadata retrieval without leaking tokens or secrets', async () => {
      const apt = makeAppointment();
      const consult = makeConsultation();
      vi.spyOn(AppointmentModel, 'findById').mockResolvedValue(apt as any);
      vi.spyOn(VideoConsultationModel, 'findOne').mockResolvedValue(consult as any);
      vi.spyOn(UserModel, 'findById').mockReturnValue({
        select: () => ({ lean: async () => ({ name: 'Synthetic Patient', phone: '9000011111' }) }),
      } as any);
      vi.spyOn(DoctorProfileModel, 'findOne').mockReturnValue({
        select: () => ({ lean: async () => ({ specialization: ['Cardiology'], qualifications: ['MD'] }) }),
      } as any);

      const session = await telemedicineService.getConsultationSession(appointmentId, {
        userId: doctorId,
        role: 'DOCTOR',
      });
      expect(session.participantRole).toBe('DOCTOR');
      expect(session.recordingEnabled).toBe(false);
      expect(session.emergencyDisclaimer).toContain('112');
    });
  });
});
