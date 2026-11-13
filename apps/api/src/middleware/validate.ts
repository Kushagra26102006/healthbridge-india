import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { AppError } from '../shared/errors/app-error';
import { ErrorCode } from '../shared/errors/error-codes';
import type { ApiErrorDetail } from '@healthbridge/shared-types';

export interface ValidationTargetSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Reusable Zod Request Validation Middleware
 * Supports validation and sanitization of:
 * - Request Body
 * - Query Parameters
 * - URL Path Parameters
 */
export const validateRequest = (
  schemaOrTargets: ZodTypeAny | ValidationTargetSchemas
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // If a single Zod schema is provided, validate req.body by default
      if (schemaOrTargets && 'parseAsync' in schemaOrTargets && typeof schemaOrTargets.parseAsync === 'function') {
        const parsed = await schemaOrTargets.parseAsync(req.body);
        req.body = parsed;
        return next();
      }

      const targets = schemaOrTargets as ValidationTargetSchemas;
      const errors: ApiErrorDetail[] = [];

      // Validate Body
      if (targets.body) {
        const result = await targets.body.safeParseAsync(req.body);
        if (!result.success) {
          result.error.errors.forEach((err) => {
            errors.push({
              field: err.path.length > 0 ? err.path.join('.') : 'body',
              message: err.message,
              code: err.code,
            });
          });
        } else {
          req.body = result.data;
        }
      }

      // Validate Query Parameters
      if (targets.query) {
        const result = await targets.query.safeParseAsync(req.query);
        if (!result.success) {
          result.error.errors.forEach((err) => {
            errors.push({
              field: `query.${err.path.join('.')}`,
              message: err.message,
              code: err.code,
            });
          });
        } else {
          req.query = result.data as Record<string, string>;
        }
      }

      // Validate URL Parameters
      if (targets.params) {
        const result = await targets.params.safeParseAsync(req.params);
        if (!result.success) {
          result.error.errors.forEach((err) => {
            errors.push({
              field: `params.${err.path.join('.')}`,
              message: err.message,
              code: err.code,
            });
          });
        } else {
          req.params = result.data as Record<string, string>;
        }
      }

      if (errors.length > 0) {
        return next(
          AppError.unprocessable(
            'Validation failed for request data',
            errors,
            ErrorCode.VALIDATION_ERROR
          )
        );
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: ApiErrorDetail[] = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));
        return next(
          AppError.unprocessable(
            'Validation failed for request data',
            errors,
            ErrorCode.VALIDATION_ERROR
          )
        );
      }
      next(error);
    }
  };
};

export const validate = validateRequest;

