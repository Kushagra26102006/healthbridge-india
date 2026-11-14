'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sun,
  KeyRound,
  Laptop,
  Bell,
  ShieldCheck,
  LogOut,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { SettingsNav } from '@/components/patient/settings';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function PatientSettingsPage() {
  const { logoutAll, isLoading } = useAuth();
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
      setLogoutNotice('All active sessions have been revoked. Redirecting to login...');
    } catch {
      setLogoutNotice('Failed to revoke sessions. Please try again.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Account Settings & Security
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure security credentials, active sessions, notification alerts, and data privacy
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <SettingsNav />

      {logoutNotice && (
        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-800 dark:text-teal-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
          <span>{logoutNotice}</span>
        </div>
      )}

      {/* Settings Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Theme & Appearance */}
        <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sun className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground">
                Display Theme & Mode
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Switch between light, dark, or system preference modes for high-contrast clinical viewing.
            </p>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60">
              <span className="font-semibold text-foreground">Toggle Interface Theme</span>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* 2. Security & Password */}
        <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <KeyRound className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground">
                Password & Authentication
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Maintain a high-entropy password with uppercase, lowercase, numeric, and symbol complexity.
            </p>
            <div className="pt-2">
              <Link href="/patient/settings/security">
                <Button size="sm" variant="outline" className="w-full text-xs rounded-xl gap-1.5 border-border">
                  <span>Change Password</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 3. Active Sessions */}
        <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Laptop className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground">
                Active Devices & Sessions
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Review browsers, mobile devices, and active IP addresses authorized to access your patient portal.
            </p>
            <div className="pt-2">
              <Link href="/patient/settings/sessions">
                <Button size="sm" variant="outline" className="w-full text-xs rounded-xl gap-1.5 border-border">
                  <span>View Active Sessions</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 4. Notification Preferences */}
        <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Bell className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground">
                Notification Alerts & Channels
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Customize delivery channels (email, in-app, SMS) for appointments, lab results, and prescriptions.
            </p>
            <div className="pt-2">
              <Link href="/patient/settings/notifications">
                <Button size="sm" variant="outline" className="w-full text-xs rounded-xl gap-1.5 border-border">
                  <span>Configure Notifications</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 5. Privacy & Data Portability */}
        <Card className="border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden flex flex-col justify-between md:col-span-2">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground">
                Privacy, Consent Management & ABDM
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <p className="text-muted-foreground leading-relaxed max-w-xl">
              Inspect active health data authorizations, audit access history, review the Privacy Policy,
              or configure DPDP-compliant data settings.
            </p>
            <Link href="/patient/settings/privacy" className="shrink-0">
              <Button size="sm" className="text-xs rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-1.5">
                <span>Privacy Dashboard</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 6. Emergency Revocation / Logout All */}
        <Card className="border-destructive/30 bg-destructive/5 rounded-2xl overflow-hidden md:col-span-2">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-destructive font-bold">
                <LogOut className="h-4 w-4" />
                <span>Emergency Sign Out Across All Devices</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Immediately terminates all active sessions and invalidates all cryptographic refresh tokens.
                You will need to sign in again on all devices.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleLogoutAll}
              disabled={isLoading}
              className="text-xs rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0 gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{isLoading ? 'Signing out...' : 'Sign Out Everywhere'}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
