import { AxiosError } from 'axios';
import { ApiClientError } from './types';
import type { ApiResponse } from '@healthbridge/shared-types';

/**
 * Normalizes Axios errors into standard ApiClientError instances
 */
export const handleAxiosError = (error: AxiosError<ApiResponse>): ApiClientError => {
  // 1. Network / Connection Errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return new ApiClientError({
        message: 'Request timed out. Please check your internet connection and try again.',
        statusCode: 408,
        code: 'REQUEST_TIMEOUT',
        isNetworkError: true,
      });
    }

    return new ApiClientError({
      message: 'Unable to reach HealthBridge servers. Please check your network connection.',
      statusCode: 0,
      code: 'NETWORK_ERROR',
      isNetworkError: true,
    });
  }

  // 2. HTTP Response Errors
  const status = error.response.status;
  const data = error.response.data;
  const requestId = data?.requestId || (error.response.headers['x-request-id'] as string);

  // Extract Retry-After header for 429 rate limiting
  let retryAfter: number | undefined = undefined;
  if (status === 429 && error.response.headers['retry-after']) {
    retryAfter = parseInt(error.response.headers['retry-after'] as string, 10);
  }

  let code = data?.code;
  let message = data?.message;

  switch (status) {
    case 400:
      code = code || 'BAD_REQUEST';
      message = message || 'Invalid request syntax or parameters.';
      break;
    case 401:
      code = code || 'UNAUTHORIZED';
      message = message || 'Authentication required. Please sign in to continue.';
      break;
    case 403:
      code = code || 'FORBIDDEN';
      message = message || 'You do not have permission to access this resource.';
      break;
    case 404:
      code = code || 'NOT_FOUND';
      message = message || 'The requested resource could not be found.';
      break;
    case 409:
      code = code || 'CONFLICT';
      message = message || 'A resource conflict occurred. Please refresh and retry.';
      break;
    case 422:
      code = code || 'VALIDATION_ERROR';
      message = message || 'Validation failed for the submitted information.';
      break;
    case 429:
      code = code || 'RATE_LIMIT_EXCEEDED';
      message =
        message ||
        (retryAfter
          ? `Rate limit reached. Please retry in ${retryAfter} seconds.`
          : 'Too many requests. Please slow down and try again shortly.');
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      code = code || 'SERVER_ERROR';
      message =
        message ||
        'HealthBridge server encountered an error. Our engineering team is investigating.';
      break;
    default:
      code = code || 'UNKNOWN_ERROR';
      message = message || error.message || 'An unexpected error occurred.';
  }

  return new ApiClientError({
    message,
    statusCode: status,
    code,
    requestId,
    errors: data?.errors,
    retryAfter,
    responseData: data,
  });
};
