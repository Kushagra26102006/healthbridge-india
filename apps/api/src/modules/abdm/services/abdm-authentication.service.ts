/**
 * HealthBridge India — ABDM Authentication & Credential Lifecycle Adapter (Day 7 Task 01)
 *
 * Implements a secure, server-only token lifecycle abstraction aligned with the
 * documented ABDM V3 Gateway Sessions contract (`POST /api/hiecm/gateway/v3/sessions`)
 * WITHOUT fabricating live sandbox authentication success when credentials are absent.
 */

import { abdmConfigurationService, type AbdmRuntimeConfig } from './abdm-configuration.service';
import { abdmCorrelationService } from './abdm-correlation.service';
import { AbdmIntegrationError } from '../errors/abdm-error';

export interface AbdmAccessTokenRecord {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAtMs: number;
  source: 'MOCK' | 'SANDBOX_SESSION';
}

export type AbdmTokenFetcher = (
  config: AbdmRuntimeConfig,
  headers: Record<string, string>
) => Promise<{ accessToken: string; expiresInSeconds: number }>;

export class AbdmAuthenticationService {
  private cachedToken: AbdmAccessTokenRecord | null = null;
  private readonly refreshSafetyMarginMs = 60_000; // Refresh 60s before expiry
  private customFetcher?: AbdmTokenFetcher;

  /**
   * Allows injecting a custom/mocked fetcher during unit tests without altering runtime safety.
   */
  setTokenFetcher(fetcher?: AbdmTokenFetcher): void {
    this.customFetcher = fetcher;
  }

  /**
   * Returns a valid access token from cache or invokes the configured authentication adapter.
   * Rejects calls when ABDM is disabled or unconfigured.
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

    // Sandbox / Production mode requires verified token fetcher or explicit sandbox activation
    if (this.customFetcher) {
      const headers = {
        'Content-Type': 'application/json',
        'REQUEST-ID': abdmCorrelationService.generateRequestId(),
        TIMESTAMP: abdmCorrelationService.generateTimestamp(),
        'X-CM-ID': config.xCmId || 'sbx',
      };

      try {
        const result = await this.customFetcher(config, headers);
        if (!result.accessToken) {
          throw new Error('Empty access token returned by authentication provider');
        }
        this.cachedToken = {
          accessToken: result.accessToken,
          tokenType: 'Bearer',
          expiresAtMs: Date.now() + Math.max(60, result.expiresInSeconds) * 1000,
          source: 'SANDBOX_SESSION',
        };
        return this.cachedToken;
      } catch (err: any) {
        this.clearToken();
        throw new AbdmIntegrationError({
          message: `ABDM authentication failed: ${err?.message || 'Unable to acquire session token'}`,
          abdmCode: 'ABDM_AUTH_ERROR',
          statusCode: 502,
        });
      }
    }

    // Foundation Task 01 intentionally does not execute live outbound credential exchange
    throw new AbdmIntegrationError({
      message:
        'Live ABDM V3 session token exchange is disabled in Day 7 Task 01 foundation mode pending verified sandbox onboarding.',
      abdmCode: 'ABDM_NOT_IMPLEMENTED_LIVE',
      statusCode: 501,
    });
  }

  /**
   * Clears cached token on logout, credential rotation, or 401 unauthorized failure.
   */
  clearToken(): void {
    this.cachedToken = null;
  }

  /**
   * Returns non-sensitive token cache status for diagnostics (never returns token string).
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
}

export const abdmAuthenticationService = new AbdmAuthenticationService();
