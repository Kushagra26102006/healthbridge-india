import { describe, it, expect, beforeEach } from 'vitest';
import { abdmFhirMapperService } from '../../src/modules/abdm/mappers/abdm-fhir.mapper';
import { fhirR4Validator } from '../../src/modules/abdm/validators/fhir-r4.validator';
import { abdmWebhookService } from '../../src/modules/abdm/webhooks/abdm-webhook.service';

describe('Phase 17 — ABDM FHIR R4 Complete Clinical Mapping & Webhook Telemetry Tests', () => {
  beforeEach(() => {
    abdmWebhookService.clearInMemoryCache();
  });

  it('maps Encounter, Appointment, Condition, AllergyIntolerance, MedicationRequest, MedicationStatement, and DocumentReference to valid NRCeS FHIR R4 resources', () => {
    const encounter = abdmFhirMapperService.mapEncounter({
      id: 'enc-101',
      patientId: 'pat-101',
      practitionerId: 'doc-101',
      facilityId: 'org-101',
      encounterType: 'AMBULATORY',
      status: 'COMPLETED',
      startTime: '2026-11-10T10:00:00Z',
      endTime: '2026-11-10T10:30:00Z',
      chiefComplaint: 'Seasonal allergic rhinitis',
    });
    expect(encounter.mappingStatus).toBe('MAPPED');
    expect(encounter.validationErrors).toHaveLength(0);
    expect(encounter.resource?.resourceType).toBe('Encounter');

    const appointment = abdmFhirMapperService.mapAppointment({
      id: 'apt-202',
      patientId: 'pat-101',
      doctorId: 'doc-101',
      status: 'CONFIRMED',
      start: '2026-11-12T09:00:00Z',
      end: '2026-11-12T09:30:00Z',
      reason: 'Follow-up consultation',
      consultationType: 'TELECONSULTATION',
    });
    expect(appointment.mappingStatus).toBe('MAPPED_WITH_WARNINGS');
    expect(appointment.validationErrors).toHaveLength(0);
    expect(appointment.unmappedFields[0]).toContain('consultationType');
    expect(appointment.resource?.status).toBe('booked');

    const condition = abdmFhirMapperService.mapCondition({
      id: 'cond-303',
      patientId: 'pat-101',
      encounterId: 'enc-101',
      codeText: 'Essential Hypertension',
      icd10Code: 'I10',
      snomedCode: '59621000',
      clinicalStatus: 'active',
      recordedDate: '2026-11-10T10:15:00Z',
    });
    expect(condition.mappingStatus).toBe('MAPPED');
    expect(condition.validationErrors).toHaveLength(0);
    expect(condition.resource?.resourceType).toBe('Condition');

    const allergy = abdmFhirMapperService.mapAllergyIntolerance({
      id: 'alg-404',
      patientId: 'pat-101',
      substanceName: 'Penicillin',
      snomedCode: '764146007',
      criticality: 'high',
      reactionDescription: 'Urticaria rash',
    });
    expect(allergy.mappingStatus).toBe('MAPPED');
    expect(allergy.validationErrors).toHaveLength(0);
    expect(allergy.resource?.resourceType).toBe('AllergyIntolerance');

    const medReq = abdmFhirMapperService.mapMedicationRequest({
      id: 'rx-505',
      patientId: 'pat-101',
      practitionerId: 'doc-101',
      medicationName: 'Telmisartan 40 mg Tablet',
      snomedCode: '376209006',
      status: 'ACTIVE',
      dosageInstruction: '1 tablet once daily after breakfast',
      authoredOn: '2026-11-10T10:20:00Z',
    });
    expect(medReq.mappingStatus).toBe('MAPPED');
    expect(medReq.validationErrors).toHaveLength(0);

    const medStmt = abdmFhirMapperService.mapMedicationStatement({
      id: 'ms-606',
      patientId: 'pat-101',
      medicationName: 'Vitamin D3 60000 IU',
      status: 'active',
      dosageText: 'Once weekly',
    });
    expect(medStmt.mappingStatus).toBe('MAPPED');
    expect(medStmt.validationErrors).toHaveLength(0);

    const docRef = abdmFhirMapperService.mapDocumentReference({
      id: 'doc-707',
      patientId: 'pat-101',
      title: 'Cardiology Consultation Summary',
      mimeType: 'application/pdf',
      fileName: 'cardiology_summary.pdf',
      fileSize: 120_400,
      recordDate: '2026-11-10T10:25:00Z',
      loincCode: '34108-1',
      loincDisplay: 'Outpatient Evaluation and Management',
    });
    expect(docRef.mappingStatus).toBe('MAPPED');
    expect(docRef.validationErrors).toHaveLength(0);
    expect(docRef.resource?.resourceType).toBe('DocumentReference');
  });

  it('flags missing SNOMED/ICD-10 codes as explicit warnings and rejects invalid Appointment/Condition/AllergyIntolerance fields', () => {
    const unstructuredCondition = abdmFhirMapperService.mapCondition({
      id: 'cond-warn',
      patientId: 'pat-101',
      codeText: 'Mild seasonal cough',
    });
    expect(unstructuredCondition.mappingStatus).toBe('MAPPED_WITH_WARNINGS');
    expect(unstructuredCondition.warnings.some((w) => w.code === 'UNSTRUCTURED_CONDITION_TEXT')).toBe(
      true
    );

    const invalidAppointment = fhirR4Validator.validateResource({
      resourceType: 'Appointment',
      id: 'apt-bad',
      status: 'not-a-fhir-status',
      start: '12/31/2026',
      participant: [],
    });
    expect(invalidAppointment.valid).toBe(false);
    expect(invalidAppointment.errors.some((e) => e.code === 'APPOINTMENT_STATUS_INVALID')).toBe(true);
    expect(invalidAppointment.errors.some((e) => e.code === 'APPOINTMENT_PARTICIPANT_REQUIRED')).toBe(
      true
    );
    expect(invalidAppointment.errors.some((e) => e.code === 'INVALID_DATE_FORMAT')).toBe(true);

    const invalidAllergy = fhirR4Validator.validateResource({
      resourceType: 'AllergyIntolerance',
      id: 'alg-bad',
      patient: { reference: 'Patient/p1' },
      code: { text: 'Peanuts' },
      criticality: 'extreme-invalid',
    });
    expect(invalidAllergy.valid).toBe(false);
    expect(invalidAllergy.errors.some((e) => e.code === 'ALLERGY_CRITICALITY_INVALID')).toBe(true);
  });

  it('tracks aggregate PII-free webhook analytics in AbdmWebhookService', async () => {
    const env: NodeJS.ProcessEnv = {
      ABDM_WEBHOOK_SECRET: 'test-webhook-secret-strong-value',
    };
    const nowIso = new Date().toISOString();

    await abdmWebhookService.handleCallback(
      {
        requestId: 'req-p17-001',
        timestamp: nowIso,
        eventType: 'consent/request/on-init',
        resp: { requestId: 'corr-p17-001' },
      },
      { webhookSecret: 'test-webhook-secret-strong-value' },
      env
    );

    const analytics = await abdmWebhookService.getAdminWebhookAnalytics();
    expect(analytics.totalReceived).toBe(1);
    expect(analytics.processed).toBe(1);
    expect(analytics.failed).toBe(0);
    expect(analytics.recentEvents[0]?.eventType).toBe('consent/request/on-init');
    expect(analytics.recentEvents[0]?.correlationId).toBe('corr-p17-001');
  });
});
