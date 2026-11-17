/**
 * HealthBridge India — ABDM Authentication, Public Certificate & Session Lifecycle Adapter
 * (Day 7 Tasks 01 & 02)
 *
 * Implements the verified official ABDM V3 authentication architecture:
 * 1. Gateway Session Token Acquisition (`POST /api/hiecm/gateway/v3/sessions` with `REQUEST-ID`,
 *    `TIMESTAMP`, `X-CM-ID`, and `{ clientId, clientSecret, grantType: "client_credentials" }`).
 * 2. ABHA V3 Public Certificate Retrieval (`GET /v3/profile/public/certificate`) for
 *    `RSA/ECB/OAEPWithSHA-1AndMGF1Padding` payload encryption.
 * 3. Server-Side Ephemeral User `X-Token` Session Store (never persisted to DB or sent to frontend).
 *
 * Security Invariants:
 * - Tokens & client secrets are NEVER exposed to the frontend or logs.
 * - HTTPS-only enforced in sandbox/production.
 * - Mock mode in `development` returns deterministic non-production tokens and ephemeral RSA-2048 keys.
 */

import crypto from 'crypto';
import { abdmConfigurationService, type AbdmRuntimeConfig } from './abdm-configuration.service';
import { abdmCorrelationService } from './abdm-correlation.service';
import { AbdmIntegrationError } from '../errors/abdm-error';
import { logger } from '../../../config/logger';
import { redactAbdmLogPayload } from '../utils/redaction';

export interface AbdmAccessTokenRecord {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAtMs: number;
  source: 'MOCK' | 'SANDBOX_SESSION' | 'PRODUCTION_SESSION';
}

export interface AbhaPublicCertificateRecord {
  publicKey: string;
  encryptionAlgorithm: string;
  fetchedAtMs: number;
  expiresAtMs: number;
  source: 'MOCK' | 'ABHA_V3_CERT';
}

export interface AbhaUserXTokenSession {
  patientId: string;
  xToken: string;
  expiresAtMs: number;
  source: 'MOCK' | 'ABHA_V3_LOGIN';
}

export type AbdmTokenFetcher = (
  config: AbdmRuntimeConfig,
  headers: Record<string, string>
) => Promise<{ accessToken: string; expiresInSeconds: number }>;

export type AbhaCertFetcher = (
  config: AbdmRuntimeConfig,
  headers: Record<string, string>
) => Promise<{ publicKey: string; encryptionAlgorithm?: string }>;

export class AbdmAuthenticationService {
  private cachedToken: AbdmAccessTokenRecord | null = null;
  private cachedCert: AbhaPublicCertificateRecord | null = null;
  private mockKeyPair: { publicKey: string; privateKey: string } | null = null;
  private readonly userXTokens = new Map<string, AbhaUserXTokenSession>();
  private readonly refreshSafetyMarginMs = 60_000; // Refresh 60s before expiry
  private readonly certCacheTtlMs = 60 * 60 * 1000; // 1 hour public certificate cache
  private readonly xTokenDefaultTtlMs = 15 * 60 * 1000; // 15 min user X-Token TTL
  private customFetcher?: AbdmTokenFetcher;
  private customCertFetcher?: AbhaCertFetcher;

  /**
   * Allows injecting a custom/mocked gateway session fetcher during tests.
   */
  setTokenFetcher(fetcher?: AbdmTokenFetcher): void {
    this.customFetcher = fetcher;
  }

  /**
   * Allows injecting a custom/mocked ABHA V3 public certificate fetcher during tests.
   */
  setCertFetcher(fetcher?: AbhaCertFetcher): void {
    this.customCertFetcher = fetcher;
  }

  /**
   * Returns a valid ABDM Gateway Bearer access token from cache or acquires one via
   * the official V3 session endpoint (`POST /api/hiecm/gateway/v3/sessions`).
   */
  async getAccessToken(source: NodeJS.ProcessEnv = process.env): Promise<AbdmAccessTokenRecord> {
    const config = abdmConfigurationService.assertValidWhenEnabled(source);

    if (!config.enabled || config.environment === 'disabled') {
      throw new AbdmIntegrationError({
        message: 'ABDM integration is disabled. Enable ABDM_ENABLED=true with valid sandbox configuration.',
        abdmCode: 'ABDM_DISABLED',
        statusCode: 503,
      });
    }

    // Serve valid non-expired cached token
    if (
      this.cachedToken &&
      Date.now() + this.refreshSafetyMarginMs < this.cachedToken.expiresAtMs
    ) {
      return this.cachedToken;
    }

    // Development / Mock mode returns a deterministic non-production mock token
    if (config.environment === 'development') {
      this.cachedToken = {
        accessToken: 'abdm_dev_mock_token_not_for_sandbox',
        tokenType: 'Bearer',
        expiresAtMs: Date.now() + 15 * 60 * 1000,
        source: 'MOCK',
      };
      return this.cachedToken;
    }

    // Enforce HTTPS for sandbox/production gateway session calls
    const baseUrl = (config.baseUrl || '').replace(/\/+$/, '');
    if (!baseUrl.startsWith('https://')) {
      throw new AbdmIntegrationError({
        message: 'ABDM_BASE_URL must use HTTPS in sandbox and production environments.',
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 503,
      });
    }

    const correlationId = abdmCorrelationService.generateRequestId();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'REQUEST-ID': correlationId,
      TIMESTAMP: abdmCorrelationService.generateTimestamp(),
      'X-CM-ID': config.xCmId || 'sbx',
    };

    try {
      let result: { accessToken: string; expiresInSeconds: number };

      if (this.customFetcher) {
        result = await this.customFetcher(config, headers);
      } else {
        result = await this.fetchLiveGatewaySession(config, baseUrl, headers, correlationId);
      }

      if (!result.accessToken) {
        throw new Error('Empty access token returned by ABDM gateway session endpoint');
      }

      this.cachedToken = {
        accessToken: result.accessToken,
        tokenType: 'Bearer',
        expiresAtMs: Date.now() + Math.max(60, result.expiresInSeconds || 900) * 1000,
        source: config.environment === 'production' ? 'PRODUCTION_SESSION' : 'SANDBOX_SESSION',
      };

      abdmConfigurationService.recordConnectivityOutcome(true);
      return this.cachedToken;
    } catch (err: any) {
      this.clearToken();
      const safeMsg = `ABDM authentication failed: ${err?.message || 'Unable to acquire session token'}`;
      abdmConfigurationService.recordConnectivityOutcome(false, safeMsg);

      logger.warn(
        'ABDM gateway session authentication failed',
        redactAbdmLogPayload({
          event: 'ABDM_AUTH_FAILURE',
          correlationId,
          environment: config.environment,
          error: safeMsg,
        }) as Record<string, unknown>
      );

      if (err instanceof AbdmIntegrationError) {
        throw err;
      }

      throw new AbdmIntegrationError({
        message: safeMsg,
        abdmCode: 'ABDM_AUTH_ERROR',
        statusCode: 502,
        correlationId,
      });
    }
  }

  /**
   * Executes the verified ABDM V3 Gateway Session request:
   * `POST /api/hiecm/gateway/v3/sessions`
   */
  private async fetchLiveGatewaySession(
    config: AbdmRuntimeConfig,
    baseUrl: string,
    headers: Record<string, string>,
    correlationId: string
  ): Promise<{ accessToken: string; expiresInSeconds: number }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    try {
      const response = await globalThis.fetch(`${baseUrl}/api/hiecm/gateway/v3/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          grantType: 'client_credentials',
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      const rawText = await response.text();
      let body: Record<string, any> = {};
      if (rawText) {
        try {
          body = JSON.parse(rawText);
        } catch {
          body = {};
        }
      }

      if (!response.ok) {
        throw new AbdmIntegrationError({
          message: `ABDM gateway session endpoint returned HTTP ${response.status}`,
          abdmCode: response.status === 429 ? 'ABDM_RATE_LIMITED' : 'ABDM_AUTH_ERROR',
          statusCode: response.status === 401 || response.status === 403 ? 401 : 502,
          correlationId,
        });
      }

      const accessToken = body.accessToken || body.access_token;
      const expiresInSeconds = Number(body.expiresIn || body.expires_in || 900);
      if (!accessToken) {
        throw new Error('Gateway session response did not contain accessToken');
      }

      return { accessToken, expiresInSeconds };
    } catch (err: any) {
      clearTimeout(timer);
      if (err?.name === 'AbortError') {
        throw new AbdmIntegrationError({
          message: `ABDM gateway session request timed out after ${config.requestTimeoutMs}ms`,
          abdmCode: 'ABDM_TIMEOUT',
          statusCode: 504,
          correlationId,
        });
      }
      throw err;
    }
  }

  /**
   * Fetches and caches the ABHA V3 RSA Public Certificate (`GET /v3/profile/public/certificate`)
   * required for encrypting sensitive Aadhaar / ABHA / OTP fields via RSA-OAEP-SHA1.
   */
  async getAbhaPublicCertificate(
    source: NodeJS.ProcessEnv = process.env
  ): Promise<AbhaPublicCertificateRecord> {
    const config = abdmConfigurationService.assertValidWhenEnabled(source);

    if (!config.enabled || config.environment === 'disabled') {
      throw new AbdmIntegrationError({
        message: 'ABDM integration is disabled; public certificate cannot be retrieved.',
        abdmCode: 'ABDM_DISABLED',
        statusCode: 503,
      });
    }

    if (this.cachedCert && Date.now() < this.cachedCert.expiresAtMs) {
      return this.cachedCert;
    }

    if (config.environment === 'development' && !this.customCertFetcher) {
      const pair = this.getOrGenerateMockRsaKeyPair();
      this.cachedCert = {
        publicKey: pair.publicKey,
        encryptionAlgorithm: 'RSA/ECB/OAEPWithSHA-1AndMGF1Padding',
        fetchedAtMs: Date.now(),
        expiresAtMs: Date.now() + this.certCacheTtlMs,
        source: 'MOCK',
      };
      return this.cachedCert;
    }

    const tokenRecord = await this.getAccessToken(source);
    const correlationId = abdmCorrelationService.generateRequestId();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `${tokenRecord.tokenType} ${tokenRecord.accessToken}`,
      'REQUEST-ID': correlationId,
      TIMESTAMP: abdmCorrelationService.generateTimestamp(),
      ...(config.xCmId ? { 'X-CM-ID': config.xCmId } : {}),
    };

    try {
      let certData: { publicKey: string; encryptionAlgorithm?: string };
      if (this.customCertFetcher) {
        certData = await this.customCertFetcher(config, headers);
      } else {
        const abhaBase = (
          config.abhaBaseUrl || 'https://abhasbx.abdm.gov.in/abha/api/v3'
        ).replace(/\/+$/, '');
        if (!abhaBase.startsWith('https://')) {
          throw new AbdmIntegrationError({
            message: 'ABDM_ABHA_BASE_URL must use HTTPS in sandbox/production.',
            abdmCode: 'ABDM_VALIDATION_ERROR',
            statusCode: 503,
          });
        }
        const certUrl = abhaBase.endsWith('/v3')
          ? `${abhaBase}/profile/public/certificate`
          : `${abhaBase}/v3/profile/public/certificate`;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
        try {
          const res = await globalThis.fetch(certUrl, {
            method: 'GET',
            headers,
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (!res.ok) {
            throw new AbdmIntegrationError({
              message: `ABHA public certificate endpoint returned HTTP ${res.status}`,
              abdmCode: 'ABDM_TRANSIENT_ERROR',
              statusCode: 502,
              correlationId,
            });
          }
          const parsed = (await res.json()) as {
            publicKey?: string;
            encryptionAlgorithm?: string;
          };
          if (!parsed.publicKey) {
            throw new Error('ABHA public certificate response missing publicKey');
          }
          certData = {
            publicKey: parsed.publicKey,
            encryptionAlgorithm:
              parsed.encryptionAlgorithm || 'RSA/ECB/OAEPWithSHA-1AndMGF1Padding',
          };
        } finally {
          clearTimeout(timer);
        }
      }

      this.cachedCert = {
        publicKey: certData.publicKey,
        encryptionAlgorithm:
          certData.encryptionAlgorithm || 'RSA/ECB/OAEPWithSHA-1AndMGF1Padding',
        fetchedAtMs: Date.now(),
        expiresAtMs: Date.now() + this.certCacheTtlMs,
        source: 'ABHA_V3_CERT',
      };
      return this.cachedCert;
    } catch (err: any) {
      if (err instanceof AbdmIntegrationError) throw err;
      throw new AbdmIntegrationError({
        message: `Failed to retrieve ABHA V3 public certificate: ${err?.message || 'unknown error'}`,
        abdmCode: 'ABDM_TRANSIENT_ERROR',
        statusCode: 502,
        correlationId,
      });
    }
  }

  /**
   * Stores a patient's short-lived ABHA user X-Token exclusively in server memory.
   * Never persisted to MongoDB or returned to the browser.
   */
  storeUserXToken(
    patientId: string,
    xToken: string,
    source: 'MOCK' | 'ABHA_V3_LOGIN',
    ttlMs = this.xTokenDefaultTtlMs
  ): void {
    this.userXTokens.set(patientId, {
      patientId,
      xToken,
      expiresAtMs: Date.now() + ttlMs,
      source,
    });
  }

  /**
   * Retrieves a valid non-expired server-side user X-Token for authorized ABHA profile calls.
   */
  getUserXToken(patientId: string): AbhaUserXTokenSession | null {
    const entry = this.userXTokens.get(patientId);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAtMs) {
      this.userXTokens.delete(patientId);
      return null;
    }
    return entry;
  }

  clearUserXToken(patientId: string): void {
    this.userXTokens.delete(patientId);
  }

  /**
   * Clears cached gateway token & public certificate on rotation or 401 failure.
   */
  clearToken(): void {
    this.cachedToken = null;
  }

  clearCertificate(): void {
    this.cachedCert = null;
  }

  clearAllSessions(): void {
    this.cachedToken = null;
    this.cachedCert = null;
    this.userXTokens.clear();
  }

  /**
   * Returns non-sensitive token cache status for diagnostics (never returns token strings).
   */
  getTokenStatus(): { hasCachedToken: boolean; expiresAt?: string; source?: string } {
    if (!this.cachedToken) {
      return { hasCachedToken: false };
    }
    return {
      hasCachedToken: Date.now() < this.cachedToken.expiresAtMs,
      expiresAt: new Date(this.cachedToken.expiresAtMs).toISOString(),
      source: this.cachedToken.source,
    };
  }

  private getOrGenerateMockRsaKeyPair(): { publicKey: string; privateKey: string } {
    if (!this.mockKeyPair) {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      this.mockKeyPair = { publicKey, privateKey };
    }
    return this.mockKeyPair;
  }
}

export const abdmAuthenticationService = new AbdmAuthenticationService();
