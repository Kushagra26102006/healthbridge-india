/**
 * HealthBridge India — ABDM HIE-CM V3 Consent Manager Client Adapter (Day 7 Task 03)
 *
 * Implements ONLY officially verified ABDM V3 HIE-CM consent endpoints:
 * - POST /api/hiecm/consent/v3/request/init
 * - POST /api/hiecm/consent/v3/request/status
 * - POST /api/hiecm/consent/v3/fetch
 * - POST /api/hiecm/consent/v3/request/hiu/on-notify
 * - POST /api/hiecm/consent/v3/request/hip/on-notify
 * - POST /api/hiecm/gateway/v3/consents/revoke (PHR-app role + patient X-AUTH-TOKEN required)
 *
 * STRICT HONESTY & FAIL-CLOSED RULES:
 * - In `development` mode: uses deterministic synthetic mock responses flagged `isMocked: true`.
 *   NEVER fabricates an `APPROVED`/`GRANTED` consent artefact on request initiation.
 * - In `sandbox` mode: calls official ABDM gateway endpoints via `abdmHttpClient` with HTTPS & gateway Bearer token.
 * - In `disabled` or locked `production` mode: fails closed with typed `AbdmIntegrationError`.
 */

import crypto from 'crypto';
import type {
  AbdmConsentAccessMode,
  AbdmConsentFrequencyDto,
  AbdmEnvironment,
  AbdmExternalConsentStatus,
  AbdmHealthInfoType,
  AbdmPurposeCode,
} from '@healthbridge/shared-types';
import { abdmConfigurationService } from '../services/abdm-configuration.service';
import { abdmCorrelationService } from '../services/abdm-correlation.service';
import { abdmHttpClient } from './abdm-http.client';
import { AbdmIntegrationError } from '../errors/abdm-error';

export const VERIFIED_ABDM_CONSENT_V3_PATHS = {
  REQUEST_INIT: '/api/hiecm/consent/v3/request/init',
  REQUEST_STATUS: '/api/hiecm/consent/v3/request/status',
  CONSENT_FETCH: '/api/hiecm/consent/v3/fetch',
  HIU_ON_NOTIFY: '/api/hiecm/consent/v3/request/hiu/on-notify',
  HIP_ON_NOTIFY: '/api/hiecm/consent/v3/request/hip/on-notify',
  PHR_CONSENT_REVOKE: '/api/hiecm/gateway/v3/consents/revoke',
} as const;

export interface InitConsentRequestAdapterInput {
  correlationId: string;
  patientAbhaAddress: string;
  hiuId: string;
  requesterName: string;
  requesterIdentifierValue: string;
  purposeCode: AbdmPurposeCode;
  purposeText: string;
  hiTypes: AbdmHealthInfoType[];
  accessMode: AbdmConsentAccessMode;
  dateRange: { from: string; to: string };
  dataEraseAt: string;
  frequency: AbdmConsentFrequencyDto;
}

export interface InitConsentRequestAdapterResult {
  accepted: boolean;
  correlationId: string;
  externalTransactionRef: string;
  externalRequestId?: string;
  externalStatus: AbdmExternalConsentStatus;
  environment: AbdmEnvironment;
  isMocked: boolean;
  acknowledgedAt: string;
}

export interface PollConsentStatusAdapterResult {
  accepted: boolean;
  correlationId: string;
  externalStatus?: AbdmExternalConsentStatus;
  environment: AbdmEnvironment;
  isMocked: boolean;
  checkedAt: string;
}

export interface FetchConsentArtefactAdapterResult {
  accepted: boolean;
  correlationId: string;
  environment: AbdmEnvironment;
  isMocked: boolean;
  requestedAt: string;
}

export interface RevokeConsentAdapterResult {
  supportedByCurrentRole: boolean;
  externalConfirmed: boolean;
  correlationId: string;
  environment: AbdmEnvironment;
  isMocked: boolean;
  reason: string;
}

export class AbdmConsentV3Client {
  private resolveMode(envSource: NodeJS.ProcessEnv = process.env): {
    environment: AbdmEnvironment;
    isMocked: boolean;
    xCmId: string;
  } {
    const config = abdmConfigurationService.loadConfig(envSource);

    if (!config.enabled || config.environment === 'disabled') {
      throw new AbdmIntegrationError({
        message: 'ABDM integration is disabled. Enable development or sandbox mode to invoke consent APIs.',
        abdmCode: 'ABDM_DISABLED',
        statusCode: 503,
      });
    }

    if (config.environment === 'production' && !config.allowProduction) {
      throw new AbdmIntegrationError({
        message: 'ABDM production mode is locked (ABDM_ALLOW_PRODUCTION=false).',
        abdmCode: 'ABDM_PRODUCTION_LOCKED',
        statusCode: 403,
      });
    }

    return {
      environment: config.environment,
      isMocked: config.environment === 'development',
      xCmId: config.xCmId || 'sbx',
    };
  }

  /**
   * POST /api/hiecm/consent/v3/request/init
   * Initiates an asynchronous HIU consent request. Never fabricates an approved outcome.
   */
  async initConsentRequest(
    input: InitConsentRequestAdapterInput,
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<InitConsentRequestAdapterResult> {
    const mode = this.resolveMode(envSource);
    const requestId = input.correlationId || abdmCorrelationService.generateRequestId();

    abdmCorrelationService.registerOutboundRequest('HIECM_CONSENT_REQUEST_INIT', requestId);

    if (mode.isMocked) {
      const mockExternalReqId = `sbx-cr-${crypto.randomUUID()}`;
      return {
        accepted: true,
        correlationId: requestId,
        externalTransactionRef: `txn-${requestId.slice(0, 12)}`,
        externalRequestId: mockExternalReqId,
        externalStatus: 'REQUESTED',
        environment: mode.environment,
        isMocked: true,
        acknowledgedAt: new Date().toISOString(),
      };
    }

    const body = {
      consent: {
        purpose: {
          text: input.purposeText,
          code: input.purposeCode,
        },
        patient: {
          id: input.patientAbhaAddress,
        },
        hiu: {
          id: input.hiuId,
        },
        requester: {
          name: input.requesterName,
          identifier: {
            type: 'REGNO',
            value: input.requesterIdentifierValue,
            system: 'https://www.mciindia.org',
          },
        },
        hiTypes: input.hiTypes,
        permission: {
          accessMode: input.accessMode,
          dateRange: input.dateRange,
          dataEraseAt: input.dataEraseAt,
          frequency: input.frequency,
        },
      },
    };

    const res = await abdmHttpClient.request<{ consentRequest?: { id?: string } }>({
      service: 'gateway',
      method: 'POST',
      path: VERIFIED_ABDM_CONSENT_V3_PATHS.REQUEST_INIT,
      idempotent: false,
      envSource,
      headers: {
        'REQUEST-ID': requestId,
        'X-CM-ID': mode.xCmId,
        'X-HIU-ID': input.hiuId,
      },
      body,
    });

    return {
      accepted: res.status >= 200 && res.status < 300,
      correlationId: requestId,
      externalTransactionRef: requestId,
      externalRequestId: res.data?.consentRequest?.id,
      externalStatus: 'REQUESTED',
      environment: mode.environment,
      isMocked: false,
      acknowledgedAt: new Date().toISOString(),
    };
  }

  /**
   * POST /api/hiecm/consent/v3/request/status
   * Requests asynchronous status update for an existing external consentRequestId.
   */
  async fetchConsentRequestStatus(
    params: { externalRequestId: string; hiuId: string },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<PollConsentStatusAdapterResult> {
    const mode = this.resolveMode(envSource);
    const requestId = abdmCorrelationService.generateRequestId();

    abdmCorrelationService.registerOutboundRequest('HIECM_CONSENT_REQUEST_STATUS', requestId);

    if (mode.isMocked) {
      return {
        accepted: true,
        correlationId: requestId,
        environment: mode.environment,
        isMocked: true,
        checkedAt: new Date().toISOString(),
      };
    }

    const res = await abdmHttpClient.request({
      service: 'gateway',
      method: 'POST',
      path: VERIFIED_ABDM_CONSENT_V3_PATHS.REQUEST_STATUS,
      idempotent: true,
      envSource,
      headers: {
        'REQUEST-ID': requestId,
        'X-CM-ID': mode.xCmId,
        'X-HIU-ID': params.hiuId,
      },
      body: {
        consentRequestId: params.externalRequestId,
      },
    });

    return {
      accepted: res.status >= 200 && res.status < 300,
      correlationId: requestId,
      environment: mode.environment,
      isMocked: false,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * POST /api/hiecm/consent/v3/fetch
   * Requests full signed Consent Artefact payload from HIE-CM for a granted consentId.
   */
  async fetchConsentArtefact(
    params: { externalConsentId: string; hiuId: string },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<FetchConsentArtefactAdapterResult> {
    const mode = this.resolveMode(envSource);
    const requestId = abdmCorrelationService.generateRequestId();

    abdmCorrelationService.registerOutboundRequest('HIECM_CONSENT_ARTEFACT_FETCH', requestId);

    if (mode.isMocked) {
      return {
        accepted: true,
        correlationId: requestId,
        environment: mode.environment,
        isMocked: true,
        requestedAt: new Date().toISOString(),
      };
    }

    const res = await abdmHttpClient.request({
      service: 'gateway',
      method: 'POST',
      path: VERIFIED_ABDM_CONSENT_V3_PATHS.CONSENT_FETCH,
      idempotent: true,
      envSource,
      headers: {
        'REQUEST-ID': requestId,
        'X-CM-ID': mode.xCmId,
        'X-HIU-ID': params.hiuId,
      },
      body: {
        consentId: params.externalConsentId,
      },
    });

    return {
      accepted: res.status >= 200 && res.status < 300,
      correlationId: requestId,
      environment: mode.environment,
      isMocked: false,
      requestedAt: new Date().toISOString(),
    };
  }

  /**
   * POST /api/hiecm/consent/v3/request/hiu/on-notify or hip/on-notify
   * Acknowledges receipt of consent notification callbacks back to the ABDM Gateway.
   */
  async acknowledgeConsentNotification(
    params: {
      role: 'HIU' | 'HIP';
      participantId: string;
      respRequestId: string;
      consentIds: string[];
    },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<{ acknowledged: boolean; correlationId: string; isMocked: boolean }> {
    const mode = this.resolveMode(envSource);
    const requestId = abdmCorrelationService.generateRequestId();

    if (mode.isMocked) {
      return { acknowledged: true, correlationId: requestId, isMocked: true };
    }

    const path =
      params.role === 'HIP'
        ? VERIFIED_ABDM_CONSENT_V3_PATHS.HIP_ON_NOTIFY
        : VERIFIED_ABDM_CONSENT_V3_PATHS.HIU_ON_NOTIFY;
    const roleHeaderKey = params.role === 'HIP' ? 'X-HIP-ID' : 'X-HIU-ID';

    const res = await abdmHttpClient.request({
      service: 'gateway',
      method: 'POST',
      path,
      idempotent: true,
      envSource,
      headers: {
        'REQUEST-ID': requestId,
        'X-CM-ID': mode.xCmId,
        [roleHeaderKey]: params.participantId,
      },
      body: {
        acknowledgement: params.consentIds.map((consentId) => ({
          status: 'OK',
          consentId,
        })),
        resp: {
          requestId: params.respRequestId,
        },
      },
    });

    return {
      acknowledged: res.status >= 200 && res.status < 300,
      correlationId: requestId,
      isMocked: false,
    };
  }

  /**
   * Attempts external ABDM consent revocation ONLY if a patient PHR X-AUTH-TOKEN is supplied
   * under an authorized PHR-capable integration. Otherwise returns `externalConfirmed: false`
   * so HealthBridge marks revocation `PENDING_CONFIRMATION` and guides the patient to their
   * official ABDM PHR application — NEVER falsely claiming external revocation succeeded.
   */
  async requestConsentRevocation(
    params: {
      externalConsentId: string;
      patientPhrAuthToken?: string;
    },
    envSource: NodeJS.ProcessEnv = process.env
  ): Promise<RevokeConsentAdapterResult> {
    const mode = this.resolveMode(envSource);
    const correlationId = abdmCorrelationService.generateRequestId();

    abdmCorrelationService.registerOutboundRequest('HIECM_CONSENT_REVOKE_REQUEST', correlationId);

    if (!params.patientPhrAuthToken) {
      return {
        supportedByCurrentRole: false,
        externalConfirmed: false,
        correlationId,
        environment: mode.environment,
        isMocked: mode.isMocked,
        reason:
          'Direct HIE-CM revocation requires an official ABDM PHR session (X-AUTH-TOKEN). Internal access has been blocked immediately; confirm revocation in your ABDM PHR app to synchronize external HIE-CM state.',
      };
    }

    if (mode.isMocked) {
      return {
        supportedByCurrentRole: true,
        externalConfirmed: false,
        correlationId,
        environment: mode.environment,
        isMocked: true,
        reason:
          'Mocked HIE-CM revocation request accepted (202); awaiting external REVOKED callback confirmation.',
      };
    }

    await abdmHttpClient.request({
      service: 'gateway',
      method: 'POST',
      path: VERIFIED_ABDM_CONSENT_V3_PATHS.PHR_CONSENT_REVOKE,
      idempotent: false,
      envSource,
      headers: {
        'REQUEST-ID': correlationId,
        'X-AUTH-TOKEN': params.patientPhrAuthToken,
        'X-CM-ID': mode.xCmId,
      },
      body: {
        consents: [params.externalConsentId],
      },
    });

    return {
      supportedByCurrentRole: true,
      externalConfirmed: false,
      correlationId,
      environment: mode.environment,
      isMocked: false,
      reason:
        'External HIE-CM revocation request submitted (202 Accepted); awaiting asynchronous REVOKED callback confirmation.',
    };
  }
}

export const abdmConsentV3Client = new AbdmConsentV3Client();
