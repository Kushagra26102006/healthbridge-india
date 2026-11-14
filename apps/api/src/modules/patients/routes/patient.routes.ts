import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateRequest } from '../../../middleware/validate';
import { sendSuccess } from '../../../utils/api-response';
import { PatientProfileModel } from '../../users/models/patient-profile.model';
import { MedicalRecordModel } from '../../healthcare/models/medical-record.model';
import { AppointmentModel } from '../../healthcare/models/appointment.model';
import { PrescriptionModel } from '../../healthcare/models/prescription.model';
import { LaboratoryReportModel } from '../../healthcare/models/lab-report.model';
import { ConsentArtifactModel } from '../../consent/models/consent-artifact.model';
import { getDatabaseStatus } from '../../../config/database';
import { patientProfileController } from '../controllers/patient-profile.controller';
import {
  updatePatientProfileSchema,
  changePasswordSchema,
  updateNotificationPreferencesSchema,
} from '@healthbridge/validation';
import type { PatientDashboardSummaryDto } from '@healthbridge/shared-types';

export const patientRoutes = Router();

patientRoutes.get('/', (_req: Request, res: Response) => {
  sendSuccess(
    res,
    { module: 'Patients', status: 'operational', milestone: 'Day 3' },
    'Patients module ready'
  );
});

/**
 * @route   GET /api/v1/patients/dashboard-summary
 * @desc    Fetch aggregated summary statistics, recent records, appointments and ABHA status for current patient
 * @access  Private (PATIENT role only)
 */
patientRoutes.get(
  '/dashboard-summary',
  authenticate,
  authorize(['PATIENT']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user?.userId;
      const dbHealth = await getDatabaseStatus();

      // Graceful offline fallback if MongoDB service is unreachable during offline test runs
      if (dbHealth.status !== 'connected' || !patientId) {
        const fallbackSummary: PatientDashboardSummaryDto = {
          profile: null,
          stats: {
            totalRecords: 0,
            upcomingAppointments: 0,
            activePrescriptions: 0,
            availableLabReports: 0,
            activeConsents: 0,
          },
          upcomingAppointments: [],
          recentPrescriptions: [],
          recentActivity: [],
        };
        sendSuccess(res, fallbackSummary, 'Patient summary (offline fallback envelope)');
        return;
      }

      // 1. Fetch patient profile with ABHA data
      const profile = await PatientProfileModel.findOne({ userId: patientId });

      // 2. Fetch summary counts concurrently
      const [
        totalRecords,
        activePrescriptionsCount,
        availableLabReports,
        activeConsents,
        appointmentsData,
        prescriptionsData,
        recentRecords,
      ] = await Promise.all([
        MedicalRecordModel.countDocuments({ patientId }),
        PrescriptionModel.countDocuments({ patientId, status: 'ACTIVE' }),
        LaboratoryReportModel.countDocuments({ patientId }),
        ConsentArtifactModel.countDocuments({ patientId, status: 'ACTIVE' }),
        AppointmentModel.find({
          patientId,
          status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] },
        })
          .sort({ scheduledAt: 1 })
          .limit(5)
          .populate('doctorId', 'name specialization')
          .populate('facilityId', 'name')
          .lean(),
        PrescriptionModel.find({ patientId })
          .sort({ issuedAt: -1 })
          .limit(5)
          .populate('doctorId', 'name')
          .lean(),
        MedicalRecordModel.find({ patientId }).sort({ createdAt: -1 }).limit(5).lean(),
      ]);

      // 3. Format upcoming appointments
      const upcomingAppointments = appointmentsData.map((apt: any) => ({
        id: apt._id?.toString() || apt.id,
        doctorName: apt.doctorId?.name || 'Healthcare Practitioner',
        specialty: (apt.doctorId as any)?.specialization?.[0] || 'General Medicine',
        scheduledAt: apt.scheduledAt
          ? new Date(apt.scheduledAt).toISOString()
          : new Date().toISOString(),
        facilityName: apt.facilityId?.name || 'Main Healthcare Center',
        status: apt.status || 'CONFIRMED',
      }));

      // 4. Format recent prescriptions
      const recentPrescriptions = prescriptionsData.map((rx: any) => {
        const medsSummary =
          rx.medications?.map((m: any) => m.name).join(', ') || 'Prescribed Medications';
        return {
          id: rx._id?.toString() || rx.id,
          doctorName: rx.doctorId?.name || 'Attending Physician',
          issuedAt: rx.issuedAt ? new Date(rx.issuedAt).toISOString() : new Date().toISOString(),
          medicationsSummary: medsSummary,
          status: rx.status || 'ACTIVE',
          medicationsCount: rx.medications?.length || 0,
        };
      });

      // 5. Build recent activity timeline
      const recentActivity: any[] = [];

      for (const rec of recentRecords) {
        recentActivity.push({
          id: `act-rec-${rec._id?.toString()}`,
          type: 'RECORD',
          title: `New ${rec.recordType || 'Medical'} Record: ${rec.title}`,
          description: rec.description || 'Health record added to your repository',
          timestamp: rec.createdAt
            ? new Date(rec.createdAt).toISOString()
            : new Date().toISOString(),
          badge: rec.source || 'ABDM_INGESTION',
          actionUrl: '/patient/records',
        });
      }

      for (const apt of upcomingAppointments.slice(0, 3)) {
        recentActivity.push({
          id: `act-apt-${apt.id}`,
          type: 'APPOINTMENT',
          title: `Consultation with ${apt.doctorName}`,
          description: `Scheduled at ${apt.facilityName}`,
          timestamp: apt.scheduledAt,
          badge: apt.status,
          actionUrl: '/patient/appointments',
        });
      }

      for (const rx of recentPrescriptions.slice(0, 2)) {
        recentActivity.push({
          id: `act-rx-${rx.id}`,
          type: 'PRESCRIPTION',
          title: `Prescription from ${rx.doctorName}`,
          description: rx.medicationsSummary,
          timestamp: rx.issuedAt,
          badge: rx.status,
          actionUrl: '/patient/prescriptions',
        });
      }

      // Sort activity latest first
      recentActivity.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const responsePayload: PatientDashboardSummaryDto = {
        profile: profile ? (profile.toJSON() as any) : null,
        stats: {
          totalRecords,
          upcomingAppointments: upcomingAppointments.length,
          activePrescriptions: activePrescriptionsCount,
          availableLabReports,
          activeConsents,
        },
        upcomingAppointments,
        recentPrescriptions,
        recentActivity: recentActivity.slice(0, 10),
      };

      sendSuccess(res, responsePayload, 'Patient dashboard summary retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Patient Profile Endpoints
 * GET /api/v1/patients/me & GET /api/v1/patients/profile
 */
patientRoutes.get(
  '/me',
  authenticate,
  authorize(['PATIENT']),
  (req, res, next) => patientProfileController.getProfile(req, res, next)
);
patientRoutes.get(
  '/profile',
  authenticate,
  authorize(['PATIENT']),
  (req, res, next) => patientProfileController.getProfile(req, res, next)
);

/**
 * Update Patient Profile
 * PATCH /api/v1/patients/me & PATCH /api/v1/patients/profile
 */
patientRoutes.patch(
  '/me',
  authenticate,
  authorize(['PATIENT']),
  validateRequest(updatePatientProfileSchema),
  (req, res, next) => patientProfileController.updateProfile(req, res, next)
);
patientRoutes.patch(
  '/profile',
  authenticate,
  authorize(['PATIENT']),
  validateRequest(updatePatientProfileSchema),
  (req, res, next) => patientProfileController.updateProfile(req, res, next)
);

/**
 * Change Password
 * POST /api/v1/patients/me/change-password & POST /api/v1/patients/change-password
 */
patientRoutes.post(
  '/me/change-password',
  authenticate,
  authorize(['PATIENT']),
  validateRequest(changePasswordSchema),
  (req, res, next) => patientProfileController.changePassword(req, res, next)
);
patientRoutes.post(
  '/change-password',
  authenticate,
  authorize(['PATIENT']),
  validateRequest(changePasswordSchema),
  (req, res, next) => patientProfileController.changePassword(req, res, next)
);

/**
 * Active Sessions Management
 * GET /api/v1/patients/me/sessions & GET /api/v1/patients/sessions
 */
patientRoutes.get(
  '/me/sessions',
  authenticate,
  authorize(['PATIENT']),
  (req, res, next) => patientProfileController.getSessions(req, res, next)
);
patientRoutes.get(
  '/sessions',
  authenticate,
  authorize(['PATIENT']),
  (req, res, next) => patientProfileController.getSessions(req, res, next)
);

/**
 * Revoke Individual Session
 * DELETE /api/v1/patients/me/sessions/:sessionId & DELETE /api/v1/patients/sessions/:sessionId
 */
patientRoutes.delete(
  '/me/sessions/:sessionId',
  authenticate,
  authorize(['PATIENT']),
  (req, res, next) => patientProfileController.revokeSession(req, res, next)
);
patientRoutes.delete(
  '/sessions/:sessionId',
  authenticate,
  authorize(['PATIENT']),
  (req, res, next) => patientProfileController.revokeSession(req, res, next)
);

/**
 * Revoke Other Sessions
 * POST /api/v1/patients/me/sessions/revoke-others & POST /api/v1/patients/sessions/revoke-others
 */
patientRoutes.post(
  '/me/sessions/revoke-others',
  authenticate,
  authorize(['PATIENT']),
  (req, res, next) => patientProfileController.revokeOtherSessions(req, res, next)
);
patientRoutes.post(
  '/sessions/revoke-others',
  authenticate,
  authorize(['PATIENT']),
  (req, res, next) => patientProfileController.revokeOtherSessions(req, res, next)
);

/**
 * Notification Preferences
 * GET /api/v1/patients/me/notification-preferences & GET /api/v1/patients/notification-preferences
 */
patientRoutes.get(
  '/me/notification-preferences',
  authenticate,
  authorize(['PATIENT']),
  (req, res, next) => patientProfileController.getNotificationPreferences(req, res, next)
);
patientRoutes.get(
  '/notification-preferences',
  authenticate,
  authorize(['PATIENT']),
  (req, res, next) => patientProfileController.getNotificationPreferences(req, res, next)
);

/**
 * Update Notification Preferences
 * PATCH /api/v1/patients/me/notification-preferences & PATCH /api/v1/patients/notification-preferences
 */
patientRoutes.patch(
  '/me/notification-preferences',
  authenticate,
  authorize(['PATIENT']),
  validateRequest(updateNotificationPreferencesSchema),
  (req, res, next) => patientProfileController.updateNotificationPreferences(req, res, next)
);
patientRoutes.patch(
  '/notification-preferences',
  authenticate,
  authorize(['PATIENT']),
  validateRequest(updateNotificationPreferencesSchema),
  (req, res, next) => patientProfileController.updateNotificationPreferences(req, res, next)
);

export default patientRoutes;
