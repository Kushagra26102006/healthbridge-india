import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../modules/auth/services/token.service';
import { UserModel } from '../modules/users/models/user.model';
import { AppError } from '../shared/errors/app-error';
import { AUTH_CONFIG } from '@healthbridge/config';
import type { AuthenticatedUser } from '@healthbridge/shared-types';
import { securityAuditMonitor } from '../security/security-audit.monitor';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication Middleware: Validates JWT Access Token & Injects Request User Context
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 0. Strictly reject tokens passed via URL query string (prevents leakage in logs/history/Referer)
    if (req.query && (req.query.token !== undefined || req.query.access_token !== undefined)) {
      void securityAuditMonitor.record({
        actorRole: 'ANONYMOUS',
        action: 'URL_TOKEN_REJECTED',
        resourceType: 'AUTH',
        resourceId: req.path,
        requestId: req.requestId,
        outcome: 'BLOCKED',
        metadata: { reason: 'Access token supplied in URL query parameter' },
      });
      throw AppError.unauthorized(
        'Access tokens are not permitted in URL query parameters. Use Authorization header or HTTP-only cookie.'
      );
    }

    let token: string | undefined;

    // 1. Check Bearer Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // 2. Check HTTP-only cookie as fallback
    else if (req.cookies && req.cookies[AUTH_CONFIG.accessTokenCookieName]) {
      token = req.cookies[AUTH_CONFIG.accessTokenCookieName];
    }

    if (!token) {
      throw AppError.unauthorized('Authentication required. No access token provided.');
    }

    // 3. Verify JWT signature, expiration, issuer and audience
    const decoded = tokenService.verifyAccessToken(token);

    // 4. Verify user exists and check active account status
    const user = await UserModel.findById(decoded.sub);
    if (!user) {
      throw AppError.unauthorized('User account no longer exists');
    }

    if (user.accountStatus === 'SUSPENDED') {
      throw AppError.forbidden('Account has been suspended');
    }

    if (user.accountStatus === 'DEACTIVATED') {
      throw AppError.forbidden('Account has been deactivated');
    }

    // 5. Inject authenticated user context onto Express Request
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      phone: user.phone,
      role: user.role,
      accountStatus: user.accountStatus,
      name: user.name,
    };

    next();
  } catch (error) {
    next(error);
  }
};
