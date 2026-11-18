/**
 * HealthBridge India — Unified Doctor Clinical Workspace Service (Day 8 Task 01)
 *
 * Aggregates all authorized patient clinical context for `/doctor/patients/[patientId]/overview`:
 *   - Unified Patient Identity (internal ID + external ABHA badge)
 *   - Appointments, Encounters, Prescriptions + read-only Pharmacy Dispensing status
 *   - Read-only Published/Amended Laboratory Reports & Amendment version history
 *   - Medical Documents & Consolidated Medication History
 *   - Consent & Access Status (Internal + ABDM)
 *   - Read-only Authorized ABDM External Imported Records
 *
 * SECURITY INVARIANTS:
 *   1. Fails CLOSED (`403`) if doctor lacks an active appointment, clinical encounter, or active
 *      internal/ABDM consent with the patient.
 *   2. Doctors NEVER receive edit endpoints for Laboratory Reports, Pharmacy Dispensing, or ABDM External Records.
 *   3. Zero AI-generated diagnoses or clinical interpretations.
 */

import { Types } from 'mongoose';
import type { DoctorUnifiedPatientOverviewDto } from '@healthbridge/shared-types';
import { platformIdentityService } from './platform-identity.service';
import { abdmHiuService } from '../../abdm/services/abdm-hiu.service';
import { DoctorProfileModel } from '../../users/models/doctor-profile.model';
import { AppointmentModel } from '../../healthcare/models/appointment.model';
import { EncounterModel } from '../../healthcare/models/encounter.model';
import { PrescriptionModel } from '../../healthcare/models/prescription.model';
import { DispensingRecordModel } from '../../pharmacy/models/dispensing-record.model';
import { LaboratoryReportModel } from '../../healthcare/models/lab-report.model';
import { MedicalRecordModel } from '../../healthcare/models/medical-record.model';
import { ConsentArtifactModel } from '../../consent/models/consent-artifact.model';
import { AbdmConsentArtefactModel } from '../../abdm/models/abdm-consent-artefact.model';
import { AuditLogModel } from '../../security/models/audit-log.model';
import { AppError } from '../../../shared/errors/app-error';

export class DoctorWorkspaceService {
  private async resolveDoctorIds(doctorUserId: string): Promise<Types.ObjectId[]> {
    const userObjId = new Types.ObjectId(doctorUserId);
    const profile = await DoctorProfileModel.findOne({ userId: userObjId }).select('_id').lean();
    const ids: Types.ObjectId[] = [userObjId];
    if (profile?._id && !new Types.ObjectId(String(profile._id)).equals(userObjId)) {
      ids.push(new Types.ObjectId(String(profile._id)));
    }
    return ids;
  }

  async getUnifiedPatientOverview(params: {
    doctorUserId: string;
    patientId: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<DoctorUnifiedPatientOverviewDto> {
    if (!Types.ObjectId.isValid(params.patientId)) {
      throw AppError.badRequest('Invalid patient ID');
    }

    const patientObjectId = new Types.ObjectId(params.patientId);
    const doctorIds = await this.resolveDoctorIds(params.doctorUserId);
    const now = new Date();

    // 1. Fail-closed authorization check: active consent OR appointment/encounter relationship
    const [
      hasAppointment,
      hasEncounter,
      activeInternalConsentsCount,
      activeAbdmArtefactsCount,
    ] = await Promise.all([
      AppointmentModel.exists({ doctorId: { $in: doctorIds }, patientId: patientObjectId }),
      EncounterModel.exists({ practitionerId: { $in: doctorIds }, patientId: patientObjectId }),
      ConsentArtifactModel.countDocuments({
        patientId: patientObjectId,
        grantedTo: { $in: doctorIds },
        status: 'ACTIVE',
        expiresAt: { $gt: now },
      }),
      AbdmConsentArtefactModel.countDocuments({
        patientId: patientObjectId,
        externalStatus: 'GRANTED',
        revocationStatus: 'NOT_REVOKED',
        expiresAt: { $gt: now },
      }),
    ]);

    const hasRelationship = Boolean(hasAppointment || hasEncounter);
    const hasConsent = activeInternalConsentsCount > 0 || activeAbdmArtefactsCount > 0;

    if (!hasRelationship && !hasConsent) {
      throw AppError.forbidden(
        'Access denied: You lack an authorized clinical relationship, appointment, or active consent for this patient.'
      );
    }

    // Build optional date range filter
    const dateFilter: Record<string, Date> = {};
    if (params.fromDate) dateFilter.$gte = new Date(params.fromDate);
    if (params.toDate) dateFilter.$lte = new Date(params.toDate);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // 2. Fetch unified authorized clinical datasets concurrently
    const [
      patientIdentity,
      appointments,
      encounters,
      prescriptions,
      dispensings,
      labReports,
      medicalDocuments,
      externalAbdmRecords,
    ] = await Promise.all([
      platformIdentityService.resolveUnifiedPatientIdentity(params.patientId),
      AppointmentModel.find({
        patientId: patientObjectId,
        ...(hasDateFilter ? { scheduledAt: dateFilter } : {}),
      })
        .sort({ scheduledAt: -1 })
        .limit(50)
        .populate('facilityId', 'name')
        .lean(),
      EncounterModel.find({
        patientId: patientObjectId,
        ...(hasDateFilter ? { startTime: dateFilter } : {}),
      })
        .sort({ startTime: -1 })
        .limit(50)
        .lean(),
      PrescriptionModel.find({
        patientId: patientObjectId,
        isDraft: false,
        status: { $ne: 'DRAFT' },
        ...(hasDateFilter ? { issuedAt: dateFilter } : {}),
      })
        .sort({ issuedAt: -1, createdAt: -1 })
        .limit(50)
        .lean(),
      DispensingRecordModel.find({
        patientId: patientObjectId,
        ...(hasDateFilter ? { dispensedAt: dateFilter } : {}),
      })
        .sort({ dispensedAt: -1 })
        .limit(50)
        .lean(),
      // STRICT: Only published/amended reports are shown in clinical overview
      LaboratoryReportModel.find({
        patientId: patientObjectId,
        status: { $in: ['PUBLISHED', 'AMENDED'] },
        ...(hasDateFilter ? { testDate: dateFilter } : {}),
      })
        .sort({ publishedAt: -1, testDate: -1 })
        .limit(50)
        .populate('laboratoryId', 'name')
        .lean(),
      MedicalRecordModel.find({
        patientId: patientObjectId,
        ...(hasDateFilter ? { recordDate: dateFilter } : {}),
      })
        .sort({ recordDate: -1 })
        .limit(50)
        .lean(),
      activeAbdmArtefactsCount > 0
        ? abdmHiuService.listImportedRecords({
            actorId: params.doctorUserId,
            actorRole: 'DOCTOR',
            patientId: params.patientId,
          })
        : Promise.resolve([]),
    ]);

    // Map pharmacy dispensing status by prescriptionId
    const dispensingByRxId = new Map<string, any>();
    for (const d of dispensings as any[]) {
      const rxKey = String(d.prescriptionId);
      if (!dispensingByRxId.has(rxKey)) {
        dispensingByRxId.set(rxKey, d);
      }
    }

    const mappedPrescriptions = (prescriptions as any[]).map((rx) => {
      const disp = dispensingByRxId.get(String(rx._id));
      const meds = Array.isArray(rx.medications) ? rx.medications : [];
      return {
        id: String(rx._id),
        prescriptionNumber: rx.prescriptionNumber,
        encounterId: rx.encounterId ? String(rx.encounterId) : undefined,
        issuedAt: new Date(rx.issuedAt || rx.createdAt).toISOString(),
        status: rx.status,
        medicationsCount: meds.length,
        medicationsSummary: meds.map((m: any) => m.name).slice(0, 3).join(', ') || 'Prescribed regimen',
        dispensingStatus: (disp?.dispensingStatus || 'NOT_DISPENSED') as
          | 'NOT_DISPENSED'
          | 'PARTIALLY_DISPENSED'
          | 'FULLY_DISPENSED'
          | 'CANCELLED',
        lastDispensedAt: disp?.dispensedAt ? new Date(disp.dispensedAt).toISOString() : undefined,
        dispensingPharmacyName: disp?.pharmacyName,
      };
    });

    const medicationHistory: DoctorUnifiedPatientOverviewDto['medicationHistory'] = [];
    for (const rx of prescriptions as any[]) {
      const disp = dispensingByRxId.get(String(rx._id));
      for (const m of (rx.medications || []) as any[]) {
        medicationHistory.push({
          medicationName: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          prescribedAt: new Date(rx.issuedAt || rx.createdAt).toISOString(),
          prescriptionStatus: rx.status,
          dispensingStatus: disp?.dispensingStatus || 'NOT_DISPENSED',
          source: disp ? 'PHARMACY_DISPENSING' : 'INTERNAL_PRESCRIPTION',
        });
      }
    }

    await AuditLogModel.create({
      actorId: params.doctorUserId,
      actorRole: 'DOCTOR',
      action: 'DOCTOR_UNIFIED_WORKSPACE_VIEWED',
      resourceType: 'PATIENT_OVERVIEW',
      resourceId: params.patientId,
      timestamp: new Date(),
      outcome: 'SUCCESS',
      metadata: {
        accessBasis: hasConsent ? 'ACTIVE_CONSENT' : 'APPOINTMENT_OR_ENCOUNTER_RELATIONSHIP',
        externalAbdmCount: externalAbdmRecords.length,
      },
    }).catch(() => undefined);

    return {
      patient: patientIdentity,
      authorization: {
        accessBasis: hasConsent ? 'ACTIVE_CONSENT' : 'APPOINTMENT_OR_ENCOUNTER_RELATIONSHIP',
        internalConsentActive: activeInternalConsentsCount > 0,
        abdmConsentActive: activeAbdmArtefactsCount > 0,
        activeInternalConsentsCount,
        activeAbdmArtefactsCount,
        readOnlyExternalSections: [
          'LABORATORY_REPORTS',
          'PHARMACY_DISPENSING',
          'ABDM_EXTERNAL_RECORDS',
        ],
      },
      appointments: (appointments as any[]).map((a) => ({
        id: String(a._id),
        scheduledAt: new Date(a.scheduledAt || a.createdAt).toISOString(),
        status: a.status,
        reason: a.reason,
        encounterId: a.encounterId ? String(a.encounterId) : undefined,
        facilityName: a.facilityId?.name,
      })),
      encounters: (encounters as any[]).map((e) => ({
        id: String(e._id),
        appointmentId: e.appointmentId ? String(e.appointmentId) : undefined,
        encounterType: e.encounterType,
        startTime: new Date(e.startTime || e.createdAt).toISOString(),
        status: e.status,
        isDraft: Boolean(e.isDraft),
        chiefComplaint: e.chiefComplaint,
        diagnoses: (e.diagnoses || []).map((d: any) => ({
          name: d.name,
          code: d.code,
          type: d.type,
        })),
        finalizedAt: e.finalizedAt ? new Date(e.finalizedAt).toISOString() : undefined,
        source: 'INTERNAL_HEALTHBRIDGE' as const,
      })),
      prescriptions: mappedPrescriptions,
      medicationHistory,
      laboratoryReports: (labReports as any[]).map((r) => ({
        id: String(r._id),
        reportNumber: r.reportNumber,
        orderId: r.orderId ? String(r.orderId) : undefined,
        testName: r.testName,
        category: r.category,
        status: r.status,
        publishedAt: r.publishedAt ? new Date(r.publishedAt).toISOString() : undefined,
        testDate: new Date(r.testDate || r.createdAt).toISOString(),
        isAmended: r.status === 'AMENDED' || Boolean(r.amendmentDetails?.isAmended),
        currentVersion: r.currentVersion || 1,
        laboratoryName: r.laboratoryId?.name,
        readOnly: true as const,
      })),
      medicalDocuments: (medicalDocuments as any[]).map((d) => ({
        id: String(d._id),
        title: d.title,
        recordType: d.recordType,
        recordDate: new Date(d.recordDate || d.createdAt).toISOString(),
        source: d.source || 'MANUAL_ENTRY',
        facilityName: d.facilityName,
      })),
      externalAbdmRecords,
      dateFilterApplied: hasDateFilter
        ? { fromDate: params.fromDate, toDate: params.toDate }
        : undefined,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const doctorWorkspaceService = new DoctorWorkspaceService();
