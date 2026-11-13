import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateRequest } from '../../src/middleware/validate';
import { AppError } from '../../src/shared/errors/app-error';
import { ErrorCode } from '../../src/shared/errors/error-codes';

describe('Validation Middleware Unit Tests', () => {
  const schema = z.object({
    email: z.string().email(),
    age: z.number().min(18),
  });

  it('should pass validation when body data is valid and assign parsed data', async () => {
    const middleware = validateRequest(schema);
    const req: any = { body: { email: 'test@healthbridge.in', age: 30 } };
    const res: any = {};
    let nextCalled = false;
    let nextError: any = null;

    await middleware(req, res, (err) => {
      nextCalled = true;
      nextError = err;
    });

    expect(nextCalled).toBe(true);
    expect(nextError).toBeUndefined();
    expect(req.body).toEqual({ email: 'test@healthbridge.in', age: 30 });
  });

  it('should forward AppError with status 422 when body validation fails', async () => {
    const middleware = validateRequest(schema);
    const req: any = { body: { email: 'invalid-email', age: 16 } };
    const res: any = {};
    let caughtError: any = null;

    await middleware(req, res, (err) => {
      caughtError = err;
    });

    expect(caughtError).toBeInstanceOf(AppError);
    expect(caughtError.statusCode).toBe(422);
    expect(caughtError.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(caughtError.errors).toHaveLength(2);
    expect(caughtError.errors[0].field).toBe('email');
    expect(caughtError.errors[1].field).toBe('age');
  });

  it('should validate query and params when provided in target schemas', async () => {
    const querySchema = z.object({ page: z.string().regex(/^\d+$/) });
    const paramsSchema = z.object({ id: z.string().min(5) });

    const middleware = validateRequest({
      query: querySchema,
      params: paramsSchema,
    });

    const req: any = {
      body: {},
      query: { page: 'not-a-number' },
      params: { id: '12' }, // too short
    };
    const res: any = {};
    let caughtError: any = null;

    await middleware(req, res, (err) => {
      caughtError = err;
    });

    expect(caughtError).toBeInstanceOf(AppError);
    expect(caughtError.statusCode).toBe(422);
    expect(caughtError.errors.some((e: any) => e.field.startsWith('query.'))).toBe(true);
    expect(caughtError.errors.some((e: any) => e.field.startsWith('params.'))).toBe(true);
  });
});
