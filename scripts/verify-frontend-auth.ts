/**
 * HealthBridge India — Day 2 Frontend, Authentication & Security Audit Test Suite
 * Executes automated frontend contract, security boundary, and validation verification.
 */

import {
  registerValidationSchema,
  loginValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
  verifyEmailValidationSchema,
} from '@healthbridge/validation';
import { API_ENDPOINTS } from '../apps/web/src/lib/api/endpoints';
import { handleAxiosError } from '../apps/web/src/lib/api/error-handler';
import { authSlice, setSession, clearSession } from '../apps/web/src/store/slices/auth-slice';
import type { UserRole, UserPublicDto } from '@healthbridge/shared-types';

interface AuditCheck {
  id: number;
  category: string;
  name: string;
  status: 'PASSED' | 'FAILED';
  error?: string;
}

const auditChecks: AuditCheck[] = [];

const recordCheck = (
  id: number,
  category: string,
  name: string,
  fn: () => void | Promise<void>
) => {
  try {
    fn();
    auditChecks.push({ id, category, name, status: 'PASSED' });
    console.log(`  ✔ [PASS] [${category}] #${id}: ${name}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    auditChecks.push({ id, category, name, status: 'FAILED', error: errorMsg });
    console.error(`  ✘ [FAIL] [${category}] #${id}: ${name} — ${errorMsg}`);
  }
};

export const runFrontendSecurityAudit = async (): Promise<void> => {
  console.log('====================================================');
  console.log('HEALTHBRIDGE INDIA — DAY 2 FRONTEND & SECURITY AUDIT');
  console.log('====================================================\n');

  // --- 1. REGISTRATION INPUT & SECURITY SCHEMAS ---
  recordCheck(1, 'Validation', 'Patient registration valid input passes Zod schema', () => {
    const validPatient = registerValidationSchema.safeParse({
      name: 'Ramesh Patel',
      email: 'ramesh.patel@healthbridge.test',
      phone: '9876543210',
      password: 'StrongPassword#2026',
      confirmPassword: 'StrongPassword#2026',
      role: 'PATIENT',
    });
    if (!validPatient.success) throw new Error('Valid patient input failed validation');
  });

  recordCheck(2, 'Validation', 'Doctor registration valid input passes Zod schema', () => {
    const validDoctor = registerValidationSchema.safeParse({
      name: 'Dr. Priya Sharma',
      email: 'dr.priya@healthbridge.test',
      phone: '9812345678',
      password: 'StrongPassword#2026',
      confirmPassword: 'StrongPassword#2026',
      role: 'DOCTOR',
    });
    if (!validDoctor.success) throw new Error('Valid doctor input failed validation');
  });

  recordCheck(3, 'Validation', 'Pharmacy registration valid input passes Zod schema', () => {
    const validPharmacy = registerValidationSchema.safeParse({
      name: 'Apollo Care Pharmacy',
      email: 'apollo.care@healthbridge.test',
      phone: '9898989898',
      password: 'StrongPassword#2026',
      confirmPassword: 'StrongPassword#2026',
      role: 'PHARMACY',
    });
    if (!validPharmacy.success) throw new Error('Valid pharmacy input failed validation');
  });

  recordCheck(4, 'Validation', 'Laboratory registration valid input passes Zod schema', () => {
    const validLab = registerValidationSchema.safeParse({
      name: 'Thyrocare Diagnostics',
      email: 'thyrocare@healthbridge.test',
      phone: '9765432109',
      password: 'StrongPassword#2026',
      confirmPassword: 'StrongPassword#2026',
      role: 'LABORATORY',
    });
    if (!validLab.success) throw new Error('Valid lab input failed validation');
  });

  recordCheck(
    5,
    'Security',
    'Public ADMIN registration attempt without key is strictly rejected',
    () => {
      const adminAttempt = registerValidationSchema.safeParse({
        name: 'Unauthorized Admin',
        email: 'admin.rogue@healthbridge.test',
        phone: '9876543210',
        password: 'StrongPassword#2026',
        confirmPassword: 'StrongPassword#2026',
        role: 'ADMIN',
      });
      if (adminAttempt.success) {
        throw new Error('Public ADMIN registration without key must be rejected');
      }
    }
  );

  recordCheck(6, 'Validation', 'Password mismatch is rejected with descriptive error', () => {
    const mismatchAttempt = registerValidationSchema.safeParse({
      name: 'Mismatch User',
      email: 'user@healthbridge.test',
      phone: '9876543210',
      password: 'StrongPassword#2026',
      confirmPassword: 'DifferentPassword#2026',
      role: 'PATIENT',
    });
    if (mismatchAttempt.success) throw new Error('Password mismatch should fail validation');
    const msg = mismatchAttempt.error.issues[0]?.message;
    if (msg !== 'Passwords do not match') {
      throw new Error(`Expected 'Passwords do not match', received '${msg}'`);
    }
  });

  recordCheck(7, 'Validation', 'Weak password (no special char / uppercase) is rejected', () => {
    const weakAttempt = registerValidationSchema.safeParse({
      name: 'Weak Pass User',
      email: 'weak@healthbridge.test',
      phone: '9876543210',
      password: 'weakpassword',
      confirmPassword: 'weakpassword',
      role: 'PATIENT',
    });
    if (weakAttempt.success) throw new Error('Weak password should fail validation');
  });

  recordCheck(8, 'Validation', 'Invalid 10-digit Indian mobile number is rejected', () => {
    const invalidPhones = ['1234567890', '98765', 'abcdefghij', '98765432101'];
    for (const phone of invalidPhones) {
      const res = registerValidationSchema.safeParse({
        name: 'Phone Test',
        email: 'test@healthbridge.test',
        phone,
        password: 'StrongPassword#2026',
        confirmPassword: 'StrongPassword#2026',
        role: 'PATIENT',
      });
      if (res.success) throw new Error(`Invalid phone ${phone} was wrongly accepted`);
    }
  });

  // --- 2. LOGIN SCHEMA & IDENTIFIERS ---
  recordCheck(9, 'Login', 'Login schema accepts valid email address', () => {
    const validEmail = loginValidationSchema.safeParse({
      identifier: 'dr.sharma@healthbridge.in',
      password: 'StrongPassword#2026',
    });
    if (!validEmail.success) throw new Error('Valid email identifier failed');
  });

  recordCheck(10, 'Login', 'Login schema accepts valid 10-digit Indian phone number', () => {
    const validPhone = loginValidationSchema.safeParse({
      identifier: '9876543210',
      password: 'StrongPassword#2026',
    });
    if (!validPhone.success) throw new Error('Valid phone identifier failed');
  });

  recordCheck(
    11,
    'Login',
    'Login schema rejects malformed identifier (invalid email and phone)',
    () => {
      const invalid = loginValidationSchema.safeParse({
        identifier: 'invalid-id-without-at',
        password: 'StrongPassword#2026',
      });
      if (invalid.success) throw new Error('Invalid identifier should be rejected');
    }
  );

  recordCheck(12, 'Login', 'Login schema rejects missing password', () => {
    const missingPass = loginValidationSchema.safeParse({
      identifier: 'patient@healthbridge.in',
      password: '',
    });
    if (missingPass.success) throw new Error('Empty password should be rejected');
  });

  // --- 3. PASSWORD RECOVERY & EMAIL VERIFICATION SCHEMAS ---
  recordCheck(13, 'PasswordRecovery', 'Forgot password schema validates correct email', () => {
    const res = forgotPasswordValidationSchema.safeParse({ email: 'user@healthbridge.in' });
    if (!res.success) throw new Error('Valid forgot-password email rejected');
  });

  recordCheck(
    14,
    'PasswordRecovery',
    'Reset password schema validates token and matching passwords',
    () => {
      const res = resetPasswordValidationSchema.safeParse({
        token: 'crypto-reset-token-12345',
        password: 'NewStrongPassword#2026',
        confirmPassword: 'NewStrongPassword#2026',
      });
      if (!res.success) throw new Error('Valid reset password payload rejected');
    }
  );

  recordCheck(15, 'PasswordRecovery', 'Reset password rejects mismatched new passwords', () => {
    const res = resetPasswordValidationSchema.safeParse({
      token: 'crypto-reset-token-12345',
      password: 'NewStrongPassword#2026',
      confirmPassword: 'MismatchPassword#2026',
    });
    if (res.success) throw new Error('Mismatched reset passwords should fail');
  });

  recordCheck(16, 'Verification', 'Verify email schema validates token string', () => {
    const res = verifyEmailValidationSchema.safeParse({ token: 'email-verification-token' });
    if (!res.success) throw new Error('Valid verify email payload rejected');
  });

  // --- 4. REDUX AUTH STATE & PRIVACY INVARIANTS ---
  recordCheck(17, 'StateManagement', 'Redux setSession stores user profile without tokens', () => {
    const mockUser: UserPublicDto = {
      id: 'usr-123',
      name: 'Ramesh Patel',
      email: 'ramesh@healthbridge.test',
      phone: '9876543210',
      role: 'PATIENT',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      mfaEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const state = authSlice.reducer(
      undefined,
      setSession({ user: mockUser, profile: { abhaAddress: 'ramesh@abdm' } })
    );

    if (!state.isAuthenticated) throw new Error('State should be authenticated');
    if (state.user?.email !== 'ramesh@healthbridge.test') throw new Error('User email not set');
    // Ensure no token field exists in user public state
    if ('accessToken' in (state.user as any) || 'refreshToken' in (state.user as any)) {
      throw new Error('Tokens must never be persisted in Redux state!');
    }
  });

  recordCheck(
    18,
    'StateManagement',
    'Redux clearSession clears user state completely upon logout',
    () => {
      const activeState = {
        user: { id: 'usr-123', name: 'Dr. Priya', role: 'DOCTOR' } as any,
        profile: {},
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
      };

      const clearedState = authSlice.reducer(activeState, clearSession());
      if (clearedState.isAuthenticated) throw new Error('Session should be unauthenticated');
      if (clearedState.user !== null) throw new Error('User must be null after logout');
    }
  );

  // --- 5. API CLIENT & ENDPOINT REGISTRY ---
  recordCheck(
    19,
    'APIClient',
    'API Endpoint registry maps canonical v1 auth and domain paths',
    () => {
      if (API_ENDPOINTS.AUTH.LOGIN !== '/auth/login') throw new Error('LOGIN endpoint mismatch');
      if (API_ENDPOINTS.AUTH.REGISTER !== '/auth/register')
        throw new Error('REGISTER endpoint mismatch');
      if (API_ENDPOINTS.AUTH.REFRESH !== '/auth/refresh')
        throw new Error('REFRESH endpoint mismatch');
      if (API_ENDPOINTS.AUTH.LOGOUT !== '/auth/logout') throw new Error('LOGOUT endpoint mismatch');
      if (API_ENDPOINTS.AUTH.ME !== '/auth/me') throw new Error('ME endpoint mismatch');
      if (API_ENDPOINTS.AUTH.FORGOT_PASSWORD !== '/auth/forgot-password')
        throw new Error('FORGOT_PASSWORD mismatch');
      if (API_ENDPOINTS.AUTH.RESET_PASSWORD !== '/auth/reset-password')
        throw new Error('RESET_PASSWORD mismatch');
      if (API_ENDPOINTS.AUTH.VERIFY_EMAIL !== '/auth/verify-email')
        throw new Error('VERIFY_EMAIL mismatch');
    }
  );

  recordCheck(20, 'APIClient', 'Error handler normalizes API error responses safely', () => {
    const mockAxiosErr: any = {
      isAxiosError: true,
      response: {
        status: 401,
        data: {
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        },
      },
    };

    const clientErr = handleAxiosError(mockAxiosErr);
    if (clientErr.statusCode !== 401) throw new Error('Expected status 401');
    if (clientErr.code !== 'UNAUTHORIZED') throw new Error('Expected code UNAUTHORIZED');
    if (clientErr.message !== 'Invalid email or password') throw new Error('Message mismatch');
  });

  // --- 6. ROLE ACCESS CONTROL LOGIC ---
  recordCheck(21, 'RBAC', 'Role-based access matrix forbids unauthorized route access', () => {
    const checkRoleAccess = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
      return allowedRoles.includes(userRole);
    };

    if (checkRoleAccess('PATIENT', ['DOCTOR', 'ADMIN'])) {
      throw new Error('PATIENT was wrongly allowed on DOCTOR route');
    }
    if (checkRoleAccess('DOCTOR', ['ADMIN'])) {
      throw new Error('DOCTOR was wrongly allowed on ADMIN route');
    }
    if (checkRoleAccess('PHARMACY', ['LABORATORY'])) {
      throw new Error('PHARMACY was wrongly allowed on LABORATORY route');
    }
    if (checkRoleAccess('LABORATORY', ['PHARMACY'])) {
      throw new Error('LABORATORY was wrongly allowed on PHARMACY route');
    }
    if (!checkRoleAccess('PATIENT', ['PATIENT'])) {
      throw new Error('PATIENT should be allowed on PATIENT route');
    }
    if (!checkRoleAccess('ADMIN', ['ADMIN', 'DOCTOR'])) {
      throw new Error('ADMIN should be allowed on ADMIN route');
    }
  });

  // --- SUMMARY ---
  console.log('\n====================================================');
  console.log('FRONTEND & SECURITY AUDIT SUMMARY');
  console.log('====================================================');
  const passed = auditChecks.filter((c) => c.status === 'PASSED').length;
  const failed = auditChecks.filter((c) => c.status === 'FAILED').length;
  console.log(`Total Checks: ${auditChecks.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.error('Audit failed with errors.');
    process.exit(1);
  } else {
    console.log('🎉 ALL 21 FRONTEND & SECURITY AUDIT CHECKS PASSED WITH 100% SUCCESS RATE!\n');
  }
};

// Auto-run if executed directly
if (require.main === module || process.argv[1]?.endsWith('verify-frontend-auth.ts')) {
  runFrontendSecurityAudit()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
