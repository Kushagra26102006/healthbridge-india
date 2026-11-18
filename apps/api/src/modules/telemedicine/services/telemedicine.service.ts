import crypto from 'crypto';
import { Types } from 'mongoose';
import {
  AppointmentModel,
  UserModel,
  DoctorProfileModel,
  EncounterModel,
  AuditLogModel,
} from '../../../database/models';
import {
  VideoConsultationModel,
  VideoSignalMessageModel,
  type VideoConsultationMode,
  type VideoConsultationStatus,
} from '../models/video-consultation.model';
import { videoTokenService } from './video-token.service';
import { AppError } from '../../../shared/errors/app-error';
import { notificationService } from '../../notifications/services/notification.service';

export const TELEMEDICINE_EMERGENCY_DISCLAIMER =
  'Video consultation is NOT an emergency medical service. For chest pain, severe breathing difficulty, stroke symptoms, or life-threatening emergencies in India, call 112 or 108 immediately or visit the nearest emergency room.';

const JOINABLE_APPOINTMENT_STATUSES = new Set([
  'CONFIRMED',
  'SCHEDULED',
  'CHECKED_IN',
  'IN_PROGRESS',
]);

export interface TelemedicineActor {
  userId: string;
  role: string;
  ip?: string;
  requestId?: string;
}

export class TelemedicineService {
  private hashIp(ip?: string): string | undefined {
    if (!ip) return undefined;
    return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
  }

  private async logAudit(params: {
    actorId: string;
    action: string;
    resourceId: string;
    outcome: 'SUCCESS' | 'FAILURE';
    requestId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await AuditLogModel.create({
        actorId: new Types.ObjectId(params.actorId),
        action: params.action,
        resourceType: 'VIDEO_CONSULTATION',
        resourceId: params.resourceId,
        timestamp: new Date(),
        requestId: params.requestId || `vc-${crypto.randomUUID()}`,
        outcome: params.outcome,
        metadata: params.metadata || {},
      });
    } catch {
      // Never fail clinical call lifecycle on non-fatal audit write errors in mocked tests
    }
  }

  /**
   * Loads and strictly authorizes that the requesting actor is either the exact
   * Patient or assigned Doctor on a valid TELECONSULTATION appointment.
   * Prevents unauthorized access, cross-patient access, admin eavesdropping, and impersonation.
   */
  private async loadAuthorizedAppointment(appointmentId: string, actor: TelemedicineActor) {
    if (!Types.ObjectId.isValid(appointmentId)) {
      throw AppError.badRequest('Invalid appointment identifier');
    }

    const appointment = await AppointmentModel.findById(appointmentId);
    if (!appointment) {
      throw AppError.notFound('Appointment not found');
    }

    if (appointment.consultationType !== 'TELECONSULTATION') {
      throw AppError.badRequest(
        'Video consultation rooms are only available for TELECONSULTATION appointments'
      );
    }

    const isPatient =
      actor.role === 'PATIENT' && appointment.patientId.toString() === actor.userId;
    const isDoctor =
      actor.role === 'DOCTOR' && appointment.doctorId.toString() === actor.userId;

    if (!isPatient && !isDoctor) {
      await this.logAudit({
        actorId: actor.userId,
        action: 'TELEMEDICINE_UNAUTHORIZED_ROOM_ACCESS_BLOCKED',
        resourceId: appointmentId,
        outcome: 'FAILURE',
        requestId: actor.requestId,
        metadata: { actorRole: actor.role },
      });
      throw AppError.forbidden(
        'Access denied: Only the assigned patient and doctor may access this video consultation room'
      );
    }

    return {
      appointment,
      participantRole: (isDoctor ? 'DOCTOR' : 'PATIENT') as 'PATIENT' | 'DOCTOR',
    };
  }

  /**
   * Ensures a consultation metadata record exists for an authorized teleconsultation appointment.
   */
  private async ensureConsultationRecord(appointment: any) {
    let consultation = await VideoConsultationModel.findOne({
      appointmentId: appointment._id,
    });

    if (!consultation) {
      const cfg = videoTokenService.getProviderConfig();
      consultation = await VideoConsultationModel.create({
        appointmentId: appointment._id,
        roomName: videoTokenService.generateOpaqueRoomName(),
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        facilityId: appointment.facilityId,
        encounterId: appointment.encounterId,
        provider: cfg.configuredProvider,
        status: appointment.status === 'COMPLETED' ? 'COMPLETED' : 'SCHEDULED',
        mode: 'VIDEO',
        recordingEnabled: false,
        patientConsent: {
          granted: false,
          consentVersion: 'HB-TELEMED-V1',
          emergencyDisclaimerAcknowledged: false,
        },
        consultationNotes: {},
        technicalMetrics: {
          reconnectCount: 0,
          failureCount: 0,
          audioFallbackUsed: false,
        },
      });
    }

    return consultation;
  }

  /**
   * GET /api/v1/telemedicine/appointments/:appointmentId/session
   * Returns consultation metadata, consent status, and role-appropriate authorized participant info.
   */
  async getConsultationSession(appointmentId: string, actor: TelemedicineActor) {
    const { appointment, participantRole } = await this.loadAuthorizedAppointment(
      appointmentId,
      actor
    );
    const consultation = await this.ensureConsultationRecord(appointment);
    const providerCfg = videoTokenService.getProviderConfig();

    const [patientUser, doctorUser, doctorProfile] = await Promise.all([
      UserModel.findById(appointment.patientId).select('name phone email').lean(),
      UserModel.findById(appointment.doctorId).select('name').lean(),
      DoctorProfileModel.findOne({ userId: appointment.doctorId })
        .select('specialization qualifications')
        .lean(),
    ]);

    const doctorDisplayName = doctorUser?.name
      ? doctorUser.name.startsWith('Dr.')
        ? doctorUser.name
        : `Dr. ${doctorUser.name}`
      : 'Assigned Clinician';

    const canJoin =
      JOINABLE_APPOINTMENT_STATUSES.has(appointment.status) &&
      consultation.status !== 'CANCELLED' &&
      consultation.status !== 'COMPLETED';

    return {
      consultationId: consultation._id.toString(),
      appointmentId: appointment._id.toString(),
      roomName: consultation.roomName,
      provider: providerCfg.configuredProvider,
      status: consultation.status,
      mode: consultation.mode,
      recordingEnabled: false,
      canJoin,
      participantRole,
      emergencyDisclaimer: TELEMEDICINE_EMERGENCY_DISCLAIMER,
      appointment: {
        id: appointment._id.toString(),
        scheduledAt: appointment.scheduledAt,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        consultationType: appointment.consultationType,
        reason: appointment.reason,
        encounterId: appointment.encounterId?.toString(),
      },
      doctor: {
        id: appointment.doctorId.toString(),
        name: doctorDisplayName,
        specialization: doctorProfile?.specialization || [],
        qualifications: doctorProfile?.qualifications || [],
      },
      // Patient clinical contact details only returned to authorized participant
      patient: {
        id: appointment.patientId.toString(),
        name: patientUser?.name || 'Patient',
        ...(participantRole === 'DOCTOR' ? { phone: patientUser?.phone } : {}),
      },
      consent: {
        granted: Boolean(consultation.patientConsent?.granted),
        grantedAt: consultation.patientConsent?.grantedAt,
        consentVersion: consultation.patientConsent?.consentVersion || 'HB-TELEMED-V1',
        emergencyDisclaimerAcknowledged: Boolean(
          consultation.patientConsent?.emergencyDisclaimerAcknowledged
        ),
      },
      presence: {
        patientInWaitingRoom: consultation.patientInWaitingRoom,
        doctorInWaitingRoom: consultation.doctorInWaitingRoom,
        patientJoined: Boolean(consultation.patientJoinedAt && !consultation.patientLeftAt),
        doctorJoined: Boolean(consultation.doctorJoinedAt && !consultation.doctorLeftAt),
      },
      // Clinical consultation notes only visible to the assigned doctor
      consultationNotes:
        participantRole === 'DOCTOR'
          ? {
              chiefComplaint: consultation.consultationNotes?.chiefComplaint || '',
              clinicalObservations: consultation.consultationNotes?.clinicalObservations || '',
              summary: consultation.consultationNotes?.summary || '',
              followUpPlan: consultation.consultationNotes?.followUpPlan || '',
              updatedAt: consultation.consultationNotes?.updatedAt,
            }
          : undefined,
      startedAt: consultation.startedAt,
      endedAt: consultation.endedAt,
    };
  }

  /**
   * POST /api/v1/telemedicine/appointments/:appointmentId/consent
   * Records explicit patient telemedicine informed consent & emergency disclaimer acknowledgement.
   */
  async recordPatientConsent(
    appointmentId: string,
    actor: TelemedicineActor,
    input: { consentAccepted: boolean; emergencyDisclaimerAcknowledged: boolean }
  ) {
    const { appointment, participantRole } = await this.loadAuthorizedAppointment(
      appointmentId,
      actor
    );

    if (participantRole !== 'PATIENT') {
      throw AppError.forbidden('Only the patient can grant telemedicine consultation consent');
    }

    if (!input.consentAccepted || !input.emergencyDisclaimerAcknowledged) {
      throw AppError.badRequest(
        'Both telemedicine informed consent and the non-emergency disclaimer must be acknowledged before joining'
      );
    }

    const consultation = await this.ensureConsultationRecord(appointment);
    consultation.patientConsent = {
      granted: true,
      grantedAt: new Date(),
      consentVersion: 'HB-TELEMED-V1',
      emergencyDisclaimerAcknowledged: true,
      ipHash: this.hashIp(actor.ip),
    };
    await consultation.save();

    await this.logAudit({
      actorId: actor.userId,
      action: 'TELEMEDICINE_PATIENT_CONSENT_GRANTED',
      resourceId: consultation._id.toString(),
      outcome: 'SUCCESS',
      requestId: actor.requestId,
      metadata: {
        consentVersion: 'HB-TELEMED-V1',
        recordingEnabled: false,
      },
    });

    return {
      consultationId: consultation._id.toString(),
      granted: true,
      grantedAt: consultation.patientConsent.grantedAt,
      consentVersion: consultation.patientConsent.consentVersion,
    };
  }

  /**
   * POST /api/v1/telemedicine/appointments/:appointmentId/token
   * Issues a short-lived room token strictly after verifying:
   * - participant identity (assigned patient or doctor)
   * - valid joinable TELECONSULTATION appointment
   * - explicit patient telemedicine consent
   * - non-recording default
   */
  async issueJoinToken(
    appointmentId: string,
    actor: TelemedicineActor,
    options?: { mode?: VideoConsultationMode; clientSessionId?: string }
  ) {
    const { appointment, participantRole } = await this.loadAuthorizedAppointment(
      appointmentId,
      actor
    );

    if (!JOINABLE_APPOINTMENT_STATUSES.has(appointment.status)) {
      throw AppError.badRequest(
        `Appointment cannot start video consultation in status "${appointment.status}". Appointment must be confirmed first.`
      );
    }

    const consultation = await this.ensureConsultationRecord(appointment);

    if (consultation.status === 'CANCELLED' || consultation.status === 'COMPLETED') {
      throw AppError.badRequest(`Consultation session is already ${consultation.status.toLowerCase()}`);
    }

    // Patient must grant explicit telemedicine consent before entering the room
    if (participantRole === 'PATIENT' && !consultation.patientConsent?.granted) {
      throw AppError.forbidden(
        'TELEMEDICINE_CONSENT_REQUIRED: Please accept telemedicine consent and the emergency disclaimer before joining.'
      );
    }

    const clientSessionId = options?.clientSessionId?.trim() || crypto.randomUUID();
    const replacedExistingSession = Boolean(
      (participantRole === 'PATIENT' &&
        consultation.activePatientSessionId &&
        consultation.activePatientSessionId !== clientSessionId) ||
        (participantRole === 'DOCTOR' &&
          consultation.activeDoctorSessionId &&
          consultation.activeDoctorSessionId !== clientSessionId)
    );

    if (options?.mode === 'AUDIO_ONLY') {
      consultation.mode = 'AUDIO_ONLY';
      consultation.technicalMetrics.audioFallbackUsed = true;
    }

    if (participantRole === 'PATIENT') {
      consultation.activePatientSessionId = clientSessionId;
      consultation.patientInWaitingRoom = true;
      consultation.patientJoinedAt = consultation.patientJoinedAt || new Date();
      consultation.patientLeftAt = undefined;
    } else {
      consultation.activeDoctorSessionId = clientSessionId;
      consultation.doctorInWaitingRoom = false;
      consultation.doctorJoinedAt = consultation.doctorJoinedAt || new Date();
      consultation.doctorLeftAt = undefined;
      if (appointment.status === 'CONFIRMED' || appointment.status === 'SCHEDULED') {
        appointment.status = 'IN_PROGRESS';
        appointment.consultationStartedAt = appointment.consultationStartedAt || new Date();
        await appointment.save();
      }
    }

    if (consultation.patientJoinedAt && consultation.doctorJoinedAt) {
      consultation.status = 'CONNECTING';
      consultation.startedAt = consultation.startedAt || new Date();
    } else {
      consultation.status = 'WAITING_ROOM';
    }

    // Strictly enforce recording disabled by default
    consultation.recordingEnabled = false;
    await consultation.save();

    const tokenResult = videoTokenService.issueRoomToken({
      userId: actor.userId,
      role: participantRole,
      roomName: consultation.roomName,
      appointmentId: appointment._id.toString(),
      consultationId: consultation._id.toString(),
      clientSessionId,
    });

    await this.logAudit({
      actorId: actor.userId,
      action: 'TELEMEDICINE_ROOM_TOKEN_ISSUED',
      resourceId: consultation._id.toString(),
      outcome: 'SUCCESS',
      requestId: actor.requestId,
      metadata: {
        participantRole,
        provider: tokenResult.provider,
        ttlSeconds: tokenResult.ttlSeconds,
        mode: consultation.mode,
        replacedExistingSession,
        recordingEnabled: false,
      },
    });

    // Privacy-safe notification (NEVER include medical reason, diagnosis, or room token!)
    const counterpartyId =
      participantRole === 'PATIENT'
        ? appointment.doctorId.toString()
        : appointment.patientId.toString();
    const counterpartyRole = participantRole === 'PATIENT' ? 'DOCTOR' : 'PATIENT';
    const targetRoute =
      counterpartyRole === 'DOCTOR'
        ? `/doctor/consultations/${appointment._id.toString()}`
        : `/patient/appointments/${appointment._id.toString()}/consultation`;

    notificationService
      .publishEvent({
        eventType: 'APPOINTMENT_CONFIRMED',
        category: 'APPOINTMENT',
        recipientId: counterpartyId,
        recipientRole: counterpartyRole,
        title:
          participantRole === 'PATIENT'
            ? 'Patient Ready in Video Waiting Room'
            : 'Doctor Joined Video Consultation Room',
        message:
          participantRole === 'PATIENT'
            ? 'Your scheduled teleconsultation patient has entered the secure waiting room.'
            : 'Your clinician is ready in the encrypted video consultation room.',
        priority: 'HIGH',
        linkUrl: targetRoute,
        sourceModule: 'telemedicine',
      })
      .catch(() => undefined);

    return {
      ...tokenResult,
      consultationId: consultation._id.toString(),
      appointmentId: appointment._id.toString(),
      participantRole,
      clientSessionId,
      replacedExistingSession,
      status: consultation.status,
      mode: consultation.mode,
      emergencyDisclaimer: TELEMEDICINE_EMERGENCY_DISCLAIMER,
    };
  }

  /**
   * PATCH /api/v1/telemedicine/appointments/:appointmentId/state
   * Updates call lifecycle state, audio-only fallback flag, or anonymized technical error telemetry.
   */
  async updateConsultationState(
    appointmentId: string,
    actor: TelemedicineActor,
    input: {
      status?: VideoConsultationStatus;
      mode?: VideoConsultationMode;
      failureCode?: string;
      failureCategory?: string;
    }
  ) {
    const { appointment, participantRole } = await this.loadAuthorizedAppointment(
      appointmentId,
      actor
    );
    const consultation = await this.ensureConsultationRecord(appointment);

    if (input.mode) {
      consultation.mode = input.mode;
      if (input.mode === 'AUDIO_ONLY') {
        consultation.technicalMetrics.audioFallbackUsed = true;
      }
    }

    if (input.status) {
      consultation.status = input.status;
      if (input.status === 'CONNECTED') {
        consultation.startedAt = consultation.startedAt || new Date();
        consultation.patientInWaitingRoom = false;
        consultation.doctorInWaitingRoom = false;
      } else if (input.status === 'RECONNECTING') {
        consultation.technicalMetrics.reconnectCount += 1;
      } else if (input.status === 'FAILED') {
        consultation.technicalMetrics.failureCount += 1;
        consultation.technicalMetrics.lastFailureCode = input.failureCode?.slice(0, 80);
        consultation.technicalMetrics.lastFailureCategory = input.failureCategory?.slice(0, 80);
      } else if (input.status === 'COMPLETED') {
        consultation.endedAt = new Date();
        consultation.endedByRole = participantRole;
        if (participantRole === 'PATIENT') {
          consultation.patientLeftAt = new Date();
          consultation.patientInWaitingRoom = false;
        } else {
          consultation.doctorLeftAt = new Date();
          consultation.doctorInWaitingRoom = false;
        }
        if (consultation.startedAt) {
          consultation.technicalMetrics.durationSeconds = Math.max(
            0,
            Math.round((consultation.endedAt.getTime() - consultation.startedAt.getTime()) / 1000)
          );
        }
        if (appointment.status === 'IN_PROGRESS') {
          appointment.status = 'COMPLETED';
          appointment.completedAt = new Date();
          appointment.completedBy = new Types.ObjectId(actor.userId);
          await appointment.save();
        }
      }
    }

    await consultation.save();

    await this.logAudit({
      actorId: actor.userId,
      action: `TELEMEDICINE_STATE_${consultation.status}`,
      resourceId: consultation._id.toString(),
      outcome: consultation.status === 'FAILED' ? 'FAILURE' : 'SUCCESS',
      requestId: actor.requestId,
      metadata: {
        participantRole,
        status: consultation.status,
        mode: consultation.mode,
        failureCategory: input.failureCategory,
      },
    });

    return {
      consultationId: consultation._id.toString(),
      status: consultation.status,
      mode: consultation.mode,
      startedAt: consultation.startedAt,
      endedAt: consultation.endedAt,
      durationSeconds: consultation.technicalMetrics.durationSeconds,
    };
  }

  /**
   * PUT /api/v1/telemedicine/appointments/:appointmentId/notes
   * Doctor-only structured clinical notes saved during/after video consultation.
   */
  async saveConsultationNotes(
    appointmentId: string,
    actor: TelemedicineActor,
    notes: {
      chiefComplaint?: string;
      clinicalObservations?: string;
      summary?: string;
      followUpPlan?: string;
    }
  ) {
    const { appointment, participantRole } = await this.loadAuthorizedAppointment(
      appointmentId,
      actor
    );

    if (participantRole !== 'DOCTOR') {
      throw AppError.forbidden('Only the assigned doctor can record clinical consultation notes');
    }

    const consultation = await this.ensureConsultationRecord(appointment);
    consultation.consultationNotes = {
      chiefComplaint: notes.chiefComplaint?.trim() ?? consultation.consultationNotes?.chiefComplaint,
      clinicalObservations:
        notes.clinicalObservations?.trim() ?? consultation.consultationNotes?.clinicalObservations,
      summary: notes.summary?.trim() ?? consultation.consultationNotes?.summary,
      followUpPlan: notes.followUpPlan?.trim() ?? consultation.consultationNotes?.followUpPlan,
      updatedAt: new Date(),
      updatedBy: new Types.ObjectId(actor.userId),
    };
    await consultation.save();

    // Sync concise summary into linked virtual encounter if present
    if (appointment.encounterId) {
      const combinedNotes = [
        consultation.consultationNotes.chiefComplaint
          ? `Chief Complaint: ${consultation.consultationNotes.chiefComplaint}`
          : null,
        consultation.consultationNotes.clinicalObservations
          ? `Observations: ${consultation.consultationNotes.clinicalObservations}`
          : null,
        consultation.consultationNotes.summary
          ? `Assessment/Summary: ${consultation.consultationNotes.summary}`
          : null,
        consultation.consultationNotes.followUpPlan
          ? `Follow-Up Plan: ${consultation.consultationNotes.followUpPlan}`
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      await EncounterModel.updateOne(
        { _id: appointment.encounterId, practitionerId: appointment.doctorId },
        { $set: { notes: combinedNotes } }
      ).catch(() => undefined);
    }

    await this.logAudit({
      actorId: actor.userId,
      action: 'TELEMEDICINE_CLINICAL_NOTES_SAVED',
      resourceId: consultation._id.toString(),
      outcome: 'SUCCESS',
      requestId: actor.requestId,
      metadata: { hasEncounterLink: Boolean(appointment.encounterId) },
    });

    return {
      consultationId: consultation._id.toString(),
      consultationNotes: consultation.consultationNotes,
    };
  }

  /**
   * GET /api/v1/telemedicine/doctor/upcoming
   * Returns upcoming and active TELECONSULTATION appointments for the Doctor Dashboard.
   */
  async getDoctorUpcomingVideoConsultations(doctorUserId: string) {
    const doctorObjId = new Types.ObjectId(doctorUserId);
    const startOfYesterday = new Date(Date.now() - 86_400_000);

    const appointments = await AppointmentModel.find({
      doctorId: doctorObjId,
      consultationType: 'TELECONSULTATION',
      status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
      scheduledAt: { $gte: startOfYesterday },
    })
      .populate('patientId', 'name phone')
      .sort({ scheduledAt: 1 })
      .limit(12)
      .lean();

    const appointmentIds = appointments.map((a) => a._id);
    const consultations = await VideoConsultationModel.find({
      appointmentId: { $in: appointmentIds },
    })
      .select('appointmentId status mode patientConsent.granted patientInWaitingRoom startedAt')
      .lean();

    const consultMap = new Map(consultations.map((c) => [c.appointmentId.toString(), c]));

    return appointments.map((apt: any) => {
      const vc = consultMap.get(apt._id.toString());
      return {
        appointmentId: apt._id.toString(),
        patientId: apt.patientId?._id?.toString() || apt.patientId?.toString() || '',
        patientName: apt.patientId?.name || 'Authorized Patient',
        patientPhone: apt.patientId?.phone,
        scheduledAt: apt.scheduledAt,
        startTime: apt.startTime,
        endTime: apt.endTime,
        appointmentStatus: apt.status,
        reason: apt.reason,
        consultationStatus: vc?.status || 'SCHEDULED',
        mode: vc?.mode || 'VIDEO',
        patientConsentGranted: Boolean(vc?.patientConsent?.granted),
        patientInWaitingRoom: Boolean(vc?.patientInWaitingRoom),
      };
    });
  }

  /**
   * POST /api/v1/telemedicine/doctor/appointments/:appointmentId/decision
   * Allows assigned Doctor to ACCEPT (confirm) or REJECT (decline) an upcoming video consultation.
   */
  async decideVideoConsultation(
    appointmentId: string,
    actor: TelemedicineActor,
    input: { decision: 'ACCEPT' | 'REJECT'; reason?: string }
  ) {
    const { appointment, participantRole } = await this.loadAuthorizedAppointment(
      appointmentId,
      actor
    );

    if (participantRole !== 'DOCTOR') {
      throw AppError.forbidden('Only the assigned doctor can accept or reject consultations');
    }

    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      throw AppError.badRequest(`Cannot modify an appointment that is already ${appointment.status}`);
    }

    const consultation = await this.ensureConsultationRecord(appointment);

    if (input.decision === 'ACCEPT') {
      appointment.status = 'CONFIRMED';
      appointment.confirmedBy = new Types.ObjectId(actor.userId);
      await appointment.save();
      consultation.status = 'SCHEDULED';
      await consultation.save();
    } else {
      appointment.status = 'CANCELLED';
      appointment.rejectionReason = input.reason?.trim() || 'Declined by consulting physician';
      appointment.cancelledAt = new Date();
      appointment.cancelledBy = new Types.ObjectId(actor.userId);
      await appointment.save();
      consultation.status = 'CANCELLED';
      consultation.endedAt = new Date();
      consultation.endedByRole = 'DOCTOR';
      await consultation.save();
    }

    await this.logAudit({
      actorId: actor.userId,
      action:
        input.decision === 'ACCEPT'
          ? 'TELEMEDICINE_APPOINTMENT_ACCEPTED'
          : 'TELEMEDICINE_APPOINTMENT_REJECTED',
      resourceId: appointment._id.toString(),
      outcome: 'SUCCESS',
      requestId: actor.requestId,
      metadata: { decision: input.decision },
    });

    notificationService
      .publishEvent({
        eventType:
          input.decision === 'ACCEPT' ? 'APPOINTMENT_CONFIRMED' : 'APPOINTMENT_CANCELLED',
        category: 'APPOINTMENT',
        recipientId: appointment.patientId.toString(),
        recipientRole: 'PATIENT',
        title:
          input.decision === 'ACCEPT'
            ? 'Video Consultation Confirmed'
            : 'Video Consultation Declined',
        message:
          input.decision === 'ACCEPT'
            ? 'Your doctor confirmed your teleconsultation slot. You can enter the waiting room when ready.'
            : 'Your doctor could not accept this teleconsultation slot. Please reschedule another available time.',
        priority: 'HIGH',
        linkUrl: `/patient/appointments/${appointment._id.toString()}`,
        sourceModule: 'telemedicine',
      })
      .catch(() => undefined);

    return {
      appointmentId: appointment._id.toString(),
      appointmentStatus: appointment.status,
      consultationStatus: consultation.status,
    };
  }

  /**
   * POST /api/v1/telemedicine/sessions/:consultationId/signals
   * Relays WebRTC SDP/ICE signaling messages strictly between the two verified participants.
   */
  async postSignal(
    consultationId: string,
    actor: TelemedicineActor,
    input: {
      roomToken: string;
      signalType: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'MEDIA_STATE' | 'HANGUP';
      payload: Record<string, unknown>;
    }
  ) {
    if (!Types.ObjectId.isValid(consultationId)) {
      throw AppError.badRequest('Invalid consultation session identifier');
    }

    const consultation = await VideoConsultationModel.findById(consultationId);
    if (!consultation) {
      throw AppError.notFound('Consultation session not found');
    }

    let claims;
    try {
      claims = videoTokenService.verifyRoomToken(
        input.roomToken,
        consultation.roomName,
        actor.userId
      );
    } catch (err) {
      const code = err instanceof Error ? err.message : 'INVALID_ROOM_TOKEN';
      throw AppError.unauthorized(`Room token verification failed: ${code}`);
    }

    const recipientId =
      claims.role === 'PATIENT' ? consultation.doctorId : consultation.patientId;

    const msg = await VideoSignalMessageModel.create({
      consultationId: consultation._id,
      roomName: consultation.roomName,
      senderId: new Types.ObjectId(actor.userId),
      senderRole: claims.role,
      recipientId,
      signalType: input.signalType,
      payload: input.payload,
    });

    return {
      signalId: msg._id.toString(),
      createdAt: msg.createdAt,
    };
  }

  /**
   * GET /api/v1/telemedicine/sessions/:consultationId/signals
   * Fetches pending WebRTC signals addressed strictly to the verified participant.
   */
  async pollSignals(
    consultationId: string,
    actor: TelemedicineActor,
    roomToken: string,
    since?: string
  ) {
    if (!Types.ObjectId.isValid(consultationId)) {
      throw AppError.badRequest('Invalid consultation session identifier');
    }

    const consultation = await VideoConsultationModel.findById(consultationId);
    if (!consultation) {
      throw AppError.notFound('Consultation session not found');
    }

    try {
      videoTokenService.verifyRoomToken(roomToken, consultation.roomName, actor.userId);
    } catch (err) {
      const code = err instanceof Error ? err.message : 'INVALID_ROOM_TOKEN';
      throw AppError.unauthorized(`Room token verification failed: ${code}`);
    }

    const query: Record<string, unknown> = {
      consultationId: consultation._id,
      recipientId: new Types.ObjectId(actor.userId),
    };
    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) {
        query.createdAt = { $gt: sinceDate };
      }
    }

    const signals = await VideoSignalMessageModel.find(query)
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    return {
      status: consultation.status,
      presence: {
        patientJoined: Boolean(consultation.patientJoinedAt && !consultation.patientLeftAt),
        doctorJoined: Boolean(consultation.doctorJoinedAt && !consultation.doctorLeftAt),
      },
      signals: signals.map((s) => ({
        id: s._id.toString(),
        senderRole: s.senderRole,
        signalType: s.signalType,
        payload: s.payload,
        createdAt: s.createdAt,
      })),
    };
  }

  /**
   * GET /api/v1/telemedicine/admin/telemetry
   * ADMIN-ONLY aggregate usage, configuration posture, and anonymized technical failure stats.
   * STRICT PRIVACY INVARIANT: Never returns clinical notes, patient/doctor PII, room names, or tokens.
   */
  async getAdminTelemetry() {
    const providerCfg = videoTokenService.getProviderConfig();

    const [
      totalSessions,
      statusAgg,
      audioFallbackCount,
      failureAgg,
      recentTechnicalIssues,
      totalTeleconsultAppointments,
    ] = await Promise.all([
      VideoConsultationModel.countDocuments({}),
      VideoConsultationModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      VideoConsultationModel.countDocuments({ 'technicalMetrics.audioFallbackUsed': true }),
      VideoConsultationModel.aggregate([
        {
          $group: {
            _id: null,
            totalReconnects: { $sum: '$technicalMetrics.reconnectCount' },
            totalFailures: { $sum: '$technicalMetrics.failureCount' },
            avgDurationSeconds: { $avg: '$technicalMetrics.durationSeconds' },
          },
        },
      ]),
      VideoConsultationModel.find({
        $or: [
          { status: 'FAILED' },
          { 'technicalMetrics.failureCount': { $gt: 0 } },
          { 'technicalMetrics.reconnectCount': { $gt: 0 } },
        ],
      })
        .select('provider status mode technicalMetrics updatedAt')
        .sort({ updatedAt: -1 })
        .limit(15)
        .lean(),
      AppointmentModel.countDocuments({ consultationType: 'TELECONSULTATION' }),
    ]);

    const statusBreakdown: Record<string, number> = {
      SCHEDULED: 0,
      WAITING_ROOM: 0,
      CONNECTING: 0,
      CONNECTED: 0,
      RECONNECTING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      FAILED: 0,
    };
    for (const row of statusAgg) {
      if (row._id) statusBreakdown[String(row._id)] = Number(row.count || 0);
    }

    const metricsSummary = failureAgg[0] || {
      totalReconnects: 0,
      totalFailures: 0,
      avgDurationSeconds: 0,
    };

    return {
      configuration: {
        activeProvider: providerCfg.configuredProvider,
        livekitConfigured: providerCfg.livekitConfigured,
        productionSfuReady: providerCfg.livekitConfigured,
        tokenTtlSeconds: providerCfg.tokenTtlSeconds,
        recordingEnabledByDefault: false,
        patientConsentRequired: true,
        encryptionTransport: 'DTLS-SRTP (WebRTC Encrypted Media) + TLS/HTTPS Signaling',
        iceServerCount: providerCfg.iceServers.length,
        readinessNotice: providerCfg.livekitConfigured
          ? 'LiveKit SFU credentials detected. Complete real-device network, TURN relay, and clinical security verification before production launch.'
          : 'Running in WEBRTC_DIRECT development/demo signaling mode. Provision LiveKit SFU + TURN credentials in backend environment variables before production deployment.',
      },
      usage: {
        totalTeleconsultAppointments,
        totalVideoSessions: totalSessions,
        activeSessions:
          (statusBreakdown.WAITING_ROOM || 0) +
          (statusBreakdown.CONNECTING || 0) +
          (statusBreakdown.CONNECTED || 0) +
          (statusBreakdown.RECONNECTING || 0),
        completedSessions: statusBreakdown.COMPLETED || 0,
        failedSessions: statusBreakdown.FAILED || 0,
        audioFallbackSessions: audioFallbackCount,
        totalReconnectEvents: metricsSummary.totalReconnects || 0,
        totalTechnicalFailures: metricsSummary.totalFailures || 0,
        averageDurationSeconds: Math.round(metricsSummary.avgDurationSeconds || 0),
        statusBreakdown,
      },
      // Anonymized technical failure log — ZERO patient/doctor identities, ZERO clinical notes
      recentTechnicalEvents: recentTechnicalIssues.map((item) => ({
        sessionRef: `VC-${item._id.toString().slice(-6).toUpperCase()}`,
        provider: item.provider,
        status: item.status,
        mode: item.mode,
        reconnectCount: item.technicalMetrics?.reconnectCount || 0,
        failureCount: item.technicalMetrics?.failureCount || 0,
        failureCode: item.technicalMetrics?.lastFailureCode || 'NONE',
        failureCategory: item.technicalMetrics?.lastFailureCategory || 'NONE',
        audioFallbackUsed: Boolean(item.technicalMetrics?.audioFallbackUsed),
        updatedAt: item.updatedAt,
      })),
    };
  }
}

export const telemedicineService = new TelemedicineService();
