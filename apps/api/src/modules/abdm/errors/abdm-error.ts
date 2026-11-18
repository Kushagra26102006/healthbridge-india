/**
 * HealthBridge India — Structured ABDM Integration Errors (Day 7 Task 01)
 */

import { AppError } from '../../../shared/errors/app-error';

export type AbdmErrorCode =
  | 'ABDM_DISABLED'
  | 'ABDM_NOT_CONFIGURED'
  | 'ABDM_PRODUCTION_LOCKED'
  | 'ABDM_AUTH_ERROR'
  | 'ABDM_TIMEOUT'
  | 'ABDM_TRANSIENT_ERROR'
  | 'ABDM_RATE_LIMITED'
  | 'ABDM_CLIENT_ERROR'
  | 'ABDM_VALIDATION_ERROR'
  | 'ABDM_WEBHOOK_UNAUTHORIZED'
  | 'ABDM_REPLAY_DETECTED'
  | 'ABDM_CONSENT_INVALID'
  | 'ABDM_UNSUPPORTED_OPERATION'
  | 'ABDM_SESSION_EXPIRED'
  | 'ABDM_INVALID_OTP'
  | 'ABDM_DUPLICATE_IDENTITY'
  | 'ABDM_ENCRYPTION_NOT_CONFIGURED'
  | 'ABDM_ENCRYPTION_REQUIRED'
  | 'ABDM_INVALID_STATE_TRANSITION'
  | 'ABDM_DUPLICATE_RESOURCE'
  | 'ABDM_PARTICIPANT_UNAUTHORIZED'
  | 'ABDM_TRANSFER_QUARANTINED'
  | 'ABDM_NOT_IMPLEMENTED_LIVE';

export class AbdmIntegrationError extends AppError {
  public readonly abdmCode: AbdmErrorCode;
  public readonly retryable: boolean;
  public readonly correlationId?: string;
  public readonly details?: Record<string, unknown>;

  constructor(params: {
    message: string;
    abdmCode: AbdmErrorCode;
    statusCode?: number;
    retryable?: boolean;
    correlationId?: string;
    details?: Record<string, unknown>;
  }) {
    super(
      params.message,
      (params.statusCode ?? 502) as any,
      params.abdmCode,
      true
    );
    this.abdmCode = params.abdmCode;
    this.retryable = params.retryable ?? false;
    this.correlationId = params.correlationId;
    this.details = params.details;
    Object.setPrototypeOf(this, AbdmIntegrationError.prototype);
  }
}
