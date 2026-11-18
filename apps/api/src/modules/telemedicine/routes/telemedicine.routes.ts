import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { telemedicineController } from '../controllers/telemedicine.controller';

export const telemedicineRoutes = Router();

// All telemedicine endpoints require verified JWT authentication
telemedicineRoutes.use(authenticate);

// 1. Participant-Scoped Session & Token Lifecycle (Patient & Assigned Doctor ONLY — Admins excluded from room entry)
telemedicineRoutes.get(
  '/appointments/:appointmentId/session',
  authorize(['PATIENT', 'DOCTOR']),
  telemedicineController.getSession
);

telemedicineRoutes.post(
  '/appointments/:appointmentId/consent',
  authorize(['PATIENT']),
  telemedicineController.grantConsent
);

telemedicineRoutes.post(
  '/appointments/:appointmentId/token',
  authorize(['PATIENT', 'DOCTOR']),
  telemedicineController.issueToken
);

telemedicineRoutes.patch(
  '/appointments/:appointmentId/state',
  authorize(['PATIENT', 'DOCTOR']),
  telemedicineController.updateState
);

telemedicineRoutes.put(
  '/appointments/:appointmentId/notes',
  authorize(['DOCTOR']),
  telemedicineController.saveNotes
);

// 2. Doctor Dashboard Video Consultation Queue & Accept/Reject Controls
telemedicineRoutes.get(
  '/doctor/upcoming',
  authorize(['DOCTOR']),
  telemedicineController.getDoctorUpcoming
);

telemedicineRoutes.post(
  '/doctor/appointments/:appointmentId/decision',
  authorize(['DOCTOR']),
  telemedicineController.decideConsultation
);

// 3. Authenticated Participant-Only WebRTC Signaling Relay (verified by short-lived room token)
telemedicineRoutes.post(
  '/sessions/:consultationId/signals',
  authorize(['PATIENT', 'DOCTOR']),
  telemedicineController.postSignal
);

telemedicineRoutes.get(
  '/sessions/:consultationId/signals',
  authorize(['PATIENT', 'DOCTOR']),
  telemedicineController.pollSignals
);

// 4. Admin Configuration & Aggregate Usage Telemetry (Strictly Zero Clinical Content / Zero PHI)
telemedicineRoutes.get(
  '/admin/telemetry',
  authorize(['ADMIN']),
  telemedicineController.getAdminTelemetry
);

export default telemedicineRoutes;
