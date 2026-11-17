/**
 * HealthBridge India — Day 7 Task 02
 * Comprehensive Unit & Mocked Tests for ABHA V3 Authentication, Cryptography,
 * ABHA Creation, ABHA Number Verification, ABHA Address Management,
 * Patient Identity Linking, Privacy Redaction, and FHIR R4 Identity Mapping.
 *
 * NOTE: All external ABDM/ABHA network calls in this suite are mocked with synthetic test data.
 * Passing these tests validates internal adapters, security invariants, and contracts ONLY —
 * NOT live ABDM sandbox connectivity or official NHA certification.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { abdmAuthenticationService } from '../../src/modules/abdm/services/abdm-authentication.service';
import { AbdmHttpClient } from '../../src/modules/abdm/clients/abdm-http.client';
import { AbhaV3Client } from '../../src/modules/abdm/clients/abha-v3.client';
import { AbhaIdentityService } from '../../src/modules/abdm/services/abha-identity.service';
import { abdmConsentAdapter } from '../../src/modules/abdm/adapters/abdm-consent.adapter';
import { abdmFhirMapperService } from '../../src/modules/abdm/mappers/abdm-fhir.mapper';
import { AbdmIntegrationError } from '../../src/modules/abdm/errors/abdm-error';
import {
  encryptAbhaV3Field,
  encryptAbhaNumberForStorage,
  decryptAbhaNumberFromStorage,
  computeAbhaNumberHash,
} from '../../src/modules/abdm/utils/abha-crypto.util';
import {
  maskAbhaNumber,
  redactAbdmLogPayload,
  redactStringSecrets,
} from '../../src/modules/abdm/utils/redaction';

const DEV_MOCK_ENV: NodeJS.ProcessEnv = {
  ABDM_ENABLED: 'true',
  ABDM_ENVIRONMENT: 'development',
  ABDM_BASE_URL: 'https://dev.abdm.gov.in',
  ABDM_ABHA_BASE_URL: 'https://abhasbx.abdm.gov.in/abha/api/v3',
  ABDM_X_CM_ID: 'sbx',
  ABDM_REQUEST_TIMEOUT_MS: '5000',
};

const SANDBOX_ENV: NodeJS.ProcessEnv = {
  ABDM_ENABLED: 'true',
  ABDM_ENVIRONMENT: 'sandbox',
  ABDM_BASE_URL: 'https://dev.abdm.gov.in',
  ABDM_ABHA_BASE_URL: 'https://abhasbx.abdm.gov.in/abha/api/v3',
  ABDM_X_CM_ID: 'sbx',
  ABDM_CLIENT_ID: 'SYNTHETIC_SBX_CLIENT_ID',
  ABDM_CLIENT_SECRET: 'SYNTHETIC_SBX_CLIENT_SECRET',
  ABDM_IDENTIFIER_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  ABDM_REQUEST_TIMEOUT_MS: '5000',
};

describe('ABHA Identity Integration — Unit & Mocked Tests (Day 7 Task 02)', () => {
  let service: AbhaIdentityService;
  const patientA = new Types.ObjectId().toString();
  const patientB = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.restoreAllMocks();
    abdmAuthenticationService.clearAllSessions();
    abdmAuthenticationService.setTokenFetcher(undefined);
    abdmAuthenticationService.setCertFetcher(undefined);
    service = new AbhaIdentityService(new AbhaV3Client());
    service.resetTestState();
  });

  // ===========================================================================
  // 1. AUTHENTICATION & CRYPTOGRAPHY
  // ===========================================================================
  describe('1. Authentication, Token Lifecycle & Cryptography', () => {
    it('acquires and caches sandbox gateway token using configured fetcher and never exposes raw token in status', async () => {
      const fetcher = vi.fn().mockResolvedValue({
        accessToken: 'sbx_gateway_jwt_secret_never_leak',
        expiresInSeconds: 900,
      });
      abdmAuthenticationService.setTokenFetcher(fetcher);

      const t1 = await abdmAuthenticationService.getAccessToken(SANDBOX_ENV);
      const t2 = await abdmAuthenticationService.getAccessToken(SANDBOX_ENV);

      expect(t1.accessToken).toBe('sbx_gateway_jwt_secret_never_leak');
      expect(t2.accessToken).toBe(t1.accessToken);
      expect(fetcher).toHaveBeenCalledTimes(1);

      const diag = abdmAuthenticationService.getTokenStatus();
      expect(diag.hasCachedToken).toBe(true);
      expect(JSON.stringify(diag)).not.toContain('sbx_gateway_jwt_secret_never_leak');
    });

    it('rejects missing/placeholder credentials in sandbox mode', async () => {
      await expect(
        abdmAuthenticationService.getAccessToken({
          ABDM_ENABLED: 'true',
          ABDM_ENVIRONMENT: 'sandbox',
          ABDM_BASE_URL: 'https://dev.abdm.gov.in',
          ABDM_CLIENT_ID: 'your_abdm_sandbox_client_id',
          ABDM_CLIENT_SECRET: '',
        })
      ).rejects.toThrow(AbdmIntegrationError);
    });

    it('re-acquires gateway token automatically when cached token is expired', async () => {
      let callCount = 0;
      abdmAuthenticationService.setTokenFetcher(async () => {
        callCount += 1;
        return {
          accessToken: `sbx_token_v${callCount}`,
          expiresInSeconds: 10, // Inside 60s refresh safety margin -> triggers refresh on next call
        };
      });

      const first = await abdmAuthenticationService.getAccessToken(SANDBOX_ENV);
      const second = await abdmAuthenticationService.getAccessToken(SANDBOX_ENV);

      expect(first.accessToken).toBe('sbx_token_v1');
      expect(second.accessToken).toBe('sbx_token_v2');
      expect(callCount).toBe(2);
    });

    it('handles authentication provider failures securely and clears cached token', async () => {
      abdmAuthenticationService.setTokenFetcher(async () => {
        throw new Error('Invalid client credentials');
      });

      await expect(abdmAuthenticationService.getAccessToken(SANDBOX_ENV)).rejects.toMatchObject({
        abdmCode: 'ABDM_AUTH_ERROR',
      });
      expect(abdmAuthenticationService.getTokenStatus().hasCachedToken).toBe(false);
    });

    it('encrypts ABHA V3 payloads with RSA-OAEP-SHA1 and decrypts cleanly with matching private key', () => {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      const syntheticOtp = '123456';
      const ciphertextBase64 = encryptAbhaV3Field(syntheticOtp, publicKey);
      expect(ciphertextBase64).not.toContain(syntheticOtp);

      const decrypted = crypto
        .privateDecrypt(
          {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha1',
          },
          Buffer.from(ciphertextBase64, 'base64')
        )
        .toString('utf8');

      expect(decrypted).toBe(syntheticOtp);
    });

    it('encrypts ABHA numbers with AES-256-GCM for storage and computes deterministic HMAC blind index', () => {
      const syntheticAbha = '91-0000-1122-3344';
      const enc1 = encryptAbhaNumberForStorage(syntheticAbha, SANDBOX_ENV);
      const enc2 = encryptAbhaNumberForStorage(syntheticAbha, SANDBOX_ENV);

      expect(enc1).not.toBe(enc2); // Random IV per encryption
      expect(enc1).not.toContain('91-0000-1122-3344');
      expect(decryptAbhaNumberFromStorage(enc1, SANDBOX_ENV)).toBe(syntheticAbha);

      const h1 = computeAbhaNumberHash('91000011223344', SANDBOX_ENV);
      const h2 = computeAbhaNumberHash('91-0000-1122-3344', SANDBOX_ENV);
      expect(h1).toBe(h2);
    });
  });

  // ===========================================================================
  // 2. ABHA WORKFLOWS (CREATION, NUMBER VERIFICATION, ADDRESS, TIMEOUT, UNSUPPORTED)
  // ===========================================================================
  describe('2. ABHA Creation, Verification & Address Workflows (Mocked)', () => {
    it('completes mocked ABHA creation via Aadhaar OTP, suggests addresses, and creates custom address', async () => {
      const init = await service.initiateAbhaCreation(
        {
          patientId: patientA,
          actorId: patientA,
          method: 'AADHAAR_OTP',
          aadhaarNumber: '999900001111',
          patientConsentConfirmed: true,
        },
        DEV_MOCK_ENV
      );

      expect(init.isMocked).toBe(true);
      expect(init.verificationStatus).toBe('VERIFICATION_IN_PROGRESS');
      expect(init.correlationId).toBeTruthy();

      const outcome = await service.completeAbhaCreation(
        {
          patientId: patientA,
          actorId: patientA,
          internalTransactionId: init.internalTransactionId,
          otp: '123456',
          mobileNumber: '9876543210',
          consentAccepted: true,
        },
        DEV_MOCK_ENV
      );

      expect(outcome.verificationStatus).toBe('VERIFIED');
      expect(outcome.maskedAbhaNumber).toMatch(/^91-XXXX-XXXX-\d{4}$/);
      expect(outcome.readyToLink).toBe(true);

      const suggestions = await service.getAbhaAddressSuggestions(
        { patientId: patientA, internalTransactionId: init.internalTransactionId },
        DEV_MOCK_ENV
      );
      expect(suggestions.suggestions.length).toBeGreaterThan(0);

      const createdAddr = await service.createAbhaAddress(
        {
          patientId: patientA,
          actorId: patientA,
          internalTransactionId: init.internalTransactionId,
          abhaAddress: 'synthetic.patient.01@sbx',
          preferred: true,
        },
        DEV_MOCK_ENV
      );
      expect(createdAddr.abhaAddress).toBe('synthetic.patient.01@sbx');
    });

    it('rejects failed creation when invalid synthetic Aadhaar or invalid OTP is supplied', async () => {
      await expect(
        service.initiateAbhaCreation(
          {
            patientId: patientA,
            actorId: patientA,
            method: 'AADHAAR_OTP',
            aadhaarNumber: '000000000000',
            patientConsentConfirmed: true,
          },
          DEV_MOCK_ENV
        )
      ).rejects.toThrow(AbdmIntegrationError);

      const init = await service.initiateAbhaCreation(
        {
          patientId: patientA,
          actorId: patientA,
          method: 'AADHAAR_OTP',
          aadhaarNumber: '999900002222',
          patientConsentConfirmed: true,
        },
        DEV_MOCK_ENV
      );

      await expect(
        service.completeAbhaCreation(
          {
            patientId: patientA,
            actorId: patientA,
            internalTransactionId: init.internalTransactionId,
            otp: '000000',
            consentAccepted: true,
          },
          DEV_MOCK_ENV
        )
      ).rejects.toMatchObject({ abdmCode: 'ABDM_INVALID_OTP' });
    });

    it('handles invalid ABHA verification and expired OTP sessions cleanly', async () => {
      await expect(
        service.initiateAbhaNumberVerification(
          {
            patientId: patientA,
            actorId: patientA,
            abhaNumber: '00-0000-0000-0000',
            otpSystem: 'abdm',
            patientConsentConfirmed: true,
          },
          DEV_MOCK_ENV
        )
      ).rejects.toThrow(AbdmIntegrationError);

      const init = await service.initiateAbhaNumberVerification(
        {
          patientId: patientA,
          actorId: patientA,
          abhaNumber: '91-0000-1234-5678',
          otpSystem: 'abdm',
          patientConsentConfirmed: true,
        },
        DEV_MOCK_ENV
      );

      await expect(
        service.confirmAbhaNumberVerification(
          {
            patientId: patientA,
            actorId: patientA,
            internalTransactionId: init.internalTransactionId,
            otp: '999999', // Triggers expired OTP session in synthetic mock
          },
          DEV_MOCK_ENV
        )
      ).rejects.toMatchObject({ abdmCode: 'ABDM_SESSION_EXPIRED' });
    });

    it('propagates external ABHA API timeout cleanly without crashing', async () => {
      abdmAuthenticationService.setTokenFetcher(async () => ({
        accessToken: 'sbx_tok',
        expiresInSeconds: 900,
      }));
      const { publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      abdmAuthenticationService.setCertFetcher(async () => ({ publicKey }));

      const timeoutFetch = vi.fn().mockImplementation(async (_url, init) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      });

      const httpClient = new AbdmHttpClient({ fetchFn: timeoutFetch as any, retryBaseDelayMs: 0 });
      const sbxClient = new AbhaV3Client({ httpClient, useHttpClientInDev: true });
      const sbxService = new AbhaIdentityService(sbxClient);

      await expect(
        sbxService.initiateAbhaNumberVerification(
          {
            patientId: patientA,
            actorId: patientA,
            abhaNumber: '91-0000-9999-1111',
            otpSystem: 'abdm',
            patientConsentConfirmed: true,
          },
          { ...SANDBOX_ENV, ABDM_REQUEST_TIMEOUT_MS: '50' }
        )
      ).rejects.toMatchObject({ abdmCode: 'ABDM_TIMEOUT' });
    });

    it('explicitly rejects unsupported operations', () => {
      const client = new AbhaV3Client();
      expect(() => client.assertSupportedOperation('DEMOGRAPHIC_AUTO_LINK')).toThrow(
        AbdmIntegrationError
      );
      expect(() => client.assertSupportedOperation('V1_LEGACY_REGISTRATION')).toThrow(
        AbdmIntegrationError
      );
    });

    it('supports ABHA address availability check and OTP ownership verification separately from ABHA number', async () => {
      const checkFree = await service.checkAbhaAddressAvailability(
        { patientId: patientA, actorId: patientA, abhaAddress: 'brandnew.citizen@sbx' },
        DEV_MOCK_ENV
      );
      expect(checkFree.exists).toBe(false);
      expect(checkFree.availableForCreation).toBe(true);

      const checkTaken = await service.checkAbhaAddressAvailability(
        { patientId: patientA, actorId: patientA, abhaAddress: 'taken.user@sbx' },
        DEV_MOCK_ENV
      );
      expect(checkTaken.exists).toBe(true);

      const addrInit = await service.initiateAbhaAddressVerification(
        {
          patientId: patientA,
          actorId: patientA,
          abhaAddress: 'aarav.test@sbx',
          otpSystem: 'abdm',
          patientConsentConfirmed: true,
        },
        DEV_MOCK_ENV
      );

      const addrVerified = await service.confirmAbhaAddressVerification(
        {
          patientId: patientA,
          actorId: patientA,
          internalTransactionId: addrInit.internalTransactionId,
          otp: '123456',
        },
        DEV_MOCK_ENV
      );
      expect(addrVerified.verificationStatus).toBe('VERIFIED');
      expect(addrVerified.abhaAddress).toBe('aarav.test@sbx');
    });
  });

  // ===========================================================================
  // 3. PATIENT IDENTITY LINKING & UNLINKING AUTHORIZATION
  // ===========================================================================
  describe('3. Patient Identity Linking, Duplicate Prevention & Unlinking', () => {
    it('links a verified ABHA identity, blocks duplicate cross-patient linking, blocks cross-patient tx hijack, and enforces unlink authorization', async () => {
      // Patient A verifies ABHA Number
      const initA = await service.initiateAbhaNumberVerification(
        {
          patientId: patientA,
          actorId: patientA,
          abhaNumber: '91-0000-5555-6666',
          otpSystem: 'abdm',
          patientConsentConfirmed: true,
        },
        DEV_MOCK_ENV
      );

      // Cross-patient attempt: Patient B tries to confirm Patient A's transaction -> 403
      await expect(
        service.confirmAbhaNumberVerification(
          {
            patientId: patientB,
            actorId: patientB,
            internalTransactionId: initA.internalTransactionId,
            otp: '123456',
          },
          DEV_MOCK_ENV
        )
      ).rejects.toMatchObject({ abdmCode: 'ABDM_AUTH_ERROR', statusCode: 403 });

      // Patient A confirms OTP & links
      await service.confirmAbhaNumberVerification(
        {
          patientId: patientA,
          actorId: patientA,
          internalTransactionId: initA.internalTransactionId,
          otp: '123456',
        },
        DEV_MOCK_ENV
      );

      const linkedA = await service.linkVerifiedAbha(
        {
          patientId: patientA,
          actorId: patientA,
          internalTransactionId: initA.internalTransactionId,
          patientConsentConfirmed: true,
          purposeAcknowledged: true,
        },
        DEV_MOCK_ENV
      );
      expect(linkedA.linkStatus).toBe('ACTIVE');
      expect(linkedA.verificationStatus).toBe('VERIFIED');
      expect(linkedA.maskedAbhaNumber).toBe('91-XXXX-XXXX-6666');
      expect(linkedA.consentScope).toBe('IDENTITY_LINKING_ONLY');

      // Patient B verifies the EXACT SAME ABHA number and attempts to link -> 409 DUPLICATE_IDENTITY
      const initB = await service.initiateAbhaNumberVerification(
        {
          patientId: patientB,
          actorId: patientB,
          abhaNumber: '91-0000-5555-6666',
          otpSystem: 'abdm',
          patientConsentConfirmed: true,
        },
        DEV_MOCK_ENV
      );
      await service.confirmAbhaNumberVerification(
        {
          patientId: patientB,
          actorId: patientB,
          internalTransactionId: initB.internalTransactionId,
          otp: '123456',
        },
        DEV_MOCK_ENV
      );

      await expect(
        service.linkVerifiedAbha(
          {
            patientId: patientB,
            actorId: patientB,
            internalTransactionId: initB.internalTransactionId,
            patientConsentConfirmed: true,
            purposeAcknowledged: true,
          },
          DEV_MOCK_ENV
        )
      ).rejects.toMatchObject({ abdmCode: 'ABDM_DUPLICATE_IDENTITY', statusCode: 409 });

      // Unauthorized unlink attempt by another actor -> 403
      await expect(
        service.unlinkPatientAbha(
          {
            patientId: patientA,
            actorId: patientB,
            reason: 'Unauthorized attempt',
            confirmUnlink: true,
          },
          DEV_MOCK_ENV
        )
      ).rejects.toMatchObject({ abdmCode: 'ABDM_AUTH_ERROR', statusCode: 403 });

      // Patient A unlinks cleanly (local unlink, history preserved)
      const afterUnlink = await service.unlinkPatientAbha(
        {
          patientId: patientA,
          actorId: patientA,
          reason: 'Switching sandbox test account',
          confirmUnlink: true,
        },
        DEV_MOCK_ENV
      );
      expect(afterUnlink.linkStatus).toBe('UNLINKED');
      expect(afterUnlink.verificationStatus).toBe('REVOKED_OR_UNLINKED');
    });
  });

  // ===========================================================================
  // 4. PRIVACY SAFEGUARDS & CONSENT SEPARATION
  // ===========================================================================
  describe('4. Privacy Redaction & Consent Separation', () => {
    it('redacts OTP, Aadhaar, full ABHA numbers, and Bearer/X-Tokens from logs and errors', () => {
      const dirty = {
        aadhaarNumber: '999988887777',
        otpValue: '654321',
        xToken: 'secret_user_xtoken_abc',
        abhaNumber: '91-1234-5678-9012',
        note: 'Failed with Aadhaar 9999 8888 7777 and ABHA 91-1234-5678-9012 otp=654321 Bearer secret_tok',
      };

      const redacted = redactAbdmLogPayload(dirty) as Record<string, any>;
      const serialized = JSON.stringify(redacted);

      expect(serialized).not.toContain('999988887777');
      expect(serialized).not.toContain('9999 8888 7777');
      expect(serialized).not.toContain('654321');
      expect(serialized).not.toContain('secret_user_xtoken_abc');
      expect(serialized).not.toContain('91-1234-5678-9012');
      expect(serialized).not.toContain('secret_tok');
      expect(maskAbhaNumber('91-1234-5678-9012')).toBe('91-XXXX-XXXX-9012');
      expect(redactStringSecrets('Aadhaar 1234-5678-9012 failed')).toContain('[REDACTED_AADHAAR]');
    });

    it('proves ABHA identity linking does NOT grant ABDM health-record exchange consent', () => {
      // Even when a patient has linked ABHA, passing an internal/linking-only record to AbdmConsentAdapter is denied
      const decision = abdmConsentAdapter.evaluateConsentAccess({
        artefact: {
          artefactId: 'link-only-not-hie-cm',
          origin: 'INTERNAL_HEALTHBRIDGE',
          purposeCode: 'CAREMGT',
          hiTypes: ['DiagnosticReport'],
          dateRange: { from: '2025-01-01T00:00:00.000Z', to: '2027-01-01T00:00:00.000Z' },
          dataEraseAt: '2027-01-01T00:00:00.000Z',
          status: 'GRANTED',
          signatureVerified: true,
        },
        requireAbdmOrigin: true,
        requestedHiType: 'DiagnosticReport',
        requestedPurposeCode: 'CAREMGT',
        recordDateIso: '2026-06-01T00:00:00.000Z',
      });

      expect(decision.authorized).toBe(false);
      expect(decision.denialCode).toBe('INTERNAL_CONSENT_NOT_ABDM_ARTEFACT');
    });
  });

  // ===========================================================================
  // 5. FHIR R4 PATIENT IDENTITY MAPPING
  // ===========================================================================
  describe('5. NRCeS ABDM FHIR R4 Patient Identity Mapping', () => {
    it('maps internal MRN separately from verified ABHA Number and ABHA Address', () => {
      const mapped = abdmFhirMapperService.mapPatient({
        id: 'hb-patient-001',
        fullName: 'Aarav Sharma',
        gender: 'MALE',
        dateOfBirth: '1992-05-14',
        abhaNumber: '91-0000-1122-3344',
        abhaAddress: 'aarav.sharma@sbx',
        abhaVerified: true,
      });

      expect(mapped.mappingStatus).toBe('MAPPED');
      const identifiers = (mapped.resource?.identifier || []) as Array<Record<string, any>>;
      expect(identifiers).toHaveLength(3);

      const mrn = identifiers.find((i) => i.system === 'https://healthbridge.in/identifiers');
      const abhaNum = identifiers.find(
        (i) => i.system === 'https://healthid.ndhm.gov.in' && i.use === 'official'
      );
      const abhaAddr = identifiers.find(
        (i) => i.system === 'https://healthid.ndhm.gov.in' && i.use === 'secondary'
      );

      expect(mrn?.value).toBe('hb-patient-001');
      expect(mrn?.type?.coding?.[0]?.code).toBe('MR');
      expect(abhaNum?.value).toBe('91-0000-1122-3344');
      expect(abhaNum?.type?.coding?.[0]?.code).toBe('ABHA');
      expect(abhaAddr?.value).toBe('aarav.sharma@sbx');
      expect(abhaAddr?.type?.coding?.[0]?.code).toBe('PHR');
    });

    it('omits unverified ABHA number from Patient.identifier and emits explicit warning', () => {
      const mapped = abdmFhirMapperService.mapPatient({
        id: 'hb-patient-002',
        fullName: 'Priya Nair',
        gender: 'FEMALE',
        abhaNumber: '91-0000-4444-5555',
        abhaVerified: false,
      });

      expect(mapped.mappingStatus).toBe('MAPPED_WITH_WARNINGS');
      expect(mapped.warnings.some((w) => w.code === 'UNVERIFIED_ABHA_NUMBER_OMITTED')).toBe(true);
      expect(JSON.stringify(mapped.resource)).not.toContain('91-0000-4444-5555');
    });
  });
});
