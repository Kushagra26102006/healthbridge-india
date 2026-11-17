/**
 * HealthBridge India — Official ABDM ABHA V3 API Client & Synthetic Mock Adapter (Day 7 Task 02)
 *
 * Implements ONLY officially verified ABDM ABHA V3 endpoints (`https://abhasbx.abdm.gov.in/abha/api/v3`).
 * - Encrypts sensitive fields (`loginId`, `otpValue`) with RSA/ECB/OAEPWithSHA-1AndMGF1Padding
 *   using the dynamically fetched ABHA V3 public certificate.
 * - Never logs Aadhaar numbers, OTP values, full ABHA numbers, or X-Tokens.
 * - Uses synthetic sandbox-shaped mock responses ONLY when `ABDM_ENVIRONMENT=development`
 *   (strictly labeled `isMocked: true`), and real HTTPS requests when valid sandbox credentials exist.
 */

import crypto from 'crypto';
import type {
  AbhaOtpSystem,
  AbhaSupportedWorkflowSummaryDto,
} from '@healthbridge/shared-types';
import { AbdmHttpClient, abdmHttpClient } from './abdm-http.client';
import { abdmConfigurationService } from '../services/abdm-configuration.service';
import { abdmAuthenticationService } from '../services/abdm-authentication.service';
import { abdmCorrelationService } from '../services/abdm-correlation.service';
import { encryptAbhaV3Field } from '../utils/abha-crypto.util';
import { AbdmIntegrationError } from '../errors/abdm-error';
import { normalizeAbhaNumber } from '../utils/redaction';

export const ABHA_VERIFIED_API_CATALOG: AbhaSupportedWorkflowSummaryDto[] = [
  {
    workflow: 'Gateway Session Token Acquisition',
    officialApi: 'POST /api/hiecm/gateway/v3/sessions',
    version: 'V3',
    authRequirement: 'clientId + clientSecret + X-CM-ID',
    verifiedFromDocs: true,
    implementationStatus: 'IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER',
  },
  {
    workflow: 'ABHA Public Certificate Retrieval (RSA-OAEP-SHA1)',
    officialApi: 'GET /abha/api/v3/profile/public/certificate',
    version: 'V3',
    authRequirement: 'Gateway Bearer Token',
    verifiedFromDocs: true,
    implementationStatus: 'IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER',
  },
  {
    workflow: 'ABHA Creation — Request Aadhaar OTP',
    officialApi: 'POST /abha/api/v3/enrollment/request/otp',
    version: 'V3',
    authRequirement: 'Gateway Bearer Token + RSA Encrypted Aadhaar',
    verifiedFromDocs: true,
    implementationStatus: 'IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER',
  },
  {
    workflow: 'ABHA Creation — Verify Aadhaar OTP & Enrol',
    officialApi: 'POST /abha/api/v3/enrollment/enrol/byAadhaar',
    version: 'V3',
    authRequirement: 'Gateway Bearer Token + RSA Encrypted OTP + Consent v1.4',
    verifiedFromDocs: true,
    implementationStatus: 'IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER',
  },
  {
    workflow: 'ABHA Address Suggestions',
    officialApi: 'GET /abha/api/v3/enrollment/enrol/suggestion',
    version: 'V3',
    authRequirement: 'Gateway Bearer Token + Transaction_Id header',
    verifiedFromDocs: true,
    implementationStatus: 'IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER',
  },
  {
    workflow: 'ABHA Address Creation / Enrolment',
    officialApi: 'POST /abha/api/v3/enrollment/enrol/abha-address',
    version: 'V3',
    authRequirement: 'Gateway Bearer Token + active txnId',
    verifiedFromDocs: true,
    implementationStatus: 'IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER',
  },
  {
    workflow: 'ABHA Number Verification — Request OTP',
    officialApi: 'POST /abha/api/v3/profile/login/request/otp',
    version: 'V3',
    authRequirement: 'Gateway Bearer Token + RSA Encrypted ABHA Number',
    verifiedFromDocs: true,
    implementationStatus: 'IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER',
  },
  {
    workflow: 'ABHA Number Verification — Verify OTP',
    officialApi: 'POST /abha/api/v3/profile/login/verify',
    version: 'V3',
    authRequirement: 'Gateway Bearer Token + RSA Encrypted OTP',
    verifiedFromDocs: true,
    implementationStatus: 'IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER',
  },
  {
    workflow: 'Authorized ABHA Profile Retrieval',
    officialApi: 'GET /abha/api/v3/profile/account',
    version: 'V3',
    authRequirement: 'Gateway Bearer Token + User X-Token',
    verifiedFromDocs: true,
    implementationStatus: 'IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER',
  },
  {
    workflow: 'ABHA Address Availability / Existence Check',
    officialApi: 'POST /abha/api/v3/phr/app/enrollment/isExists',
    version: 'V3',
    authRequirement: 'Gateway Bearer Token',
    verifiedFromDocs: true,
    implementationStatus: 'IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER',
  },
  {
    workflow: 'ABHA Address Verification — Request OTP',
    officialApi: 'POST /abha/api/v3/phr/web/login/abha/request/otp',
    version: 'V3',
    authRequirement: 'Gateway Bearer Token + RSA Encrypted ABHA Address',
    verifiedFromDocs: true,
    implementationStatus: 'IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER',
  },
  {
    workflow: 'ABHA Address Verification — Verify OTP',
    officialApi: 'POST /abha/api/v3/phr/web/login/abha/verify',
    version: 'V3',
    authRequirement: 'Gateway Bearer Token + RSA Encrypted OTP',
    verifiedFromDocs: true,
    implementationStatus: 'IMPLEMENTED_MOCK_AND_SANDBOX_ADAPTER',
  },
  {
    workflow: 'Local HealthBridge Patient Identity Unlinking',
    officialApi: 'Internal HealthBridge Association Removal (Non-NHA Deactivation)',
    version: 'Internal',
    authRequirement: 'Authenticated Patient JWT + Explicit Confirmation',
    verifiedFromDocs: true,
    implementationStatus: 'LOCAL_ONLY_WITH_AUDIT',
  },
  {
    workflow: 'Unverified Demographic Auto-Linking / Legacy V1-V2 APIs',
    officialApi: 'Deprecated / Unsupported',
    version: 'N/A',
    authRequirement: 'Blocked by Policy',
    verifiedFromDocs: true,
    implementationStatus: 'BLOCKED_UNSUPPORTED',
  },
];

export interface AbhaV3OtpRequestResult {
  txnId: string;
  message: string;
  correlationId: string;
  isMocked: boolean;
}

export interface AbhaV3ProfilePayload {
  abhaNumber: string;
  abhaAddress?: string;
  phrAddresses: string[];
  fullName: string;
  gender?: string;
  dateOfBirth?: string;
  yearOfBirth?: string;
  stateName?: string;
  districtName?: string;
  abhaStatus: string;
  isNew?: boolean;
  kycVerified: boolean;
  xToken?: string;
  txnId?: string;
  correlationId: string;
  isMocked: boolean;
}

export interface AbhaV3AddressCheckResult {
  abhaAddress: string;
  exists: boolean;
  correlationId: string;
  isMocked: boolean;
}

export interface AbhaV3SuggestionsResult {
  txnId: string;
  abhaAddressList: string[];
  correlationId: string;
  isMocked: boolean;
}

export interface AbhaV3AddressCreateResult {
  txnId: string;
  abhaAddress: string;
  preferred: boolean;
  correlationId: string;
  isMocked: boolean;
}

const UNSUPPORTED_WORKFLOWS = new Set([
  'DEMOGRAPHIC_AUTO_LINK',
  'PASSWORD_UNVERIFIED_LINK',
  'V1_LEGACY_REGISTRATION',
  'V2_LEGACY_HID',
  'DRIVING_LICENSE_UNVERIFIED',
  'BIOMETRIC_FINGERPRINT',
]);

export class AbhaV3Client {
  private readonly httpClient: AbdmHttpClient;
  private readonly useHttpClientInDev: boolean;

  constructor(options?: { httpClient?: AbdmHttpClient; useHttpClientInDev?: boolean }) {
    this.httpClient = options?.httpClient || abdmHttpClient;
    this.useHttpClientInDev = options?.useHttpClientInDev ?? false;
  }

  /**
   * Explicitly rejects unsupported/deprecated operations rather than guessing endpoints.
   */
  assertSupportedOperation(operationName: string): void {
    if (UNSUPPORTED_WORKFLOWS.has(operationName.toUpperCase())) {
      throw new AbdmIntegrationError({
        message: `Operation '${operationName}' is not supported by the verified ABDM ABHA V3 integration policy.`,
        abdmCode: 'ABDM_UNSUPPORTED_OPERATION',
        statusCode: 400,
      });
    }
  }

  private resolveMode(envSource?: NodeJS.ProcessEnv): {
    isMocked: boolean;
    environment: string;
  } {
    const config = abdmConfigurationService.assertValidWhenEnabled(envSource);
    if (!config.enabled || config.environment === 'disabled') {
      throw new AbdmIntegrationError({
        message: 'ABDM integration is disabled. Configure ABDM_ENABLED=true and ABDM_ENVIRONMENT.',
        abdmCode: 'ABDM_DISABLED',
        statusCode: 503,
      });
    }
    const isMocked = config.environment === 'development' && !this.useHttpClientInDev;
    return { isMocked, environment: config.environment };
  }

  private async encryptField(plaintext: string, envSource?: NodeJS.ProcessEnv): Promise<string> {
    const cert = await abdmAuthenticationService.getAbhaPublicCertificate(envSource);
    return encryptAbhaV3Field(plaintext, cert.publicKey);
  }

  /**
   * 1. Request Aadhaar OTP for ABHA Creation
   * Official V3 Endpoint: `POST /enrollment/request/otp`
   */
  async requestEnrollmentAadhaarOtp(
    aadhaarNumber: string,
    envSource?: NodeJS.ProcessEnv
  ): Promise<AbhaV3OtpRequestResult> {
    const { isMocked } = this.resolveMode(envSource);
    const encryptedLoginId = await this.encryptField(aadhaarNumber, envSource);

    if (isMocked) {
      if (aadhaarNumber === '000000000000') {
        throw new AbdmIntegrationError({
          message: 'Invalid synthetic Aadhaar identifier for sandbox enrolment test.',
          abdmCode: 'ABDM_CLIENT_ERROR',
          statusCode: 400,
        });
      }
      const correlationId = abdmCorrelationService.generateRequestId();
      return {
        txnId: `sbx-enrol-${crypto.randomUUID()}`,
        message: 'Synthetic mock OTP dispatched to Aadhaar-registered mobile ending ******0101 (use 123456 in dev mock mode).',
        correlationId,
        isMocked: true,
      };
    }

    const res = await this.httpClient.request<{ txnId?: string; message?: string }>({
      method: 'POST',
      service: 'abha',
      path: '/enrollment/request/otp',
      body: {
        txnId: '',
        scope: ['abha-enrol'],
        loginHint: 'aadhaar',
        loginId: encryptedLoginId,
        otpSystem: 'aadhaar',
      },
      envSource,
    });

    if (!res.data?.txnId) {
      throw new AbdmIntegrationError({
        message: 'ABHA enrolment OTP response did not include a transaction ID.',
        abdmCode: 'ABDM_CLIENT_ERROR',
        statusCode: 502,
        correlationId: res.correlationId,
      });
    }

    return {
      txnId: res.data.txnId,
      message: res.data.message || 'OTP sent to Aadhaar-registered mobile number.',
      correlationId: res.correlationId,
      isMocked: false,
    };
  }

  /**
   * 2. Verify Aadhaar OTP & Enrol ABHA (`byAadhaar`)
   * Official V3 Endpoint: `POST /enrollment/enrol/byAadhaar`
   */
  async completeEnrollmentByAadhaar(
    params: { txnId: string; otp: string; mobileNumber?: string },
    envSource?: NodeJS.ProcessEnv
  ): Promise<AbhaV3ProfilePayload> {
    const { isMocked } = this.resolveMode(envSource);
    const encryptedOtp = await this.encryptField(params.otp, envSource);

    if (isMocked) {
      return this.buildMockVerificationResponse({
        txnId: params.txnId,
        otp: params.otp,
        mode: 'CREATION',
      });
    }

    const res = await this.httpClient.request<Record<string, any>>({
      method: 'POST',
      service: 'abha',
      path: '/enrollment/enrol/byAadhaar',
      body: {
        authData: {
          authMethods: ['otp'],
          otp: {
            txnId: params.txnId,
            otpValue: encryptedOtp,
            ...(params.mobileNumber ? { mobile: params.mobileNumber } : {}),
          },
        },
        consent: {
          code: 'abha-enrollment',
          version: '1.4',
        },
      },
      envSource,
    });

    return this.normalizeProfilePayload(res.data, res.correlationId, params.txnId, false);
  }

  /**
   * 3. Fetch ABHA Address Suggestions
   * Official V3 Endpoint: `GET /enrollment/enrol/suggestion`
   */
  async getAbhaAddressSuggestions(
    txnId: string,
    envSource?: NodeJS.ProcessEnv
  ): Promise<AbhaV3SuggestionsResult> {
    const { isMocked } = this.resolveMode(envSource);

    if (isMocked) {
      const suffix = crypto.createHash('sha256').update(txnId).digest('hex').slice(0, 4);
      return {
        txnId,
        abhaAddressList: [
          `citizen.${suffix}@sbx`,
          `healthbridge.${suffix}@sbx`,
          `abha.user.${suffix}@sbx`,
        ],
        correlationId: abdmCorrelationService.generateRequestId(),
        isMocked: true,
      };
    }

    const res = await this.httpClient.request<{ txnId?: string; abhaAddressList?: string[] }>({
      method: 'GET',
      service: 'abha',
      path: '/enrollment/enrol/suggestion',
      headers: {
        Transaction_Id: txnId,
      },
      envSource,
    });

    return {
      txnId: res.data?.txnId || txnId,
      abhaAddressList: Array.isArray(res.data?.abhaAddressList) ? res.data.abhaAddressList : [],
      correlationId: res.correlationId,
      isMocked: false,
    };
  }

  /**
   * 4. Enrol / Create ABHA Address
   * Official V3 Endpoint: `POST /enrollment/enrol/abha-address`
   */
  async createAbhaAddress(
    params: { txnId: string; abhaAddress: string; preferred?: boolean },
    envSource?: NodeJS.ProcessEnv
  ): Promise<AbhaV3AddressCreateResult> {
    const { isMocked } = this.resolveMode(envSource);
    const normalizedAddress = params.abhaAddress.trim().toLowerCase();

    if (isMocked) {
      if (normalizedAddress.startsWith('taken')) {
        throw new AbdmIntegrationError({
          message: 'Requested ABHA address is already taken in sandbox.',
          abdmCode: 'ABDM_DUPLICATE_IDENTITY',
          statusCode: 409,
        });
      }
      return {
        txnId: params.txnId,
        abhaAddress: normalizedAddress.includes('@') ? normalizedAddress : `${normalizedAddress}@sbx`,
        preferred: params.preferred !== false,
        correlationId: abdmCorrelationService.generateRequestId(),
        isMocked: true,
      };
    }

    const res = await this.httpClient.request<Record<string, any>>({
      method: 'POST',
      service: 'abha',
      path: '/enrollment/enrol/abha-address',
      body: {
        txnId: params.txnId,
        abhaAddress: normalizedAddress,
        preferred: params.preferred !== false ? 1 : 0,
      },
      envSource,
    });

    return {
      txnId: res.data?.txnId || params.txnId,
      abhaAddress: (res.data?.abhaAddress || normalizedAddress).toLowerCase(),
      preferred: Boolean(res.data?.preferred ?? params.preferred ?? true),
      correlationId: res.correlationId,
      isMocked: false,
    };
  }

  /**
   * 5. Request OTP for ABHA Number Verification
   * Official V3 Endpoint: `POST /profile/login/request/otp`
   */
  async requestAbhaNumberLoginOtp(
    params: { abhaNumber: string; otpSystem: AbhaOtpSystem },
    envSource?: NodeJS.ProcessEnv
  ): Promise<AbhaV3OtpRequestResult> {
    const { isMocked } = this.resolveMode(envSource);
    const normalized = normalizeAbhaNumber(params.abhaNumber);
    const encryptedAbha = await this.encryptField(normalized, envSource);

    if (isMocked) {
      if (normalized === '00-0000-0000-0000') {
        throw new AbdmIntegrationError({
          message: 'ABHA number not found in synthetic sandbox registry.',
          abdmCode: 'ABDM_CLIENT_ERROR',
          statusCode: 404,
        });
      }
      return {
        txnId: `sbx-verify-num-${crypto.randomUUID()}`,
        message: `Synthetic mock OTP sent via ${params.otpSystem.toUpperCase()} to registered mobile ending ******4321 (use 123456 in dev mock mode).`,
        correlationId: abdmCorrelationService.generateRequestId(),
        isMocked: true,
      };
    }

    const verifyScope = params.otpSystem === 'aadhaar' ? 'aadhaar-verify' : 'mobile-verify';
    const res = await this.httpClient.request<{ txnId?: string; message?: string }>({
      method: 'POST',
      service: 'abha',
      path: '/profile/login/request/otp',
      body: {
        scope: ['abha-login', verifyScope],
        loginHint: 'abha-number',
        loginId: encryptedAbha,
        otpSystem: params.otpSystem,
      },
      envSource,
    });

    if (!res.data?.txnId) {
      throw new AbdmIntegrationError({
        message: 'ABHA login OTP response missing transaction ID.',
        abdmCode: 'ABDM_CLIENT_ERROR',
        statusCode: 502,
        correlationId: res.correlationId,
      });
    }

    return {
      txnId: res.data.txnId,
      message: res.data.message || 'Verification OTP sent to ABHA-registered mobile.',
      correlationId: res.correlationId,
      isMocked: false,
    };
  }

  /**
   * 6. Verify OTP for ABHA Number Verification
   * Official V3 Endpoint: `POST /profile/login/verify`
   */
  async verifyAbhaNumberLoginOtp(
    params: { txnId: string; otp: string; otpSystem: AbhaOtpSystem; syntheticHintAbha?: string },
    envSource?: NodeJS.ProcessEnv
  ): Promise<AbhaV3ProfilePayload> {
    const { isMocked } = this.resolveMode(envSource);
    const encryptedOtp = await this.encryptField(params.otp, envSource);

    if (isMocked) {
      return this.buildMockVerificationResponse({
        txnId: params.txnId,
        otp: params.otp,
        mode: 'VERIFY_NUMBER',
        hintAbhaNumber: params.syntheticHintAbha,
      });
    }

    const verifyScope = params.otpSystem === 'aadhaar' ? 'aadhaar-verify' : 'mobile-verify';
    const res = await this.httpClient.request<Record<string, any>>({
      method: 'POST',
      service: 'abha',
      path: '/profile/login/verify',
      body: {
        scope: ['abha-login', verifyScope],
        authData: {
          authMethods: ['otp'],
          otp: {
            txnId: params.txnId,
            otpValue: encryptedOtp,
          },
        },
      },
      envSource,
    });

    return this.normalizeProfilePayload(res.data, res.correlationId, params.txnId, false);
  }

  /**
   * 7. Check ABHA Address Availability / Existence
   * Official V3 Endpoint: `POST /phr/app/enrollment/isExists`
   */
  async checkAbhaAddressExists(
    abhaAddress: string,
    envSource?: NodeJS.ProcessEnv
  ): Promise<AbhaV3AddressCheckResult> {
    const { isMocked } = this.resolveMode(envSource);
    const normalized = abhaAddress.trim().toLowerCase();

    if (isMocked) {
      const exists =
        normalized.startsWith('taken') ||
        normalized.startsWith('aarav') ||
        normalized.startsWith('existing') ||
        normalized.endsWith('.linked@sbx');
      return {
        abhaAddress: normalized,
        exists,
        correlationId: abdmCorrelationService.generateRequestId(),
        isMocked: true,
      };
    }

    const res = await this.httpClient.request<{ exists?: boolean; isExists?: boolean }>({
      method: 'POST',
      service: 'abha',
      path: '/phr/app/enrollment/isExists',
      idempotent: true,
      body: {
        abhaAddress: normalized,
      },
      envSource,
    });

    return {
      abhaAddress: normalized,
      exists: Boolean(res.data?.exists ?? res.data?.isExists ?? false),
      correlationId: res.correlationId,
      isMocked: false,
    };
  }

  /**
   * 8. Request OTP for ABHA Address Verification (PHR Web)
   * Official V3 Endpoint: `POST /phr/web/login/abha/request/otp`
   */
  async requestAbhaAddressLoginOtp(
    params: { abhaAddress: string; otpSystem: AbhaOtpSystem },
    envSource?: NodeJS.ProcessEnv
  ): Promise<AbhaV3OtpRequestResult> {
    const { isMocked } = this.resolveMode(envSource);
    const normalized = params.abhaAddress.trim().toLowerCase();
    const encryptedAddress = await this.encryptField(normalized, envSource);

    if (isMocked) {
      if (normalized.startsWith('invalid') || normalized.startsWith('notfound')) {
        throw new AbdmIntegrationError({
          message: 'ABHA address not found in synthetic sandbox PHR directory.',
          abdmCode: 'ABDM_CLIENT_ERROR',
          statusCode: 404,
        });
      }
      return {
        txnId: `sbx-verify-addr-${crypto.randomUUID()}`,
        message: `Synthetic mock OTP sent via ${params.otpSystem.toUpperCase()} for ABHA address verification (use 123456 in dev mock mode).`,
        correlationId: abdmCorrelationService.generateRequestId(),
        isMocked: true,
      };
    }

    const verifyScope = params.otpSystem === 'aadhaar' ? 'aadhaar-verify' : 'mobile-verify';
    const res = await this.httpClient.request<{ txnId?: string; message?: string }>({
      method: 'POST',
      service: 'abha',
      path: '/phr/web/login/abha/request/otp',
      body: {
        scope: ['abha-address-login', verifyScope],
        loginHint: 'abha-address',
        loginId: encryptedAddress,
        otpSystem: params.otpSystem,
      },
      envSource,
    });

    if (!res.data?.txnId) {
      throw new AbdmIntegrationError({
        message: 'ABHA address login OTP response missing transaction ID.',
        abdmCode: 'ABDM_CLIENT_ERROR',
        statusCode: 502,
        correlationId: res.correlationId,
      });
    }

    return {
      txnId: res.data.txnId,
      message: res.data.message || 'Verification OTP sent for ABHA address.',
      correlationId: res.correlationId,
      isMocked: false,
    };
  }

  /**
   * 9. Verify OTP for ABHA Address Verification (PHR Web)
   * Official V3 Endpoint: `POST /phr/web/login/abha/verify`
   */
  async verifyAbhaAddressLoginOtp(
    params: { txnId: string; otp: string; otpSystem: AbhaOtpSystem; abhaAddressHint?: string },
    envSource?: NodeJS.ProcessEnv
  ): Promise<AbhaV3ProfilePayload> {
    const { isMocked } = this.resolveMode(envSource);
    const encryptedOtp = await this.encryptField(params.otp, envSource);

    if (isMocked) {
      return this.buildMockVerificationResponse({
        txnId: params.txnId,
        otp: params.otp,
        mode: 'VERIFY_ADDRESS',
        hintAbhaAddress: params.abhaAddressHint,
      });
    }

    const verifyScope = params.otpSystem === 'aadhaar' ? 'aadhaar-verify' : 'mobile-verify';
    const res = await this.httpClient.request<Record<string, any>>({
      method: 'POST',
      service: 'abha',
      path: '/phr/web/login/abha/verify',
      body: {
        scope: ['abha-address-login', verifyScope],
        authData: {
          authMethods: ['otp'],
          otp: {
            txnId: params.txnId,
            otpValue: encryptedOtp,
          },
        },
      },
      envSource,
    });

    return this.normalizeProfilePayload(res.data, res.correlationId, params.txnId, false);
  }

  /**
   * 10. Retrieve Authorized ABHA Profile using server-held user `X-Token`
   * Official V3 Endpoint: `GET /profile/account`
   */
  async getAuthorizedProfile(
    xToken: string,
    envSource?: NodeJS.ProcessEnv,
    mockContext?: { abhaNumber?: string; abhaAddress?: string; fullName?: string }
  ): Promise<AbhaV3ProfilePayload> {
    const { isMocked } = this.resolveMode(envSource);

    if (isMocked) {
      const abhaNumber = mockContext?.abhaNumber || '91-0000-0001-2345';
      const abhaAddress = mockContext?.abhaAddress || 'sandbox.citizen@sbx';
      return {
        abhaNumber,
        abhaAddress,
        phrAddresses: [abhaAddress],
        fullName: mockContext?.fullName || 'Sandbox Test Citizen',
        gender: 'M',
        dateOfBirth: '1992-05-14',
        yearOfBirth: '1992',
        stateName: 'MAHARASHTRA',
        districtName: 'PUNE',
        abhaStatus: 'ACTIVE',
        kycVerified: true,
        correlationId: abdmCorrelationService.generateRequestId(),
        isMocked: true,
      };
    }

    const res = await this.httpClient.request<Record<string, any>>({
      method: 'GET',
      service: 'abha',
      path: '/profile/account',
      headers: {
        'X-token': xToken.startsWith('Bearer ') ? xToken : `Bearer ${xToken}`,
      },
      envSource,
    });

    return this.normalizeProfilePayload(res.data, res.correlationId, undefined, false);
  }

  private buildMockVerificationResponse(params: {
    txnId: string;
    otp: string;
    mode: 'CREATION' | 'VERIFY_NUMBER' | 'VERIFY_ADDRESS';
    hintAbhaNumber?: string;
    hintAbhaAddress?: string;
  }): AbhaV3ProfilePayload {
    if (params.otp === '000000') {
      throw new AbdmIntegrationError({
        message: 'Invalid OTP provided for ABHA verification.',
        abdmCode: 'ABDM_INVALID_OTP',
        statusCode: 400,
      });
    }
    if (params.otp === '999999') {
      throw new AbdmIntegrationError({
        message: 'ABHA OTP verification session has expired. Please initiate a new request.',
        abdmCode: 'ABDM_SESSION_EXPIRED',
        statusCode: 410,
      });
    }

    // Deterministic synthetic sandbox ABHA number derived from txnId or hint (NEVER real citizen data)
    const digest = crypto.createHash('sha256').update(params.txnId).digest('hex');
    const digits = parseInt(digest.slice(0, 8), 16).toString().padStart(8, '0').slice(0, 8);
    const syntheticAbha = params.hintAbhaNumber
      ? normalizeAbhaNumber(params.hintAbhaNumber)
      : `91-0000-${digits.slice(0, 4)}-${digits.slice(4, 8)}`;

    const syntheticAddress =
      params.hintAbhaAddress?.trim().toLowerCase() || `sandbox.user.${digits.slice(0, 4)}@sbx`;

    return {
      abhaNumber: syntheticAbha,
      abhaAddress: syntheticAddress,
      phrAddresses: [syntheticAddress],
      fullName: 'Sandbox Synthetic Patient',
      gender: 'M',
      dateOfBirth: '1992-05-14',
      yearOfBirth: '1992',
      stateName: 'MAHARASHTRA',
      districtName: 'PUNE',
      abhaStatus: 'ACTIVE',
      isNew: params.mode === 'CREATION',
      kycVerified: true,
      xToken: `mock_xtoken_${crypto.randomBytes(12).toString('hex')}`,
      txnId: params.txnId,
      correlationId: abdmCorrelationService.generateRequestId(),
      isMocked: true,
    };
  }

  private normalizeProfilePayload(
    raw: Record<string, any> = {},
    correlationId: string,
    txnId: string | undefined,
    isMocked: boolean
  ): AbhaV3ProfilePayload {
    const profileObj = raw.ABHAProfile || raw.user || raw.accounts?.[0] || raw;
    const rawAbha =
      profileObj.ABHANumber || profileObj.abhaNumber || profileObj.healthIdNumber || '';
    const phrList: string[] = Array.isArray(profileObj.phrAddress)
      ? profileObj.phrAddress
      : Array.isArray(profileObj.phrAddresses)
      ? profileObj.phrAddresses
      : profileObj.preferredAbhaAddress
      ? [profileObj.preferredAbhaAddress]
      : profileObj.abhaAddress
      ? [profileObj.abhaAddress]
      : [];

    const primaryAddress = (
      profileObj.preferredAbhaAddress ||
      profileObj.abhaAddress ||
      phrList[0] ||
      ''
    )
      .trim()
      .toLowerCase();

    const fullName =
      profileObj.name ||
      [profileObj.firstName, profileObj.middleName, profileObj.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      'Verified ABHA Holder';

    return {
      abhaNumber: rawAbha ? normalizeAbhaNumber(String(rawAbha)) : '',
      abhaAddress: primaryAddress || undefined,
      phrAddresses: phrList.map((a) => String(a).trim().toLowerCase()).filter(Boolean),
      fullName,
      gender: profileObj.gender,
      dateOfBirth: profileObj.dob || profileObj.dateOfBirth,
      yearOfBirth:
        profileObj.yearOfBirth ||
        (typeof profileObj.dob === 'string' ? profileObj.dob.slice(0, 4) : undefined),
      stateName: profileObj.stateName,
      districtName: profileObj.districtName,
      abhaStatus: profileObj.abhaStatus || profileObj.status || 'ACTIVE',
      isNew: Boolean(raw.isNew),
      kycVerified: Boolean(profileObj.kycVerified ?? true),
      xToken: raw.tokens?.token || raw.token || undefined,
      txnId: raw.txnId || txnId,
      correlationId,
      isMocked,
    };
  }
}

export const abhaV3Client = new AbhaV3Client();
