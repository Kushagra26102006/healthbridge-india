import { describe, it, expect } from 'vitest';
import { AppError } from '../../src/shared/errors/app-error';
import { ErrorCode } from '../../src/shared/errors/error-codes';
import { HttpStatus } from '../../src/shared/constants/http-status';

describe('AppError Unit Tests', () => {
  it('should instantiate AppError with defaults and operational status', () => {
    const error = new AppError('General application error');
    expect(error.message).toBe('General application error');
    expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    expect(error.isOperational).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should create badRequest error with status 400 and custom details', () => {
    const details = [{ field: 'email', message: 'Email is required' }];
    const error = AppError.badRequest('Invalid input', details);

    expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(error.code).toBe(ErrorCode.BAD_REQUEST);
    expect(error.message).toBe('Invalid input');
    expect(error.errors).toEqual(details);
    expect(error.isOperational).toBe(true);
  });

  it('should create unauthorized error with status 401', () => {
    const error = AppError.unauthorized('Session has expired');
    expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(error.message).toBe('Session has expired');
    expect(error.isOperational).toBe(true);
  });

  it('should create forbidden error with status 403', () => {
    const error = AppError.forbidden('Only doctors can sign prescriptions');
    expect(error.statusCode).toBe(HttpStatus.FORBIDDEN);
    expect(error.code).toBe(ErrorCode.FORBIDDEN);
    expect(error.message).toBe('Only doctors can sign prescriptions');
  });

  it('should create notFound error with status 404', () => {
    const error = AppError.notFound('Patient profile not found');
    expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.message).toBe('Patient profile not found');
  });

  it('should create conflict error with status 409', () => {
    const error = AppError.conflict('An active encounter already exists');
    expect(error.statusCode).toBe(HttpStatus.CONFLICT);
    expect(error.code).toBe(ErrorCode.CONFLICT);
  });

  it('should create unprocessable error with status 422', () => {
    const details = [{ field: 'dateOfBirth', message: 'Date must be in past' }];
    const error = AppError.unprocessable('Validation failure', details);
    expect(error.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.errors).toEqual(details);
  });

  it('should create tooManyRequests error with status 429', () => {
    const error = AppError.tooManyRequests('Rate limit exceeded');
    expect(error.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
  });

  it('should create internal server error as non-operational by default', () => {
    const error = AppError.internal('Unexpected failure in database pool');
    expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    expect(error.isOperational).toBe(false);
  });
});
