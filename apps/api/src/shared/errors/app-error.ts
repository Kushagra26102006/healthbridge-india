import { HttpStatus, HttpStatusCode } from '../constants/http-status';
import type { ApiErrorDetail } from '@healthbridge/shared-types';

/**
 * Custom Operational Application Error
 */
export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly errors?: ApiErrorDetail[];

  constructor(
    message: string,
    statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    errors?: ApiErrorDetail[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: ApiErrorDetail[]): AppError {
    return new AppError(message, HttpStatus.BAD_REQUEST, true, errors);
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(message, HttpStatus.UNAUTHORIZED, true);
  }

  static forbidden(message = 'Access forbidden'): AppError {
    return new AppError(message, HttpStatus.FORBIDDEN, true);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(message, HttpStatus.NOT_FOUND, true);
  }

  static conflict(message: string): AppError {
    return new AppError(message, HttpStatus.CONFLICT, true);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, HttpStatus.INTERNAL_SERVER_ERROR, false);
  }
}

