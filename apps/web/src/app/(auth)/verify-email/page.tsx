'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/auth/FormError';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { CheckCircle2, Loader2, MailCheck, Send, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const { verifyEmail, resendVerification } = useAuth();
  const [token, setToken] = useState(tokenFromUrl);
  const [emailForResend, setEmailForResend] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = useCallback(
    async (tokenToUse: string) => {
      setErrorMessage(null);
      setSuccessMessage(null);

      if (!tokenToUse.trim()) {
        setErrorMessage('Please enter your email verification token');
        return;
      }

      try {
        setIsLoading(true);
        const msg = await verifyEmail(tokenToUse.trim());
        setSuccessMessage(msg);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid or expired verification token';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [verifyEmail]
  );

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (tokenFromUrl && !successMessage) {
      void handleVerify(tokenFromUrl);
    }
  }, [tokenFromUrl, successMessage, handleVerify]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResendNotice(null);

    if (!emailForResend.trim() || !emailForResend.includes('@')) {
      setErrorMessage('Please enter a valid email address to resend verification');
      return;
    }

    try {
      setIsResending(true);
      const msg = await resendVerification(emailForResend.trim());
      setResendNotice(msg);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to dispatch verification email';
      setErrorMessage(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify Your Email Address"
      subtitle="Confirm your identity to activate longitudinal record notifications and security alerts."
    >
      <div className="space-y-5 text-left">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Email Verification</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Enter the verification token received in your email inbox.
          </p>
        </div>

        <FormError message={errorMessage} />

        {successMessage ? (
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 space-y-4">
            <div className="flex items-center gap-2.5 font-bold text-sm">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <span>Email Verified Successfully</span>
            </div>
            <p className="text-xs leading-relaxed">
              Your registered email has been verified. You can now access all authenticated features
              and clinical consent workflows.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="teal" size="sm" className="w-full">
                  <span>Sign In to Healthcare Account</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleVerify(token);
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="verify-token"
                  className="block text-xs font-semibold text-foreground"
                >
                  Verification Token
                </label>
                <div className="relative">
                  <MailCheck className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    id="verify-token"
                    placeholder="Paste 32-character token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isLoading}
                    className="pl-9 font-mono text-xs"
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
                    Validating Token...
                  </>
                ) : (
                  'Verify Email Token'
                )}
              </Button>
            </form>

            {/* Resend Verification Section */}
            <div className="p-4 rounded-2xl bg-muted/50 border border-border/80 space-y-3">
              <p className="text-xs font-semibold text-foreground">
                Didn&apos;t receive the email?
              </p>
              {resendNotice ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {resendNotice}
                </p>
              ) : (
                <form onSubmit={handleResend} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={emailForResend}
                    onChange={(e) => setEmailForResend(e.target.value)}
                    disabled={isResending}
                    className="text-xs h-9"
                    required
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-9 text-xs"
                    disabled={isResending}
                  >
                    {isResending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-1" />
                        Resend
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="text-center pt-2 border-t border-border">
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Return to <strong className="text-teal-600 dark:text-teal-400">Sign in</strong>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-muted-foreground">
          Loading email verification portal...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
