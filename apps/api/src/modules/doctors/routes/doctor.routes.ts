import { Router } from 'express';
import { doctorController } from '../controllers/doctor.controller';
import { authenticate } from '../../../middleware/authenticate';
import { validateRequest } from '../../../middleware/validate';
import {
  doctorFilterQuerySchema,
  doctorIdParamSchema,
  doctorAvailabilityQuerySchema,
} from '@healthbridge/validation';

export const doctorRoutes = Router();

// Doctor discovery is available for authenticated sessions
doctorRoutes.use(authenticate);

// 1. GET /api/v1/doctors — Discover doctors with specialization & facility filtering
doctorRoutes.get(
  '/',
  validateRequest({ query: doctorFilterQuerySchema }),
  doctorController.getDoctors
);

// 2. GET /api/v1/doctors/:doctorId/availability — Query real-time time slots for booking
doctorRoutes.get(
  '/:doctorId/availability',
  validateRequest({
    params: doctorIdParamSchema,
    query: doctorAvailabilityQuerySchema,
  }),
  doctorController.getAvailability
);

// 3. GET /api/v1/doctors/:doctorId — View verified doctor profile & credentials
doctorRoutes.get(
  '/:doctorId',
  validateRequest({ params: doctorIdParamSchema }),
  doctorController.getDoctorById
);

export default doctorRoutes;
