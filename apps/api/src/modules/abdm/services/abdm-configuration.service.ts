/**
 * HealthBridge India — ABDM Configuration & Readiness Service (Day 7 Task 01)
 *
 * Manages environment-isolated ABDM configuration with strict validation,
 * production lock protection, and redacted status reporting (never exposes secrets).
 */

import type {
  AbdmEnvironment,
  AbdmIntegrationStatus,
  AbdmConfigSummaryDto,
  AbdmOnboardingChecklistItemDto,
  AbdmIntegrationStatusDashboardDto,
} from '@healthbridge/shared-types';
import { AbdmIntegrationError } from '../errors/abdm-error';

export interface AbdmRuntimeConfig {
  enabled: boolean;
  environment: AbdmEnvironment;
  baseUrl?: string;
  abhaBaseUrl?: string;
  xCmId?: string;
  clientId?: string;
  clientSecret?: string;
  callbackUrl?: string;
  webhookSecret?: string;
  requestTimeoutMs: number;
  allowProduction: boolean;
}

const VALID_ENVIRONMENTS: readonly AbdmEnvironment[] = [
  'disabled',
  'development',
  'sandbox',
  'production',
];

function isPlaceholder(val?: string): boolean {
  if (!val || !val.trim()) return true;
  const lower = val.trim().toLowerCase();
  return (
    lower.startsWith('your_') ||
    lower.includes('placeholder') ||
    lower.includes('example') ||
    lower === 'changeme'
  );
}

function isValidHttpUrl(val?: string): boolean {
  if (!val) return false;
  try {
    const parsed = new URL(val);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export class AbdmConfigurationService {
  private lastSuccessfulConnectivityCheckAt: string | null = null;
  private lastFailedConnectivityCheckAt: string | null = null;
  private lastConnectivityError: string | null = null;

  /**
   * Reads ABDM configuration from runtime environment variables (or overrides in tests).
   */
  loadConfig(source: NodeJS.ProcessEnv = process.env): AbdmRuntimeConfig {
    const rawEnv = (source.ABDM_ENVIRONMENT || 'disabled').trim().toLowerCase();
    const enabled = source.ABDM_ENABLED === 'true';
    const allowProduction = source.ABDM_ALLOW_PRODUCTION === 'true';
    const parsedTimeout = parseInt(source.ABDM_REQUEST_TIMEOUT_MS || '15000', 10);
    const requestTimeoutMs = Number.isNaN(parsedTimeout)
      ? 15000
      : Math.min(60000, Math.max(1000, parsedTimeout));

    if (!VALID_ENVIRONMENTS.includes(rawEnv as AbdmEnvironment)) {
      throw new AbdmIntegrationError({
        message: `Invalid ABDM_ENVIRONMENT '${rawEnv}'. Allowed values: disabled, development, sandbox, production.`,
        abdmCode: 'ABDM_VALIDATION_ERROR',
        statusCode: 500,
      });
    }

    return {
      enabled,
      environment: rawEnv as AbdmEnvironment,
      baseUrl: source.ABDM_BASE_URL?.trim() || undefined,
      abhaBaseUrl: source.ABDM_ABHA_BASE_URL?.trim() || undefined,
      xCmId: source.ABDM_X_CM_ID?.trim() || undefined,
      clientId: source.ABDM_CLIENT_ID?.trim() || undefined,
      clientSecret: source.ABDM_CLIENT_SECRET?.trim() || undefined,
      callbackUrl: source.ABDM_CALLBACK_URL?.trim() || undefined,
      webhookSecret: source.ABDM_WEBHOOK_SECRET?.trim() || undefined,
      requestTimeoutMs,
      allowProduction,
    };
  }

  /**
   * Validates configuration integrity. Throws AbdmIntegrationError when enabled with missing/invalid settings
   * or when production mode is attempted without explicit approval unlock.
   */
  validateConfig(config: AbdmRuntimeConfig): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.enabled || config.environment === 'disabled') {
      return { valid: true, errors, warnings };
    }

    if (config.environment === 'production' && !config.allowProduction) {
      errors.push(
        'ABDM production mode is locked by default (ABDM_ALLOW_PRODUCTION=false). Complete sandbox exit, WASA security audit, and NHA approval before enabling production.'
      );
    }

    if (config.environment === 'sandbox' || config.environment === 'production') {
      if (!isValidHttpUrl(config.baseUrl)) {
        errors.push('ABDM_BASE_URL must be a valid URL when ABDM integration is enabled in sandbox/production.');
      }
      if (config.environment === 'production' && config.baseUrl && !config.baseUrl.startsWith('https://')) {
        errors.push('ABDM_BASE_URL must use HTTPS in production mode.');
      }
      if (isPlaceholder(config.clientId)) {
        errors.push('ABDM_CLIENT_ID is required and must not be a placeholder when enabled in sandbox/production.');
      }
      if (isPlaceholder(config.clientSecret)) {
        errors.push('ABDM_CLIENT_SECRET is required and must not be a placeholder when enabled in sandbox/production.');
      }
      if (!config.xCmId) {
        errors.push('ABDM_X_CM_ID (e.g., sbx for sandbox) is required for V3 gateway requests.');
      }
      if (!isValidHttpUrl(config.callbackUrl)) {
        warnings.push('ABDM_CALLBACK_URL is not configured as a valid public HTTPS callback endpoint.');
      }
      if (isPlaceholder(config.webhookSecret)) {
        warnings.push('ABDM_WEBHOOK_SECRET is not configured; inbound callback verification will reject unverified requests.');
      }
    } else if (config.environment === 'development') {
      warnings.push('ABDM running in development/mock mode. External ABDM sandbox calls are disabled.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Enforces startup or runtime configuration validity when enabled.
   */
  assertValidWhenEnabled(source: NodeJS.ProcessEnv = process.env): AbdmRuntimeConfig {
    const config = this.loadConfig(source);
    const validation = this.validateConfig(config);

    if (!validation.valid) {
      const isProdLock = config.environment === 'production' && !config.allowProduction;
      throw new AbdmIntegrationError({
        message: `ABDM configuration invalid: ${validation.errors.join(' ')}`,
        abdmCode: isProdLock ? 'ABDM_PRODUCTION_LOCKED' : 'ABDM_NOT_CONFIGURED',
        statusCode: 503,
        details: { errors: validation.errors },
      });
    }

    return config;
  }

  recordConnectivityOutcome(success: boolean, errorMessage?: string): void {
    const now = new Date().toISOString();
    if (success) {
      this.lastSuccessfulConnectivityCheckAt = now;
      this.lastConnectivityError = null;
    } else {
      this.lastFailedConnectivityCheckAt = now;
      this.lastConnectivityError = errorMessage || 'Connectivity verification failed';
    }
  }

  /**
   * Builds a safe, redacted configuration summary (zero secrets exposed).
   */
  getSafeConfigSummary(source: NodeJS.ProcessEnv = process.env): AbdmConfigSummaryDto {
    const config = this.loadConfig(source);
    const validation = this.validateConfig(config);

    return {
      enabled: config.enabled,
      environment: config.environment,
      baseUrlConfigured: isValidHttpUrl(config.baseUrl),
      abhaBaseUrlConfigured: isValidHttpUrl(config.abhaBaseUrl),
      xCmIdConfigured: Boolean(config.xCmId),
      clientIdConfigured: !isPlaceholder(config.clientId),
      clientSecretConfigured: !isPlaceholder(config.clientSecret),
      callbackUrlConfigured: isValidHttpUrl(config.callbackUrl) && !isPlaceholder(config.callbackUrl),
      webhookSecretConfigured: !isPlaceholder(config.webhookSecret),
      requestTimeoutMs: config.requestTimeoutMs,
      productionLocked: !config.allowProduction,
      configurationErrors: validation.errors,
      configurationWarnings: validation.warnings,
    };
  }

  /**
   * Computes honest integration status dashboard payload for `/admin/integrations/abdm`.
   * Never fabricates CONNECTIVITY_VERIFIED or SANDBOX_TESTED without real verification.
   */
  getIntegrationStatusDashboard(
    source: NodeJS.ProcessEnv = process.env
  ): AbdmIntegrationStatusDashboardDto {
    const summary = this.getSafeConfigSummary(source);

    const checklistBooleans = [
      summary.baseUrlConfigured,
      summary.abhaBaseUrlConfigured,
      summary.xCmIdConfigured,
      summary.clientIdConfigured,
      summary.clientSecretConfigured,
      summary.callbackUrlConfigured,
      summary.webhookSecretConfigured,
    ];
    const configuredCount = checklistBooleans.filter(Boolean).length;
    const completenessPercent = Math.round((configuredCount / checklistBooleans.length) * 100);

    const credentialStatus: AbdmIntegrationStatus =
      summary.clientIdConfigured && summary.clientSecretConfigured
        ? 'CONFIGURED'
        : 'NOT_CONFIGURED';

    const callbackStatus: AbdmIntegrationStatus =
      summary.callbackUrlConfigured && summary.webhookSecretConfigured
        ? 'CONFIGURED'
        : 'NOT_CONFIGURED';

    let overallStatus: AbdmIntegrationStatus = 'NOT_CONFIGURED';
    let sandboxConnectivityStatus: AbdmIntegrationStatus = 'NOT_CONFIGURED';

    if (!summary.enabled || summary.environment === 'disabled') {
      overallStatus = 'NOT_CONFIGURED';
      sandboxConnectivityStatus = 'NOT_CONFIGURED';
    } else if (summary.environment === 'development') {
      overallStatus = 'MOCKED';
      sandboxConnectivityStatus = 'MOCKED';
    } else if (summary.environment === 'production' && summary.productionLocked) {
      overallStatus = 'PRODUCTION_NOT_ENABLED';
      sandboxConnectivityStatus = 'PRODUCTION_NOT_ENABLED';
    } else if (summary.configurationErrors.length > 0) {
      overallStatus = 'NOT_CONFIGURED';
      sandboxConnectivityStatus = 'NOT_CONFIGURED';
    } else {
      overallStatus = 'PENDING_ONBOARDING';
      sandboxConnectivityStatus = this.lastSuccessfulConnectivityCheckAt
        ? 'CONNECTIVITY_VERIFIED'
        : 'PENDING_ONBOARDING';
    }

    const pendingOnboardingTasks: AbdmOnboardingChecklistItemDto[] = [
      {
        id: 'sandbox-org-registration',
        title: 'Register organization & product on ABDM Sandbox Portal (sandbox.abdm.gov.in)',
        category: 'SANDBOX',
        status: 'PENDING_USER_ACTION',
        notes: 'Requires official organization details and authorized signatory contact.',
      },
      {
        id: 'sandbox-credentials',
        title: 'Provision Sandbox Client ID & Client Secret',
        category: 'CREDENTIALS',
        status:
          credentialStatus === 'CONFIGURED'
            ? 'VERIFIED_FROM_DOCS'
            : 'DEPENDENT_ON_ACCOUNT_ACCESS',
        notes: 'Inject via backend environment variables only; never expose to frontend.',
      },
      {
        id: 'public-https-callback',
        title: 'Register public HTTPS Callback URL (/api/v1/abdm/webhooks/callback) in Sandbox Bridge',
        category: 'CALLBACKS',
        status: callbackStatus === 'CONFIGURED' ? 'VERIFIED_FROM_DOCS' : 'PENDING_USER_ACTION',
        notes: 'Required for ABDM V3 asynchronous on-* gateway callbacks.',
      },
      {
        id: 'hfr-hpr-sandbox-ids',
        title: 'Register test Health Facility (HFR) and Healthcare Professional (HPR) sandbox IDs',
        category: 'SANDBOX',
        status: 'DEPENDENT_ON_ACCOUNT_ACCESS',
        notes: 'Prerequisite for Milestone 2 (HIP) and Milestone 3 (HIU) functional verification.',
      },
      {
        id: 'fhir-nrces-validator',
        title: 'Validate generated FHIR R4 Bundles against official NRCeS ndhm.in package (HAPI FHIR CLI)',
        category: 'FHIR',
        status: 'NOT_YET_VERIFIED',
        notes: 'Internal structural validator implemented; external NRCeS package validation pending.',
      },
      {
        id: 'wasa-sandbox-exit',
        title: 'Complete Milestone M1/M2/M3 functional testing, CERT-In WASA audit & NHA Sandbox Exit',
        category: 'APPROVAL',
        status: 'DEPENDENT_ON_OFFICIAL_APPROVAL',
        notes: 'Production mode remains locked (PRODUCTION_NOT_ENABLED) until official NHA approval.',
      },
    ];

    return {
      enabled: summary.enabled,
      environment: summary.environment,
      overallStatus,
      configurationCompletenessPercent: completenessPercent,
      sandboxConnectivityStatus,
      lastSuccessfulConnectivityCheckAt: this.lastSuccessfulConnectivityCheckAt,
      lastFailedConnectivityCheckAt: this.lastFailedConnectivityCheckAt,
      lastConnectivityError: this.lastConnectivityError,
      credentialStatus,
      callbackStatus,
      fhirMappingReadiness: 'CONFIGURED',
      consentAdapterReadiness: 'CONFIGURED',
      hipReadiness: 'PENDING_ONBOARDING',
      hiuReadiness: 'PENDING_ONBOARDING',
      configSummary: summary,
      pendingOnboardingTasks,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const abdmConfigurationService = new AbdmConfigurationService();
