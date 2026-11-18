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
  User,
  Fingerprint,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Dialog, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { SettingsNav } from '@/components/patient/settings';
import { InteractionPreferencesControl } from '@/components/motion';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function PatientSettingsPage() {
  const { logoutAll, isLoading } = useAuth();
  const [logoutNotice, setLogoutNotice] = useState<{
    variant: 'success' | 'error';
    message: string;
  } | null>(null);
  const [confirmLogoutAllOpen, setConfirmLogoutAllOpen] = useState(false);

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
      setConfirmLogoutAllOpen(false);
      setLogoutNotice({
        variant: 'success',
        message: 'All active sessions have been revoked. Redirecting to login...',
      });
    } catch {
      setConfirmLogoutAllOpen(false);
      setLogoutNotice({
        variant: 'error',
        message: 'Failed to revoke sessions. Please try again.',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-page-heading">Profile, Account Settings &amp; Preferences</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage personal details, ABHA identity, display theme, sound &amp; haptics, security, and
          privacy controls
        </p>
      </div>

      <SettingsNav />

      {logoutNotice && (
        <Alert
          variant={logoutNotice.variant}
          title={logoutNotice.variant === 'success' ? 'Sessions Revoked' : 'Action Failed'}
          description={logoutNotice.message}
        />
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal & Contact Information */}
        <Card className="flex flex-col justify-between hover-lift">
          <CardHeader className="pb-3 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-primary/12 text-primary flex items-center justify-center">
                <User className="h-4 w-4" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Personal &amp; Contact Information
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Review and update your permitted demographic profile, contact phone, and emergency
              details.
            </p>
            <Button size="sm" variant="outline" asChild className="w-full justify-between">
              <Link href="/patient/profile">
                <span>Open Personal Profile</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* ABHA Health Identity */}
        <Card className="flex flex-col justify-between hover-lift">
          <CardHeader className="pb-3 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-secondary/12 text-secondary flex items-center justify-center">
                <Fingerprint className="h-4 w-4" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-semibold">ABHA Health Identity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Verify, link, or unlink your Ayushman Bharat Health Account (ABHA) address and review
              identity history.
            </p>
            <Button size="sm" variant="outline" asChild className="w-full justify-between">
              <Link href="/patient/abha">
                <span>Manage ABHA Identity</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Display Theme & Appearance */}
        <Card className="hover-lift">
          <CardHeader className="pb-3 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-amber-500/12 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sun className="h-4 w-4" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-semibold">Display Theme &amp; Mode</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Switch between Light, Dark, or System themes across all patient records and portals.
            </p>
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border/70">
              <span className="font-medium text-foreground">Interface Theme</span>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Sound & Haptic Interaction Preferences */}
        <InteractionPreferencesControl />

        {/* Password & Security */}
        <Card className="flex flex-col justify-between hover-lift">
          <CardHeader className="pb-3 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-secondary/12 text-secondary flex items-center justify-center">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Password &amp; Account Security
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Maintain strong password credentials and monitor account security posture.
            </p>
            <Button size="sm" variant="outline" asChild className="w-full justify-between">
              <Link href="/patient/settings/security">
                <span>Change Password</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="flex flex-col justify-between hover-lift">
          <CardHeader className="pb-3 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-primary/12 text-primary flex items-center justify-center">
                <Laptop className="h-4 w-4" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Active Devices &amp; Sessions
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Review signed-in browsers and revoke unfamiliar devices immediately.
            </p>
            <Button size="sm" variant="outline" asChild className="w-full justify-between">
              <Link href="/patient/settings/sessions">
                <span>View Active Sessions</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="flex flex-col justify-between hover-lift">
          <CardHeader className="pb-3 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Bell className="h-4 w-4" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Customize delivery channels for appointments, laboratory reports, and consent alerts.
            </p>
            <Button size="sm" variant="outline" asChild className="w-full justify-between">
              <Link href="/patient/settings/notifications">
                <span>Configure Notifications</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Privacy & Data Rights */}
        <Card className="flex flex-col justify-between hover-lift">
          <CardHeader className="pb-3 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-semibold">Privacy &amp; Data Rights</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Inspect access history, request data exports or corrections, and manage consent
              governance.
            </p>
            <Button size="sm" variant="secondary" asChild className="w-full justify-between">
              <Link href="/patient/settings/privacy">
                <span>Open Privacy Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Destructive Action: Sign Out All Devices (with Confirmation Dialog) */}
        <Card className="border-error/30 bg-red-50/40 dark:bg-red-950/20 md:col-span-2">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-error font-semibold text-sm">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Sign Out Across All Devices</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Immediately terminates every active browser and mobile session and revokes all
                refresh tokens.
              </p>
            </div>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirmLogoutAllOpen(true)}
              disabled={isLoading}
              className="shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out Everywhere</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog Before Destructive Action */}
      <Dialog
        open={confirmLogoutAllOpen}
        onClose={() => setConfirmLogoutAllOpen(false)}
        title="Sign out from all devices?"
        description="This immediately revokes every active session across all browsers and devices."
        size="sm"
      >
        <DialogBody>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You will be signed out of this session as well and will need to sign in again with your
            credentials.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmLogoutAllOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            loading={isLoading}
            loadingText="Signing out..."
            onClick={handleLogoutAll}
          >
            Confirm Sign Out Everywhere
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
