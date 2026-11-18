import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRequest } from '../validators/auth.validator';
import { authenticate } from '../../../middleware/authenticate';
import {
  authGeneralLimiter,
  loginRateLimiter,
  passwordResetRateLimiter,
} from '../utils/rate-limiter.util';
import {
  registerValidationSchema,
  loginValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
  verifyEmailValidationSchema,
  resendVerificationValidationSchema,
  changePasswordSchema,
} from '@healthbridge/validation';
import { patientProfileController } from '../../patients/controllers/patient-profile.controller';

const router: Router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new healthcare platform user
 * @access  Public (Role-restricted for ADMIN)
 */
router.post(
  '/register',
  authGeneralLimiter,
  validateRequest(registerValidationSchema),
  (req, res, next) => authController.register(req, res, next)
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user using email or 10-digit phone
 * @access  Public (Rate-limited: 5 attempts / 15 mins)
 */
router.post('/login', loginRateLimiter, validateRequest(loginValidationSchema), (req, res, next) =>
  authController.login(req, res, next)
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Rotate refresh token and issue fresh JWT access token
 * @access  Public (Requires valid refresh token)
 */
router.post('/refresh', authGeneralLimiter, (req, res, next) =>
  authController.refresh(req, res, next)
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Revoke current refresh token and clear auth cookies
 * @access  Public
 */
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Revoke all sessions across all devices
 * @access  Private
 */
router.post('/logout-all', authenticate, (req, res, next) =>
  authController.logoutAll(req, res, next)
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Fetch authenticated user context and linked role profile
 * @access  Private
 */
router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request one-time password reset link
 * @access  Public (Rate-limited: 3 requests / hour)
 */
router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validateRequest(forgotPasswordValidationSchema),
  (req, res, next) => authController.forgotPassword(req, res, next)
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using one-time cryptographic token
 * @access  Public
 */
router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validateRequest(resetPasswordValidationSchema),
  (req, res, next) => authController.resetPassword(req, res, next)
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address using verification token
 * @access  Public
 */
router.post(
  '/verify-email',
  authGeneralLimiter,
  validateRequest(verifyEmailValidationSchema),
  (req, res, next) => authController.verifyEmail(req, res, next)
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification token
 * @access  Public
 */
router.post(
  '/resend-verification',
  passwordResetRateLimiter,
  validateRequest(resendVerificationValidationSchema),
  (req, res, next) => authController.resendVerification(req, res, next)
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  validateRequest(changePasswordSchema),
  (req, res, next) => patientProfileController.changePassword(req, res, next)
);

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    List active sessions for authenticated user
 * @access  Private
 */
router.get('/sessions', authenticate, (req, res, next) =>
  patientProfileController.getSessions(req, res, next)
);

/**
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @desc    Revoke specific active session
 * @access  Private
 */
router.delete('/sessions/:sessionId', authenticate, (req, res, next) =>
  patientProfileController.revokeSession(req, res, next)
);

/**
 * @route   POST /api/v1/auth/logout-others
 * @desc    Revoke all sessions except current
 * @access  Private
 */
router.post('/logout-others', authenticate, (req, res, next) =>
  patientProfileController.revokeOtherSessions(req, res, next)
);

export const authRoutes: Router = router;
export default authRoutes;
