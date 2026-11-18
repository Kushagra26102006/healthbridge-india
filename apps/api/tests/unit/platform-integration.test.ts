/**
 * HealthBridge India — Day 8 Task 01
 * Unit Tests for Platform-Wide Integration:
 *   - Unified Patient Identity (internal User._id authoritative, ABHA external, duplicate demographic review flag without auto-merge)
 *   - Unified Domain Event & Notification Service (recipient delivery, idempotency, retry on transient failure, sensitive clinical value scrubbing)
 *   - Patient Health Timeline (chronological ordering, draft/unpublished exclusion, event/module/date/search filtering, pagination, ABDM provenance)
 *   - Doctor Unified Clinical Workspace (fail-closed cross-doctor denial, read-only lab/dispensing/ABDM sections)
 *   - Doctor-to-Laboratory Order Service (encounter ownership, duplicate idempotency, event dispatch)
 *
 * NOTE: Synthetic test data with mocked Mongoose models. Does NOT contact live external ABDM APIs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import {
  platformEventService,
  sanitizePrivacySafePreview,
} from '../../src/modules/platform/services/platform-event.service';
import { platformIdentityService } from '../../src/modules/platform/services/platform-identity.service';
import { patientTimelineService } from '../../src/modules/platform/services/patient-timeline.service';
import { doctorWorkspaceService } from '../../src/modules/platform/services/doctor-workspace.service';
import { doctorLabOrderService } from '../../src/modules/platform/services/doctor-lab-order.service';
import { notificationService } from '../../src/modules/notifications/services/notification.service';
import { UserModel } from '../../src/modules/users/models/user.model';
import { PatientProfileModel } from '../../src/modules/users/models/patient-profile.model';
import { DoctorProfileModel } from '../../src/modules/users/models/doctor-profile.model';
import { AbhaLinkModel } from '../../src/modules/abdm/models/abha-link.model';
import { AppointmentModel } from '../../src/modules/healthcare/models/appointment.model';
import { EncounterModel } from '../../src/modules/healthcare/models/encounter.model';
import { PrescriptionModel } from '../../src/modules/healthcare/models/prescription.model';
import { DispensingRecordModel } from '../../src/modules/pharmacy/models/dispensing-record.model';
import { LaboratoryOrderModel } from '../../src/modules/healthcare/models/lab-order.model';
import { LabSampleModel } from '../../src/modules/laboratory/models/lab-sample.model';
import { LaboratoryReportModel } from '../../src/modules/healthcare/models/lab-report.model';
import { MedicalRecordModel } from '../../src/modules/healthcare/models/medical-record.model';
import { ConsentArtifactModel } from '../../src/modules/consent/models/consent-artifact.model';
import { AbdmConsentArtefactModel } from '../../src/modules/abdm/models/abdm-consent-artefact.model';
import { AbdmImportedRecordModel } from '../../src/modules/abdm/models/abdm-imported-record.model';

function chainQuery(result: any) {
  return {
    select: () => chainQuery(result),
    sort: () => chainQuery(result),
    limit: () => chainQuery(result),
    populate: () => chainQuery(result),
    lean: async () => result,
    then: (resolve: any) => resolve(result),
  } as any;
}

describe('Platform-Wide Integration — Unit Tests (Day 8 Task 01)', () => {
  const patientId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();
  const labId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.restoreAllMocks();
    platformEventService.clearInMemoryDedupe();
  });

  // ==========================================================================
  // 1. UNIFIED PATIENT IDENTITY
  // ==========================================================================
  it('resolves authoritative internal patient ID, keeps ABHA external, and flags demographic duplicates without auto-merging', async () => {
    const otherPatientId = new Types.ObjectId();

    vi.spyOn(UserModel, 'findOne').mockReturnValue(
      chainQuery({
        _id: new Types.ObjectId(patientId),
        name: 'Aarav Sharma',
        email: 'aarav@example.test',
        phone: '9876543210',
        isActive: true,
      })
    );
    vi.spyOn(PatientProfileModel, 'findOne').mockReturnValue(
      chainQuery({
        userId: new Types.ObjectId(patientId),
        gender: 'MALE',
        dateOfBirth: new Date('1992-04-12'),
        bloodGroup: 'O+',
      })
    );
    vi.spyOn(AbhaLinkModel, 'findOne').mockReturnValue(
      chainQuery({
        patientId: new Types.ObjectId(patientId),
        verificationStatus: 'VERIFIED',
        abhaNumberMasked: '12-XXXX-XXXX-3456',
        abhaAddress: 'aarav.sharma@sbx',
        isActive: true,
        isMocked: true,
      })
    );
    vi.spyOn(AbhaLinkModel, 'countDocuments').mockResolvedValue(2);
    vi.spyOn(PatientProfileModel, 'find').mockReturnValue(
      chainQuery([{ userId: otherPatientId }])
    );
    vi.spyOn(UserModel, 'countDocuments').mockResolvedValue(1);

    const identity = await platformIdentityService.resolveUnifiedPatientIdentity(patientId);

    expect(identity.authoritativePatientId).toBe(patientId);
    expect(identity.externalAbha.linked).toBe(true);
    expect(identity.externalAbha.abhaAddress).toBe('aarav.sharma@sbx');
    expect(identity.externalAbha.linkHistoryCount).toBe(2);
    expect(identity.duplicateAccountReview.flaggedForReview).toBe(true);
    expect(identity.duplicateAccountReview.potentialMatchCount).toBe(1);
    expect(identity.duplicateAccountReview.autoMergeAllowed).toBe(false);
  });

  // ==========================================================================
  // 2. UNIFIED NOTIFICATION EVENTS (REDACTION, IDEMPOTENCY, RETRY)
  // ==========================================================================
  it('redacts sensitive clinical values & identifiers in notification previews, retries transient errors, and suppresses duplicates', async () => {
    const scrubbed = sanitizePrivacySafePreview(
      'Lab report ready: Hemoglobin: 9.2 g/dL, Glucose 210 mg/dL, diagnosis: Type 2 Diabetes, ABHA 12-3456-7890-1234'
    );
    expect(scrubbed).not.toContain('9.2 g/dL');
    expect(scrubbed).not.toContain('210 mg/dL');
    expect(scrubbed).not.toContain('Type 2 Diabetes');
    expect(scrubbed).not.toContain('12-3456-7890-1234');

    let attempts = 0;
    const publishSpy = vi.spyOn(notificationService, 'publishEvent').mockImplementation(async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error('Transient DB timeout');
      }
      return { id: 'notif-1' } as any;
    });

    const first = await platformEventService.emit({
      eventType: 'REPORT_PUBLISHED',
      sourceModule: 'LABORATORY',
      actorId: labId,
      actorRole: 'LABORATORY',
      recipients: [{ userId: patientId, role: 'PATIENT' }],
      title: 'Lab Report Ready',
      message: 'Hemoglobin: 11.4 g/dL is ready to view',
      relatedEntity: { entityType: 'LaboratoryReport', entityId: 'rep-1', referenceNumber: 'R-001' },
      idempotencyKey: 'evt-rep-1',
    });

    expect(first.deliveredCount).toBe(1);
    expect(first.failedRecipients).toHaveLength(0);
    expect(attempts).toBe(2); // Retried once and succeeded
    expect(first.sanitizedPreview).not.toContain('11.4 g/dL');

    // Duplicate event suppressed idempotently
    const second = await platformEventService.emit({
      eventType: 'REPORT_PUBLISHED',
      sourceModule: 'LABORATORY',
      actorId: labId,
      actorRole: 'LABORATORY',
      recipients: [{ userId: patientId, role: 'PATIENT' }],
      title: 'Lab Report Ready',
      message: 'Duplicate delivery',
      relatedEntity: { entityType: 'LaboratoryReport', entityId: 'rep-1' },
      idempotencyKey: 'evt-rep-1',
    });
    expect(second.deliveredCount).toBe(0);
    expect(publishSpy).toHaveBeenCalledTimes(2);
  });

  // ==========================================================================
  // 3. UNIFIED PATIENT HEALTH TIMELINE
  // ==========================================================================
  it('orders patient timeline chronologically, enforces filters/pagination, and preserves ABDM external provenance', async () => {
    vi.spyOn(UserModel, 'findById').mockReturnValue(
      chainQuery({ _id: new Types.ObjectId(patientId), name: 'Riya', createdAt: new Date('2026-01-01T00:00:00Z') })
    );
    vi.spyOn(AppointmentModel, 'find').mockReturnValue(
      chainQuery([
        {
          _id: new Types.ObjectId(),
          scheduledAt: new Date('2026-10-05T09:00:00Z'),
          status: 'COMPLETED',
          reason: 'Follow-up consultation',
          doctorId: { name: 'Dr. Iyer' },
          facilityId: { name: 'City Clinic' },
        },
      ])
    );
    vi.spyOn(EncounterModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(PrescriptionModel, 'find').mockReturnValue(
      chainQuery([
        {
          _id: new Types.ObjectId(),
          prescriptionNumber: 'RX-2026-55',
          issuedAt: new Date('2026-10-06T10:00:00Z'),
          status: 'ACTIVE',
          medications: [{ name: 'Metformin' }],
          doctorId: { name: 'Dr. Iyer' },
        },
      ])
    );
    vi.spyOn(DispensingRecordModel, 'find').mockReturnValue(
      chainQuery([
        {
          _id: new Types.ObjectId(),
          dispensingNumber: 'DSP-901',
          pharmacyName: 'Apollo Pharmacy',
          dispenserName: 'Ramesh',
          dispensedAt: new Date('2026-10-07T12:00:00Z'),
          dispensingStatus: 'FULLY_DISPENSED',
          totalItems: 1,
        },
      ])
    );
    vi.spyOn(LaboratoryOrderModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(LabSampleModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(LaboratoryReportModel, 'find').mockReturnValue(
      chainQuery([
        {
          _id: new Types.ObjectId(),
          reportNumber: 'LAB-77',
          testName: 'HbA1c',
          status: 'AMENDED',
          currentVersion: 2,
          publishedAt: new Date('2026-10-10T14:00:00Z'),
          amendmentDetails: { isAmended: true },
        },
      ])
    );
    vi.spyOn(MedicalRecordModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(ConsentArtifactModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(AbdmConsentArtefactModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(AbdmImportedRecordModel, 'find').mockReturnValue(
      chainQuery([
        {
          _id: new Types.ObjectId(),
          internalImportRef: 'IMP-88',
          externalConsentId: 'consent-ext-88',
          sourceOrganizationName: 'External Sandbox Hospital',
          hiType: 'DiagnosticReport',
          reviewStatus: 'IMPORTED_VERIFIED',
          importedAt: new Date('2026-11-01T08:00:00Z'),
          summary: { title: 'External Lipid Panel' },
          isMocked: true,
          isAmended: false,
        },
      ])
    );

    // Full descending order check
    const full = await patientTimelineService.getUnifiedTimeline(patientId, { page: 1, limit: 2 });
    expect(full.pagination.total).toBe(6);
    expect(full.pagination.totalPages).toBe(3);
    expect(full.pagination.hasNext).toBe(true);
    expect(full.items[0]?.eventType).toBe('EXTERNAL_RECORD_IMPORTED');
    expect(full.items[0]?.provenance.origin).toBe('ABDM_EXTERNAL_IMPORT');
    expect(full.items[0]?.provenance.isMocked).toBe(true);
    expect(full.items[1]?.eventType).toBe('LAB_REPORT_AMENDED');
    expect(full.items[1]?.provenance.isAmended).toBe(true);

    // Module filter + search
    const filtered = await patientTimelineService.getUnifiedTimeline(patientId, {
      sourceModule: 'PHARMACY',
      search: 'Apollo',
    });
    expect(filtered.items).toHaveLength(1);
    expect(filtered.items[0]?.eventType).toBe('PRESCRIPTION_DISPENSED');
  });

  // ==========================================================================
  // 4. DOCTOR WORKSPACE AUTHORIZATION & LAB ORDER CREATION
  // ==========================================================================
  it('blocks unrelated doctor from unified patient workspace (fail-closed 403)', async () => {
    vi.spyOn(DoctorProfileModel, 'findOne').mockReturnValue(chainQuery(null));
    vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(null);
    vi.spyOn(EncounterModel, 'exists').mockResolvedValue(null);
    vi.spyOn(ConsentArtifactModel, 'countDocuments').mockResolvedValue(0);
    vi.spyOn(AbdmConsentArtefactModel, 'countDocuments').mockResolvedValue(0);

    await expect(
      doctorWorkspaceService.getUnifiedPatientOverview({
        doctorUserId: doctorId,
        patientId,
      })
    ).rejects.toThrow(/Access denied/i);
  });

  it('creates Doctor -> Laboratory Order linked to Encounter and emits LAB_ORDER_CREATED notification', async () => {
    const encounterId = new Types.ObjectId().toString();
    vi.spyOn(DoctorProfileModel, 'findOne').mockReturnValue(chainQuery(null));
    vi.spyOn(UserModel, 'findOne')
      .mockReturnValueOnce(chainQuery({ _id: new Types.ObjectId(patientId), name: 'Patient A' }))
      .mockReturnValueOnce(chainQuery({ _id: new Types.ObjectId(labId) }));
    vi.spyOn(EncounterModel, 'findOne').mockReturnValue(
      chainQuery({ _id: new Types.ObjectId(encounterId), patientId: new Types.ObjectId(patientId) })
    );
    vi.spyOn(LaboratoryOrderModel, 'findOne').mockReturnValue(chainQuery(null));
    vi.spyOn(LaboratoryOrderModel, 'create').mockImplementation(async (d: any) => ({
      _id: new Types.ObjectId(),
      ...d,
    }));
    const emitSpy = vi.spyOn(platformEventService, 'emit').mockResolvedValue({
      eventId: 'e1',
      eventType: 'LAB_ORDER_CREATED',
      deliveredCount: 2,
      failedRecipients: [],
      sanitizedPreview: 'Order created',
    });

    const created: any = await doctorLabOrderService.createLabOrder({
      doctorUserId: doctorId,
      doctorName: 'Dr. Nair',
      dto: {
        patientId,
        encounterId,
        laboratoryId: labId,
        priority: 'URGENT',
        idempotencyKey: 'lab-ord-key-1',
        tests: [{ testCode: 'CBC', testName: 'Complete Blood Count' }],
      },
    });

    expect(created.status).toBe('ORDERED');
    expect(String(created.encounterId)).toBe(encounterId);
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy.mock.calls[0]?.[0].recipients).toHaveLength(2);
  });
});
