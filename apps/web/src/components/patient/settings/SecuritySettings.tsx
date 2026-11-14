'use client';

import React from 'react';
import Link from 'next/link';
import { Laptop, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChangePasswordForm } from './ChangePasswordForm';

export const SecuritySettings: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Sessions Banner */}
      <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Active Devices & Sessions
              </h3>
              <p className="text-xs text-muted-foreground">
                Manage logged-in devices and revoke sessions remotely if needed
              </p>
            </div>
          </div>

          <Link href="/patient/settings/sessions">
            <Button size="sm" variant="outline" className="text-xs rounded-xl gap-1.5 shrink-0 border-border">
              <span>Manage Sessions</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Change Password Form */}
      <ChangePasswordForm />

      {/* Security Policies */}
      <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold text-foreground">
              Account Security Best Practices
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3 text-xs leading-relaxed text-muted-foreground">
          <div className="flex items-start gap-2">
            <Lock className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
            <span>
              Never share your password, OTP codes, or ABHA credentials with anyone, including healthcare clinic staff.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
            <span>
              Sessions expire automatically after inactivity. If you use a shared hospital workstation, always remember to sign out explicitly.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
