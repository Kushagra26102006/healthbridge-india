import { Response } from 'express';
import { HttpStatus, HttpStatusCode } from '../shared/constants/http-status';
import { ErrorCode } from '../shared/errors/error-codes';
import type { ApiResponse, ApiErrorDetail, PaginationMeta } from '@healthbridge/shared-types';

const statusToErrorCode: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.VALIDATION_ERROR,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMIT_EXCEEDED,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_SERVER_ERROR,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
};

/**
 * Sends a standardized success response
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message = 'Request completed',
  statusCode: HttpStatusCode = HttpStatus.OK,
  meta?: PaginationMeta | Record<string, unknown>
): Response => {
  const req = res.req;
  const requestId = (req?.requestId as string) || (res.getHeader('X-Request-Id') as string) || undefined;

  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta,
    requestId,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
};

/**
 * Sends a standardized error response adhering to:
 * {
 *   "success": false,
 *   "message": "Human-readable message",
 *   "code": "ERROR_CODE",
 *   "requestId": "request-id"
 * }
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
  codeOrErrors?: string | ApiErrorDetail[],
  errorsParam?: ApiErrorDetail[],
  customRequestId?: string
): Response {
  let code: string;
  let errors: ApiErrorDetail[] | undefined = errorsParam;

  if (Array.isArray(codeOrErrors)) {
    errors = codeOrErrors;
    code = statusToErrorCode[statusCode] || ErrorCode.INTERNAL_SERVER_ERROR;
  } else if (typeof codeOrErrors === 'string') {
    code = codeOrErrors;
  } else {
    code = statusToErrorCode[statusCode] || ErrorCode.INTERNAL_SERVER_ERROR;
  }

  const req = res.req;
  const requestId =
    customRequestId ||
    (req?.requestId as string) ||
    (res.getHeader('X-Request-Id') as string) ||
    'req-unknown';

  const payload: ApiResponse = {
    success: false,
    message,
    code,
    requestId,
    errors,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
}
