import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../shared/errors/app-error';
import { HttpStatus, HttpStatusCode } from '../shared/constants/http-status';
import { sendError } from '../utils/api-response';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import type { ApiErrorDetail } from '@healthbridge/shared-types';

/**
 * Centralized Application Error Handling Middleware
 */
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected internal error occurred';
  let errors: ApiErrorDetail[] | undefined = undefined;

  // Handle known operational AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // Handle Zod schema validation errors
  else if (err instanceof ZodError) {
    statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
    message = 'Validation failed for request data';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
  }
  // Handle Mongoose validation errors
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = HttpStatus.BAD_REQUEST;
    message = 'Database validation error';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }
  // Handle Mongoose CastError (e.g. invalid ObjectId)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = HttpStatus.BAD_REQUEST;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  // Handle standard JSON syntax error in request body
  else if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    statusCode = HttpStatus.BAD_REQUEST;
    message = 'Malformed JSON syntax in request payload';
  }
  // Handle generic native error
  else if (err instanceof Error) {
    message = err.message;
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`[Unhandled Server Error] ${message}`, err);
  } else {
    logger.warn(`[Client/Operational Error ${statusCode}] ${message}`);
  }

  // Include stack trace only in development
  if (env.NODE_ENV === 'development' && err instanceof Error && !errors) {
    errors = [{ message: err.stack ?? err.message, code: 'DEV_STACK_TRACE' }];
  }

  sendError(res, message, statusCode, errors);
};

