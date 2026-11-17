/**
 * HealthBridge India — Patient ABHA Identity API Client (Day 7 Task 02)
 *
 * Security Notes:
 * - Never sends or receives ABDM gateway tokens, X-Tokens, or client secrets.
 * - Patient identity is always derived server-side from the authenticated session cookie/JWT.
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  AbhaAddressAvailabilityDto,
  AbhaAddressSuggestionsDto,
  AbhaAuthorizedProfileDto,
  AbhaLinkStatusDto,
  AbhaOtpInitiationResultDto,
  AbhaOtpSystem,
  AbhaTransactionHistoryItemDto,
  AbhaVerificationOutcomeDto,
} from '@healthbridge/shared-types';

const E = API_ENDPOINTS.ABDM_INTEGRATION.ABHA;

export function extractAbhaErrorMessage(err: any, fallback: string): string {
  const code = err?.response?.data?.code || err?.response?.data?.error?.code;
  const serverMsg = err?.response?.data?.message || err?.message;

  switch (code) {
    case 'ABDM_INVALID_OTP':
      return 'The OTP entered is invalid. Please double-check the 6-digit code and try again.';
    case 'ABDM_SESSION_EXPIRED':
      return 'Your verification session has expired. Please request a fresh OTP to continue.';
    case 'ABDM_DUPLICATE_IDENTITY':
      return 'This ABHA identity is already linked to an active HealthBridge account.';
    case 'ABDM_RATE_LIMITED':
    case 'RATE_LIMIT_EXCEEDED':
      return 'Too many verification attempts. Please wait a few minutes before retrying.';
    case 'ABDM_DISABLED':
    case 'ABDM_NOT_CONFIGURED':
    case 'ABDM_TIMEOUT':
    case 'ABDM_TRANSIENT_ERROR':
      return 'The ABHA verification service is temporarily unavailable. Please try again later.';
    case 'ABDM_AUTH_ERROR':
      return 'Authorization failed. Please sign in again or restart your verification session.';
    default:
      return serverMsg || fallback;
  }
}

export const abhaApi = {
  async getStatus(): Promise<AbhaLinkStatusDto> {
    const res = await apiClient.get<ApiResponse<AbhaLinkStatusDto>>(E.STATUS);
    return res.data.data!;
  },

  async getHistory(limit = 25): Promise<AbhaTransactionHistoryItemDto[]> {
    const res = await apiClient.get<ApiResponse<AbhaTransactionHistoryItemDto[]>>(
      `${E.HISTORY}?limit=${limit}`
    );
    return res.data.data || [];
  },

  async initiateCreation(payload: {
    method: 'AADHAAR_OTP';
    aadhaarNumber: string;
    patientConsentConfirmed: true;
  }): Promise<AbhaOtpInitiationResultDto> {
    const res = await apiClient.post<ApiResponse<AbhaOtpInitiationResultDto>>(
      E.CREATION_INITIATE,
      payload
    );
    return res.data.data!;
  },

  async completeCreation(payload: {
    internalTransactionId: string;
    otp: string;
    mobileNumber?: string;
    consentAccepted: true;
  }): Promise<AbhaVerificationOutcomeDto> {
    const res = await apiClient.post<ApiResponse<AbhaVerificationOutcomeDto>>(
      E.CREATION_COMPLETE,
      payload
    );
    return res.data.data!;
  },

  async initiateNumberVerification(payload: {
    abhaNumber: string;
    otpSystem: AbhaOtpSystem;
    patientConsentConfirmed: true;
  }): Promise<AbhaOtpInitiationResultDto> {
    const res = await apiClient.post<ApiResponse<AbhaOtpInitiationResultDto>>(
      E.VERIFY_NUMBER,
      payload
    );
    return res.data.data!;
  },

  async confirmNumberVerification(payload: {
    internalTransactionId: string;
    otp: string;
  }): Promise<AbhaVerificationOutcomeDto> {
    const res = await apiClient.post<ApiResponse<AbhaVerificationOutcomeDto>>(
      E.VERIFY_NUMBER_CONFIRM,
      payload
    );
    return res.data.data!;
  },

  async checkAddressAvailability(abhaAddress: string): Promise<AbhaAddressAvailabilityDto> {
    const res = await apiClient.post<ApiResponse<AbhaAddressAvailabilityDto>>(E.ADDRESS_CHECK, {
      abhaAddress,
    });
    return res.data.data!;
  },

  async getAddressSuggestions(internalTransactionId: string): Promise<AbhaAddressSuggestionsDto> {
    const res = await apiClient.get<ApiResponse<AbhaAddressSuggestionsDto>>(
      `${E.ADDRESS_SUGGESTIONS}?internalTransactionId=${encodeURIComponent(internalTransactionId)}`
    );
    return res.data.data!;
  },

  async createAddress(payload: {
    internalTransactionId: string;
    abhaAddress: string;
    preferred?: boolean;
  }): Promise<{ abhaAddress: string; correlationId: string; isMocked: boolean }> {
    const res = await apiClient.post<
      ApiResponse<{ abhaAddress: string; correlationId: string; isMocked: boolean }>
    >(E.ADDRESS_CREATE, payload);
    return res.data.data!;
  },

  async initiateAddressVerification(payload: {
    abhaAddress: string;
    otpSystem: AbhaOtpSystem;
    patientConsentConfirmed: true;
  }): Promise<AbhaOtpInitiationResultDto> {
    const res = await apiClient.post<ApiResponse<AbhaOtpInitiationResultDto>>(
      E.ADDRESS_VERIFY,
      payload
    );
    return res.data.data!;
  },

  async confirmAddressVerification(payload: {
    internalTransactionId: string;
    otp: string;
  }): Promise<AbhaVerificationOutcomeDto> {
    const res = await apiClient.post<ApiResponse<AbhaVerificationOutcomeDto>>(
      E.ADDRESS_VERIFY_CONFIRM,
      payload
    );
    return res.data.data!;
  },

  async getAuthorizedProfile(): Promise<AbhaAuthorizedProfileDto> {
    const res = await apiClient.get<ApiResponse<AbhaAuthorizedProfileDto>>(E.PROFILE);
    return res.data.data!;
  },

  async confirmLink(payload: {
    internalTransactionId: string;
    patientConsentConfirmed: true;
    purposeAcknowledged: true;
  }): Promise<AbhaLinkStatusDto> {
    const res = await apiClient.post<ApiResponse<AbhaLinkStatusDto>>(E.LINK, payload);
    return res.data.data!;
  },

  async unlink(payload: { reason: string; confirmUnlink: true }): Promise<AbhaLinkStatusDto> {
    const res = await apiClient.post<ApiResponse<AbhaLinkStatusDto>>(E.UNLINK, payload);
    return res.data.data!;
  },
};
