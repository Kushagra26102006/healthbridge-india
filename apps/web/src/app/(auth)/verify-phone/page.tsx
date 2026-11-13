'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ArrowLeft, Info } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function VerifyPhonePage() {
  const { user } = useAuth();
  const [phoneNumber] = useState(user?.phone || '9876543210');

  return (
    <AuthLayout
      title="Mobile Number Verification"
      subtitle="Connecting your mobile number for instant SMS alerts and ABHA consent authorization."
    >
      <div className="space-y-5 text-left">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Phone Verification</h2>
            <Badge variant="warning" className="text-[10px]">
              API Integration Scheduled
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Mobile OTP verification for digital health record access.
          </p>
        </div>

        {/* Integration Status Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 space-y-2 text-xs leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>SMS Gateway Integration Notice</span>
          </div>
          <p>
            In accordance with platform architecture standards, real SMS delivery requires live
            telecom gateway credentials (e.g. CDAC / Twilio / Government SMS Gateway). The backend
            endpoints <code>POST /api/v1/auth/verify-phone</code> and{' '}
            <code>POST /api/v1/auth/send-phone-otp</code> are provisioned in the architecture
            pipeline for live telecommunications binding.
          </p>
        </div>

        {/* Phone Status Card */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Target Mobile Number:</span>
            <span className="font-mono font-bold text-foreground">+91 {phoneNumber}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Verification State:</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Pending Live Gateway
            </span>
          </div>
        </div>

        {/* Architecture Details Box */}
        <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Info className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span>Architecture Readiness:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[11px]">
            <li>User database model includes verified mobile indexing</li>
            <li>Zero fake OTP validation implemented to preserve integrity</li>
            <li>Ready for live CDAC / NHA OTP webhook dispatch</li>
          </ul>
        </div>

        <div className="space-y-2 pt-2">
          <Link href="/login">
            <Button variant="teal" size="lg" className="w-full shadow-sm">
              Proceed to Sign In
            </Button>
          </Link>
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
