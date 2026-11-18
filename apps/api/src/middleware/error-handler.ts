import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../shared/errors/app-error';
import { ErrorCode } from '../shared/errors/error-codes';
import { HttpStatus, HttpStatusCode } from '../shared/constants/http-status';
import { sendError } from '../utils/api-response';
import { logger } from '../config/logger';
import { env } from '../config/env';
import type { ApiErrorDetail } from '@healthbridge/shared-types';

interface MongoDuplicateError {
  code?: number;
  codeName?: string;
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, unknown>;
}

/**
 * Centralized Application Error Handling Middleware
 * Guarantees standard error responses:
 * {
 *   "success": false,
 *   "message": "Human-readable message",
 *   "code": "ERROR_CODE",
 *   "requestId": "request-id"
 * }
 */
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let code: string = ErrorCode.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected internal error occurred';
  let errors: ApiErrorDetail[] | undefined = undefined;

  // 1. Handle Known Operational AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code || ErrorCode.INTERNAL_SERVER_ERROR;
    message = err.message;
    errors = err.errors;
  }
  // 2. Handle Zod Schema Validation Errors
  else if (err instanceof ZodError) {
    statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
    code = ErrorCode.VALIDATION_ERROR;
    message = 'Validation failed for request data';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
  }
  // 3. Handle CORS Origin Authorization Rejection
  else if (err instanceof Error && err.message.startsWith('CORS blocked origin:')) {
    statusCode = HttpStatus.FORBIDDEN;
    code = ErrorCode.FORBIDDEN;
    message = err.message;
  }
  // 4. Handle MongoDB / Mongoose Duplicate Key Error (E11000)
  else if (
    err &&
    typeof err === 'object' &&
    ('code' in err || 'codeName' in err) &&
    ((err as MongoDuplicateError).code === 11000 ||
      (err as MongoDuplicateError).codeName === 'DuplicateKey')
  ) {
    statusCode = HttpStatus.CONFLICT;
    code = ErrorCode.DUPLICATE_RESOURCE;
    const mongoErr = err as MongoDuplicateError;
    const field = mongoErr.keyPattern ? Object.keys(mongoErr.keyPattern)[0] : 'record';
    message = `A resource with this ${field} already exists`;
  }
  // 4. Handle Mongoose Schema Validation Errors
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = HttpStatus.BAD_REQUEST;
    code = ErrorCode.VALIDATION_ERROR;
    message = 'Database validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }
  // 5. Handle Mongoose CastError (invalid ObjectId / type cast)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = HttpStatus.BAD_REQUEST;
    code = ErrorCode.INVALID_IDENTIFIER;
    message = `Invalid format for resource identifier '${err.path}'`;
  }
  // 5b. Handle MongoDB / Mongoose connectivity or buffering timeout errors cleanly (503)
  else if (
    err instanceof Error &&
    (err.name === 'MongooseServerSelectionError' ||
      err.name === 'MongoServerSelectionError' ||
      err.name === 'MongoNetworkError' ||
      err.name === 'MongoNotConnectedError' ||
      /buffering timed out|topology was destroyed|not connected/i.test(err.message))
  ) {
    statusCode = HttpStatus.SERVICE_UNAVAILABLE;
    code = 'DATABASE_UNAVAILABLE';
    message =
      'Healthcare database is currently unreachable. Please check MongoDB connectivity (e.g., Atlas IP allowlist or local mongod) and retry.';
  }
  // 6. Handle Malformed JSON Syntax in Request Body
  else if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status: number }).status === 400
  ) {
    statusCode = HttpStatus.BAD_REQUEST;
    code = ErrorCode.MALFORMED_JSON;
    message = 'Malformed JSON syntax in request payload';
  }
  // 7. Generic unexpected native Error
  else if (err instanceof Error) {
    if (env.NODE_ENV === 'production') {
      message = 'An unexpected internal error occurred';
    } else {
      message = err.message;
    }
  }

  // Structured logging of error
  const logContext = {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl || req.url,
    statusCode,
    code,
  };

  if (statusCode >= 500) {
    logger.error(`[Unhandled Server Error] ${message}`, err, logContext);
  } else {
    logger.warn(`[Client/Operational Error ${statusCode}] ${message}`, logContext);
  }

  // Development stack trace attachment (NEVER exposed in production)
  if (env.NODE_ENV === 'development' && err instanceof Error && !errors) {
    errors = [{ message: err.stack ?? err.message, code: 'DEV_STACK_TRACE' }];
  }

  sendError(res, message, statusCode, code, errors, req.requestId);
};
