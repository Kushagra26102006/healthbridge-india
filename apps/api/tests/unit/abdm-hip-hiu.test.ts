/**
 * HealthBridge India — Day 7 Task 04
 * Unit & Mocked Workflow Tests for ABDM HIP / HIU Health Information Exchange:
 *   - Discovery (valid, invalid patient, invalid participant, duplicate, callback)
 *   - Care-Context Linking (separate from ABHA link & consent, duplicate guard, confirm, local unlink)
 *   - Consent Enforcement (valid, expired, revoked, wrong purpose, out-of-scope categories)
 *   - FHIR R4 DocumentBundle Generation & Validation (valid, missing Patient, invalid Observation,
 *     invalid DiagnosticReport, broken reference, duplicate resource, unsupported resource)
 *   - Encryption Adapter (mock local X25519 round-trip, private key never exposed, sandbox fail-closed)
 *   - HIP Packaging (authorized accepted, unauthorized participant rejected, consent enforced,
 *     data-category restrictions enforced, encrypted package created)
 *   - HIU Import (valid encrypted transfer, unencrypted rejected, ambiguous patient quarantined,
 *     duplicate import skipped, invalid FHIR bundle rejected)
 *   - State Machine & Transfer Acknowledgements (invalid transitions rejected, terminal states immutable,
 *     duplicate acknowledgement idempotency)
 *
 * NOTE: Uses synthetic records and mocked adapters (`isMocked: true`). Does NOT connect to live ABDM sandbox.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import crypto from 'crypto';
import { abdmFhirBundleService } from '../../src/modules/abdm/services/abdm-fhir-bundle.service';
import { fhirR4Validator } from '../../src/modules/abdm/validators/fhir-r4.validator';
import { abdmEncryptionAdapter } from '../../src/modules/abdm/adapters/abdm-encryption.adapter';
import { abdmHealthInformationDiscoveryService } from '../../src/modules/abdm/services/abdm-health-information-discovery.service';
import { abdmHealthRecordLinkingService } from '../../src/modules/abdm/services/abdm-health-record-linking.service';
import { abdmHipService } from '../../src/modules/abdm/services/abdm-hip.service';
import { abdmHiuService } from '../../src/modules/abdm/services/abdm-hiu.service';
import { abdmHealthInformationTransferService } from '../../src/modules/abdm/services/abdm-health-information-transfer.service';
import { abdmTransferAcknowledgementService } from '../../src/modules/abdm/services/abdm-transfer-acknowledgement.service';
import { abdmConsentValidationService } from '../../src/modules/abdm/services/abdm-consent-validation.service';
import { AbhaLinkModel } from '../../src/modules/abdm/models/abha-link.model';
import { AbdmDiscoveryRequestModel } from '../../src/modules/abdm/models/abdm-discovery-request.model';
import { AbdmLinkedHealthRecordModel } from '../../src/modules/abdm/models/abdm-linked-health-record.model';
import { AbdmConsentArtefactModel } from '../../src/modules/abdm/models/abdm-consent-artefact.model';
import { AbdmHealthInformationRequestModel } from '../../src/modules/abdm/models/abdm-health-information-request.model';
import { AbdmHealthInformationTransferModel } from '../../src/modules/abdm/models/abdm-health-information-transfer.model';
import { AbdmTransferPackageModel } from '../../src/modules/abdm/models/abdm-transfer-package.model';
import { AbdmTransferAcknowledgementModel } from '../../src/modules/abdm/models/abdm-transfer-acknowledgement.model';
import { AbdmImportedRecordModel } from '../../src/modules/abdm/models/abdm-imported-record.model';
import { UserModel } from '../../src/modules/users/models/user.model';

const devEnv: NodeJS.ProcessEnv = {
  ABDM_ENABLED: 'true',
  ABDM_ENVIRONMENT: 'development',
  ABDM_ALLOW_PRODUCTION: 'false',
  ABDM_IDENTIFIER_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
};

const sandboxEnv: NodeJS.ProcessEnv = {
  ABDM_ENABLED: 'true',
  ABDM_ENVIRONMENT: 'sandbox',
  ABDM_BASE_URL: 'https://dev.abdm.gov.in',
  ABDM_X_CM_ID: 'sbx',
  ABDM_CLIENT_ID: 'SBX_TEST_CLIENT',
  ABDM_CLIENT_SECRET: 'SBX_TEST_SECRET_VALUE',
  ABDM_ALLOW_PRODUCTION: 'false',
};

function makeInMemoryDoc<T extends Record<string, any>>(data: T) {
  const doc: any = {
    _id: data._id || new Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };
  doc.save = vi.fn(async () => doc);
  return doc;
}

describe('ABDM HIP / HIU Health Information Exchange — Unit Tests (Day 7 Task 04 — Mocked)', () => {
  const patientId = new Types.ObjectId().toString();
  const otherPatientId = new Types.ObjectId().toString();
  const abhaAddress = 'synthetic.patient@sbx';

  beforeEach(() => {
    vi.restoreAllMocks();
    abdmConsentValidationService.clearCache();
  });

  // ==========================================================================
  // 1. FHIR R4 BUNDLE GENERATION & VALIDATION (7 REQUIRED TEST CASES)
  // ==========================================================================
  describe('FHIR R4 DocumentBundle Generation & Validation', () => {
    it('generates a valid NRCeS-aligned DiagnosticReport DocumentBundle preserving exact values, units & ranges', async () => {
      const result = await abdmFhirBundleService.generateDocumentBundle({
        hiType: 'DiagnosticReport',
        patient: {
          id: patientId,
          fullName: 'Synthetic Patient',
          gender: 'female',
          dateOfBirth: '1990-05-15',
          abhaAddress,
          abhaVerified: true,
        },
        practitioner: {
          id: 'doc-1',
          fullName: 'Dr. Ananya Rao',
          registrationNumber: 'MCI-99881',
        },
        organization: {
          id: 'org-1',
          name: 'HealthBridge Synthetic Diagnostics',
          hfrFacilityId: 'IN2910000182',
        },
        diagnosticReport: {
          id: 'rep-1',
          reportNumber: 'LAB-2026-001',
          testName: 'Complete Blood Count',
          issuedAt: '2026-11-10T10:00:00Z',
          status: 'final',
          specimenType: 'Whole Blood EDTA',
          orderNumber: 'ORD-101',
          observations: [
            {
              parameterCode: 'HB',
              testName: 'Hemoglobin',
              value: '13.4',
              numericValue: 13.4,
              unit: 'g/dL',
              referenceRange: '12.0 - 15.5 g/dL',
              interpretation: 'NORMAL',
            },
          ],
        },
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.officialIgConformanceClaimed).toBe(false);
      expect(result.resourceCounts.Composition).toBe(1);
      expect(result.resourceCounts.Patient).toBe(1);
      expect(result.resourceCounts.DiagnosticReport).toBe(1);
      expect(result.resourceCounts.Observation).toBe(1);
      expect(result.resourceCounts.Provenance).toBe(1);

      const entries = (result.bundle as any).entry as Array<{ resource: any }>;
      expect(entries[0]?.resource.resourceType).toBe('Composition');
      const obs = entries.find((e) => e.resource.resourceType === 'Observation')?.resource;
      expect(obs.valueQuantity.value).toBe(13.4);
      expect(obs.valueQuantity.unit).toBe('g/dL');
      expect(obs.referenceRange[0].text).toBe('12.0 - 15.5 g/dL');
    });

    it('rejects DocumentBundle missing Patient resource or Patient reference', () => {
      const compId = crypto.randomUUID();
      const orgId = crypto.randomUUID();
      const bundle = {
        resourceType: 'Bundle',
        id: 'bundle-no-patient',
        type: 'document',
        timestamp: '2026-11-10T10:00:00Z',
        entry: [
          {
            fullUrl: `urn:uuid:${compId}`,
            resource: {
              resourceType: 'Composition',
              id: compId,
              status: 'final',
              type: { text: 'OP Note' },
              subject: { reference: `urn:uuid:${orgId}` },
              date: '2026-11-10T10:00:00Z',
              author: [{ reference: `urn:uuid:${orgId}` }],
              title: 'OP Note',
            },
          },
          {
            fullUrl: `urn:uuid:${orgId}`,
            resource: { resourceType: 'Organization', id: orgId, name: 'Clinic' },
          },
        ],
      };

      const validation = fhirR4Validator.validateResource(bundle, { strictAbdmProfile: true });
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.code === 'BUNDLE_PATIENT_RESOURCE_MISSING')).toBe(true);
    });

    it('rejects invalid Observation and invalid DiagnosticReport resources', () => {
      const obsCheck = fhirR4Validator.validateResource({
        resourceType: 'Observation',
        id: 'obs-bad',
        status: 'not-a-valid-status',
      });
      expect(obsCheck.valid).toBe(false);
      expect(obsCheck.errors.some((e) => e.code === 'OBSERVATION_STATUS_INVALID')).toBe(true);

      const drCheck = fhirR4Validator.validateResource({
        resourceType: 'DiagnosticReport',
        id: 'dr-bad',
        status: 'bad-status',
      });
      expect(drCheck.valid).toBe(false);
      expect(drCheck.errors.some((e) => e.code === 'DIAGNOSTIC_REPORT_STATUS_INVALID')).toBe(true);
    });

    it('rejects broken internal references, duplicate resources, and unsupported resource types', () => {
      const compId = crypto.randomUUID();
      const patId = crypto.randomUUID();
      const brokenBundle = {
        resourceType: 'Bundle',
        id: 'bundle-broken-dup',
        type: 'document',
        timestamp: '2026-11-10T10:00:00Z',
        entry: [
          {
            fullUrl: `urn:uuid:${compId}`,
            resource: {
              resourceType: 'Composition',
              id: compId,
              status: 'final',
              type: { text: 'OP Note' },
              subject: { reference: `urn:uuid:${patId}` },
              date: '2026-11-10T10:00:00Z',
              author: [{ reference: 'urn:uuid:00000000-0000-4000-8000-000000000099' }], // broken!
              title: 'OP Note',
            },
          },
          {
            fullUrl: `urn:uuid:${patId}`,
            resource: { resourceType: 'Patient', id: patId, name: [{ text: 'Test' }] },
          },
          {
            fullUrl: `urn:uuid:${patId}`, // duplicate!
            resource: { resourceType: 'Patient', id: patId, name: [{ text: 'Test' }] },
          },
          {
            fullUrl: `urn:uuid:${crypto.randomUUID()}`,
            resource: { resourceType: 'UnsupportedCustomResource', id: 'u1' }, // unsupported!
          },
        ],
      };

      const res = fhirR4Validator.validateResource(brokenBundle, { strictAbdmProfile: true });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.code === 'UNRESOLVED_BUNDLE_REFERENCE')).toBe(true);
      expect(res.errors.some((e) => e.code === 'DUPLICATE_BUNDLE_RESOURCE')).toBe(true);
      expect(res.errors.some((e) => e.code === 'UNSUPPORTED_RESOURCE_TYPE')).toBe(true);
    });
  });

  // ==========================================================================
  // 2. ENCRYPTION ADAPTER & PRIVATE KEY SECURITY
  // ==========================================================================
  describe('AbdmEncryptionAdapter (Fidelius Protocol Architecture)', () => {
    it('encrypts & decrypts round-trip in mocked dev mode without exposing private keys and purges session keys', () => {
      const sessionId = `txn-enc-${crypto.randomUUID()}`;
      const hiuHandle = abdmEncryptionAdapter.generateEphemeralKeyMaterial(sessionId, devEnv);

      // Verify private key is NEVER present in returned handle
      const serialized = JSON.stringify(hiuHandle);
      expect(serialized).not.toContain('privateKey');
      expect(serialized).not.toContain('PRIVATE KEY');

      const sampleBundle = JSON.stringify({ resourceType: 'Bundle', id: 'synthetic-1' });
      const encrypted = abdmEncryptionAdapter.encryptBundleForPeer(
        sampleBundle,
        hiuHandle.keyMaterial,
        undefined,
        devEnv
      );
      expect(encrypted.isMocked).toBe(true);
      expect(encrypted.providerMode).toBe('MOCK_LOCAL_X25519_NOT_BOUNCYCASTLE_WEIERSTRASS');
      expect(encrypted.ciphertextBase64).not.toContain('synthetic-1');

      const decrypted = abdmEncryptionAdapter.decryptBundleFromPeer(
        encrypted.ciphertextBase64,
        encrypted.senderKeyMaterial,
        sessionId,
        devEnv
      );
      expect(decrypted.plaintext).toBe(sampleBundle);

      // Purging key blocks subsequent reuse
      abdmEncryptionAdapter.purgeSessionKey(sessionId);
      expect(() =>
        abdmEncryptionAdapter.decryptBundleFromPeer(
          encrypted.ciphertextBase64,
          encrypted.senderKeyMaterial,
          sessionId,
          devEnv
        )
      ).toThrow(/missing or expired/i);
    });

    it('fails closed in sandbox mode because live BouncyCastle short-Weierstrass Fidelius is not configured', () => {
      const readiness = abdmEncryptionAdapter.getReadiness(sandboxEnv);
      expect(readiness.liveFideliusConfigured).toBe(false);
      expect(readiness.providerMode).toBe('NOT_CONFIGURED');

      expect(() =>
        abdmEncryptionAdapter.generateEphemeralKeyMaterial('txn-sbx-1', sandboxEnv)
      ).toThrow(/not configured/i);
    });
  });

  // ==========================================================================
  // 3. DISCOVERY & HEALTH-RECORD LINKING
  // ==========================================================================
  describe('Discovery & Health-Record Linking Workflows', () => {
    it('handles valid discovery, invalid patient/participant, duplicate prevention, and discovery callback', async () => {
      vi.spyOn(AbhaLinkModel, 'findOne').mockResolvedValue({
        patientId: new Types.ObjectId(patientId),
        abhaAddress,
        isActive: true,
        verificationStatus: 'VERIFIED',
      } as any);

      const createdDocs: any[] = [];
      vi.spyOn(AbdmDiscoveryRequestModel, 'findOne').mockImplementation((async (q: any) => {
        if (q?.externalTransactionRef) {
          return createdDocs.find((d) => d.externalTransactionRef === q.externalTransactionRef) || null;
        }
        if (q?.status === 'DISCOVERY_PENDING') {
          return createdDocs.find((d) => d.participantId === q.participantId && d.status === 'DISCOVERY_PENDING') || null;
        }
        return null;
      }) as any);
      vi.spyOn(AbdmDiscoveryRequestModel, 'create').mockImplementation(async (data: any) => {
        const doc = makeInMemoryDoc(data);
        createdDocs.push(doc);
        return doc;
      });
      vi.spyOn(AbdmLinkedHealthRecordModel, 'find').mockReturnValue({
        select: vi.fn().mockResolvedValue([]),
      } as any);

      // Invalid participant rejected
      await expect(
        abdmHealthInformationDiscoveryService.initiateDiscovery(
          {
            actorId: patientId,
            actorRole: 'PATIENT',
            participantId: 'bad participant !!',
            requestedCategories: ['OPConsultation'],
          },
          devEnv
        )
      ).rejects.toThrow(/Invalid ABDM participant/i);

      // Cross-patient attempt rejected
      await expect(
        abdmHealthInformationDiscoveryService.initiateDiscovery(
          {
            actorId: patientId,
            actorRole: 'PATIENT',
            patientId: otherPatientId,
            participantId: 'IN2910000182',
            requestedCategories: ['OPConsultation'],
          },
          devEnv
        )
      ).rejects.toThrow(/own health records/i);

      // Valid discovery created
      const disc = await abdmHealthInformationDiscoveryService.initiateDiscovery(
        {
          actorId: patientId,
          actorRole: 'PATIENT',
          participantId: 'IN2910000182',
          requestedCategories: ['OPConsultation', 'DiagnosticReport'],
        },
        devEnv
      );
      expect(disc.status).toBe('DISCOVERY_PENDING');
      expect(disc.isMocked).toBe(true);

      // Duplicate pending discovery blocked
      await expect(
        abdmHealthInformationDiscoveryService.initiateDiscovery(
          {
            actorId: patientId,
            actorRole: 'PATIENT',
            participantId: 'IN2910000182',
            requestedCategories: ['OPConsultation'],
          },
          devEnv
        )
      ).rejects.toThrow(/already pending/i);

      // Discovery callback completes and deduplicates on replay
      const cb1 = await abdmHealthInformationDiscoveryService.processDiscoveryCallback({
        eventId: 'evt-disc-1',
        timestamp: new Date().toISOString(),
        externalTransactionRef: disc.externalTransactionRef!,
        participantId: 'IN2910000182',
        status: 'DISCOVERY_COMPLETED',
        careContexts: [
          {
            careContextReference: 'CC-OPD-101',
            display: 'OPD Visit Nov 2026',
            hiTypes: ['OPConsultation'],
          },
        ],
      });
      expect(cb1.duplicate).toBe(false);
      expect(cb1.discovery.status).toBe('DISCOVERY_COMPLETED');
      expect(cb1.discovery.discoveredCareContexts).toHaveLength(1);

      const cb2 = await abdmHealthInformationDiscoveryService.processDiscoveryCallback({
        eventId: 'evt-disc-1',
        timestamp: new Date().toISOString(),
        externalTransactionRef: disc.externalTransactionRef!,
        participantId: 'IN2910000182',
        status: 'DISCOVERY_COMPLETED',
        careContexts: [],
      });
      expect(cb2.duplicate).toBe(true);
    });

    it('links care contexts separately from ABHA identity, prevents duplicates, confirms, and unlinks locally', async () => {
      vi.spyOn(AbhaLinkModel, 'findOne').mockResolvedValue({
        patientId: new Types.ObjectId(patientId),
        abhaAddress,
        isActive: true,
        verificationStatus: 'VERIFIED',
      } as any);

      const links: any[] = [];
      vi.spyOn(AbdmLinkedHealthRecordModel, 'findOne').mockImplementation((async (q: any) => {
        return links.find(
          (l) =>
            l.participantId === q.participantId &&
            l.careContextReference === q.careContextReference &&
            ['LINKING_PENDING', 'OTP_VERIFICATION_PENDING', 'LINKED'].includes(l.status)
        ) || null;
      }) as any);
      vi.spyOn(AbdmLinkedHealthRecordModel, 'findById').mockImplementation((async (id: any) => {
        return links.find((l) => String(l._id) === String(id)) || null;
      }) as any);
      vi.spyOn(AbdmLinkedHealthRecordModel, 'create').mockImplementation(async (data: any) => {
        const doc = makeInMemoryDoc(data);
        links.push(doc);
        return doc;
      });

      const created = await abdmHealthRecordLinkingService.initiateLinking(
        {
          actorId: patientId,
          actorRole: 'PATIENT',
          participantId: 'IN2910000182',
          careContextReference: 'CC-LAB-202',
          careContextDisplay: 'CBC Report Nov 2026',
          hiTypes: ['DiagnosticReport'],
          linkMode: 'USER_INITIATED',
        },
        devEnv
      );
      expect(created.status).toBe('OTP_VERIFICATION_PENDING');

      // Duplicate link rejected
      await expect(
        abdmHealthRecordLinkingService.initiateLinking(
          {
            actorId: patientId,
            actorRole: 'PATIENT',
            participantId: 'IN2910000182',
            careContextReference: 'CC-LAB-202',
            careContextDisplay: 'CBC Report Nov 2026',
            hiTypes: ['DiagnosticReport'],
            linkMode: 'USER_INITIATED',
          },
          devEnv
        )
      ).rejects.toThrow(/already linked or pending/i);

      const confirmed = await abdmHealthRecordLinkingService.confirmLinking({
        linkId: created.id,
        actorId: patientId,
        actorRole: 'PATIENT',
        otpToken: '654321',
        confirmed: true,
      });
      expect(confirmed.status).toBe('LINKED');

      const unlinked = await abdmHealthRecordLinkingService.unlinkRecord(
        created.id,
        patientId,
        'PATIENT',
        'Patient requested local unlink'
      );
      expect(unlinked.status).toBe('UNLINKED_LOCALLY');
      expect(unlinked.unlinkScope).toBe('LOCAL_HEALTHBRIDGE_UNLINK_ONLY');
    });
  });

  // ==========================================================================
  // 4. HIP PACKAGING, CONSENT ENFORCEMENT & DATA-CATEGORY RESTRICTIONS
  // ==========================================================================
  describe('HIP Workflow & Centralized Consent Enforcement', () => {
    const validArtefact = () =>
      makeInMemoryDoc({
        externalConsentId: 'consent-ext-100',
        origin: 'ABDM_HIE_CM',
        patientId: new Types.ObjectId(patientId),
        hiuId: 'HIU-APP-01',
        hipId: 'HEALTHBRIDGE_HIP_SBX',
        purposeCode: 'CAREMGT',
        hiTypes: ['DiagnosticReport'],
        dateRange: {
          from: new Date('2026-01-01T00:00:00Z'),
          to: new Date('2026-12-31T23:59:59Z'),
        },
        dataEraseAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        externalStatus: 'GRANTED',
        validationStatus: 'VALID',
        revocationStatus: 'NOT_REVOKED',
        signatureVerified: true,
        externalConfirmationReceived: true,
      });

    it('accepts authorized HIP request, packages only permitted HI types, and encrypts transfer payload', async () => {
      const artefact = validArtefact();
      const transfers: any[] = [];
      const acks: any[] = [];

      vi.spyOn(AbdmConsentArtefactModel, 'findOne').mockResolvedValue(artefact);
      vi.spyOn(AbdmHealthInformationRequestModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(AbdmHealthInformationRequestModel, 'create').mockImplementation(async (d: any) =>
        makeInMemoryDoc(d)
      );
      vi.spyOn(AbdmHealthInformationTransferModel, 'create').mockImplementation(async (d: any) => {
        const doc = makeInMemoryDoc(d);
        transfers.push(doc);
        return doc;
      });
      vi.spyOn(AbdmHealthInformationTransferModel, 'findOne').mockImplementation((async (q: any) => {
        return transfers.find((t) => t.externalTransactionId === q.externalTransactionId) || null;
      }) as any);
      vi.spyOn(AbdmHealthInformationTransferModel, 'findById').mockImplementation((async (id: any) => {
        return transfers.find((t) => String(t._id) === String(id)) || null;
      }) as any);
      vi.spyOn(AbdmTransferPackageModel, 'create').mockImplementation(async (d: any) =>
        makeInMemoryDoc(d)
      );
      vi.spyOn(AbdmTransferAcknowledgementModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(AbdmTransferAcknowledgementModel, 'create').mockImplementation(async (d: any) => {
        const doc = makeInMemoryDoc(d);
        acks.push(doc);
        return doc;
      });
      vi.spyOn(UserModel, 'findById').mockReturnValue({
        select: () => ({ lean: async () => ({ firstName: 'Asha', lastName: 'Verma' }) }),
      } as any);
      vi.spyOn(AbhaLinkModel, 'findOne').mockReturnValue({
        lean: async () => ({ abhaAddress }),
      } as any);

      const hiuKeyHandle = abdmEncryptionAdapter.generateEphemeralKeyMaterial('peer-hiu-1', devEnv);

      const result = await abdmHipService.processIncomingHealthInfoRequest(
        {
          externalTransactionId: 'txn-hip-100',
          timestamp: new Date().toISOString(),
          consentArtefactId: String(artefact._id),
          hiuId: 'HIU-APP-01',
          hipId: 'HEALTHBRIDGE_HIP_SBX',
          purposeCode: 'CAREMGT',
          hiTypes: ['DiagnosticReport'],
          dateRange: {
            from: '2026-06-01T00:00:00Z',
            to: '2026-11-15T00:00:00Z',
          },
          dataPushUrl: 'https://hiu.example.org/data-push',
          keyMaterial: hiuKeyHandle.keyMaterial,
          syntheticRecords: {
            patientName: 'Asha Verma',
            diagnosticReports: [
              {
                id: 'lab-1',
                reportNumber: 'RPT-500',
                testName: 'Lipid Profile',
                issuedAt: '2026-10-01T08:00:00Z',
                observations: [
                  {
                    testName: 'Total Cholesterol',
                    value: '185',
                    numericValue: 185,
                    unit: 'mg/dL',
                    referenceRange: '< 200 mg/dL',
                    interpretation: 'NORMAL',
                  },
                ],
              },
            ],
          },
        },
        devEnv
      );

      expect(result.isMocked).toBe(true);
      expect(result.packages).toHaveLength(1);
      expect(result.packages[0]?.hiType).toBe('DiagnosticReport');
      expect(result.packages[0]?.encryptionApplied).toBe(true);
      expect(result.transfer.status).toBe('COMPLETED');
      expect(acks).toHaveLength(1);

      abdmEncryptionAdapter.purgeSessionKey('peer-hiu-1');
    });

    it('rejects HIP requests for unauthorized participant, expired consent, revoked consent, wrong purpose, or out-of-scope HI types', async () => {
      const hiuKeyHandle = abdmEncryptionAdapter.generateEphemeralKeyMaterial('peer-hiu-2', devEnv);
      vi.spyOn(AbdmHealthInformationRequestModel, 'findOne').mockResolvedValue(null);

      // 1. Unauthorized HIU participant
      vi.spyOn(AbdmConsentArtefactModel, 'findOne').mockResolvedValue(validArtefact());
      await expect(
        abdmHipService.processIncomingHealthInfoRequest(
          {
            externalTransactionId: 'txn-hip-unauth',
            timestamp: new Date().toISOString(),
            consentArtefactId: 'consent-ext-100',
            hiuId: 'ROGUE-HIU-999',
            dateRange: { from: '2026-06-01T00:00:00Z', to: '2026-11-15T00:00:00Z' },
            dataPushUrl: 'https://hiu.example.org/data-push',
            keyMaterial: hiuKeyHandle.keyMaterial,
          },
          devEnv
        )
      ).rejects.toThrow(/does not match Consent Artefact/i);

      // 2. Expired consent
      const expiredArtefact = validArtefact();
      expiredArtefact.expiresAt = new Date(Date.now() - 60_000);
      expiredArtefact.dataEraseAt = new Date(Date.now() - 60_000);
      vi.spyOn(AbdmConsentArtefactModel, 'findOne').mockResolvedValue(expiredArtefact);
      await expect(
        abdmHipService.processIncomingHealthInfoRequest(
          {
            externalTransactionId: 'txn-hip-exp',
            timestamp: new Date().toISOString(),
            consentArtefactId: 'consent-ext-100',
            hiuId: 'HIU-APP-01',
            dateRange: { from: '2026-06-01T00:00:00Z', to: '2026-11-15T00:00:00Z' },
            dataPushUrl: 'https://hiu.example.org/data-push',
            keyMaterial: hiuKeyHandle.keyMaterial,
          },
          devEnv
        )
      ).rejects.toThrow(/consent authorization/i);

      // 3. Revoked consent
      const revokedArtefact = validArtefact();
      revokedArtefact.externalStatus = 'REVOKED';
      revokedArtefact.revocationStatus = 'CONFIRMED_REVOKED';
      vi.spyOn(AbdmConsentArtefactModel, 'findOne').mockResolvedValue(revokedArtefact);
      await expect(
        abdmHipService.processIncomingHealthInfoRequest(
          {
            externalTransactionId: 'txn-hip-rev',
            timestamp: new Date().toISOString(),
            consentArtefactId: 'consent-ext-100',
            hiuId: 'HIU-APP-01',
            dateRange: { from: '2026-06-01T00:00:00Z', to: '2026-11-15T00:00:00Z' },
            dataPushUrl: 'https://hiu.example.org/data-push',
            keyMaterial: hiuKeyHandle.keyMaterial,
          },
          devEnv
        )
      ).rejects.toThrow(/consent authorization/i);

      // 4. Wrong purpose
      vi.spyOn(AbdmConsentArtefactModel, 'findOne').mockResolvedValue(validArtefact());
      await expect(
        abdmHipService.processIncomingHealthInfoRequest(
          {
            externalTransactionId: 'txn-hip-purpose',
            timestamp: new Date().toISOString(),
            consentArtefactId: 'consent-ext-100',
            hiuId: 'HIU-APP-01',
            purposeCode: 'DSRCH',
            hiTypes: ['DiagnosticReport'],
            dateRange: { from: '2026-06-01T00:00:00Z', to: '2026-11-15T00:00:00Z' },
            dataPushUrl: 'https://hiu.example.org/data-push',
            keyMaterial: hiuKeyHandle.keyMaterial,
          },
          devEnv
        )
      ).rejects.toThrow(/consent authorization/i);

      // 5. Out-of-scope category (Prescription requested when only DiagnosticReport granted)
      await expect(
        abdmHipService.processIncomingHealthInfoRequest(
          {
            externalTransactionId: 'txn-hip-scope',
            timestamp: new Date().toISOString(),
            consentArtefactId: 'consent-ext-100',
            hiuId: 'HIU-APP-01',
            purposeCode: 'CAREMGT',
            hiTypes: ['Prescription'],
            dateRange: { from: '2026-06-01T00:00:00Z', to: '2026-11-15T00:00:00Z' },
            dataPushUrl: 'https://hiu.example.org/data-push',
            keyMaterial: hiuKeyHandle.keyMaterial,
          },
          devEnv
        )
      ).rejects.toThrow(/consent authorization/i);

      abdmEncryptionAdapter.purgeSessionKey('peer-hiu-2');
    });
  });

  // ==========================================================================
  // 5. HIU IMPORT, QUARANTINE, DEDUPLICATION, UNENCRYPTED REJECTION & ACKS
  // ==========================================================================
  describe('HIU Encrypted Import, Quarantine, Deduplication & State Machine', () => {
    it('imports valid encrypted FHIR bundle, blocks unencrypted push, quarantines ambiguous patient, skips duplicates, and rejects invalid FHIR', async () => {
      const artefact = makeInMemoryDoc({
        externalConsentId: 'consent-hiu-500',
        origin: 'ABDM_HIE_CM',
        patientId: new Types.ObjectId(patientId),
        hiuId: 'HEALTHBRIDGE_HIU',
        purposeCode: 'CAREMGT',
        hiTypes: ['DiagnosticReport'],
        dateRange: {
          from: new Date('2026-01-01T00:00:00Z'),
          to: new Date('2026-12-31T23:59:59Z'),
        },
        dataEraseAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        externalStatus: 'GRANTED',
        validationStatus: 'VALID',
        revocationStatus: 'NOT_REVOKED',
        signatureVerified: true,
        externalConfirmationReceived: true,
      });

      const transfers: any[] = [];
      const imports: any[] = [];
      const acks: any[] = [];

      vi.spyOn(AbdmConsentArtefactModel, 'findOne').mockResolvedValue(artefact);
      vi.spyOn(AbdmConsentArtefactModel, 'findById').mockResolvedValue(artefact);
      vi.spyOn(AbdmHealthInformationRequestModel, 'create').mockImplementation(async (d: any) =>
        makeInMemoryDoc(d)
      );
      vi.spyOn(AbdmHealthInformationTransferModel, 'create').mockImplementation(async (d: any) => {
        const doc = makeInMemoryDoc(d);
        transfers.push(doc);
        return doc;
      });
      vi.spyOn(AbdmHealthInformationTransferModel, 'findOne').mockImplementation((async (q: any) => {
        return transfers.find((t) => t.externalTransactionId === q.externalTransactionId) || null;
      }) as any);
      vi.spyOn(AbdmHealthInformationTransferModel, 'findById').mockImplementation((async (id: any) => {
        return transfers.find((t) => String(t._id) === String(id)) || null;
      }) as any);
      vi.spyOn(AbdmImportedRecordModel, 'findOne').mockImplementation((async (q: any) => {
        return (
          imports.find(
            (i) =>
              i.careContextReference === q.careContextReference &&
              i.bundleSha256 === q.bundleSha256
          ) || null
        );
      }) as any);
      vi.spyOn(AbdmImportedRecordModel, 'create').mockImplementation(async (d: any) => {
        const doc = makeInMemoryDoc(d);
        imports.push(doc);
        return doc;
      });
      vi.spyOn(AbdmTransferAcknowledgementModel, 'findOne').mockImplementation((async (q: any) => {
        return (
          acks.find(
            (a) =>
              a.acknowledgementRef === q.acknowledgementRef &&
              a.externalTransactionId === q.externalTransactionId &&
              a.ackType === q.ackType
          ) || null
        );
      }) as any);
      vi.spyOn(AbdmTransferAcknowledgementModel, 'create').mockImplementation(async (d: any) => {
        const doc = makeInMemoryDoc(d);
        acks.push(doc);
        return doc;
      });
      vi.spyOn(AbhaLinkModel, 'findOne').mockReturnValue({
        lean: async () => ({ abhaAddress }),
      } as any);

      // Step 1: Initiate HIU request
      const initRes = await abdmHiuService.initiateHealthInfoRequest(
        {
          actorId: patientId,
          actorRole: 'PATIENT',
          consentArtefactId: String(artefact._id),
          participantId: 'EXTERNAL-HIP-01',
          hiTypes: ['DiagnosticReport'],
          purposeCode: 'CAREMGT',
          dateRange: { from: '2026-06-01T00:00:00Z', to: '2026-11-15T00:00:00Z' },
        },
        devEnv
      );

      // Step 2: Unencrypted data push MUST be rejected
      await expect(
        abdmHiuService.receiveDataPushCallback(
          {
            pageNumber: 0,
            pageCount: 1,
            transactionId: initRes.transfer.externalTransactionId!,
            entries: [
              {
                content: '{"resourceType":"Bundle"}',
                media: 'application/fhir+json',
                careContextReference: 'CC-UNENC',
                encrypted: false,
              },
            ],
          },
          devEnv
        )
      ).rejects.toThrow(/Unencrypted health information payload rejected/i);

      // Step 3: Cross-participant push MUST be rejected
      await expect(
        abdmHiuService.receiveDataPushCallback(
          {
            pageNumber: 0,
            pageCount: 1,
            transactionId: initRes.transfer.externalTransactionId!,
            sourceParticipantId: 'ROGUE-HIP-999',
            entries: [
              {
                content: 'cipher',
                media: 'application/fhir+json',
                careContextReference: 'CC-1',
                encrypted: true,
              },
            ],
            keyMaterial: initRes.ephemeralKeyMaterial,
          },
          devEnv
        )
      ).rejects.toThrow(/source participant does not match/i);

      // Step 4: Prepare 3 encrypted entries:
      //   (a) Valid matching patient bundle
      //   (b) Valid bundle with ambiguous/mismatched patient -> QUARANTINED_REVIEW
      //   (c) Invalid FHIR bundle -> REJECTED
      const validBundleRes = await abdmFhirBundleService.generateDocumentBundle({
        hiType: 'DiagnosticReport',
        patient: { id: patientId, fullName: 'Asha Verma', abhaAddress, abhaVerified: true },
        practitioner: { id: 'p1', fullName: 'Dr. Roy' },
        organization: { id: 'o1', name: 'Apollo Sandbox Lab' },
        diagnosticReport: {
          id: 'dr1',
          reportNumber: 'R1',
          testName: 'CBC',
          issuedAt: '2026-10-10T10:00:00Z',
          status: 'final',
          observations: [
            { testName: 'WBC', value: '6.5', numericValue: 6.5, unit: '10^3/uL', referenceRange: '4.0-11.0' },
          ],
        },
      });
      const ambiguousBundleRes = await abdmFhirBundleService.generateDocumentBundle({
        hiType: 'DiagnosticReport',
        patient: { id: 'unknown-mrn-999', fullName: 'Unknown Person', abhaAddress: 'other@sbx', abhaVerified: true },
        practitioner: { id: 'p2', fullName: 'Dr. Roy' },
        organization: { id: 'o2', name: 'Apollo Sandbox Lab' },
        diagnosticReport: {
          id: 'dr2',
          reportNumber: 'R2',
          testName: 'Thyroid Panel',
          issuedAt: '2026-10-11T10:00:00Z',
          status: 'final',
          observations: [],
        },
      });

      const encValid = abdmEncryptionAdapter.encryptBundleForPeer(
        JSON.stringify(validBundleRes.bundle),
        initRes.ephemeralKeyMaterial,
        undefined,
        devEnv
      );
      // Encrypt all 3 using the same sender key material by running separate page or encrypt with matching session
      const push1 = await abdmHiuService.receiveDataPushCallback(
        {
          pageNumber: 0,
          pageCount: 3, // keep ephemeral key alive for page 1 & 2
          transactionId: initRes.transfer.externalTransactionId!,
          sourceParticipantId: 'EXTERNAL-HIP-01',
          entries: [
            {
              content: encValid.ciphertextBase64,
              media: 'application/fhir+json',
              careContextReference: 'CC-VALID-1',
              encrypted: true,
            },
            // Duplicate of same bundle -> skipped!
            {
              content: encValid.ciphertextBase64,
              media: 'application/fhir+json',
              careContextReference: 'CC-VALID-1',
              encrypted: true,
            },
          ],
          keyMaterial: encValid.senderKeyMaterial,
        },
        devEnv
      );

      expect(push1.imported).toHaveLength(1);
      expect(push1.duplicatesSkipped).toBe(1);
      expect(push1.imported[0]?.readOnly).toBe(true);
      expect(push1.imported[0]?.provenance.sourceOrganizationName).toBe('Apollo Sandbox Lab');

      // Now test ambiguous patient quarantine & invalid FHIR bundle on a fresh HIU transfer
      const initRes2 = await abdmHiuService.initiateHealthInfoRequest(
        {
          actorId: patientId,
          actorRole: 'PATIENT',
          consentArtefactId: String(artefact._id),
          participantId: 'EXTERNAL-HIP-01',
          hiTypes: ['DiagnosticReport'],
          purposeCode: 'CAREMGT',
          dateRange: { from: '2026-06-01T00:00:00Z', to: '2026-11-15T00:00:00Z' },
        },
        devEnv
      );
      const encAmbiguous = abdmEncryptionAdapter.encryptBundleForPeer(
        JSON.stringify(ambiguousBundleRes.bundle),
        initRes2.ephemeralKeyMaterial,
        undefined,
        devEnv
      );
      const push2 = await abdmHiuService.receiveDataPushCallback(
        {
          pageNumber: 0,
          pageCount: 1,
          transactionId: initRes2.transfer.externalTransactionId!,
          sourceParticipantId: 'EXTERNAL-HIP-01',
          entries: [
            {
              content: encAmbiguous.ciphertextBase64,
              media: 'application/fhir+json',
              careContextReference: 'CC-AMBIGUOUS-2',
              encrypted: true,
            },
          ],
          keyMaterial: encAmbiguous.senderKeyMaterial,
        },
        devEnv
      );
      expect(push2.quarantined).toHaveLength(1);
      expect(push2.quarantined[0]?.reviewStatus).toBe('QUARANTINED_REVIEW');
      expect(push2.transfer.status).toBe('REQUIRES_REVIEW');

      // Test invalid FHIR bundle rejection
      const initRes3 = await abdmHiuService.initiateHealthInfoRequest(
        {
          actorId: patientId,
          actorRole: 'PATIENT',
          consentArtefactId: String(artefact._id),
          participantId: 'EXTERNAL-HIP-01',
          hiTypes: ['DiagnosticReport'],
          purposeCode: 'CAREMGT',
          dateRange: { from: '2026-06-01T00:00:00Z', to: '2026-11-15T00:00:00Z' },
        },
        devEnv
      );
      const encInvalid = abdmEncryptionAdapter.encryptBundleForPeer(
        JSON.stringify({ resourceType: 'Bundle', id: 'bad', type: 'document', entry: [] }),
        initRes3.ephemeralKeyMaterial,
        undefined,
        devEnv
      );
      const push3 = await abdmHiuService.receiveDataPushCallback(
        {
          pageNumber: 0,
          pageCount: 1,
          transactionId: initRes3.transfer.externalTransactionId!,
          sourceParticipantId: 'EXTERNAL-HIP-01',
          entries: [
            {
              content: encInvalid.ciphertextBase64,
              media: 'application/fhir+json',
              careContextReference: 'CC-INVALID-3',
              encrypted: true,
            },
          ],
          keyMaterial: encInvalid.senderKeyMaterial,
        },
        devEnv
      );
      expect(push3.imported).toHaveLength(0);
      expect(push3.rejectedEntries).toHaveLength(1);
      expect(push3.transfer.status).toBe('FAILED');

      // Test duplicate acknowledgement idempotency & terminal state protection
      const ack1 = await abdmTransferAcknowledgementService.processAcknowledgement(
        {
          acknowledgementRef: 'ACK-IDEMP-001',
          externalTransactionId: initRes.transfer.externalTransactionId!,
          role: 'HIU',
          ackType: 'TRANSFER_COMPLETED',
          externalSessionStatus: 'TRANSFERRED',
          careContextStatuses: [{ careContextReference: 'CC-VALID-1', hiStatus: 'DELIVERED' }],
        },
        devEnv
      );
      expect(ack1.duplicate).toBe(false);

      const ack2 = await abdmTransferAcknowledgementService.processAcknowledgement(
        {
          acknowledgementRef: 'ACK-IDEMP-001',
          externalTransactionId: initRes.transfer.externalTransactionId!,
          role: 'HIU',
          ackType: 'TRANSFER_COMPLETED',
          externalSessionStatus: 'TRANSFERRED',
          careContextStatuses: [{ careContextReference: 'CC-VALID-1', hiStatus: 'DELIVERED' }],
        },
        devEnv
      );
      expect(ack2.duplicate).toBe(true);

      // Completed transfer cannot be overwritten back to FAILED
      const completedTransfer = transfers.find(
        (t) => t.externalTransactionId === initRes.transfer.externalTransactionId
      );
      await expect(
        abdmHealthInformationTransferService.transitionState({
          transfer: completedTransfer,
          toState: 'FAILED',
          source: 'ABDM_CALLBACK',
        })
      ).rejects.toThrow(/terminal state/i);
    });
  });
});
