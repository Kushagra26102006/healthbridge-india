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
import { EncounterModel } from '../../healthcare/models/encounter.model';
import { DispensingRecordModel } from '../../pharmacy/models/dispensing-record.model';
import { ConsentArtifactModel } from '../../consent/models/consent-artifact.model';
import { ConsentRequestModel } from '../../consent/models/consent-request.model';
import { AbhaLinkModel } from '../../abdm/models/abha-link.model';
import { AbdmConsentArtefactModel } from '../../abdm/models/abdm-consent-artefact.model';
import { AbdmConsentRequestModel } from '../../abdm/models/abdm-consent-request.model';
import { NotificationModel } from '../../notifications/models/notification.model';
import { getDatabaseStatus } from '../../../config/database';
import { patientProfileController } from '../controllers/patient-profile.controller';
import { orderFulfillmentController } from '../../pharmacy/controllers/order-fulfillment.controller';
import {
  updatePatientProfileSchema,
  changePasswordSchema,
  updateNotificationPreferencesSchema,
  createOrderFromPrescriptionSchema,
  patientOrderQuerySchema,
  orderIdParamSchema,
  cancelOrderSchema,
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

      // 2. Fetch summary counts and cross-module data concurrently (STRICT: excludes drafts & unpublished clinical reports)
      const [
        totalRecords,
        activePrescriptionsCount,
        availableLabReports,
        activeConsents,
        pendingInternalConsentRequests,
        activeAbdmArtefacts,
        pendingAbdmRequests,
        unreadNotificationsCount,
        activeAbhaLink,
        appointmentsData,
        prescriptionsData,
        recentRecords,
        recentEncountersRaw,
        recentLabReportsRaw,
        recentDispensingRaw,
      ] = await Promise.all([
        MedicalRecordModel.countDocuments({ patientId }),
        PrescriptionModel.countDocuments({ patientId, isDraft: false, status: 'ACTIVE' }),
        LaboratoryReportModel.countDocuments({
          patientId,
          status: { $in: ['PUBLISHED', 'AMENDED'] },
        }),
        ConsentArtifactModel.countDocuments({ patientId, status: 'ACTIVE' }),
        ConsentRequestModel.countDocuments({ patientId, status: 'PENDING' }),
        AbdmConsentArtefactModel.countDocuments({
          patientId,
          externalStatus: 'GRANTED',
          revocationStatus: 'NOT_REVOKED',
          expiresAt: { $gt: new Date() },
        }),
        AbdmConsentRequestModel.countDocuments({
          patientId,
          internalStatus: { $in: ['SUBMITTED', 'AWAITING_PATIENT_ACTION'] },
        }),
        NotificationModel.countDocuments({ userId: patientId, isRead: false }),
        AbhaLinkModel.findOne({ patientId, isActive: true }).lean(),
        AppointmentModel.find({
          patientId,
          status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] },
        })
          .sort({ scheduledAt: 1 })
          .limit(5)
          .populate('doctorId', 'name specialization')
          .populate('facilityId', 'name')
          .lean(),
        PrescriptionModel.find({
          patientId,
          isDraft: false,
          status: { $ne: 'DRAFT' },
        })
          .sort({ issuedAt: -1 })
          .limit(5)
          .populate('doctorId', 'name')
          .lean(),
        MedicalRecordModel.find({ patientId }).sort({ createdAt: -1 }).limit(5).lean(),
        EncounterModel.find({
          patientId,
          isDraft: false,
          status: { $in: ['COMPLETED', 'FINALIZED'] },
        })
          .sort({ startTime: -1 })
          .limit(5)
          .populate('practitionerId', 'name')
          .lean(),
        LaboratoryReportModel.find({
          patientId,
          status: { $in: ['PUBLISHED', 'AMENDED'] },
        })
          .sort({ publishedAt: -1, testDate: -1 })
          .limit(5)
          .lean(),
        DispensingRecordModel.find({ patientId })
          .sort({ dispensedAt: -1 })
          .limit(5)
          .lean(),
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

      const recentEncounters = (recentEncountersRaw as any[]).map((enc) => ({
        id: enc._id?.toString() || enc.id,
        doctorName: enc.practitionerId?.name || 'Attending Clinician',
        encounterType: enc.encounterType || 'OPD',
        startTime: enc.startTime ? new Date(enc.startTime).toISOString() : new Date().toISOString(),
        status: enc.status || 'COMPLETED',
        chiefComplaint: enc.chiefComplaint,
      }));

      const recentLabReports = (recentLabReportsRaw as any[]).map((rep) => ({
        id: rep._id?.toString() || rep.id,
        reportNumber: rep.reportNumber,
        testName: rep.testName,
        publishedAt: (rep.publishedAt || rep.testDate || rep.createdAt)
          ? new Date(rep.publishedAt || rep.testDate || rep.createdAt).toISOString()
          : new Date().toISOString(),
        status: rep.status,
        isAmended: rep.status === 'AMENDED' || Boolean(rep.amendmentDetails?.isAmended),
      }));

      const recentDispensing = (recentDispensingRaw as any[]).map((d) => ({
        id: d._id?.toString() || d.id,
        dispensingNumber: d.dispensingNumber,
        pharmacyName: d.pharmacyName,
        prescriptionNumber: d.prescriptionNumber,
        dispensedAt: d.dispensedAt ? new Date(d.dispensedAt).toISOString() : new Date().toISOString(),
        dispensingStatus: d.dispensingStatus,
      }));

      for (const rep of recentLabReports.slice(0, 3)) {
        recentActivity.push({
          id: `act-lab-${rep.id}`,
          type: 'LAB_REPORT',
          title: rep.isAmended ? `Amended Lab Report: ${rep.testName}` : `Lab Report Published: ${rep.testName}`,
          description: `Report ${rep.reportNumber} is available for download`,
          timestamp: rep.publishedAt,
          badge: rep.status,
          actionUrl: '/patient/lab-reports',
        });
      }

      for (const disp of recentDispensing.slice(0, 2)) {
        recentActivity.push({
          id: `act-disp-${disp.id}`,
          type: 'PRESCRIPTION',
          title: `Medication Dispensed (${disp.dispensingNumber})`,
          description: `Fulfilled by ${disp.pharmacyName}`,
          timestamp: disp.dispensedAt,
          badge: disp.dispensingStatus,
          actionUrl: '/patient/orders',
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
          activeConsents: activeConsents + activeAbdmArtefacts,
        },
        upcomingAppointments,
        recentPrescriptions,
        recentActivity: recentActivity.slice(0, 10),
        recentEncounters,
        recentLabReports,
        recentDispensing,
        abhaStatus: {
          linked: Boolean(activeAbhaLink && activeAbhaLink.verificationStatus === 'VERIFIED'),
          verificationStatus: activeAbhaLink?.verificationStatus || 'NOT_LINKED',
          abhaAddress: activeAbhaLink?.abhaAddress,
          maskedAbhaNumber: activeAbhaLink?.abhaNumberMasked,
          isMocked: activeAbhaLink?.isMocked,
        },
        consentSummary: {
          activeInternalConsents: activeConsents,
          pendingInternalRequests: pendingInternalConsentRequests,
          activeAbdmArtefacts,
          pendingAbdmRequests,
        },
        unreadNotificationsCount,
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

/**
 * ============================================================================
 * DAY 5 TASK 05: PATIENT PHARMACY ORDERS & TRACKING
 * ============================================================================
 */

/**
 * @route   GET /api/v1/patients/orders
 * @desc    List patient orders with status filtering and search
 * @access  Private (PATIENT role only)
 */
patientRoutes.get(
  '/orders',
  authenticate,
  authorize(['PATIENT']),
  validateRequest({ query: patientOrderQuerySchema }),
  (req, res, next) => orderFulfillmentController.getPatientOrders(req, res, next)
);

/**
 * @route   POST /api/v1/patients/orders
 * @desc    Create pharmacy order from doctor-issued prescription
 * @access  Private (PATIENT role only)
 */
patientRoutes.post(
  '/orders',
  authenticate,
  authorize(['PATIENT']),
  validateRequest({ body: createOrderFromPrescriptionSchema }),
  (req, res, next) => orderFulfillmentController.createOrderFromPrescription(req, res, next)
);

/**
 * @route   GET /api/v1/patients/orders/:orderId
 * @desc    Get patient order detail (reveals pickup code when ready)
 * @access  Private (PATIENT role only)
 */
patientRoutes.get(
  '/orders/:orderId',
  authenticate,
  authorize(['PATIENT']),
  validateRequest({ params: orderIdParamSchema }),
  (req, res, next) => orderFulfillmentController.getPatientOrderById(req, res, next)
);

/**
 * @route   GET /api/v1/patients/orders/:orderId/tracking
 * @desc    Get order tracking timeline
 * @access  Private (PATIENT role only)
 */
patientRoutes.get(
  '/orders/:orderId/tracking',
  authenticate,
  authorize(['PATIENT']),
  validateRequest({ params: orderIdParamSchema }),
  (req, res, next) => orderFulfillmentController.getOrderTimeline(req, res, next)
);

/**
 * @route   POST /api/v1/patients/orders/:orderId/cancel
 * @desc    Cancel order prior to fulfillment processing
 * @access  Private (PATIENT role only)
 */
patientRoutes.post(
  '/orders/:orderId/cancel',
  authenticate,
  authorize(['PATIENT']),
  validateRequest({ params: orderIdParamSchema, body: cancelOrderSchema }),
  (req, res, next) => orderFulfillmentController.cancelOrder(req, res, next)
);

export default patientRoutes;
