import { Response } from 'express';
import { HttpStatus, HttpStatusCode } from '../shared/constants/http-status';
import type { ApiResponse, ApiErrorDetail } from '@healthbridge/shared-types';

/**
 * Standardized API Response Helpers
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: HttpStatusCode = HttpStatus.OK
): Response => {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
  errors?: ApiErrorDetail[]
): Response => {
  const payload: ApiResponse = {
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
};

