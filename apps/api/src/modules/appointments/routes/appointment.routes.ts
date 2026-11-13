import { Router } from 'express';
import { appointmentController } from '../controllers/appointment.controller';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateRequest } from '../../../middleware/validate';
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
  appointmentFilterQuerySchema,
  appointmentIdParamSchema,
} from '@healthbridge/validation';

export const appointmentRoutes = Router();

// All appointment actions require active session authentication
appointmentRoutes.use(authenticate);

// 1. GET /api/v1/appointments — Retrieve patient's appointments with status filters
appointmentRoutes.get(
  '/',
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  validateRequest({ query: appointmentFilterQuerySchema }),
  appointmentController.getAppointments
);

// 2. POST /api/v1/appointments — Concurrency-protected atomic booking
appointmentRoutes.post(
  '/',
  authorize(['PATIENT']),
  validateRequest({ body: createAppointmentSchema }),
  appointmentController.bookAppointment
);

// 3. GET /api/v1/appointments/:appointmentId — Detailed appointment inspection
appointmentRoutes.get(
  '/:appointmentId',
  authorize(['PATIENT', 'DOCTOR', 'ADMIN']),
  validateRequest({ params: appointmentIdParamSchema }),
  appointmentController.getAppointmentById
);

// 4. PATCH /api/v1/appointments/:appointmentId/cancel — Cancel appointment
appointmentRoutes.patch(
  '/:appointmentId/cancel',
  authorize(['PATIENT']),
  validateRequest({
    params: appointmentIdParamSchema,
    body: cancelAppointmentSchema,
  }),
  appointmentController.cancelAppointment
);

// 5. PATCH /api/v1/appointments/:appointmentId/reschedule — Reschedule appointment slot
appointmentRoutes.patch(
  '/:appointmentId/reschedule',
  authorize(['PATIENT']),
  validateRequest({
    params: appointmentIdParamSchema,
    body: rescheduleAppointmentSchema,
  }),
  appointmentController.rescheduleAppointment
);

export default appointmentRoutes;
