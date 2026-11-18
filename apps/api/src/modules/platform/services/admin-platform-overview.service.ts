/**
 * HealthBridge India — Unified Administrator Platform Overview Service (Day 8 Task 01)
 *
 * Computes live server-side MongoDB aggregate operational metrics across the entire platform:
 *   - Registered patients, active doctors, active pharmacies, active laboratories
 *   - Appointments, encounters, prescriptions, dispensing records, lab orders, published/amended reports
 *   - Notification delivery outcomes (`NotificationDeliveryModel`)
 *   - ABDM integration readiness (zero patient PII, zero credentials)
 */

import mongoose from 'mongoose';
import type { AdminPlatformOverviewDto } from '@healthbridge/shared-types';
import { UserModel } from '../../users/models/user.model';
import { AppointmentModel } from '../../healthcare/models/appointment.model';
import { EncounterModel } from '../../healthcare/models/encounter.model';
import { PrescriptionModel } from '../../healthcare/models/prescription.model';
import { DispensingRecordModel } from '../../pharmacy/models/dispensing-record.model';
import { LaboratoryOrderModel } from '../../healthcare/models/lab-order.model';
import { LaboratoryReportModel } from '../../healthcare/models/lab-report.model';
import { NotificationDeliveryModel } from '../../notifications/models/notification-delivery.model';
import { AbhaLinkModel } from '../../abdm/models/abha-link.model';
import { AbdmConsentArtefactModel } from '../../abdm/models/abdm-consent-artefact.model';
import { AbdmHealthInformationTransferModel } from '../../abdm/models/abdm-health-information-transfer.model';
import { AbdmImportedRecordModel } from '../../abdm/models/abdm-imported-record.model';
import { abdmConfigurationService } from '../../abdm/services/abdm-configuration.service';

export class AdminPlatformOverviewService {
  async getPlatformOverview(): Promise<AdminPlatformOverviewDto> {
    const abdmDashboard = abdmConfigurationService.getIntegrationStatusDashboard();

    if (mongoose.connection.readyState !== 1) {
      return {
        users: {
          registeredPatients: 0,
          activeDoctors: 0,
          activePharmacies: 0,
          activeLaboratories: 0,
        },
        clinicalOperations: {
          totalAppointments: 0,
          upcomingAppointments: 0,
          totalEncounters: 0,
          finalizedEncounters: 0,
          totalPrescriptions: 0,
          activePrescriptions: 0,
          dispensingRecords: 0,
          totalLabOrders: 0,
          publishedLabReports: 0,
          amendedLabReports: 0,
        },
        notifications: {
          totalSent: 0,
          delivered: 0,
          failed: 0,
          pending: 0,
        },
        abdm: {
          overallStatus: abdmDashboard.overallStatus,
          sandboxConnectivityStatus: abdmDashboard.sandboxConnectivityStatus,
          liveExchangeEnabled: false,
          verifiedAbhaLinks: 0,
          activeAbdmArtefacts: 0,
          hipHiuTransfersTotal: 0,
          importedExternalRecords: 0,
        },
        generatedAt: new Date().toISOString(),
      };
    }

    const now = new Date();
    const [
      registeredPatients,
      activeDoctors,
      activePharmacies,
      activeLaboratories,
      totalAppointments,
      upcomingAppointments,
      totalEncounters,
      finalizedEncounters,
      totalPrescriptions,
      activePrescriptions,
      dispensingRecords,
      totalLabOrders,
      publishedLabReports,
      amendedLabReports,
      notifTotal,
      notifDelivered,
      notifFailed,
      notifPending,
      verifiedAbhaLinks,
      activeAbdmArtefacts,
      hipHiuTransfersTotal,
      importedExternalRecords,
    ] = await Promise.all([
      UserModel.countDocuments({ role: 'PATIENT' }),
      UserModel.countDocuments({ role: 'DOCTOR', isActive: true }),
      UserModel.countDocuments({ role: 'PHARMACY', isActive: true }),
      UserModel.countDocuments({ role: 'LABORATORY', isActive: true }),
      AppointmentModel.countDocuments(),
      AppointmentModel.countDocuments({
        status: { $in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] },
        scheduledAt: { $gte: now },
      }),
      EncounterModel.countDocuments(),
      EncounterModel.countDocuments({ isDraft: false, status: { $in: ['COMPLETED', 'FINALIZED'] } }),
      PrescriptionModel.countDocuments({ isDraft: false }),
      PrescriptionModel.countDocuments({ isDraft: false, status: 'ACTIVE' }),
      DispensingRecordModel.countDocuments({ dispensingStatus: { $ne: 'CANCELLED' } }),
      LaboratoryOrderModel.countDocuments(),
      LaboratoryReportModel.countDocuments({ status: 'PUBLISHED' }),
      LaboratoryReportModel.countDocuments({ status: 'AMENDED' }),
      NotificationDeliveryModel.countDocuments(),
      NotificationDeliveryModel.countDocuments({ status: { $in: ['SENT', 'DELIVERED'] } }),
      NotificationDeliveryModel.countDocuments({ status: 'FAILED' }),
      NotificationDeliveryModel.countDocuments({ status: { $in: ['PENDING', 'QUEUED', 'RETRYING'] } }),
      AbhaLinkModel.countDocuments({ isActive: true, verificationStatus: 'VERIFIED' }),
      AbdmConsentArtefactModel.countDocuments({
        externalStatus: 'GRANTED',
        revocationStatus: 'NOT_REVOKED',
        expiresAt: { $gt: now },
      }),
      AbdmHealthInformationTransferModel.countDocuments(),
      AbdmImportedRecordModel.countDocuments(),
    ]);

    return {
      users: {
        registeredPatients,
        activeDoctors,
        activePharmacies,
        activeLaboratories,
      },
      clinicalOperations: {
        totalAppointments,
        upcomingAppointments,
        totalEncounters,
        finalizedEncounters,
        totalPrescriptions,
        activePrescriptions,
        dispensingRecords,
        totalLabOrders,
        publishedLabReports,
        amendedLabReports,
      },
      notifications: {
        totalSent: notifTotal,
        delivered: notifDelivered,
        failed: notifFailed,
        pending: notifPending,
      },
      abdm: {
        overallStatus: abdmDashboard.overallStatus,
        sandboxConnectivityStatus: abdmDashboard.sandboxConnectivityStatus,
        liveExchangeEnabled: false,
        verifiedAbhaLinks,
        activeAbdmArtefacts,
        hipHiuTransfersTotal,
        importedExternalRecords,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}

export const adminPlatformOverviewService = new AdminPlatformOverviewService();
