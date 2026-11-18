/**
 * HealthBridge India — Centralized Safe User-Facing Error Normalizer
 *
 * Translates HTTP/network/validation failures into plain-language guidance
 * with safe recovery actions while NEVER exposing raw stack traces or internals.
 */

export type UserErrorCategory =
  | 'NETWORK'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'UPLOAD_FAILED'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR';

export interface NormalizedUserError {
  category: UserErrorCategory;
  title: string;
  message: string;
  suggestedAction: string;
  canRetry: boolean;
  requiresReauth: boolean;
}

interface AxiosLikeError {
  code?: string;
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
      code?: string;
    };
  };
}

const UNSAFE_PATTERNS =
  /stack|mongoservererror|mongooseserverselectionerror|mongonetworkerror|buffering timed out|econnrefused|syntaxerror|typeerror|referenceerror|cast to objectid/i;

function sanitizeServerMessage(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 220 || UNSAFE_PATTERNS.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function mapApiErrorToUserError(error: unknown): NormalizedUserError {
  const err = (error ?? {}) as AxiosLikeError;
  const status = err.response?.status;
  const safeApiMessage = sanitizeServerMessage(err.response?.data?.message);

  // Network / Offline error
  if (!status && (err.code === 'ERR_NETWORK' || err.message?.toLowerCase().includes('network'))) {
    return {
      category: 'NETWORK',
      title: 'Connection Interrupted',
      message: 'We could not reach the HealthBridge server. Your entered information has not been lost.',
      suggestedAction: 'Check your internet connection and try again.',
      canRetry: true,
      requiresReauth: false,
    };
  }

  if (status === 401) {
    return {
      category: 'SESSION_EXPIRED',
      title: 'Session Expired',
      message: 'For your healthcare privacy, your authenticated session has expired or was signed out.',
      suggestedAction: 'Sign in again to continue securely.',
      canRetry: false,
      requiresReauth: true,
    };
  }

  if (status === 403) {
    return {
      category: 'FORBIDDEN',
      title: 'Access Restricted',
      message:
        safeApiMessage ||
        'Your current role or active consent permissions do not authorize access to this resource.',
      suggestedAction: 'Verify consent status or return to your authorized portal.',
      canRetry: false,
      requiresReauth: false,
    };
  }

  if (status === 404) {
    return {
      category: 'NOT_FOUND',
      title: 'Record Not Found',
      message: safeApiMessage || 'The requested record or page could not be found.',
      suggestedAction: 'Return to the previous list and verify the item still exists.',
      canRetry: false,
      requiresReauth: false,
    };
  }

  if (status === 409) {
    return {
      category: 'CONFLICT',
      title: 'Schedule or Record Conflict',
      message:
        safeApiMessage ||
        'This time slot or record was updated by another action before your request completed.',
      suggestedAction: 'Refresh available slots or record details and try again.',
      canRetry: true,
      requiresReauth: false,
    };
  }

  if (status === 413 || status === 415) {
    return {
      category: 'UPLOAD_FAILED',
      title: 'File Upload Rejected',
      message:
        safeApiMessage ||
        'The selected file exceeds the allowed size limit or uses an unsupported format.',
      suggestedAction: 'Upload a supported PDF, PNG, or JPEG file within the stated size limit.',
      canRetry: true,
      requiresReauth: false,
    };
  }

  if (status === 400 || status === 422) {
    return {
      category: 'VALIDATION',
      title: 'Please Review Your Input',
      message:
        safeApiMessage || 'Some required fields are missing or do not match the expected format.',
      suggestedAction: 'Review highlighted fields and submit again.',
      canRetry: true,
      requiresReauth: false,
    };
  }

  if (status === 429) {
    return {
      category: 'RATE_LIMITED',
      title: 'Too Many Requests',
      message: 'To protect account security, requests are temporarily rate-limited.',
      suggestedAction: 'Wait a brief moment before trying again.',
      canRetry: true,
      requiresReauth: false,
    };
  }

  return {
    category: 'SERVER_ERROR',
    title: 'Temporary Service Issue',
    message:
      safeApiMessage ||
      'An unexpected service issue occurred while processing your request. Your health records remain safely protected.',
    suggestedAction: 'Please try again in a moment.',
    canRetry: true,
    requiresReauth: false,
  };
}
