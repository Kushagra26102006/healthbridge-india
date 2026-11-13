import { HttpStatus, HttpStatusCode } from '../constants/http-status';
import { ErrorCode, ErrorCodeType } from './error-codes';
import type { ApiErrorDetail } from '@healthbridge/shared-types';

/**
 * Custom Operational Application Error for HealthBridge India
 */
export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly errors?: ApiErrorDetail[];
  public requestId?: string;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    code: string = ErrorCode.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    errors?: ApiErrorDetail[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(
    message: string,
    errors?: ApiErrorDetail[],
    code: ErrorCodeType | string = ErrorCode.BAD_REQUEST
  ): AppError {
    return new AppError(message, HttpStatus.BAD_REQUEST, code, true, errors);
  }

  static unauthorized(
    message = 'Authentication required',
    code: ErrorCodeType | string = ErrorCode.UNAUTHORIZED
  ): AppError {
    return new AppError(message, HttpStatus.UNAUTHORIZED, code, true);
  }

  static forbidden(
    message = 'Access forbidden',
    code: ErrorCodeType | string = ErrorCode.FORBIDDEN
  ): AppError {
    return new AppError(message, HttpStatus.FORBIDDEN, code, true);
  }

  static notFound(
    message = 'Resource not found',
    code: ErrorCodeType | string = ErrorCode.NOT_FOUND
  ): AppError {
    return new AppError(message, HttpStatus.NOT_FOUND, code, true);
  }

  static conflict(message: string, code: ErrorCodeType | string = ErrorCode.CONFLICT): AppError {
    return new AppError(message, HttpStatus.CONFLICT, code, true);
  }

  static duplicate(
    message: string,
    code: ErrorCodeType | string = ErrorCode.DUPLICATE_RESOURCE
  ): AppError {
    return new AppError(message, HttpStatus.CONFLICT, code, true);
  }

  static unprocessable(
    message = 'Validation failed',
    errors?: ApiErrorDetail[],
    code: ErrorCodeType | string = ErrorCode.VALIDATION_ERROR
  ): AppError {
    return new AppError(message, HttpStatus.UNPROCESSABLE_ENTITY, code, true, errors);
  }

  static tooManyRequests(
    message = 'Too many requests, please try again later',
    code: ErrorCodeType | string = ErrorCode.RATE_LIMIT_EXCEEDED
  ): AppError {
    return new AppError(message, HttpStatus.TOO_MANY_REQUESTS, code, true);
  }

  static database(
    message = 'Database operation failed',
    code: ErrorCodeType | string = ErrorCode.DATABASE_ERROR
  ): AppError {
    return new AppError(message, HttpStatus.INTERNAL_SERVER_ERROR, code, false);
  }

  static internal(
    message = 'Internal server error',
    code: ErrorCodeType | string = ErrorCode.INTERNAL_SERVER_ERROR
  ): AppError {
    return new AppError(message, HttpStatus.INTERNAL_SERVER_ERROR, code, false);
  }
}
