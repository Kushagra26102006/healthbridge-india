import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/app-error';
import { UserRole } from '@healthbridge/shared-types';

/**
 * Role-Based Access Control (RBAC) Authorization Middleware
 *
 * NOTE: Role checks establish baseline perimeter access. For medical records,
 * prescriptions, and clinical data, resource ownership and ABDM consent artifacts
 * must be verified separately prior to granting access.
 */
export const authorize = (...rolesOrArray: (UserRole | UserRole[])[]) => {
  const allowedRoles = rolesOrArray.flat() as UserRole[];

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access forbidden: Role '${req.user.role}' lacks permissions for this healthcare endpoint`
        )
      );
    }

    next();
  };
};
