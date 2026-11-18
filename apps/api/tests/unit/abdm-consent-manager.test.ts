/**
 * HealthBridge India — Day 7 Task 03
 * Unit & Workflow Tests for ABDM Consent Manager Integration
 *
 * NOTE: All tests use synthetic data and mocked/development adapters.
 * No live external ABDM HIE-CM sandbox APIs are contacted in this test suite.
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { Types } from 'mongoose';
import {
  createAbdmConsentRequestSchema,
  externalAbdmArtefactPayloadSchema,
} from '@healthbridge/validation';
import type { AbdmConsentArtefactRecordDto } from '@healthbridge/shared-types';
import {
  abdmConsentValidationService,
  validateAbdmConsentAccess,
  type EvaluatableAbdmArtefact,
} from '../../src/modules/abdm/services/abdm-consent-validation.service';
import { abdmConsentLifecycleService } from '../../src/modules/abdm/services/abdm-consent-lifecycle.service';
import { abdmConsentFhirMapper } from '../../src/modules/abdm/mappers/abdm-consent-fhir.mapper';
import { fhirR4Validator } from '../../src/modules/abdm/validators/fhir-r4.validator';
import { consentEnforcementService } from '../../src/modules/consent/services/consent-enforcement.service';
import { AbhaLinkModel } from '../../src/modules/abdm/models/abha-link.model';
import { AbdmConsentRequestModel } from '../../src/modules/abdm/models/abdm-consent-request.model';
import { AbdmConsentArtefactModel } from '../../src/modules/abdm/models/abdm-consent-artefact.model';
import { AbdmConsentEventModel } from '../../src/modules/abdm/models/abdm-consent-event.model';
import { AbdmConsentSyncLogModel } from '../../src/modules/abdm/models/abdm-consent-sync-log.model';
import { AuditLogModel } from '../../src/modules/security/models/audit-log.model';
import { notificationService } from '../../src/modules/notifications/services/notification.service';
import { redactAbdmLogPayload } from '../../src/modules/abdm/utils/redaction';

const futureIso = (daysAhead = 30) => new Date(Date.now() + daysAhead * 86400_000).toISOString();
const pastIso = (daysAgo = 30) => new Date(Date.now() - daysAgo * 86400_000).toISOString();

function buildValidArtefact(overrides: Partial<EvaluatableAbdmArtefact> = {}): EvaluatableAbdmArtefact {
  return {
    id: new Types.ObjectId().toString(),
    externalConsentId: 'abdm-artefact-001',
    origin: 'ABDM_HIE_CM',
    patientId: '507f1f77bcf86cd799439011',
    hiuId: 'HEALTHBRIDGE-HIU-01',
    hipId: 'PARTNER-HIP-01',
    purposeCode: 'CAREMGT',
    hiTypes: ['DiagnosticReport', 'Prescription'],
    dateRange: {
      from: '2025-01-01T00:00:00.000Z',
      to: '2027-01-01T00:00:00.000Z',
    },
    dataEraseAt: futureIso(45),
    expiresAt: futureIso(45),
    externalStatus: 'GRANTED',
    validationStatus: 'VALID',
    revocationStatus: 'NOT_REVOKED',
    signatureVerified: true,
    externalConfirmationReceived: true,
    lastSyncedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ABDM Consent Manager — Unit & Workflow Suite (Day 7 Task 03 — Mocked/Synthetic)', () => {
  const origEnabled = process.env.ABDM_ENABLED;
  const origEnv = process.env.ABDM_ENVIRONMENT;

  beforeEach(() => {
    vi.restoreAllMocks();
    abdmConsentValidationService.clearCache();
    process.env.ABDM_ENABLED = 'true';
    process.env.ABDM_ENVIRONMENT = 'development';
  });

  afterAll(() => {
    process.env.ABDM_ENABLED = origEnabled;
    process.env.ABDM_ENVIRONMENT = origEnv;
  });

  // ==========================================================================
  // 1. CONSENT REQUEST VALIDATION & INITIATION
  // ==========================================================================
  describe('Consent Request Validation & Initiation', () => {
    it('validates a compliant ABDM consent request schema and rejects invalid purpose/date/category', () => {
      const valid = createAbdmConsentRequestSchema.safeParse({
        patientId: new Types.ObjectId().toString(),
        purposeCode: 'CAREMGT',
        hiTypes: ['DiagnosticReport', 'Prescription'],
        accessMode: 'VIEW',
        dateRange: { from: pastIso(90), to: pastIso(1) },
        dataEraseAt: futureIso(30),
        frequency: { unit: 'DAY', value: 1, repeats: 2 },
      });
      expect(valid.success).toBe(true);

      // Unsupported purpose
      const badPurpose = createAbdmConsentRequestSchema.safeParse({
        patientId: new Types.ObjectId().toString(),
        purposeCode: 'MARKETING_PROMO',
        hiTypes: ['DiagnosticReport'],
        dateRange: { from: pastIso(10), to: pastIso(1) },
        dataEraseAt: futureIso(10),
      });
      expect(badPurpose.success).toBe(false);

      // Invalid date range (from > to)
      const badDateRange = createAbdmConsentRequestSchema.safeParse({
        patientId: new Types.ObjectId().toString(),
        purposeCode: 'CAREMGT',
        hiTypes: ['DiagnosticReport'],
        dateRange: { from: futureIso(5), to: pastIso(5) },
        dataEraseAt: futureIso(30),
      });
      expect(badDateRange.success).toBe(false);

      // Invalid HI-type category
      const badCategory = createAbdmConsentRequestSchema.safeParse({
        patientId: new Types.ObjectId().toString(),
        purposeCode: 'CAREMGT',
        hiTypes: ['PrivateBillingNotes'],
        dateRange: { from: pastIso(10), to: pastIso(1) },
        dataEraseAt: futureIso(10),
      });
      expect(badCategory.success).toBe(false);
    });

    it('initiates a valid HIU consent request in AWAITING_PATIENT_ACTION (never fake APPROVED)', async () => {
      const patientId = new Types.ObjectId();
      const doctorId = new Types.ObjectId();

      vi.spyOn(AbhaLinkModel, 'findOne').mockResolvedValue({
        patientId,
        abhaAddress: 'aarav.sharma@sbx',
        linkStatus: 'LINKED',
        verificationStatus: 'VERIFIED',
      } as any);

      const savedDoc: any = {
        _id: new Types.ObjectId(),
        internalReference: 'HB-ABDM-CR-TEST1',
        patientId,
        patientAbhaAddress: 'aarav.sharma@sbx',
        requestingUserId: doctorId,
        requestingUserRole: 'DOCTOR',
        requestingParticipantId: 'HEALTHBRIDGE-HIU-DEV',
        requestingParticipantRole: 'HIU',
        requestingOrganizationName: 'HealthBridge Clinic',
        requesterName: 'Dr. Meera',
        purposeCode: 'CAREMGT',
        purposeText: 'Care Management',
        hiTypes: ['DiagnosticReport'],
        accessMode: 'VIEW',
        dateRange: { from: new Date(pastIso(60)), to: new Date(pastIso(1)) },
        dataEraseAt: new Date(futureIso(30)),
        frequency: { unit: 'HOUR', value: 1, repeats: 0 },
        internalStatus: 'PENDING_SUBMISSION',
        externalStatus: 'UNKNOWN',
        correlationId: 'corr-1',
        artefactIds: [],
        environment: 'development',
        isMocked: true,
        statusHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(AbdmConsentRequestModel, 'create').mockResolvedValue(savedDoc);
      vi.spyOn(AbdmConsentEventModel, 'create').mockResolvedValue({} as any);
      vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
      const notifySpy = vi.spyOn(notificationService, 'publishEvent').mockResolvedValue({} as any);

      const result = await abdmConsentLifecycleService.initiateConsentRequest(
        {
          patientId: patientId.toString(),
          purposeCode: 'CAREMGT',
          hiTypes: ['DiagnosticReport'],
          accessMode: 'VIEW',
          dateRange: { from: pastIso(60), to: pastIso(1) },
          dataEraseAt: futureIso(30),
          frequency: { unit: 'HOUR', value: 1, repeats: 0 },
          requestingOrganizationName: 'HealthBridge Clinic',
        },
        { userId: doctorId.toString(), role: 'DOCTOR', name: 'Dr. Meera' }
      );

      expect(result.internalStatus).toBe('AWAITING_PATIENT_ACTION');
      expect(result.externalStatus).toBe('REQUESTED');
      expect(result.internalStatus).not.toBe('APPROVED');
      expect(result.isMocked).toBe(true);
      expect(result.externalRequestId).toMatch(/^sbx-cr-/);
      expect(result.officialApprovalGuidance.requiresExternalAbdmApproval).toBe(true);
      expect(notifySpy).toHaveBeenCalledTimes(2);
    });

    it('rejects consent request initiation for unauthorized participant role or unlinked patient', async () => {
      const patientId = new Types.ObjectId().toString();

      await expect(
        abdmConsentLifecycleService.initiateConsentRequest(
          {
            patientId,
            purposeCode: 'CAREMGT',
            hiTypes: ['DiagnosticReport'],
            accessMode: 'VIEW',
            dateRange: { from: pastIso(30), to: pastIso(1) },
            dataEraseAt: futureIso(30),
            frequency: { unit: 'HOUR', value: 1, repeats: 0 },
          },
          { userId: patientId, role: 'PATIENT' }
        )
      ).rejects.toThrow(/not authorized/i);

      vi.spyOn(AbhaLinkModel, 'findOne').mockResolvedValue(null);
      await expect(
        abdmConsentLifecycleService.initiateConsentRequest(
          {
            patientId,
            purposeCode: 'CAREMGT',
            hiTypes: ['DiagnosticReport'],
            accessMode: 'VIEW',
            dateRange: { from: pastIso(30), to: pastIso(1) },
            dataEraseAt: futureIso(30),
            frequency: { unit: 'HOUR', value: 1, repeats: 0 },
          },
          { userId: new Types.ObjectId().toString(), role: 'DOCTOR' }
        )
      ).rejects.toThrow(/verified active ABHA address/i);
    });
  });

  // ==========================================================================
  // 2. APPROVAL, REJECTION, FORGED, DUPLICATE & STALE CALLBACK HANDLING
  // ==========================================================================
  describe('Approval, Rejection, Forgery & Event-Ordering Callbacks', () => {
    it('processes mocked approval callback, rejects forged callbacks, handles duplicates & blocks stale overwrites', async () => {
      const patientId = new Types.ObjectId();
      const reqDoc: any = {
        _id: new Types.ObjectId(),
        internalReference: 'HB-ABDM-CR-100',
        externalRequestId: 'sbx-cr-known-100',
        patientId,
        patientAbhaAddress: 'priya@sbx',
        requestingParticipantId: 'HB-HIU-01',
        requestingOrganizationName: 'Apollo Test Clinic',
        internalStatus: 'AWAITING_PATIENT_ACTION',
        externalStatus: 'REQUESTED',
        artefactIds: [],
        lastExternalEventAt: undefined,
        statusHistory: [],
        save: vi.fn().mockResolvedValue(true),
      };

      const seenEvents = new Set<string>();
      vi.spyOn(AbdmConsentEventModel, 'findOne').mockImplementation((async (q: any) => {
        const key = `${q.eventId}::${q.eventType}`;
        return seenEvents.has(key) ? ({ eventId: q.eventId, eventType: q.eventType } as any) : null;
      }) as any);
      vi.spyOn(AbdmConsentEventModel, 'create').mockImplementation(async (doc: any) => {
        seenEvents.add(`${doc.eventId}::${doc.eventType}`);
        return doc;
      });
      vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
      vi.spyOn(notificationService, 'publishEvent').mockResolvedValue({} as any);

      // 1. Forged approval for unknown consentRequestId -> REJECTED!
      vi.spyOn(AbdmConsentRequestModel, 'findOne').mockResolvedValueOnce(null);
      const forged = await abdmConsentLifecycleService.processConsentCallback(
        'consent/hiu/notify',
        {
          notification: {
            consentRequestId: 'forged-unknown-req-id',
            status: 'GRANTED',
            consentArtefacts: [{ id: 'forged-art-1' }],
          },
        },
        {
          requestId: 'evt-forged-1',
          correlationId: 'corr-forged-1',
          timestamp: new Date().toISOString(),
        }
      );
      expect(forged.processed).toBe(false);
      expect(forged.outcome).toBe('REJECTED');

      // 2. Valid mocked approval callback -> PROCESSED (APPROVED / GRANTED)
      vi.spyOn(AbdmConsentRequestModel, 'findOne').mockResolvedValue(reqDoc);
      const t1 = new Date().toISOString();
      const approved = await abdmConsentLifecycleService.processConsentCallback(
        'consent/hiu/notify',
        {
          notification: {
            consentRequestId: 'sbx-cr-known-100',
            status: 'GRANTED',
            consentArtefacts: [{ id: 'art-valid-1' }],
          },
        },
        { requestId: 'evt-approve-1', correlationId: 'corr-1', timestamp: t1 }
      );
      expect(approved.processed).toBe(true);
      expect(reqDoc.internalStatus).toBe('APPROVED');
      expect(reqDoc.externalStatus).toBe('GRANTED');
      expect(reqDoc.artefactIds).toContain('art-valid-1');

      // 3. Duplicate callback with same eventId -> DUPLICATE_IGNORED
      const duplicate = await abdmConsentLifecycleService.processConsentCallback(
        'consent/hiu/notify',
        {
          notification: {
            consentRequestId: 'sbx-cr-known-100',
            status: 'GRANTED',
            consentArtefacts: [{ id: 'art-valid-1' }],
          },
        },
        { requestId: 'evt-approve-1', correlationId: 'corr-1', timestamp: t1 }
      );
      expect(duplicate.outcome).toBe('DUPLICATE_IGNORED');

      // 4. Newer REVOKED callback transitions state -> REVOKED
      const t2 = new Date(Date.now() + 5000).toISOString();
      vi.spyOn(AbdmConsentArtefactModel, 'findOne').mockResolvedValue(null);
      const revoked = await abdmConsentLifecycleService.processConsentCallback(
        'consent/hiu/notify',
        {
          notification: {
            consentRequestId: 'sbx-cr-known-100',
            status: 'REVOKED',
            consentArtefacts: [{ id: 'art-valid-1' }],
          },
        },
        { requestId: 'evt-revoke-2', correlationId: 'corr-2', timestamp: t2 }
      );
      expect(revoked.processed).toBe(true);
      expect(reqDoc.internalStatus).toBe('REVOKED');

      // 5. Delayed/stale GRANTED callback cannot overwrite newer REVOKED state -> STALE_IGNORED
      const stale = await abdmConsentLifecycleService.processConsentCallback(
        'consent/hiu/notify',
        {
          notification: {
            consentRequestId: 'sbx-cr-known-100',
            status: 'GRANTED',
            consentArtefacts: [{ id: 'art-valid-1' }],
          },
        },
        { requestId: 'evt-stale-3', correlationId: 'corr-3', timestamp: t1 }
      );
      expect(stale.outcome).toBe('STALE_IGNORED');
      expect(reqDoc.internalStatus).toBe('REVOKED');
    });

    it('processes external rejection callback (DENIED -> REJECTED)', async () => {
      const reqDoc: any = {
        _id: new Types.ObjectId(),
        internalReference: 'HB-ABDM-CR-101',
        externalRequestId: 'sbx-cr-reject-101',
        patientId: new Types.ObjectId(),
        requestingParticipantId: 'HB-HIU-01',
        requestingOrganizationName: 'City Diagnostics',
        internalStatus: 'AWAITING_PATIENT_ACTION',
        externalStatus: 'REQUESTED',
        artefactIds: [],
        statusHistory: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(AbdmConsentEventModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(AbdmConsentEventModel, 'create').mockResolvedValue({} as any);
      vi.spyOn(AbdmConsentRequestModel, 'findOne').mockResolvedValue(reqDoc);
      vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
      vi.spyOn(notificationService, 'publishEvent').mockResolvedValue({} as any);

      const res = await abdmConsentLifecycleService.processConsentCallback(
        'consent/hiu/notify',
        {
          notification: {
            consentRequestId: 'sbx-cr-reject-101',
            status: 'DENIED',
          },
        },
        { requestId: 'evt-deny-1', correlationId: 'corr-deny', timestamp: new Date().toISOString() }
      );

      expect(res.processed).toBe(true);
      expect(reqDoc.internalStatus).toBe('REJECTED');
      expect(reqDoc.externalStatus).toBe('DENIED');
    });
  });

  // ==========================================================================
  // 3. ARTEFACT VALIDATION & IMMUTABLE PRESERVATION
  // ==========================================================================
  describe('Artefact Schema Validation & Immutable Storage', () => {
    it('rejects invalid artefact schema and unknown patient reference', async () => {
      const badSchema = externalAbdmArtefactPayloadSchema.safeParse({
        consentId: 'art-bad',
        status: 'GRANTED',
      });
      expect(badSchema.success).toBe(false);

      await expect(
        abdmConsentLifecycleService.validateAndStoreExternalArtefact(
          { consentId: 'art-bad', status: 'GRANTED' },
          { source: 'MOCK_HIE_CM_DEVELOPMENT', environment: 'development' }
        )
      ).rejects.toThrow(/Invalid external ABDM Consent Artefact schema/i);

      vi.spyOn(AbhaLinkModel, 'findOne').mockResolvedValue(null);
      await expect(
        abdmConsentLifecycleService.validateAndStoreExternalArtefact(
          {
            consentId: 'art-unlinked-1',
            createdAt: new Date().toISOString(),
            status: 'GRANTED',
            signature: 'MOCK-CM-SIG-123456',
            consentDetail: {
              purpose: { code: 'CAREMGT', text: 'Care Management' },
              patient: { id: 'ghost.user@sbx' },
              hiu: { id: 'HB-HIU-1', name: 'Test HIU' },
              hiTypes: ['DiagnosticReport'],
              permission: {
                accessMode: 'VIEW',
                dateRange: { from: pastIso(60), to: pastIso(1) },
                dataEraseAt: futureIso(30),
              },
            },
          },
          { source: 'MOCK_HIE_CM_DEVELOPMENT', environment: 'development' }
        )
      ).rejects.toThrow(/does not match any verified linked HealthBridge patient/i);
    });
  });

  // ==========================================================================
  // 4. CENTRALIZED CONSENT VALIDATION SERVICE (11 RULES + SELF-ACCESS)
  // ==========================================================================
  describe('Centralized Consent Access Validation (`validateAbdmConsentAccess`)', () => {
    const patientId = '507f1f77bcf86cd799439011';

    it('ALLOWS valid purpose, HI-type, participant, and date range', async () => {
      const artefact = buildValidArtefact({ patientId });
      const res = await validateAbdmConsentAccess(
        {
          patientId,
          actorId: 'doctor-1',
          actorRole: 'DOCTOR',
          participantId: 'HEALTHBRIDGE-HIU-01',
          requestedHiType: 'DiagnosticReport',
          requestedPurposeCode: 'CAREMGT',
          recordDateIso: '2026-03-15T10:00:00.000Z',
        },
        artefact
      );
      expect(res.decision).toBe('ALLOWED');
      expect(res.allowed).toBe(true);
      expect(res.reasonCode).toBe('AUTHORIZED');
    });

    it('DENIES wrong purpose, out-of-scope HI-type, out-of-range date, wrong participant, and cross-patient access', async () => {
      const artefact = buildValidArtefact({ patientId });

      const wrongPurpose = await validateAbdmConsentAccess(
        {
          patientId,
          actorId: 'doctor-1',
          actorRole: 'DOCTOR',
          participantId: 'HEALTHBRIDGE-HIU-01',
          requestedHiType: 'DiagnosticReport',
          requestedPurposeCode: 'DSRCH',
        },
        artefact
      );
      expect(wrongPurpose.decision).toBe('DENIED');
      expect(wrongPurpose.reasonCode).toBe('PURPOSE_MISMATCH');

      const outOfScopeCategory = await validateAbdmConsentAccess(
        {
          patientId,
          actorId: 'doctor-1',
          actorRole: 'DOCTOR',
          participantId: 'HEALTHBRIDGE-HIU-01',
          requestedHiType: 'DischargeSummary',
          requestedPurposeCode: 'CAREMGT',
        },
        artefact
      );
      expect(outOfScopeCategory.decision).toBe('DENIED');
      expect(outOfScopeCategory.reasonCode).toBe('HI_TYPE_OUT_OF_SCOPE');

      const outOfRangeDate = await validateAbdmConsentAccess(
        {
          patientId,
          actorId: 'doctor-1',
          actorRole: 'DOCTOR',
          participantId: 'HEALTHBRIDGE-HIU-01',
          requestedHiType: 'DiagnosticReport',
          requestedPurposeCode: 'CAREMGT',
          recordDateIso: '2020-01-01T00:00:00.000Z',
        },
        artefact
      );
      expect(outOfRangeDate.decision).toBe('DENIED');
      expect(outOfRangeDate.reasonCode).toBe('DATE_RANGE_OUT_OF_SCOPE');

      const wrongParticipant = await validateAbdmConsentAccess(
        {
          patientId,
          actorId: 'doctor-1',
          actorRole: 'DOCTOR',
          participantId: 'ROGUE-HIU-999',
          requestedHiType: 'DiagnosticReport',
          requestedPurposeCode: 'CAREMGT',
        },
        artefact
      );
      expect(wrongParticipant.decision).toBe('DENIED');
      expect(wrongParticipant.reasonCode).toBe('PARTICIPANT_UNAUTHORIZED');

      const wrongPatient = await validateAbdmConsentAccess(
        {
          patientId: '507f1f77bcf86cd799439099',
          actorId: 'doctor-1',
          actorRole: 'DOCTOR',
          requestedHiType: 'DiagnosticReport',
          requestedPurposeCode: 'CAREMGT',
        },
        artefact
      );
      expect(wrongPatient.decision).toBe('DENIED');
      expect(wrongPatient.reasonCode).toBe('PATIENT_OWNERSHIP_MISMATCH');
    });

    it('DENIES expired, revoked, pending-revocation, unverified-signature, and internal-origin consents', async () => {
      const expired = await validateAbdmConsentAccess(
        {
          patientId,
          actorId: 'doc-1',
          requestedHiType: 'DiagnosticReport',
          requestedPurposeCode: 'CAREMGT',
        },
        buildValidArtefact({ patientId, expiresAt: pastIso(1) })
      );
      expect(expired.decision).toBe('DENIED');
      expect(expired.reasonCode).toBe('CONSENT_EXPIRED');

      const revoked = await validateAbdmConsentAccess(
        {
          patientId,
          actorId: 'doc-1',
          requestedHiType: 'DiagnosticReport',
          requestedPurposeCode: 'CAREMGT',
        },
        buildValidArtefact({ patientId, externalStatus: 'REVOKED' })
      );
      expect(revoked.decision).toBe('DENIED');
      expect(revoked.reasonCode).toBe('CONSENT_REVOKED');

      const pendingRevoke = await validateAbdmConsentAccess(
        {
          patientId,
          actorId: 'doc-1',
          requestedHiType: 'DiagnosticReport',
          requestedPurposeCode: 'CAREMGT',
        },
        buildValidArtefact({ patientId, revocationStatus: 'PENDING_CONFIRMATION' })
      );
      expect(pendingRevoke.decision).toBe('DENIED');
      expect(pendingRevoke.reasonCode).toBe('REVOCATION_PENDING_CONFIRMATION');

      const unconfirmed = await validateAbdmConsentAccess(
        {
          patientId,
          actorId: 'doc-1',
          requestedHiType: 'DiagnosticReport',
          requestedPurposeCode: 'CAREMGT',
          requireExternalConfirmation: true,
        },
        buildValidArtefact({ patientId, externalConfirmationReceived: false })
      );
      expect(unconfirmed.decision).toBe('PENDING_EXTERNAL_CONFIRMATION');
      expect(unconfirmed.allowed).toBe(false);

      const staleSync = await validateAbdmConsentAccess(
        {
          patientId,
          actorId: 'doc-1',
          requestedHiType: 'DiagnosticReport',
          requestedPurposeCode: 'CAREMGT',
          maxSyncStalenessMs: 60_000,
        },
        buildValidArtefact({ patientId, lastSyncedAt: pastIso(2) })
      );
      expect(staleSync.decision).toBe('REQUIRES_REVALIDATION');
      expect(staleSync.allowed).toBe(false);

      // Internal HealthBridge consent is NEVER misrepresented as an ABDM consent artefact!
      const internalMisrepresented = await validateAbdmConsentAccess(
        {
          patientId,
          actorId: 'doc-1',
          requestedHiType: 'DiagnosticReport',
          requestedPurposeCode: 'CAREMGT',
        },
        buildValidArtefact({ patientId, origin: 'INTERNAL_HEALTHBRIDGE' })
      );
      expect(internalMisrepresented.decision).toBe('DENIED');
      expect(internalMisrepresented.reasonCode).toBe('INTERNAL_CONSENT_NOT_ABDM_ARTEFACT');
    });

    it('PRESERVES legitimate patient self-access even when zero ABDM artefacts exist', async () => {
      const selfRes = await validateAbdmConsentAccess(
        {
          patientId,
          actorId: patientId,
          actorRole: 'PATIENT',
          requestedHiType: 'DiagnosticReport',
          requestedPurposeCode: 'PATRQT',
        },
        null
      );
      expect(selfRes.decision).toBe('ALLOWED');
      expect(selfRes.allowed).toBe(true);
      expect(selfRes.reasonCode).toBe('PATIENT_SELF_ACCESS_ALLOWED');

      // Also verify existing internal ConsentEnforcementService keeps patient self-access intact
      const internalSelf = await consentEnforcementService.validateAccess({
        requesterId: patientId,
        requesterRole: 'PATIENT',
        patientId,
        dataCategory: 'LAB_REPORTS',
      });
      expect(internalSelf.authorized).toBe(true);
    });
  });

  // ==========================================================================
  // 5. REVOCATION, CACHE INVALIDATION & EXPIRY SWEEP
  // ==========================================================================
  describe('Revocation, Authorization Cache Invalidation & Expiry Sync', () => {
    it('blocks unauthorized revocation, marks PENDING_CONFIRMATION honestly, preserves history, and invalidates cache', async () => {
      const patientA = new Types.ObjectId();
      const patientB = new Types.ObjectId();
      const artId = new Types.ObjectId();

      const artDoc: any = {
        _id: artId,
        internalReference: 'HB-ABDM-ART-900',
        externalConsentId: 'abdm-art-900',
        origin: 'ABDM_HIE_CM',
        patientId: patientA,
        patientAbhaAddress: 'patient.a@sbx',
        hiuId: 'HB-HIU-01',
        purposeCode: 'CAREMGT',
        purposeText: 'Care Management',
        hiTypes: ['DiagnosticReport'],
        accessMode: 'VIEW',
        dateRange: { from: new Date(pastIso(30)), to: new Date(futureIso(30)) },
        dataEraseAt: new Date(futureIso(30)),
        expiresAt: new Date(futureIso(30)),
        externalStatus: 'GRANTED',
        validationStatus: 'VALID',
        revocationStatus: 'NOT_REVOKED',
        signatureVerified: true,
        externalConfirmationReceived: true,
        environment: 'development',
        isMocked: true,
        statusHistory: [],
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      // Prime DB-backed cache with an ALLOWED decision
      vi.spyOn(AbdmConsentArtefactModel, 'findOne').mockResolvedValue(artDoc);
      vi.spyOn(AbdmConsentArtefactModel, 'findById').mockResolvedValue(artDoc);
      vi.spyOn(AbdmConsentEventModel, 'create').mockResolvedValue({} as any);
      vi.spyOn(AuditLogModel, 'create').mockResolvedValue({} as any);
      vi.spyOn(notificationService, 'publishEvent').mockResolvedValue({} as any);

      const firstCheck = await abdmConsentValidationService.validateAbdmConsentAccess({
        patientId: patientA.toString(),
        actorId: 'doc-1',
        actorRole: 'DOCTOR',
        participantId: 'HB-HIU-01',
        externalConsentId: 'abdm-art-900',
        requestedHiType: 'DiagnosticReport',
        requestedPurposeCode: 'CAREMGT',
      });
      expect(firstCheck.decision).toBe('ALLOWED');
      expect(firstCheck.cacheHit).toBe(false);

      const cachedCheck = await abdmConsentValidationService.validateAbdmConsentAccess({
        patientId: patientA.toString(),
        actorId: 'doc-1',
        actorRole: 'DOCTOR',
        participantId: 'HB-HIU-01',
        externalConsentId: 'abdm-art-900',
        requestedHiType: 'DiagnosticReport',
        requestedPurposeCode: 'CAREMGT',
      });
      expect(cachedCheck.cacheHit).toBe(true);
      expect(abdmConsentValidationService.getCacheSize()).toBe(1);

      // Patient B cannot revoke Patient A's artefact -> Forbidden!
      await expect(
        abdmConsentLifecycleService.initiatePatientRevocation(
          patientB.toString(),
          artId.toString(),
          'Unauthorized attempt'
        )
      ).rejects.toThrow(/not authorized/i);

      // Patient A initiates revocation -> PENDING_CONFIRMATION, cache cleared immediately!
      const revokeRes = await abdmConsentLifecycleService.initiatePatientRevocation(
        patientA.toString(),
        artId.toString(),
        'Treatment completed'
      );
      expect(revokeRes.revocationStatus).toBe('PENDING_CONFIRMATION');
      expect(revokeRes.externalConfirmed).toBe(false);
      expect(revokeRes.cacheInvalidated).toBe(true);
      expect(abdmConsentValidationService.getCacheSize()).toBe(0);
      expect(artDoc.statusHistory.length).toBe(1);

      // Subsequent access check MUST fail closed immediately!
      const postRevokeCheck = await abdmConsentValidationService.validateAbdmConsentAccess({
        patientId: patientA.toString(),
        actorId: 'doc-1',
        actorRole: 'DOCTOR',
        participantId: 'HB-HIU-01',
        externalConsentId: 'abdm-art-900',
        requestedHiType: 'DiagnosticReport',
        requestedPurposeCode: 'CAREMGT',
      });
      expect(postRevokeCheck.decision).toBe('DENIED');
      expect(postRevokeCheck.reasonCode).toBe('REVOCATION_PENDING_CONFIRMATION');

      // Duplicate revocation request handled safely without deleting history
      const dupRevoke = await abdmConsentLifecycleService.initiatePatientRevocation(
        patientA.toString(),
        artId.toString(),
        'Repeat click'
      );
      expect(dupRevoke.revocationStatus).toBe('PENDING_CONFIRMATION');
      expect(artDoc.statusHistory.length).toBe(1);
    });

    it('detects expired requests/artefacts during background sync sweep and writes SyncLog', async () => {
      const expiredReq: any = {
        _id: new Types.ObjectId(),
        internalReference: 'HB-ABDM-CR-EXP',
        patientId: new Types.ObjectId(),
        internalStatus: 'AWAITING_PATIENT_ACTION',
        externalStatus: 'REQUESTED',
        statusHistory: [],
        save: vi.fn().mockResolvedValue(true),
      };
      const expiredArt: any = {
        _id: new Types.ObjectId(),
        internalReference: 'HB-ABDM-ART-EXP',
        externalConsentId: 'abdm-art-exp-1',
        patientId: new Types.ObjectId(),
        externalStatus: 'GRANTED',
        validationStatus: 'VALID',
        revocationStatus: 'NOT_REVOKED',
        statusHistory: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(AbdmConsentRequestModel, 'find')
        .mockResolvedValueOnce([expiredReq] as any)
        .mockReturnValueOnce({ limit: vi.fn().mockResolvedValue([]) } as any);
      vi.spyOn(AbdmConsentArtefactModel, 'find')
        .mockResolvedValueOnce([expiredArt] as any)
        .mockResolvedValueOnce([] as any);
      vi.spyOn(AbdmConsentEventModel, 'create').mockResolvedValue({} as any);
      vi.spyOn(notificationService, 'publishEvent').mockResolvedValue({} as any);
      vi.spyOn(AbdmConsentSyncLogModel, 'create').mockResolvedValue({
        _id: new Types.ObjectId(),
      } as any);

      const summary = await abdmConsentLifecycleService.runExpiryAndStatusSync({
        syncType: 'SCHEDULED_SWEEP',
      });

      expect(summary.status).toBe('SUCCESS');
      expect(summary.expiredRequestsMarked).toBe(1);
      expect(summary.expiredArtefactsMarked).toBe(1);
      expect(expiredReq.internalStatus).toBe('EXPIRED');
      expect(expiredArt.externalStatus).toBe('EXPIRED');
    });
  });

  // ==========================================================================
  // 6. FHIR R4 CONSENT MAPPING & PRIVACY REDACTION
  // ==========================================================================
  describe('FHIR R4 Consent Mapping & Privacy Redaction', () => {
    it('maps an ABDM consent artefact to structurally valid FHIR R4 Consent while preserving original metadata and reporting unmapped fields', () => {
      const artefactDto: AbdmConsentArtefactRecordDto = {
        id: '507f1f77bcf86cd799439022',
        internalReference: 'HB-ABDM-ART-FHIR1',
        externalConsentId: 'abdm-consent-fhir-001',
        origin: 'ABDM_HIE_CM',
        patientId: '507f1f77bcf86cd799439011',
        patientAbhaAddress: 'rohan@sbx',
        hipId: 'HIP-01',
        hiuId: 'HIU-01',
        hiuName: 'HealthBridge Partner Hospital',
        purposeCode: 'CAREMGT',
        purposeText: 'Care Management',
        hiTypes: ['DiagnosticReport', 'Prescription'],
        accessMode: 'VIEW',
        dateRange: { from: pastIso(30), to: pastIso(1) },
        dataEraseAt: futureIso(30),
        frequency: { unit: 'DAY', value: 1, repeats: 3 },
        externalStatus: 'GRANTED',
        validationStatus: 'VALID',
        revocationStatus: 'NOT_REVOKED',
        signatureVerified: true,
        externalConfirmationReceived: true,
        payloadSha256: 'a'.repeat(64),
        source: 'MOCK_HIE_CM_DEVELOPMENT',
        environment: 'development',
        isMocked: true,
        grantedAt: pastIso(1),
        expiresAt: futureIso(30),
        validationIssues: [],
        createdAt: pastIso(1),
        updatedAt: pastIso(1),
      };

      const mapped = abdmConsentFhirMapper.mapArtefactToFhirConsent(artefactDto);

      expect(mapped.targetResourceType).toBe('Consent');
      expect(mapped.validationErrors).toHaveLength(0);
      expect(mapped.officialIgConformanceClaimed).toBe(false);
      expect(mapped.originalExternalConsentId).toBe('abdm-consent-fhir-001');
      expect(mapped.originalPayloadSha256).toBe('a'.repeat(64));
      expect(mapped.unmappedFields.length).toBeGreaterThanOrEqual(4);
      expect(mapped.resource).toBeDefined();
      expect(mapped.resource?.status).toBe('active');
      expect(mapped.resource?.provision).toBeDefined();

      const structuralCheck = fhirR4Validator.validateResource(mapped.resource!, {
        strictAbdmProfile: false,
      });
      expect(structuralCheck.valid).toBe(true);
    });

    it('redacts sensitive tokens, secrets, and Aadhaar/ABHA identifiers in log payloads', () => {
      const redacted = redactAbdmLogPayload({
        clientSecret: 'super_secret_123',
        xToken: 'eyJhbGciOiJIUzI1NiJ9.sensitive',
        aadhaar: '123456789012',
        correlationId: '12345678-1234-4123-8123-1234567890ab',
      }) as Record<string, unknown>;

      expect(redacted.clientSecret).toBe('[REDACTED]');
      expect(redacted.xToken).toBe('[REDACTED]');
      expect(redacted.aadhaar).toBe('[REDACTED]');
      expect(redacted.correlationId).toBe('12345678-1234-4123-8123-1234567890ab');
    });
  });
});
