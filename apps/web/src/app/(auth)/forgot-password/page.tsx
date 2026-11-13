'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/auth/FormError';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { forgotPasswordValidationSchema } from '@healthbridge/validation';
import { Mail, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validation = forgotPasswordValidationSchema.safeParse({ email: email.trim() });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || 'Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      const msg = await forgotPassword(email.trim());
      setSuccessMessage(msg);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to dispatch reset request';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recover Your Healthcare Account"
      subtitle="Enter your verified email address to receive one-time cryptographic password reset instructions."
    >
      <div className="space-y-5 text-left">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Forgot Password</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            We will send a one-time secure reset link to your registered email.
          </p>
        </div>

        <FormError message={errorMessage} />

        {successMessage ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Reset Instructions Dispatched</span>
            </div>
            <p className="text-xs leading-relaxed">
              If an account with <strong>{email}</strong> exists in our system, password reset
              instructions have been sent to your inbox.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="block text-xs font-semibold text-foreground">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="e.g. yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="pl-9"
                  required
                />
              </div>
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
                  Sending Reset Instructions...
                </>
              ) : (
                'Send Password Reset Link'
              )}
            </Button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-border">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
