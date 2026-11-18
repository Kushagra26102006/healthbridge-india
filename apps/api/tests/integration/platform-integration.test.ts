/**
 * HealthBridge India — Day 8 Task 01
 * Express API Integration Tests for Platform-Wide Integration:
 *   - Unified Patient Health Timeline (`/api/v1/platform/patient/timeline`) + role isolation
 *   - Unified Patient Identity (`/api/v1/platform/patient/identity`)
 *   - Doctor Unified Patient Workspace (`/api/v1/platform/doctor/patients/:patientId/overview`) + cross-doctor 403
 *   - Doctor -> Laboratory Order Creation (`POST /api/v1/lab-orders`) + Patient role blocked (403)
 *   - Duplicate Encounter Prevention for same `appointmentId` (`409 CONFLICT`)
 *   - Admin Unified Platform Overview (`/api/v1/platform/admin/overview`) + non-admin 403 + zero PII
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { tokenService } from '../../src/modules/auth/services/token.service';
import { UserModel } from '../../src/database/models';
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
import { platformEventService } from '../../src/modules/platform/services/platform-event.service';

function chainQuery(result: any) {
  return {
    select: () => chainQuery(result),
    sort: () => chainQuery(result),
    limit: () => chainQuery(result),
    populate: () => chainQuery(result),
    lean: async () => result,
    exec: async () => result,
    then: (resolve: any) => resolve(result),
  } as any;
}

describe('Platform-Wide Integration — Express API Integration Tests (Day 8 Task 01)', () => {
  const app = createApp();

  const patientId = new Types.ObjectId().toString();
  const doctorId = new Types.ObjectId().toString();
  const otherDoctorId = new Types.ObjectId().toString();
  const adminId = new Types.ObjectId().toString();

  const patientToken = tokenService.generateAccessToken({
    _id: patientId,
    role: 'PATIENT',
    email: 'plat.patient@example.test',
  } as any);
  const doctorToken = tokenService.generateAccessToken({
    _id: doctorId,
    role: 'DOCTOR',
    email: 'plat.doctor@example.test',
  } as any);
  const otherDoctorToken = tokenService.generateAccessToken({
    _id: otherDoctorId,
    role: 'DOCTOR',
    email: 'plat.other.doctor@example.test',
  } as any);
  const adminToken = tokenService.generateAccessToken({
    _id: adminId,
    role: 'ADMIN',
    email: 'plat.admin@example.test',
  } as any);

  beforeEach(() => {
    vi.restoreAllMocks();
    platformEventService.clearInMemoryDedupe();

    const users: Record<string, any> = {
      [patientId]: {
        _id: new Types.ObjectId(patientId),
        role: 'PATIENT',
        isActive: true,
        name: 'Ananya Verma',
        email: 'plat.patient@example.test',
        createdAt: new Date('2026-01-10T00:00:00Z'),
      },
      [doctorId]: {
        _id: new Types.ObjectId(doctorId),
        role: 'DOCTOR',
        isActive: true,
        name: 'Dr. Vikram Rao',
        email: 'plat.doctor@example.test',
      },
      [otherDoctorId]: {
        _id: new Types.ObjectId(otherDoctorId),
        role: 'DOCTOR',
        isActive: true,
        name: 'Dr. Unrelated',
        email: 'plat.other.doctor@example.test',
      },
      [adminId]: {
        _id: new Types.ObjectId(adminId),
        role: 'ADMIN',
        isActive: true,
        name: 'Platform Admin',
        email: 'plat.admin@example.test',
      },
    };

    vi.spyOn(UserModel, 'findById').mockImplementation((id: any) => {
      return chainQuery(users[String(id)] || null);
    });
    vi.spyOn(UserModel, 'findOne').mockImplementation((q: any) => {
      if (q?._id) return chainQuery(users[String(q._id)] || null);
      return chainQuery(null);
    });
  });

  it('serves authenticated patient unified timeline & identity and blocks non-patient roles', async () => {
    vi.spyOn(AppointmentModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(EncounterModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(PrescriptionModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(DispensingRecordModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(LaboratoryOrderModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(LabSampleModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(LaboratoryReportModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(MedicalRecordModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(ConsentArtifactModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(AbdmConsentArtefactModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(AbdmImportedRecordModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(PatientProfileModel, 'findOne').mockReturnValue(chainQuery(null));
    vi.spyOn(AbhaLinkModel, 'findOne').mockReturnValue(chainQuery(null));
    vi.spyOn(AbhaLinkModel, 'countDocuments').mockResolvedValue(0);

    const doctorAttempt = await request(app)
      .get('/api/v1/platform/patient/timeline')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(doctorAttempt.status).toBe(403);

    const timelineRes = await request(app)
      .get('/api/v1/platform/patient/timeline')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(timelineRes.status).toBe(200);
    expect(timelineRes.body.data.patientId).toBe(patientId);
    expect(timelineRes.body.data.items).toHaveLength(1);
    expect(timelineRes.body.data.items[0].eventType).toBe('PATIENT_REGISTERED');

    const identityRes = await request(app)
      .get('/api/v1/platform/patient/identity')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(identityRes.status).toBe(200);
    expect(identityRes.body.data.authoritativePatientId).toBe(patientId);
    expect(identityRes.body.data.duplicateAccountReview.autoMergeAllowed).toBe(false);
  });

  it('enforces Doctor unified workspace authorization, prevents duplicate encounters per appointment, and supports POST /api/v1/lab-orders', async () => {
    const appointmentId = new Types.ObjectId().toString();
    const encounterId = new Types.ObjectId().toString();

    vi.spyOn(DoctorProfileModel, 'findOne').mockReturnValue(chainQuery(null));
    vi.spyOn(PatientProfileModel, 'findOne').mockReturnValue(chainQuery(null));
    vi.spyOn(AbhaLinkModel, 'findOne').mockReturnValue(chainQuery(null));
    vi.spyOn(AbhaLinkModel, 'countDocuments').mockResolvedValue(0);

    // 1. Unrelated doctor blocked from unified patient workspace (403)
    vi.spyOn(AppointmentModel, 'exists').mockResolvedValue(null);
    vi.spyOn(EncounterModel, 'exists').mockResolvedValue(null);
    vi.spyOn(ConsentArtifactModel, 'countDocuments').mockResolvedValue(0);
    vi.spyOn(AbdmConsentArtefactModel, 'countDocuments').mockResolvedValue(0);

    const deniedDoc = await request(app)
      .get(`/api/v1/platform/doctor/patients/${patientId}/overview`)
      .set('Authorization', `Bearer ${otherDoctorToken}`);
    expect(deniedDoc.status).toBe(403);

    // 2. Authorized doctor retrieves unified workspace with read-only badges
    vi.spyOn(AppointmentModel, 'exists').mockResolvedValue({ _id: new Types.ObjectId(appointmentId) } as any);
    vi.spyOn(AppointmentModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(EncounterModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(PrescriptionModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(DispensingRecordModel, 'find').mockReturnValue(chainQuery([]));
    vi.spyOn(LaboratoryReportModel, 'find').mockReturnValue(
      chainQuery([
        {
          _id: new Types.ObjectId(),
          reportNumber: 'RPT-101',
          testName: 'CBC',
          status: 'PUBLISHED',
          currentVersion: 1,
          testDate: new Date(),
        },
      ])
    );
    vi.spyOn(MedicalRecordModel, 'find').mockReturnValue(chainQuery([]));

    const allowedDoc = await request(app)
      .get(`/api/v1/platform/doctor/patients/${patientId}/overview`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(allowedDoc.status).toBe(200);
    expect(allowedDoc.body.data.laboratoryReports[0].readOnly).toBe(true);
    expect(allowedDoc.body.data.authorization.readOnlyExternalSections).toContain('PHARMACY_DISPENSING');

    // 3. Duplicate encounter for the same appointmentId rejected with 409 CONFLICT
    vi.spyOn(AppointmentModel, 'findOne').mockResolvedValue({
      _id: new Types.ObjectId(appointmentId),
      doctorId: new Types.ObjectId(doctorId),
      patientId: new Types.ObjectId(patientId),
      encounterId: new Types.ObjectId(encounterId),
      status: 'IN_PROGRESS',
    } as any);
    vi.spyOn(EncounterModel, 'findOne').mockReturnValue(
      chainQuery({ _id: new Types.ObjectId(encounterId), status: 'IN_PROGRESS' })
    );

    const dupEncRes = await request(app)
      .post('/api/v1/doctors/encounters')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId,
        appointmentId,
        encounterType: 'AMBULATORY',
        chiefComplaint: 'Duplicate test',
      });
    expect(dupEncRes.status).toBe(409);

    // 4. Patient cannot create a Doctor lab order (403); Doctor succeeds (201)
    const patientOrderAttempt = await request(app)
      .post('/api/v1/lab-orders')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        patientId,
        tests: [{ testCode: 'CBC', testName: 'Complete Blood Count' }],
      });
    expect(patientOrderAttempt.status).toBe(403);

    vi.spyOn(LaboratoryOrderModel, 'findOne').mockReturnValue(chainQuery(null));
    vi.spyOn(LaboratoryOrderModel, 'create').mockImplementation(async (d: any) => ({
      _id: new Types.ObjectId(),
      ...d,
    }));
    vi.spyOn(platformEventService, 'emit').mockResolvedValue({
      eventId: 'e-http-1',
      eventType: 'LAB_ORDER_CREATED',
      deliveredCount: 1,
      failedRecipients: [],
      sanitizedPreview: 'New order created',
    });

    const labOrderRes = await request(app)
      .post('/api/v1/lab-orders')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId,
        encounterId,
        priority: 'ROUTINE',
        tests: [{ testCode: 'TSH', testName: 'Thyroid Stimulating Hormone' }],
      });
    expect(labOrderRes.status).toBe(201);
    expect(labOrderRes.body.data.status).toBe('ORDERED');
  });

  it('serves Admin platform overview with zero patient PII and blocks non-admin roles', async () => {
    const nonAdmin = await request(app)
      .get('/api/v1/platform/admin/overview')
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(nonAdmin.status).toBe(403);

    const adminRes = await request(app)
      .get('/api/v1/platform/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.data.abdm.liveExchangeEnabled).toBe(false);
    const bodyText = JSON.stringify(adminRes.body.data);
    expect(bodyText).not.toContain('Ananya Verma');
    expect(bodyText).not.toContain('plat.patient@example.test');
  });
});
