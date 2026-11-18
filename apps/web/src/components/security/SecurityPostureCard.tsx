'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, KeyRound, Clock, Smartphone, HelpCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface SecurityPostureCardProps {
  sessionsHref?: string;
  className?: string;
}

/**
 * Honest Account Security Status Card.
 * Accurately reports supported authentication safeguards and transparently marks
 * Multi-Factor Authentication (MFA) as Not Yet Configured — never simulates fake MFA.
 */
export function SecurityPostureCard({ sessionsHref, className }: SecurityPostureCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-secondary" aria-hidden="true" />
          <span>Account Security Posture &amp; Safeguards</span>
        </CardTitle>
        <CardDescription>
          Live overview of active authentication protections and account recovery guidance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-lg border border-border bg-muted/25 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground inline-flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span>Multi-Factor Authentication (MFA)</span>
              </span>
              <Badge variant="neutral" size="sm">
                Not Configured
              </Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              App-based TOTP / OTP multi-factor authentication is not yet enabled on the backend authentication service. Protect your account with a strong unique password and active session monitoring.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-muted/25 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
                <span>Session Expiration &amp; Token Security</span>
              </span>
              <Badge variant="success" size="sm">
                Active
              </Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Short-lived access tokens paired with server-tracked refresh sessions expire automatically after inactivity. You can revoke other sessions or sign out all devices at any time.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Lost password recovery is available via verified email reset on the{' '}
              <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
                Account Recovery
              </Link>{' '}
              screen.
            </span>
          </div>

          {sessionsHref && (
            <Link
              href={sessionsHref}
              className="inline-flex items-center gap-1 font-semibold text-secondary hover:underline focus-ring rounded-sm"
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Manage Active Sessions</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SecurityPostureCard;
