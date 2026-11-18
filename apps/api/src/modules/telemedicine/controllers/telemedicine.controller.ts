import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../../utils/async-handler';
import { sendSuccess } from '../../../utils/api-response';
import { AppError } from '../../../shared/errors/app-error';
import { telemedicineService } from '../services/telemedicine.service';

const consentBodySchema = z.object({
  consentAccepted: z.boolean(),
  emergencyDisclaimerAcknowledged: z.boolean(),
});

const tokenBodySchema = z.object({
  mode: z.enum(['VIDEO', 'AUDIO_ONLY']).optional(),
  clientSessionId: z.string().min(4).max(120).optional(),
});

const stateBodySchema = z.object({
  status: z
    .enum([
      'SCHEDULED',
      'WAITING_ROOM',
      'CONNECTING',
      'CONNECTED',
      'RECONNECTING',
      'COMPLETED',
      'CANCELLED',
      'FAILED',
    ])
    .optional(),
  mode: z.enum(['VIDEO', 'AUDIO_ONLY']).optional(),
  failureCode: z.string().max(80).optional(),
  failureCategory: z.string().max(80).optional(),
});

const notesBodySchema = z.object({
  chiefComplaint: z.string().max(1000).optional(),
  clinicalObservations: z.string().max(4000).optional(),
  summary: z.string().max(4000).optional(),
  followUpPlan: z.string().max(2000).optional(),
});

const decisionBodySchema = z.object({
  decision: z.enum(['ACCEPT', 'REJECT']),
  reason: z.string().max(500).optional(),
});

const signalPostSchema = z.object({
  roomToken: z.string().min(20),
  signalType: z.enum(['OFFER', 'ANSWER', 'ICE_CANDIDATE', 'MEDIA_STATE', 'HANGUP']),
  payload: z.record(z.unknown()),
});

const buildActor = (req: Request) => {
  if (!req.user?.userId || !req.user?.role) {
    throw AppError.unauthorized('Authentication required');
  }
  return {
    userId: req.user.userId,
    role: req.user.role,
    ip: req.ip,
    requestId: req.requestId,
  };
};

export class TelemedicineController {
  getSession = asyncHandler(async (req: Request, res: Response) => {
    const actor = buildActor(req);
    const appointmentId = String(req.params.appointmentId || '');
    const data = await telemedicineService.getConsultationSession(appointmentId, actor);
    sendSuccess(res, data, 'Video consultation session retrieved successfully');
  });

  grantConsent = asyncHandler(async (req: Request, res: Response) => {
    const actor = buildActor(req);
    const appointmentId = String(req.params.appointmentId || '');
    const parsed = consentBodySchema.parse(req.body);
    const data = await telemedicineService.recordPatientConsent(appointmentId, actor, parsed);
    sendSuccess(res, data, 'Telemedicine informed consent recorded successfully', 200);
  });

  issueToken = asyncHandler(async (req: Request, res: Response) => {
    const actor = buildActor(req);
    const appointmentId = String(req.params.appointmentId || '');
    const parsed = tokenBodySchema.parse(req.body || {});
    const data = await telemedicineService.issueJoinToken(appointmentId, actor, parsed);
    sendSuccess(res, data, 'Short-lived video room token issued successfully', 201);
  });

  updateState = asyncHandler(async (req: Request, res: Response) => {
    const actor = buildActor(req);
    const appointmentId = String(req.params.appointmentId || '');
    const parsed = stateBodySchema.parse(req.body || {});
    const data = await telemedicineService.updateConsultationState(appointmentId, actor, parsed);
    sendSuccess(res, data, 'Consultation state updated successfully');
  });

  saveNotes = asyncHandler(async (req: Request, res: Response) => {
    const actor = buildActor(req);
    const appointmentId = String(req.params.appointmentId || '');
    const parsed = notesBodySchema.parse(req.body || {});
    const data = await telemedicineService.saveConsultationNotes(appointmentId, actor, parsed);
    sendSuccess(res, data, 'Clinical consultation notes saved successfully');
  });

  getDoctorUpcoming = asyncHandler(async (req: Request, res: Response) => {
    const actor = buildActor(req);
    const data = await telemedicineService.getDoctorUpcomingVideoConsultations(actor.userId);
    sendSuccess(res, data, 'Upcoming doctor video consultations retrieved successfully');
  });

  decideConsultation = asyncHandler(async (req: Request, res: Response) => {
    const actor = buildActor(req);
    const appointmentId = String(req.params.appointmentId || '');
    const parsed = decisionBodySchema.parse(req.body || {});
    const data = await telemedicineService.decideVideoConsultation(appointmentId, actor, parsed);
    sendSuccess(res, data, 'Video consultation decision recorded successfully');
  });

  postSignal = asyncHandler(async (req: Request, res: Response) => {
    const actor = buildActor(req);
    const consultationId = String(req.params.consultationId || '');
    const parsed = signalPostSchema.parse(req.body || {});
    const data = await telemedicineService.postSignal(consultationId, actor, parsed);
    sendSuccess(res, data, 'Signal relayed', 201);
  });

  pollSignals = asyncHandler(async (req: Request, res: Response) => {
    const actor = buildActor(req);
    const consultationId = String(req.params.consultationId || '');
    const roomToken = String(req.headers['x-video-room-token'] || '');
    if (!roomToken) {
      throw AppError.unauthorized('Missing X-Video-Room-Token header');
    }
    const since = typeof req.query.since === 'string' ? req.query.since : undefined;
    const data = await telemedicineService.pollSignals(consultationId, actor, roomToken, since);
    sendSuccess(res, data, 'Signals fetched');
  });

  getAdminTelemetry = asyncHandler(async (_req: Request, res: Response) => {
    const data = await telemedicineService.getAdminTelemetry();
    sendSuccess(res, data, 'Telemedicine aggregate telemetry retrieved successfully');
  });
}

export const telemedicineController = new TelemedicineController();
