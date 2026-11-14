'use client';

import React from 'react';
import Link from 'next/link';
import {
  Lock,
  UserCheck,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DoctorSettingsPage() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          Practice & Account Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage clinical notifications, security credentials, and consultation preferences
        </p>
      </div>

      <div className="space-y-4">
        {/* Professional Profile Shortcut */}
        <Card className="border border-border/80 bg-card hover:bg-muted/20 transition-colors">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-foreground">Professional Profile</h3>
                <p className="text-xs text-muted-foreground">
                  Update consultation fees, spoken languages, clinic hours and bio
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/doctor/profile">
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Schedule & Availability Shortcut */}
        <Card className="border border-border/80 bg-card hover:bg-muted/20 transition-colors">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                <Globe className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-foreground">Weekly Availability</h3>
                <p className="text-xs text-muted-foreground">
                  Manage active clinic days and slot booking windows
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/doctor/schedule">
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Security & Credentials */}
        <Card className="border border-border/80 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-teal-600" />
              <CardTitle className="text-base font-bold text-foreground">
                Security & Verification
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              National Health Authority ABDM registration and credential security
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">ABDM Healthcare Professionals Registry (HPR)</p>
                <p className="text-muted-foreground text-[11px]">Digitally verified healthcare practitioner status</p>
              </div>
              <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-[10px]">
                Active & Verified
              </Badge>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Session Authentication</p>
                <p className="text-muted-foreground text-[11px]">Role-scoped JWT with HttpOnly refresh cookies</p>
              </div>
              <span className="font-mono text-muted-foreground text-[11px]">Secure</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
