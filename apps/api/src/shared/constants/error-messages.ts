/**
 * Centralized User-Facing Error Messages for HealthBridge India
 */
export const ErrorMessages = {
  INTERNAL_ERROR: 'An unexpected internal error occurred. Please try again later.',
  UNAUTHORIZED: 'Authentication credentials are required or have expired.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_FAILED: 'Validation failed for the request payload.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please slow down and try again shortly.',
  DUPLICATE_RESOURCE: 'A resource with the provided unique identifier already exists.',
  MALFORMED_JSON: 'Malformed JSON payload in request body.',
  DATABASE_ERROR: 'A database error occurred while processing the request.',
  INVALID_OBJECT_ID: 'Invalid identifier format provided in request parameters.',
} as const;

