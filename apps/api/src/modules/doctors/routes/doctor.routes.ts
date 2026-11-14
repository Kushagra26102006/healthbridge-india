import { Router } from 'express';
import { doctorController } from '../controllers/doctor.controller';
import { doctorDashboardController } from '../controllers/doctor-dashboard.controller';
import { doctorAppointmentController } from '../controllers/doctor-appointment.controller';
import { doctorEncounterController } from '../controllers/doctor-encounter.controller';
import { doctorPrescriptionController } from '../controllers/doctor-prescription.controller';
import { doctorPatientController } from '../controllers/doctor-patient.controller';
import { doctorScheduleController } from '../controllers/doctor-schedule.controller';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateRequest } from '../../../middleware/validate';
import {
  doctorFilterQuerySchema,
  doctorIdParamSchema,
  doctorAvailabilityQuerySchema,
  updateDoctorProfileSchema,
  updateDoctorScheduleSchema,
  updateDoctorWeeklyScheduleSchema,
  blockDateRequestSchema,
  blockedDateIdParamSchema,
  scheduleOverrideSchema,
  overrideIdParamSchema,
  scheduleCalendarQuerySchema,
  scheduleAvailabilityQuerySchema,
  rejectAppointmentSchema,
  doctorCancelAppointmentSchema,
  appointmentIdParamSchema,
  createEncounterSchema,
  updateEncounterDraftSchema,
  completeEncounterSchema,
  encounterFilterQuerySchema,
  encounterIdParamSchema,
  patientIdParamSchema,
  createDoctorPrescriptionSchema,
  updateDoctorPrescriptionSchema,
  issuePrescriptionSchema,
  discontinuePrescriptionSchema,
  doctorPrescriptionFilterQuerySchema,
  prescriptionIdParamSchema,
  doctorPatientFilterQuerySchema,
  patientTimelineQuerySchema,
  patientRecordFilterQuerySchema,
  createDoctorConsentRequestSchema,
  paginationQuerySchema,
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
 * @desc    Get assigned patient directory with search, filters and pagination
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/patients',
  authorize(['DOCTOR']),
  validateRequest({ query: doctorPatientFilterQuerySchema }),
  (req, res, next) => doctorPatientController.getPatients(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/schedule
 * @desc    Get clinical working hours, weekly schedule, and availability configuration
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/schedule',
  authorize(['DOCTOR']),
  (req, res, next) => doctorScheduleController.getSchedule(req, res, next)
);

/**
 * @route   PUT /api/v1/doctors/schedule
 * @desc    Update clinical schedule availability, weekly days, windows, breaks, or legacy settings
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.put(
  '/schedule',
  authorize(['DOCTOR']),
  (req, res, next) => {
    if (req.body && req.body.weeklySchedule) {
      const parsed = updateDoctorWeeklyScheduleSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(parsed.error);
      }
      req.body = parsed.data;
      return doctorScheduleController.updateSchedule(req, res, next);
    }
    const parsed = updateDoctorScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(parsed.error);
    }
    req.body = parsed.data;
    return doctorAppointmentController.updateSchedule(req, res, next);
  }
);

/**
 * @route   GET /api/v1/doctors/schedule/overview
 * @desc    Get schedule summary metrics for today and upcoming week
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/schedule/overview',
  authorize(['DOCTOR']),
  (req, res, next) => doctorScheduleController.getOverview(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/schedule/availability
 * @desc    Query doctor consultation slot availability for a specific date
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/schedule/availability',
  authorize(['DOCTOR']),
  validateRequest({ query: scheduleAvailabilityQuerySchema }),
  (req, res, next) => doctorScheduleController.getAvailability(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/schedule/calendar
 * @desc    Get aggregated calendar view items (day, week, month)
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/schedule/calendar',
  authorize(['DOCTOR']),
  validateRequest({ query: scheduleCalendarQuerySchema }),
  (req, res, next) => doctorScheduleController.getCalendar(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/schedule/blocked-dates
 * @desc    List all blocked dates and leave periods
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/schedule/blocked-dates',
  authorize(['DOCTOR']),
  (req, res, next) => doctorScheduleController.getBlockedDates(req, res, next)
);

/**
 * @route   POST /api/v1/doctors/schedule/blocked-dates
 * @desc    Create a blocked date / leave with conflict detection
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.post(
  '/schedule/blocked-dates',
  authorize(['DOCTOR']),
  validateRequest({ body: blockDateRequestSchema }),
  (req, res, next) => doctorScheduleController.createBlockedDate(req, res, next)
);

/**
 * @route   DELETE /api/v1/doctors/schedule/blocked-dates/:blockId
 * @desc    Delete a blocked date / leave period
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.delete(
  '/schedule/blocked-dates/:blockId',
  authorize(['DOCTOR']),
  validateRequest({ params: blockedDateIdParamSchema }),
  (req, res, next) => doctorScheduleController.deleteBlockedDate(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/schedule/overrides
 * @desc    Get special working day overrides
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/schedule/overrides',
  authorize(['DOCTOR']),
  (req, res, next) => doctorScheduleController.getOverrides(req, res, next)
);

/**
 * @route   POST /api/v1/doctors/schedule/overrides
 * @desc    Create or update a special working day override
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.post(
  '/schedule/overrides',
  authorize(['DOCTOR']),
  validateRequest({ body: scheduleOverrideSchema }),
  (req, res, next) => doctorScheduleController.createOverride(req, res, next)
);

/**
 * @route   DELETE /api/v1/doctors/schedule/overrides/:overrideId
 * @desc    Delete a special working day override
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.delete(
  '/schedule/overrides/:overrideId',
  authorize(['DOCTOR']),
  validateRequest({ params: overrideIdParamSchema }),
  (req, res, next) => doctorScheduleController.deleteOverride(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/schedule/facilities
 * @desc    Retrieve facilities associated with doctor
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/schedule/facilities',
  authorize(['DOCTOR']),
  (req, res, next) => doctorScheduleController.getFacilities(req, res, next)
);

/* ==========================================================================
   CLINICAL ENCOUNTER MANAGEMENT & EMR ENDPOINTS (DOCTOR role only)
   ========================================================================== */

/**
 * @route   GET /api/v1/doctors/encounters/summary
 * @desc    Aggregate encounter metrics (today, draft, completed, pendingDocumentation, total)
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/encounters/summary',
  authorize(['DOCTOR']),
  (req, res, next) => doctorEncounterController.getSummary(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/encounters
 * @desc    List consultations with search, filters and pagination
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/encounters',
  authorize(['DOCTOR']),
  validateRequest({ query: encounterFilterQuerySchema }),
  (req, res, next) => doctorEncounterController.getEncounters(req, res, next)
);

/**
 * @route   POST /api/v1/doctors/encounters
 * @desc    Initialize a new clinical encounter workspace
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.post(
  '/encounters',
  authorize(['DOCTOR']),
  validateRequest({ body: createEncounterSchema }),
  (req, res, next) => doctorEncounterController.createEncounter(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/encounters/:encounterId
 * @desc    Get detailed encounter workspace
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/encounters/:encounterId',
  authorize(['DOCTOR']),
  validateRequest({ params: encounterIdParamSchema }),
  (req, res, next) => doctorEncounterController.getEncounterById(req, res, next)
);

/**
 * @route   PATCH /api/v1/doctors/encounters/:encounterId
 * @desc    Update and auto-save clinical documentation draft
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.patch(
  '/encounters/:encounterId',
  authorize(['DOCTOR']),
  validateRequest({ params: encounterIdParamSchema, body: updateEncounterDraftSchema }),
  (req, res, next) => doctorEncounterController.updateDraft(req, res, next)
);

/**
 * @route   POST /api/v1/doctors/encounters/:encounterId/save-draft
 * @desc    Explicitly save clinical documentation draft
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.post(
  '/encounters/:encounterId/save-draft',
  authorize(['DOCTOR']),
  validateRequest({ params: encounterIdParamSchema, body: updateEncounterDraftSchema }),
  (req, res, next) => doctorEncounterController.updateDraft(req, res, next)
);

/**
 * @route   POST /api/v1/doctors/encounters/:encounterId/complete
 * @desc    Finalize and lock clinical consultation document
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.post(
  '/encounters/:encounterId/complete',
  authorize(['DOCTOR']),
  validateRequest({ params: encounterIdParamSchema, body: completeEncounterSchema }),
  (req, res, next) => doctorEncounterController.completeEncounter(req, res, next)
);

/* ==========================================================================
   DOCTOR PATIENT MANAGEMENT & CLINICAL HISTORY ENDPOINTS (DOCTOR role only)
   ========================================================================== */

/**
 * @route   GET /api/v1/doctors/patients/:patientId
 * @desc    Get clinical patient profile overview and authorized health summary
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/patients/:patientId',
  authorize(['DOCTOR']),
  validateRequest({ params: patientIdParamSchema }),
  (req, res, next) => doctorPatientController.getPatientProfile(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/patients/:patientId/history
 * @desc    Get chronological unified medical timeline with category & date filters
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/patients/:patientId/history',
  authorize(['DOCTOR']),
  validateRequest({ params: patientIdParamSchema, query: patientTimelineQuerySchema }),
  (req, res, next) => doctorPatientController.getPatientHistory(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/patients/:patientId/records
 * @desc    Get authorized patient medical records and diagnostic documents
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/patients/:patientId/records',
  authorize(['DOCTOR']),
  validateRequest({ params: patientIdParamSchema, query: patientRecordFilterQuerySchema }),
  (req, res, next) => doctorPatientController.getPatientRecords(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/patients/:patientId/encounters
 * @desc    Get previous consultation encounter history for authorized patient
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/patients/:patientId/encounters',
  authorize(['DOCTOR']),
  validateRequest({ params: patientIdParamSchema, query: paginationQuerySchema }),
  (req, res, next) => doctorPatientController.getPatientEncounters(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/patients/:patientId/prescriptions
 * @desc    Get prescription history for authorized patient
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/patients/:patientId/prescriptions',
  authorize(['DOCTOR']),
  validateRequest({ params: patientIdParamSchema, query: paginationQuerySchema }),
  (req, res, next) => doctorPatientController.getPatientPrescriptions(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/patients/:patientId/lab-reports
 * @desc    Get diagnostic laboratory reports with reference ranges
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/patients/:patientId/lab-reports',
  authorize(['DOCTOR']),
  validateRequest({ params: patientIdParamSchema, query: paginationQuerySchema }),
  (req, res, next) => doctorPatientController.getPatientLabReports(req, res, next)
);

/**
 * @route   POST /api/v1/doctors/patients/:patientId/consent-requests
 * @desc    Initiate an ABDM electronic patient consent request
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.post(
  '/patients/:patientId/consent-requests',
  authorize(['DOCTOR']),
  validateRequest({ params: patientIdParamSchema, body: createDoctorConsentRequestSchema }),
  (req, res, next) => doctorPatientController.createConsentRequest(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/patients/:patientId/clinical-history
 * @desc    Get longitudinal clinical health chart with consent enforcement (backward compatibility)
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/patients/:patientId/clinical-history',
  authorize(['DOCTOR']),
  validateRequest({ params: patientIdParamSchema }),
  (req, res, next) => doctorEncounterController.getPatientClinicalHistory(req, res, next)
);

/* ==========================================================================
   E-PRESCRIPTION MANAGEMENT ENDPOINTS (DOCTOR role only)
   ========================================================================== */

/**
 * @route   GET /api/v1/doctors/prescriptions/summary
 * @desc    Aggregate doctor prescription metrics (total, issued, draft, recent)
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/prescriptions/summary',
  authorize(['DOCTOR']),
  (req, res, next) => doctorPrescriptionController.getSummary(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/prescriptions
 * @desc    List prescriptions with filters, search and pagination
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/prescriptions',
  authorize(['DOCTOR']),
  validateRequest({ query: doctorPrescriptionFilterQuerySchema }),
  (req, res, next) => doctorPrescriptionController.getPrescriptions(req, res, next)
);

/**
 * @route   POST /api/v1/doctors/prescriptions
 * @desc    Create prescription (Draft or Issued directly)
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.post(
  '/prescriptions',
  authorize(['DOCTOR']),
  validateRequest({ body: createDoctorPrescriptionSchema }),
  (req, res, next) => doctorPrescriptionController.createPrescription(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/prescriptions/:prescriptionId
 * @desc    Get detailed prescription document
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/prescriptions/:prescriptionId',
  authorize(['DOCTOR']),
  validateRequest({ params: prescriptionIdParamSchema }),
  (req, res, next) => doctorPrescriptionController.getPrescriptionById(req, res, next)
);

/**
 * @route   PATCH /api/v1/doctors/prescriptions/:prescriptionId
 * @desc    Update draft prescription (Concurrency protected)
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.patch(
  '/prescriptions/:prescriptionId',
  authorize(['DOCTOR']),
  validateRequest({ params: prescriptionIdParamSchema, body: updateDoctorPrescriptionSchema }),
  (req, res, next) => doctorPrescriptionController.updatePrescription(req, res, next)
);

/**
 * @route   POST /api/v1/doctors/prescriptions/:prescriptionId/issue
 * @desc    Finalize and issue e-prescription
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.post(
  '/prescriptions/:prescriptionId/issue',
  authorize(['DOCTOR']),
  validateRequest({ params: prescriptionIdParamSchema, body: issuePrescriptionSchema }),
  (req, res, next) => doctorPrescriptionController.issuePrescription(req, res, next)
);

/**
 * @route   POST /api/v1/doctors/prescriptions/:prescriptionId/discontinue
 * @desc    Discontinue an active issued prescription
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.post(
  '/prescriptions/:prescriptionId/discontinue',
  authorize(['DOCTOR']),
  validateRequest({ params: prescriptionIdParamSchema, body: discontinuePrescriptionSchema }),
  (req, res, next) => doctorPrescriptionController.discontinuePrescription(req, res, next)
);

/**
 * @route   GET /api/v1/doctors/prescriptions/:prescriptionId/document
 * @desc    Get structured printable digital prescription document data
 * @access  Private (DOCTOR role only)
 */
doctorRoutes.get(
  '/prescriptions/:prescriptionId/document',
  authorize(['DOCTOR']),
  validateRequest({ params: prescriptionIdParamSchema }),
  (req, res, next) => doctorPrescriptionController.getDocument(req, res, next)
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
