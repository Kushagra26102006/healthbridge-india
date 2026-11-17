/**
 * HealthBridge India — Centralized ABDM HTTP Client Abstraction (Day 7 Task 01)
 *
 * Enforces:
 * - Configurable base URL & strict request timeout (AbortController)
 * - Automatic correlation ID (`REQUEST-ID`) & UTC `TIMESTAMP` header propagation
 * - Auth adapter integration (`Authorization: Bearer ...`) with 401 token invalidation
 * - Bounded retry ONLY for transient errors on idempotent requests (never retries non-idempotent POSTs blindly)
 * - Mandatory sensitive-field log redaction
 */

import { abdmConfigurationService } from '../services/abdm-configuration.service';
import { abdmAuthenticationService } from '../services/abdm-authentication.service';
import { abdmCorrelationService } from '../services/abdm-correlation.service';
import { AbdmIntegrationError } from '../errors/abdm-error';
import { redactAbdmLogPayload } from '../utils/redaction';
import { logger } from '../../../config/logger';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface AbdmHttpRequestOptions {
  method: HttpMethod;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxRetries?: number;
  /** Explicitly mark a non-GET request as idempotent per verified ABDM API specification */
  idempotent?: boolean;
  /** Skip bearer auth injection (e.g., for session creation or public certs) */
  skipAuth?: boolean;
  /** Optional environment source override (used in unit tests) */
  envSource?: NodeJS.ProcessEnv;
}

export interface AbdmHttpResponse<T = unknown> {
  status: number;
  correlationId: string;
  headers: Record<string, string>;
  data: T;
  attempts: number;
}

export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  }
) => Promise<{
  ok: boolean;
  status: number;
  headers?: { forEach?: (cb: (val: string, key: string) => void) => void };
  text: () => Promise<string>;
}>;

const TRANSIENT_STATUS_CODES = new Set([408, 429, 502, 503, 504]);
const IDEMPOTENT_METHODS = new Set<HttpMethod>(['GET', 'HEAD', 'OPTIONS']);

export class AbdmHttpClient {
  private readonly fetchFn: FetchLike;
  private readonly retryBaseDelayMs: number;

  constructor(options?: { fetchFn?: FetchLike; retryBaseDelayMs?: number }) {
    this.fetchFn = options?.fetchFn || (globalThis.fetch as unknown as FetchLike);
    this.retryBaseDelayMs = options?.retryBaseDelayMs ?? 150;
  }

  async request<T = unknown>(options: AbdmHttpRequestOptions): Promise<AbdmHttpResponse<T>> {
    const config = abdmConfigurationService.assertValidWhenEnabled(options.envSource);
    if (!config.enabled || config.environment === 'disabled') {
      throw new AbdmIntegrationError({
        message: 'ABDM integration is disabled; outbound HTTP requests are blocked.',
        abdmCode: 'ABDM_DISABLED',
        statusCode: 503,
      });
    }

    const baseUrl = (config.baseUrl || 'https://dev.abdm.gov.in').replace(/\/+$/, '');
    const normalizedPath = options.path.startsWith('/') ? options.path : `/${options.path}`;
    const url = `${baseUrl}${normalizedPath}`;
    const timeoutMs = options.timeoutMs ?? config.requestTimeoutMs;
    const isIdempotent = IDEMPOTENT_METHODS.has(options.method) || options.idempotent === true;
    const maxRetries = isIdempotent ? Math.min(3, Math.max(0, options.maxRetries ?? 2)) : 0;

    const correlationId = abdmCorrelationService.generateRequestId();
    abdmCorrelationService.registerOutboundRequest(`${options.method} ${normalizedPath}`, correlationId);

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'REQUEST-ID': correlationId,
      TIMESTAMP: abdmCorrelationService.generateTimestamp(),
      ...(config.xCmId ? { 'X-CM-ID': config.xCmId } : {}),
      ...(options.headers || {}),
    };

    if (!options.skipAuth) {
      const tokenRecord = await abdmAuthenticationService.getAccessToken(options.envSource);
      requestHeaders.Authorization = `${tokenRecord.tokenType} ${tokenRecord.accessToken}`;
    }

    // Redacted structured request log (never logs secrets, tokens, ABHA, or clinical payloads)
    logger.info(
      `ABDM outbound ${options.method} ${normalizedPath}`,
      redactAbdmLogPayload({
        event: 'ABDM_OUTBOUND_REQUEST',
        method: options.method,
        path: normalizedPath,
        correlationId,
        environment: config.environment,
        headers: requestHeaders,
      }) as Record<string, unknown>
    );

    let attempt = 0;
    let lastError: AbdmIntegrationError | null = null;

    while (attempt <= maxRetries) {
      attempt += 1;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await this.fetchFn(url, {
          method: options.method,
          headers: requestHeaders,
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timer);

        const rawText = await res.text();
        let parsedBody: unknown = undefined;
        if (rawText) {
          try {
            parsedBody = JSON.parse(rawText);
          } catch {
            parsedBody = rawText;
          }
        }

        const responseHeaders: Record<string, string> = {};
        if (res.headers && typeof res.headers.forEach === 'function') {
          res.headers.forEach((val, key) => {
            responseHeaders[key.toLowerCase()] = val;
          });
        }

        if (res.status === 401 || res.status === 403) {
          if (res.status === 401) {
            abdmAuthenticationService.clearToken();
          }
          throw new AbdmIntegrationError({
            message: `ABDM authentication/authorization error (HTTP ${res.status})`,
            abdmCode: 'ABDM_AUTH_ERROR',
            statusCode: res.status,
            retryable: false,
            correlationId,
          });
        }

        if (TRANSIENT_STATUS_CODES.has(res.status)) {
          lastError = new AbdmIntegrationError({
            message: `ABDM transient gateway error (HTTP ${res.status})`,
            abdmCode: 'ABDM_TRANSIENT_ERROR',
            statusCode: res.status,
            retryable: true,
            correlationId,
          });

          if (attempt <= maxRetries) {
            await this.sleep(this.retryBaseDelayMs * attempt);
            continue;
          }
          throw lastError;
        }

        if (!res.ok) {
          throw new AbdmIntegrationError({
            message: `ABDM request failed with HTTP ${res.status}`,
            abdmCode: 'ABDM_CLIENT_ERROR',
            statusCode: res.status,
            retryable: false,
            correlationId,
            details: { status: res.status },
          });
        }

        return {
          status: res.status,
          correlationId,
          headers: responseHeaders,
          data: parsedBody as T,
          attempts: attempt,
        };
      } catch (err: any) {
        clearTimeout(timer);

        if (err instanceof AbdmIntegrationError) {
          throw err;
        }

        const isAbort = err?.name === 'AbortError' || /abort|timeout/i.test(String(err?.message));
        lastError = new AbdmIntegrationError({
          message: isAbort
            ? `ABDM request timed out after ${timeoutMs}ms`
            : `ABDM network transport failure: ${err?.message || 'Unknown error'}`,
          abdmCode: isAbort ? 'ABDM_TIMEOUT' : 'ABDM_TRANSIENT_ERROR',
          statusCode: isAbort ? 504 : 502,
          retryable: true,
          correlationId,
        });

        if (attempt <= maxRetries) {
          await this.sleep(this.retryBaseDelayMs * attempt);
          continue;
        }

        logger.warn(
          lastError.message,
          redactAbdmLogPayload({
            event: 'ABDM_OUTBOUND_FAILURE',
            method: options.method,
            path: normalizedPath,
            correlationId,
            abdmCode: lastError.abdmCode,
            attempts: attempt,
          }) as Record<string, unknown>
        );
        throw lastError;
      }
    }

    throw (
      lastError ||
      new AbdmIntegrationError({
        message: 'ABDM request exhausted retry attempts',
        abdmCode: 'ABDM_TRANSIENT_ERROR',
        statusCode: 502,
        correlationId,
      })
    );
  }

  private sleep(ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const abdmHttpClient = new AbdmHttpClient();
