import { Router } from 'express';
import { doctorController } from '../controllers/doctor.controller';
import { doctorDashboardController } from '../controllers/doctor-dashboard.controller';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateRequest } from '../../../middleware/validate';
import {
  doctorFilterQuerySchema,
  doctorIdParamSchema,
  doctorAvailabilityQuerySchema,
  updateDoctorProfileSchema,
} from '@healthbridge/validation';

export const doctorRoutes = Router();

// All doctor routes require active authentication
doctorRoutes.use(authenticate);

/* ==========================================================================
   DOCTOR PORTAL SPECIFIC ENDPOINTS (Restricted to DOCTOR role only)
   Mounted before parameterized :doctorId routes to prevent route collisions
   ========================================================================== */

/**
 * @route   GET /api/v1/doctors/me & GET /api/v1/doctors/profile
 * @desc    Get authenticated doctor's professional profile
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/me',
  authorize(['DOCTOR']),
  (req, res, next) => doctorDashboardController.getProfile(req, res, next)
);
doctorRoutes.get(
  '/profile',
  authorize(['DOCTOR']),
  (req, res, next) => doctorDashboardController.getProfile(req, res, next)
);

/**
 * @route   PATCH /api/v1/doctors/me & PATCH /api/v1/doctors/profile
 * @desc    Update permitted professional profile fields
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.patch(
  '/me',
  authorize(['DOCTOR']),
  validateRequest(updateDoctorProfileSchema),
  (req, res, next) => doctorDashboardController.updateProfile(req, res, next)
);
doctorRoutes.patch(
  '/profile',
  authorize(['DOCTOR']),
  validateRequest(updateDoctorProfileSchema),
  (req, res, next) => doctorDashboardController.updateProfile(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/dashboard/summary
 * @desc    Aggregate doctor clinical metrics & overview feeds
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/dashboard/summary',
  authorize(['DOCTOR']),
  (req, res, next) => doctorDashboardController.getDashboardSummary(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/appointments/today
 * @desc    Get today's scheduled consultations with optional filter
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/appointments/today',
  authorize(['DOCTOR']),
  (req, res, next) => doctorDashboardController.getTodayAppointments(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/appointments/upcoming
 * @desc    Get upcoming scheduled consultations
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/appointments/upcoming',
  authorize(['DOCTOR']),
  (req, res, next) => doctorDashboardController.getUpcomingAppointments(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/patients
 * @desc    Get assigned patient roster with clinical relationships
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/patients',
  authorize(['DOCTOR']),
  (req, res, next) => doctorDashboardController.getAssignedPatients(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/schedule
 * @desc    Get clinical working hours, days, and blocked slots
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/schedule',
  authorize(['DOCTOR']),
  (req, res, next) => doctorDashboardController.getSchedule(req, res, next)
);

/* ==========================================================================
   PUBLIC / PATIENT DOCTOR DISCOVERY & APPOINTMENT BOOKING ENDPOINTS
   ========================================================================== */

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
