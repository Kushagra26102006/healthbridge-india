/**
 * HealthBridge India — Day 7 Task 01
 * Comprehensive Unit Tests for ABDM Configuration, HTTP Client, Redaction,
 * FHIR R4 Mapping & NRCeS Structural Validation, and Consent Adapter Separation.
 *
 * NOTE: All external HTTP calls and tokens in this suite are mocked.
 * Passing these unit tests verifies internal architecture only — NOT live ABDM sandbox connectivity.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { abdmConfigurationService } from '../../src/modules/abdm/services/abdm-configuration.service';
import { abdmAuthenticationService } from '../../src/modules/abdm/services/abdm-authentication.service';
import { AbdmHttpClient } from '../../src/modules/abdm/clients/abdm-http.client';
import { redactAbdmLogPayload } from '../../src/modules/abdm/utils/redaction';
import { abdmFhirMapperService } from '../../src/modules/abdm/mappers/abdm-fhir.mapper';
import { fhirR4Validator } from '../../src/modules/abdm/validators/fhir-r4.validator';
import { abdmConsentAdapter } from '../../src/modules/abdm/adapters/abdm-consent.adapter';
import { AbdmIntegrationError } from '../../src/modules/abdm/errors/abdm-error';

describe('ABDM Integration Foundation — Unit Tests (Day 7 Task 01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    abdmAuthenticationService.clearToken();
    abdmAuthenticationService.setTokenFetcher(undefined);
  });

  // ===========================================================================
  // 1. CONFIGURATION & INTEGRATION MODE SECURITY
  // ===========================================================================
  describe('1. Configuration & Integration Modes', () => {
    it('allows disabled mode without any credentials', () => {
      const cfg = abdmConfigurationService.assertValidWhenEnabled({
        ABDM_ENABLED: 'false',
        ABDM_ENVIRONMENT: 'disabled',
      });
      expect(cfg.enabled).toBe(false);
      expect(cfg.environment).toBe('disabled');
    });

    it('rejects missing/placeholder credentials when sandbox mode is enabled', () => {
      expect(() =>
        abdmConfigurationService.assertValidWhenEnabled({
          ABDM_ENABLED: 'true',
          ABDM_ENVIRONMENT: 'sandbox',
          ABDM_BASE_URL: 'https://dev.abdm.gov.in',
          ABDM_CLIENT_ID: 'your_abdm_sandbox_client_id',
          ABDM_CLIENT_SECRET: '',
        })
      ).toThrow(AbdmIntegrationError);
    });

    it('rejects invalid ABDM_ENVIRONMENT values', () => {
      expect(() =>
        abdmConfigurationService.loadConfig({
          ABDM_ENABLED: 'true',
          ABDM_ENVIRONMENT: 'staging_invalid',
        })
      ).toThrow(/Invalid ABDM_ENVIRONMENT/i);
    });

    it('keeps production mode locked by default even when credentials are present', () => {
      expect(() =>
        abdmConfigurationService.assertValidWhenEnabled({
          ABDM_ENABLED: 'true',
          ABDM_ENVIRONMENT: 'production',
          ABDM_BASE_URL: 'https://live.abdm.gov.in',
          ABDM_X_CM_ID: 'abdm',
          ABDM_CLIENT_ID: 'PROD_ID_REAL',
          ABDM_CLIENT_SECRET: 'PROD_SECRET_REAL',
          ABDM_ALLOW_PRODUCTION: 'false',
        })
      ).toThrow(/production mode is locked/i);
    });

    it('works in development/mock mode and never exposes raw secrets in status dashboard DTO', () => {
      const envMock = {
        ABDM_ENABLED: 'true',
        ABDM_ENVIRONMENT: 'development',
        ABDM_CLIENT_ID: 'SECRET_TEST_CLIENT_ID_999',
        ABDM_CLIENT_SECRET: 'SUPER_SECRET_VALUE_888',
        ABDM_WEBHOOK_SECRET: 'WEBHOOK_SECRET_777',
      };

      const dashboard = abdmConfigurationService.getIntegrationStatusDashboard(envMock);
      const serialized = JSON.stringify(dashboard);

      expect(dashboard.overallStatus).toBe('MOCKED');
      expect(dashboard.sandboxConnectivityStatus).toBe('MOCKED');
      expect(dashboard.configSummary.clientIdConfigured).toBe(true);
      expect(dashboard.configSummary.clientSecretConfigured).toBe(true);
      expect(serialized).not.toContain('SECRET_TEST_CLIENT_ID_999');
      expect(serialized).not.toContain('SUPER_SECRET_VALUE_888');
      expect(serialized).not.toContain('WEBHOOK_SECRET_777');
    });
  });

  // ===========================================================================
  // 2. HTTP CLIENT, RETRIES, TIMEOUTS, AUTH ERRORS & LOG REDACTION
  // ===========================================================================
  describe('2. HTTP Client Abstraction & Log Redaction', () => {
    const devEnv = {
      ABDM_ENABLED: 'true',
      ABDM_ENVIRONMENT: 'development',
      ABDM_BASE_URL: 'https://dev.abdm.gov.in',
      ABDM_X_CM_ID: 'sbx',
      ABDM_REQUEST_TIMEOUT_MS: '5000',
    };

    it('generates UUID REQUEST-ID, injects Bearer token, and succeeds on 200', async () => {
      let capturedHeaders: Record<string, string> = {};
      const mockFetch = vi.fn().mockImplementation(async (_url, init) => {
        capturedHeaders = init?.headers || {};
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ status: 'ok' }),
        };
      });

      const client = new AbdmHttpClient({ fetchFn: mockFetch as any, retryBaseDelayMs: 0 });
      const res = await client.request<{ status: string }>({
        method: 'GET',
        path: '/api/v3/health',
        envSource: devEnv,
      });

      expect(res.status).toBe(200);
      expect(res.data.status).toBe('ok');
      expect(res.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(capturedHeaders['REQUEST-ID']).toBe(res.correlationId);
      expect(capturedHeaders['X-CM-ID']).toBe('sbx');
      expect(capturedHeaders.Authorization).toContain('Bearer ');
    });

    it('retries transient 503 failures on idempotent GET but NEVER retries non-idempotent POST', async () => {
      // Idempotent GET retries and succeeds on 2nd attempt
      const getFetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'Busy' })
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '{"ok":true}' });

      const getClient = new AbdmHttpClient({ fetchFn: getFetch as any, retryBaseDelayMs: 0 });
      const getRes = await getClient.request({ method: 'GET', path: '/ping', envSource: devEnv });
      expect(getRes.attempts).toBe(2);
      expect(getFetch).toHaveBeenCalledTimes(2);

      // Non-idempotent POST fails immediately without retrying
      const postFetch = vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => 'Busy' });
      const postClient = new AbdmHttpClient({ fetchFn: postFetch as any, retryBaseDelayMs: 0 });
      await expect(
        postClient.request({
          method: 'POST',
          path: '/consent-requests',
          body: { synthetic: true },
          envSource: devEnv,
        })
      ).rejects.toThrow(/transient gateway error/i);
      expect(postFetch).toHaveBeenCalledTimes(1);
    });

    it('handles request timeout with ABDM_TIMEOUT error code', async () => {
      const slowFetch = vi.fn().mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              const err = new Error('The operation was aborted');
              err.name = 'AbortError';
              reject(err);
            });
          })
      );

      const client = new AbdmHttpClient({ fetchFn: slowFetch as any, retryBaseDelayMs: 0 });
      await expect(
        client.request({
          method: 'GET',
          path: '/slow',
          timeoutMs: 25,
          maxRetries: 0,
          envSource: devEnv,
        })
      ).rejects.toMatchObject({ abdmCode: 'ABDM_TIMEOUT', statusCode: 504 });
    });

    it('clears cached token and throws ABDM_AUTH_ERROR on HTTP 401', async () => {
      const unauthFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => '{"message":"Unauthorized"}',
      });

      const client = new AbdmHttpClient({ fetchFn: unauthFetch as any, retryBaseDelayMs: 0 });
      await expect(
        client.request({ method: 'GET', path: '/protected', envSource: devEnv })
      ).rejects.toMatchObject({ abdmCode: 'ABDM_AUTH_ERROR', statusCode: 401 });

      expect(abdmAuthenticationService.getTokenStatus().hasCachedToken).toBe(false);
    });

    it('redacts secrets, tokens, ABHA numbers, and sensitive clinical fields from logs', () => {
      const redacted = redactAbdmLogPayload({
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.secret.sig',
        clientSecret: 'my-secret-key',
        abhaNumber: '91-1234-5678-9012',
        consentToken: 'tok-xyz',
        clinicalNotes: 'Sensitive oncology note',
        message: 'Caller used Bearer abc123 and ABHA 91-1234-5678-9012',
        safeCorrelationId: '12345678-1234-4123-8123-1234567890ab',
      }) as Record<string, unknown>;

      expect(redacted.Authorization).toBe('[REDACTED]');
      expect(redacted.clientSecret).toBe('[REDACTED]');
      expect(redacted.abhaNumber).toBe('[REDACTED]');
      expect(redacted.consentToken).toBe('[REDACTED]');
      expect(redacted.clinicalNotes).toBe('[REDACTED]');
      expect(redacted.message).toBe('Caller used Bearer [REDACTED] and ABHA [REDACTED_ABHA]');
      expect(redacted.safeCorrelationId).toBe('12345678-1234-4123-8123-1234567890ab');
    });
  });

  // ===========================================================================
  // 3. FHIR R4 MAPPING & NRCeS DOCUMENT BUNDLE VALIDATION
  // ===========================================================================
  describe('3. FHIR R4 Mapping & Validation Foundation', () => {
    it('maps Patient, Practitioner, Organization, and Observation with explicit unmapped field tracking', () => {
      const pat = abdmFhirMapperService.mapPatient({
        id: 'pat-synth-01',
        fullName: 'Synthetic Patient Alpha',
        gender: 'MALE',
        dateOfBirth: '1992-05-14',
        abhaAddress: 'synth.alpha@sbx',
        bloodGroup: 'O+',
      });
      expect(pat.mappingStatus).toBe('MAPPED_WITH_WARNINGS');
      expect(pat.validationErrors).toHaveLength(0);
      expect(pat.unmappedFields.some((f) => f.includes('bloodGroup'))).toBe(true);
      expect((pat.resource as any).resourceType).toBe('Patient');

      const prac = abdmFhirMapperService.mapPractitioner({
        id: 'doc-synth-01',
        fullName: 'Dr. Synthetic Pathologist',
        hprId: 'HPR-SYNTH-001',
        specialization: 'Pathology',
      });
      expect(prac.validationErrors).toHaveLength(0);
      expect((prac.resource as any).resourceType).toBe('Practitioner');

      const org = abdmFhirMapperService.mapOrganization({
        id: 'lab-synth-01',
        name: 'HealthBridge Synthetic Reference Lab',
        hfrFacilityId: 'IN0000000001',
      });
      expect(org.mappingStatus).toBe('MAPPED');
      expect((org.resource as any).resourceType).toBe('Organization');

      const obs = abdmFhirMapperService.mapObservation(
        {
          parameterCode: '718-7',
          testName: 'Hemoglobin [Mass/volume] in Blood',
          value: '14.2',
          numericValue: 14.2,
          unit: 'g/dL',
          referenceRange: '13.0 - 17.0',
          interpretation: 'NORMAL',
          flag: 'NORMAL',
          isAbnormal: false,
          isCritical: false,
        },
        {
          observationId: 'obs-1',
          patientRef: 'Patient/pat-synth-01',
          effectiveDateTime: '2026-11-17T10:00:00.000Z',
        }
      );
      expect(obs.mappingStatus).toBe('MAPPED');
      expect(obs.validationErrors).toHaveLength(0);
    });

    it('maps LaboratoryReport into valid NRCeS ABDM Document Bundle with Composition at entry[0]', () => {
      const mapped = abdmFhirMapperService.mapDiagnosticReportDocumentBundle({
        id: new Types.ObjectId().toString(),
        reportNumber: 'LBR-SYNTH-2026-0042',
        patientId: new Types.ObjectId().toString(),
        patientName: 'Synthetic Patient Alpha',
        patientAbhaId: 'synth.alpha@sbx',
        patientGender: 'FEMALE',
        testName: 'Complete Blood Count',
        category: 'HEMATOLOGY',
        testDate: '2026-11-17T08:00:00.000Z',
        reportDate: '2026-11-17T10:00:00.000Z',
        publishedAt: '2026-11-17T10:00:00.000Z',
        laboratoryId: new Types.ObjectId().toString(),
        laboratoryName: 'HealthBridge Synthetic Lab',
        status: 'PUBLISHED',
        documentUrl: 'https://storage.healthbridge.local/reports/synthetic-cbc.pdf',
        currentVersion: 1,
        verificationStatus: 'VERIFIED',
        tests: [{ testCode: 'CBC', testName: 'Complete Blood Count' }],
        observations: [
          {
            parameterCode: '718-7',
            testName: 'Hemoglobin',
            value: '13.6',
            numericValue: 13.6,
            unit: 'g/dL',
            referenceRange: '12.0 - 15.5',
            interpretation: 'NORMAL',
            flag: 'NORMAL',
            isAbnormal: false,
            isCritical: false,
          },
        ],
        createdAt: '2026-11-17T09:00:00.000Z',
        updatedAt: '2026-11-17T10:00:00.000Z',
      });

      expect(mapped.validationErrors).toHaveLength(0);
      expect(mapped.resource).toBeDefined();
      const bundle = mapped.resource as any;
      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('document');
      expect(bundle.entry[0].resource.resourceType).toBe('Composition');
    });

    it('rejects FHIR resources with missing required fields and Document Bundles with invalid/unresolved references', () => {
      // Missing name on Patient
      const badPat = abdmFhirMapperService.mapPatient({
        id: 'pat-empty',
        fullName: '',
      });
      expect(badPat.mappingStatus).toBe('FAILED');
      expect(badPat.validationErrors.some((e) => e.code === 'PATIENT_NAME_REQUIRED')).toBe(true);

      // Document Bundle without Composition at entry[0] and with dangling reference
      const badBundle = fhirR4Validator.validateResource({
        resourceType: 'Bundle',
        id: 'bad-doc-bundle',
        type: 'document',
        timestamp: '2026-11-17T10:00:00.000Z',
        entry: [
          {
            fullUrl: 'urn:uuid:not-a-valid-uuid',
            resource: {
              resourceType: 'DiagnosticReport',
              id: 'dr-1',
              status: 'final',
              code: { text: 'CBC' },
              subject: { reference: 'urn:uuid:00000000-0000-4000-8000-000000000099' },
            },
          },
        ],
      });
      expect(badBundle.valid).toBe(false);
      expect(badBundle.errors.some((e) => e.code === 'DOCUMENT_BUNDLE_COMPOSITION_FIRST')).toBe(true);
      expect(badBundle.errors.some((e) => e.code === 'INVALID_URN_UUID')).toBe(true);
      expect(badBundle.errors.some((e) => e.code === 'UNRESOLVED_BUNDLE_REFERENCE')).toBe(true);
    });
  });

  // ===========================================================================
  // 4. CONSENT ADAPTER BOUNDARY & ENFORCEMENT
  // ===========================================================================
  describe('4. Consent Adapter Boundary (Internal vs ABDM Artefact)', () => {
    const validAbdmArtefact = {
      artefactId: 'abdm-art-001',
      origin: 'ABDM_HIE_CM' as const,
      patientAbhaAddress: 'synth.alpha@sbx',
      purposeCode: 'CAREMGT' as const,
      hiTypes: ['DiagnosticReport' as const],
      dateRange: {
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-12-31T23:59:59.000Z',
      },
      dataEraseAt: '2027-01-01T00:00:00.000Z',
      status: 'GRANTED' as const,
      signatureVerified: true,
    };

    it('rejects internal HealthBridge consent when ABDM HIE-CM artefact is required', () => {
      const internalAdapted = abdmConsentAdapter.fromInternalConsentArtifact({
        _id: new Types.ObjectId(),
        patientId: new Types.ObjectId(),
        purpose: 'CAREMGT',
        permittedDataTypes: ['LAB_REPORT'],
        consentStatus: 'ACTIVE',
        validityPeriod: {
          from: new Date('2026-01-01T00:00:00.000Z'),
          to: new Date('2027-01-01T00:00:00.000Z'),
        },
      });

      const decision = abdmConsentAdapter.evaluateConsentAccess({
        artefact: internalAdapted,
        requireAbdmOrigin: true,
        requestedHiType: 'DiagnosticReport',
        now: new Date('2026-11-17T10:00:00.000Z'),
      });

      expect(decision.authorized).toBe(false);
      expect(decision.denialCode).toBe('INTERNAL_CONSENT_NOT_ABDM_ARTEFACT');
    });

    it('rejects expired, revoked, wrong HI-type, and out-of-range consent artefacts', () => {
      const now = new Date('2026-11-17T10:00:00.000Z');

      // Expired
      const expired = abdmConsentAdapter.evaluateConsentAccess({
        artefact: { ...validAbdmArtefact, dataEraseAt: '2026-06-01T00:00:00.000Z' },
        requireAbdmOrigin: true,
        requestedHiType: 'DiagnosticReport',
        now,
      });
      expect(expired.authorized).toBe(false);
      expect(expired.denialCode).toBe('CONSENT_EXPIRED');

      // Revoked
      const revoked = abdmConsentAdapter.evaluateConsentAccess({
        artefact: { ...validAbdmArtefact, status: 'REVOKED' },
        requireAbdmOrigin: true,
        requestedHiType: 'DiagnosticReport',
        now,
      });
      expect(revoked.authorized).toBe(false);
      expect(revoked.denialCode).toBe('CONSENT_REVOKED');

      // Wrong HI-type
      const wrongHi = abdmConsentAdapter.evaluateConsentAccess({
        artefact: validAbdmArtefact,
        requireAbdmOrigin: true,
        requestedHiType: 'Prescription',
        now,
      });
      expect(wrongHi.authorized).toBe(false);
      expect(wrongHi.denialCode).toBe('HI_TYPE_NOT_PERMITTED');

      // Out-of-range date
      const outOfRange = abdmConsentAdapter.evaluateConsentAccess({
        artefact: validAbdmArtefact,
        requireAbdmOrigin: true,
        requestedHiType: 'DiagnosticReport',
        recordDateIso: '2025-05-01T00:00:00.000Z',
        now,
      });
      expect(outOfRange.authorized).toBe(false);
      expect(outOfRange.denialCode).toBe('DATE_OUT_OF_RANGE');

      // Valid authorized access
      const ok = abdmConsentAdapter.evaluateConsentAccess({
        artefact: validAbdmArtefact,
        requireAbdmOrigin: true,
        requestedHiType: 'DiagnosticReport',
        requestedPurposeCode: 'CAREMGT',
        recordDateIso: '2026-11-10T00:00:00.000Z',
        now,
      });
      expect(ok.authorized).toBe(true);
    });
  });
});
