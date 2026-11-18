/**
 * HealthBridge India — Unified Patient Health Record Timeline Service (Day 8 Task 01)
 *
 * Builds an authoritative, chronologically sorted, server-side paginated view across:
 *   - Patient Registration (`User`)
 *   - Appointments (`Appointment`)
 *   - Finalized Clinical Encounters & Recorded Diagnoses (`Encounter` — drafts strictly excluded)
 *   - Issued Prescriptions (`Prescription` — drafts strictly excluded)
 *   - Pharmacy Dispensing (`DispensingRecord`)
 *   - Lab Orders (`LaboratoryOrder`), Samples (`LabSample`), Published/Amended Reports (`LaboratoryReport` — drafts/unapproved strictly excluded)
 *   - Uploaded Medical Documents (`MedicalRecord`)
 *   - Internal Consents (`ConsentArtifact`) & ABDM Consents (`AbdmConsentArtefact`)
 *   - Verified ABDM External Imported Records (`AbdmImportedRecord`)
 *
 * SECURITY & INTEGRITY INVARIANTS:
 *   - Strictly derives patient ownership from JWT for `PATIENT` actors.
 *   - Never exposes unpublished/draft encounters, draft prescriptions, or unapproved lab reports.
 *   - Never invents synthetic medical events.
 *   - Preserves provenance (`INTERNAL_HEALTHBRIDGE` vs `ABDM_EXTERNAL_IMPORT`, `isMocked`, `isAmended`).
 */

import { Types } from 'mongoose';
import type {
  PatientTimelineItemDto,
  UnifiedPatientTimelineQueryDto,
  PatientTimelineResponseDto,
  UnifiedTimelineSourceModule,
} from '@healthbridge/shared-types';
import { UserModel } from '../../users/models/user.model';
import { AppointmentModel } from '../../healthcare/models/appointment.model';
import { EncounterModel } from '../../healthcare/models/encounter.model';
import { PrescriptionModel } from '../../healthcare/models/prescription.model';
import { DispensingRecordModel } from '../../pharmacy/models/dispensing-record.model';
import { LaboratoryOrderModel } from '../../healthcare/models/lab-order.model';
import { LabSampleModel } from '../../laboratory/models/lab-sample.model';
import { LaboratoryReportModel } from '../../healthcare/models/lab-report.model';
import { MedicalRecordModel } from '../../healthcare/models/medical-record.model';
import { ConsentArtifactModel } from '../../consent/models/consent-artifact.model';
import { AbdmConsentArtefactModel } from '../../abdm/models/abdm-consent-artefact.model';
import { AbdmImportedRecordModel } from '../../abdm/models/abdm-imported-record.model';
import { AppError } from '../../../shared/errors/app-error';

export class PatientTimelineService {
  async getUnifiedTimeline(
    patientId: string,
    query: UnifiedPatientTimelineQueryDto = {}
  ): Promise<PatientTimelineResponseDto> {
    if (!Types.ObjectId.isValid(patientId)) {
      throw AppError.badRequest('Invalid patient ID');
    }

    const patientObjectId = new Types.ObjectId(patientId);
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const fromTime = query.fromDate ? new Date(query.fromDate).getTime() : null;
    const toTime = query.toDate ? new Date(query.toDate).getTime() : null;
    const searchLower = query.search?.trim().toLowerCase() || '';

    const [
      patientUser,
      appointments,
      encounters,
      prescriptions,
      dispensings,
      labOrders,
      labSamples,
      labReports,
      medicalRecords,
      internalConsents,
      abdmConsents,
      importedRecords,
    ] = await Promise.all([
      UserModel.findById(patientObjectId).select('name createdAt').lean(),
      AppointmentModel.find({ patientId: patientObjectId })
        .sort({ scheduledAt: -1 })
        .limit(100)
        .populate('doctorId', 'name')
        .populate('facilityId', 'name')
        .lean(),
      // STRICT: Never expose draft clinical encounters to patient timeline
      EncounterModel.find({
        patientId: patientObjectId,
        isDraft: false,
        status: { $in: ['COMPLETED', 'FINALIZED'] },
      })
        .sort({ startTime: -1 })
        .limit(100)
        .populate('practitionerId', 'name')
        .populate('facilityId', 'name')
        .lean(),
      // STRICT: Never expose draft prescriptions to patient timeline
      PrescriptionModel.find({
        patientId: patientObjectId,
        isDraft: false,
        status: { $ne: 'DRAFT' },
      })
        .sort({ issuedAt: -1, createdAt: -1 })
        .limit(100)
        .populate('doctorId', 'name')
        .lean(),
      DispensingRecordModel.find({ patientId: patientObjectId })
        .sort({ dispensedAt: -1 })
        .limit(100)
        .lean(),
      LaboratoryOrderModel.find({ patientId: patientObjectId })
        .sort({ orderedAt: -1 })
        .limit(100)
        .lean(),
      LabSampleModel.find({ patientId: patientObjectId })
        .sort({ collectedAt: -1, createdAt: -1 })
        .limit(100)
        .lean(),
      // STRICT: Only PUBLISHED or AMENDED laboratory reports are visible to patients
      LaboratoryReportModel.find({
        patientId: patientObjectId,
        status: { $in: ['PUBLISHED', 'AMENDED'] },
      })
        .sort({ publishedAt: -1, testDate: -1 })
        .limit(100)
        .lean(),
      MedicalRecordModel.find({ patientId: patientObjectId })
        .sort({ recordDate: -1, createdAt: -1 })
        .limit(100)
        .lean(),
      ConsentArtifactModel.find({ patientId: patientObjectId })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      AbdmConsentArtefactModel.find({ patientId: patientObjectId })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      AbdmImportedRecordModel.find({
        patientId: patientObjectId,
        reviewStatus: { $in: ['IMPORTED_VERIFIED', 'APPROVED_AFTER_REVIEW'] },
      })
        .sort({ importedAt: -1 })
        .limit(100)
        .lean(),
    ]);

    const items: PatientTimelineItemDto[] = [];

    if (patientUser?.createdAt) {
      items.push({
        id: `reg-${patientUser._id}`,
        eventType: 'PATIENT_REGISTERED',
        occurredAt: new Date(patientUser.createdAt).toISOString(),
        timezone: 'UTC',
        sourceModule: 'PATIENT',
        title: 'HealthBridge Patient Account Registered',
        summary: 'Authoritative internal patient health record profile created.',
        status: 'ACTIVE',
        recordReference: { entityType: 'User', entityId: String(patientUser._id) },
        authorizedAction: { label: 'View Profile', href: '/patient/profile' },
        provenance: { origin: 'INTERNAL_HEALTHBRIDGE', readOnly: true },
      });
    }

    for (const apt of appointments as any[]) {
      const doctorName = apt.doctorId?.name || 'Attending Clinician';
      const isCompleted = apt.status === 'COMPLETED';
      items.push({
        id: `apt-${apt._id}`,
        eventType: isCompleted ? 'APPOINTMENT_COMPLETED' : 'APPOINTMENT_BOOKED',
        occurredAt: new Date(apt.scheduledAt || apt.createdAt).toISOString(),
        timezone: 'UTC',
        sourceModule: 'APPOINTMENTS',
        title: isCompleted
          ? `Consultation Completed with ${doctorName}`
          : `Appointment Scheduled with ${doctorName}`,
        summary: apt.reason || `Appointment status: ${apt.status}`,
        status: apt.status,
        recordReference: { entityType: 'Appointment', entityId: String(apt._id) },
        authorizedAction: { label: 'View Appointments', href: '/patient/appointments' },
        provenance: {
          origin: 'INTERNAL_HEALTHBRIDGE',
          sourceOrganization: apt.facilityId?.name,
          actorName: doctorName,
          readOnly: true,
        },
      });
    }

    for (const enc of encounters as any[]) {
      const doctorName = enc.practitionerId?.name || 'Attending Clinician';
      items.push({
        id: `enc-${enc._id}`,
        eventType: 'CLINICAL_ENCOUNTER',
        occurredAt: new Date(enc.finalizedAt || enc.startTime || enc.createdAt).toISOString(),
        timezone: 'UTC',
        sourceModule: 'ENCOUNTERS',
        title: `${enc.encounterType || 'Clinical'} Encounter Finalized`,
        summary: enc.chiefComplaint || 'Clinical consultation documented and finalized.',
        status: enc.status,
        recordReference: { entityType: 'Encounter', entityId: String(enc._id) },
        authorizedAction: { label: 'View Records', href: '/patient/records' },
        provenance: {
          origin: 'INTERNAL_HEALTHBRIDGE',
          sourceOrganization: enc.facilityId?.name,
          actorName: doctorName,
          readOnly: true,
        },
      });

      if (Array.isArray(enc.diagnoses) && enc.diagnoses.length > 0) {
        const primary = enc.diagnoses[0];
        items.push({
          id: `diag-${enc._id}`,
          eventType: 'DIAGNOSIS_RECORDED',
          occurredAt: new Date(enc.finalizedAt || enc.startTime || enc.createdAt).toISOString(),
          timezone: 'UTC',
          sourceModule: 'ENCOUNTERS',
          title: `Diagnosis Recorded by ${doctorName}`,
          summary: primary.code ? `${primary.name} (${primary.code})` : primary.name,
          status: primary.clinicalStatus || 'ACTIVE',
          recordReference: { entityType: 'Encounter', entityId: String(enc._id) },
          provenance: {
            origin: 'INTERNAL_HEALTHBRIDGE',
            actorName: doctorName,
            readOnly: true,
          },
        });
      }
    }

    for (const rx of prescriptions as any[]) {
      const doctorName = rx.doctorId?.name || 'Prescribing Clinician';
      const medCount = Array.isArray(rx.medications) ? rx.medications.length : 0;
      items.push({
        id: `rx-${rx._id}`,
        eventType: 'PRESCRIPTION_ISSUED',
        occurredAt: new Date(rx.issuedAt || rx.createdAt).toISOString(),
        timezone: 'UTC',
        sourceModule: 'PRESCRIPTIONS',
        title: `Prescription Issued (${rx.prescriptionNumber || 'Rx'})`,
        summary: `${medCount} medication(s) prescribed by ${doctorName}.`,
        status: rx.status,
        recordReference: {
          entityType: 'Prescription',
          entityId: String(rx._id),
          referenceNumber: rx.prescriptionNumber,
        },
        authorizedAction: { label: 'View Prescriptions', href: '/patient/prescriptions' },
        provenance: {
          origin: 'INTERNAL_HEALTHBRIDGE',
          actorName: doctorName,
          readOnly: true,
        },
      });
    }

    for (const disp of dispensings as any[]) {
      items.push({
        id: `disp-${disp._id}`,
        eventType: 'PRESCRIPTION_DISPENSED',
        occurredAt: new Date(disp.dispensedAt || disp.createdAt).toISOString(),
        timezone: 'UTC',
        sourceModule: 'PHARMACY',
        title: `Medication Dispensed (${disp.dispensingNumber})`,
        summary: `${disp.totalItems || 0} item(s) dispensed by ${disp.pharmacyName}.`,
        status: disp.dispensingStatus,
        recordReference: {
          entityType: 'DispensingRecord',
          entityId: String(disp._id),
          referenceNumber: disp.dispensingNumber,
        },
        authorizedAction: { label: 'View Orders', href: '/patient/orders' },
        provenance: {
          origin: 'INTERNAL_HEALTHBRIDGE',
          sourceOrganization: disp.pharmacyName,
          actorName: disp.dispenserName,
          readOnly: true,
        },
      });
    }

    for (const order of labOrders as any[]) {
      items.push({
        id: `labord-${order._id}`,
        eventType: 'LAB_ORDER_CREATED',
        occurredAt: new Date(order.orderedAt || order.createdAt).toISOString(),
        timezone: 'UTC',
        sourceModule: 'LABORATORY',
        title: `Laboratory Order Created (${order.orderNumber})`,
        summary: `${(order.tests || []).length} diagnostic test(s) ordered.`,
        status: order.status,
        recordReference: {
          entityType: 'LaboratoryOrder',
          entityId: String(order._id),
          referenceNumber: order.orderNumber,
        },
        authorizedAction: { label: 'View Lab Orders', href: '/patient/lab-orders' },
        provenance: { origin: 'INTERNAL_HEALTHBRIDGE', readOnly: true },
      });
    }

    for (const sample of labSamples as any[]) {
      items.push({
        id: `samp-${sample._id}`,
        eventType: 'SAMPLE_COLLECTED',
        occurredAt: new Date(sample.collectedAt || sample.createdAt).toISOString(),
        timezone: 'UTC',
        sourceModule: 'LABORATORY',
        title: `Diagnostic Sample Collected (${sample.sampleBarcode || sample.specimenType || 'Sample'})`,
        summary: `Specimen status: ${sample.status}`,
        status: sample.status,
        recordReference: {
          entityType: 'LabSample',
          entityId: String(sample._id),
          referenceNumber: sample.sampleBarcode,
        },
        provenance: { origin: 'INTERNAL_HEALTHBRIDGE', readOnly: true },
      });
    }

    for (const rep of labReports as any[]) {
      const isAmended = rep.status === 'AMENDED' || Boolean(rep.amendmentDetails?.isAmended);
      items.push({
        id: `rep-${rep._id}`,
        eventType: isAmended ? 'LAB_REPORT_AMENDED' : 'LAB_REPORT_PUBLISHED',
        occurredAt: new Date(rep.publishedAt || rep.testDate || rep.createdAt).toISOString(),
        timezone: 'UTC',
        sourceModule: 'LABORATORY',
        title: isAmended
          ? `Amended Laboratory Report Published (${rep.testName})`
          : `Laboratory Report Published (${rep.testName})`,
        summary: `Report ${rep.reportNumber} (v${rep.currentVersion || 1}) ready for viewing.`,
        status: rep.status,
        recordReference: {
          entityType: 'LaboratoryReport',
          entityId: String(rep._id),
          referenceNumber: rep.reportNumber,
        },
        authorizedAction: { label: 'View Lab Reports', href: '/patient/lab-reports' },
        provenance: {
          origin: 'INTERNAL_HEALTHBRIDGE',
          isAmended,
          readOnly: true,
        },
      });
    }

    for (const rec of medicalRecords as any[]) {
      items.push({
        id: `doc-${rec._id}`,
        eventType: 'DOCUMENT_UPLOADED',
        occurredAt: new Date(rec.recordDate || rec.createdAt).toISOString(),
        timezone: 'UTC',
        sourceModule: 'RECORDS',
        title: rec.title || 'Medical Document Uploaded',
        summary: `${rec.recordType} document (${rec.source || 'MANUAL_ENTRY'}).`,
        status: rec.verificationStatus || 'RECORDED',
        recordReference: { entityType: 'MedicalRecord', entityId: String(rec._id) },
        authorizedAction: { label: 'View Records', href: '/patient/records' },
        provenance: {
          origin: 'INTERNAL_HEALTHBRIDGE',
          sourceOrganization: rec.facilityName,
          actorName: rec.doctorName,
          readOnly: false,
        },
      });
    }

    for (const c of internalConsents as any[]) {
      const isRevoked = c.status === 'REVOKED';
      items.push({
        id: `cons-int-${c._id}`,
        eventType: isRevoked ? 'CONSENT_REVOKED' : 'CONSENT_GRANTED',
        occurredAt: new Date(c.revokedAt || c.grantedAt || c.createdAt).toISOString(),
        timezone: 'UTC',
        sourceModule: 'CONSENT',
        title: isRevoked ? 'Internal HealthBridge Consent Revoked' : 'Internal HealthBridge Consent Granted',
        summary: `Purpose: ${c.purpose || 'CARE_MANAGEMENT'}`,
        status: c.status,
        recordReference: { entityType: 'ConsentArtifact', entityId: String(c._id) },
        authorizedAction: { label: 'Manage Consents', href: '/patient/consent' },
        provenance: { origin: 'INTERNAL_HEALTHBRIDGE', readOnly: true },
      });
    }

    for (const ac of abdmConsents as any[]) {
      const isRevoked =
        ac.externalStatus === 'REVOKED' || ac.revocationStatus !== 'NOT_REVOKED';
      items.push({
        id: `cons-abdm-${ac._id}`,
        eventType: isRevoked ? 'CONSENT_REVOKED' : 'CONSENT_GRANTED',
        occurredAt: new Date(ac.revokedAt || ac.grantedAt || ac.createdAt).toISOString(),
        timezone: 'UTC',
        sourceModule: 'ABDM',
        title: isRevoked
          ? `ABDM HIE-CM Consent Revoked (${ac.externalConsentId})`
          : `ABDM HIE-CM Consent Artefact Active (${ac.externalConsentId})`,
        summary: `HIU: ${ac.hiuId} • Categories: ${(ac.hiTypes || []).join(', ')}`,
        status: ac.externalStatus,
        recordReference: {
          entityType: 'AbdmConsentArtefact',
          entityId: String(ac._id),
          referenceNumber: ac.externalConsentId,
        },
        authorizedAction: { label: 'View ABDM Artefacts', href: '/patient/consent/artefacts' },
        provenance: {
          origin: 'ABDM_EXTERNAL_IMPORT',
          sourceOrganization: ac.hiuId,
          isMocked: ac.isMocked,
          readOnly: true,
        },
      });
    }

    for (const imp of importedRecords as any[]) {
      items.push({
        id: `abdm-imp-${imp._id}`,
        eventType: 'EXTERNAL_RECORD_IMPORTED',
        occurredAt: new Date(imp.importedAt || imp.createdAt).toISOString(),
        timezone: 'UTC',
        sourceModule: 'ABDM',
        title: `External ABDM Record Imported: ${imp.summary?.title || imp.hiType}`,
        summary: `From ${imp.sourceOrganizationName} (${imp.hiType}) under consent ${imp.externalConsentId}.`,
        status: imp.reviewStatus,
        recordReference: {
          entityType: 'AbdmImportedRecord',
          entityId: String(imp._id),
          referenceNumber: imp.internalImportRef,
        },
        authorizedAction: { label: 'View ABDM Records', href: '/patient/abdm/health-records' },
        provenance: {
          origin: 'ABDM_EXTERNAL_IMPORT',
          sourceOrganization: imp.sourceOrganizationName,
          isMocked: imp.isMocked,
          isAmended: imp.isAmended,
          readOnly: true,
        },
      });
    }

    // Tally available module counts before pagination/filtering
    const availableCountsByModule: Partial<Record<UnifiedTimelineSourceModule, number>> = {};
    for (const item of items) {
      availableCountsByModule[item.sourceModule] =
        (availableCountsByModule[item.sourceModule] || 0) + 1;
    }

    // Filter
    const filtered = items.filter((item) => {
      if (query.eventType && item.eventType !== query.eventType) return false;
      if (query.sourceModule && item.sourceModule !== query.sourceModule) return false;
      const ts = new Date(item.occurredAt).getTime();
      if (fromTime !== null && ts < fromTime) return false;
      if (toTime !== null && ts > toTime) return false;
      if (searchLower) {
        const hay =
          `${item.title} ${item.summary} ${item.sourceModule} ${item.eventType} ${item.recordReference.referenceNumber || ''} ${item.provenance.sourceOrganization || ''}`.toLowerCase();
        if (!hay.includes(searchLower)) return false;
      }
      return true;
    });

    // Strict chronological descending order (newest first)
    filtered.sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const paged = filtered.slice(offset, offset + limit);

    return {
      patientId,
      items: paged,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      availableCountsByModule,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const patientTimelineService = new PatientTimelineService();
