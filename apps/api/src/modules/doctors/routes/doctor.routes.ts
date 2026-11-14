import { Router } from 'express';
import { doctorController } from '../controllers/doctor.controller';
import { doctorDashboardController } from '../controllers/doctor-dashboard.controller';
import { doctorAppointmentController } from '../controllers/doctor-appointment.controller';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateRequest } from '../../../middleware/validate';
import {
  doctorFilterQuerySchema,
  doctorIdParamSchema,
  doctorAvailabilityQuerySchema,
  updateDoctorProfileSchema,
  updateDoctorScheduleSchema,
  rejectAppointmentSchema,
  doctorCancelAppointmentSchema,
  appointmentIdParamSchema,
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
 * @route   GET /api/v1/doctors/appointments/summary
 * @desc    Get aggregated consultation counts (today, upcoming, pending, completed, cancelled)
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/appointments/summary',
  authorize(['DOCTOR']),
  (req, res, next) => doctorAppointmentController.getSummary(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/appointments
 * @desc    List doctor consultations with filters, search and pagination
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/appointments',
  authorize(['DOCTOR']),
  (req, res, next) => doctorAppointmentController.getAppointments(req, res, next)
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
 * @route   GET /api/v1/doctors/appointments/:appointmentId
 * @desc    Get appointment details with patient demographics
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/appointments/:appointmentId',
  authorize(['DOCTOR']),
  validateRequest({ params: appointmentIdParamSchema }),
  (req, res, next) => doctorAppointmentController.getAppointmentById(req, res, next)
);

/**
 * State Transition Action Endpoints (Atomic & Audited)
 */
doctorRoutes.patch(
  '/appointments/:appointmentId/confirm',
  authorize(['DOCTOR']),
  validateRequest({ params: appointmentIdParamSchema }),
  (req, res, next) => doctorAppointmentController.confirm(req, res, next)
);

doctorRoutes.patch(
  '/appointments/:appointmentId/reject',
  authorize(['DOCTOR']),
  validateRequest({ params: appointmentIdParamSchema, body: rejectAppointmentSchema }),
  (req, res, next) => doctorAppointmentController.reject(req, res, next)
);

doctorRoutes.patch(
  '/appointments/:appointmentId/check-in',
  authorize(['DOCTOR']),
  validateRequest({ params: appointmentIdParamSchema }),
  (req, res, next) => doctorAppointmentController.checkIn(req, res, next)
);

doctorRoutes.patch(
  '/appointments/:appointmentId/start',
  authorize(['DOCTOR']),
  validateRequest({ params: appointmentIdParamSchema }),
  (req, res, next) => doctorAppointmentController.start(req, res, next)
);

doctorRoutes.patch(
  '/appointments/:appointmentId/complete',
  authorize(['DOCTOR']),
  validateRequest({ params: appointmentIdParamSchema }),
  (req, res, next) => doctorAppointmentController.complete(req, res, next)
);

doctorRoutes.patch(
  '/appointments/:appointmentId/cancel',
  authorize(['DOCTOR']),
  validateRequest({ params: appointmentIdParamSchema, body: doctorCancelAppointmentSchema }),
  (req, res, next) => doctorAppointmentController.cancel(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/queue
 * @desc    Daily patient queue with priority ordering and waiting duration
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/queue',
  authorize(['DOCTOR']),
  (req, res, next) => doctorAppointmentController.getQueue(req, res, next)
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

/**
 * @route   PUT /api/v1/doctors/schedule
 * @desc    Update clinical schedule availability and blocked slots
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.put(
  '/schedule',
  authorize(['DOCTOR']),
  validateRequest({ body: updateDoctorScheduleSchema }),
  (req, res, next) => doctorAppointmentController.updateSchedule(req, res, next)
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
