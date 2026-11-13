'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordField } from '@/components/auth/PasswordField';
import { FormError } from '@/components/auth/FormError';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { resetPasswordValidationSchema } from '@healthbridge/validation';
import { CheckCircle2, Loader2, KeyRound } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const { resetPassword } = useAuth();
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      token: token.trim(),
      password,
      confirmPassword,
    };

    const validation = resetPasswordValidationSchema.safeParse(payload);
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'Please verify your password inputs');
      return;
    }

    try {
      setIsLoading(true);
      const msg = await resetPassword(payload);
      setSuccessMessage(msg);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired password reset token';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Establish a new, compliant password for your HealthBridge India credentials."
    >
      <div className="space-y-5 text-left">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Reset Password</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Enter your verification token and your new strong password.
          </p>
        </div>

        <FormError message={errorMessage} />

        {successMessage ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Password Successfully Updated</span>
            </div>
            <p className="text-xs leading-relaxed">
              Your password has been changed securely. Redirecting you to the sign-in portal...
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="teal" size="sm" className="w-full">
                  Proceed to Login Immediately
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="reset-token" className="block text-xs font-semibold text-foreground">
                One-Time Reset Token
              </label>
              <div className="relative">
                <KeyRound className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  id="reset-token"
                  placeholder="Paste reset token from email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={isLoading}
                  className="pl-9 font-mono text-xs"
                  required
                />
              </div>
            </div>

            <PasswordField
              id="new-password"
              label="New Password"
              placeholder="Min 8 chars, 1 uppercase, 1 symbol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />

            <PasswordField
              id="confirm-new-password"
              label="Confirm New Password"
              placeholder="Re-type new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />

            {/* Password Policy Guidelines */}
            <div className="p-3 rounded-xl bg-muted/60 border border-border/80 text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Password Requirements:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Minimum 8 characters</li>
                <li>At least one uppercase and one lowercase letter</li>
                <li>At least one numeric digit and one special character</li>
              </ul>
            </div>

            <Button
              type="submit"
              variant="teal"
              size="lg"
              className="w-full shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Set New Password'
              )}
            </Button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-border">
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Remember your credentials?{' '}
            <strong className="text-teal-600 dark:text-teal-400">Sign in</strong>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-muted-foreground">
          Loading password reset portal...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
