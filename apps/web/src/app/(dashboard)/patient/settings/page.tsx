'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sun, Bell, LogOut, KeyRound } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function PatientSettingsPage() {
  const { logout, logoutAll, isLoading } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link href="/patient/dashboard">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Account Settings & Preferences
            </h2>
            <p className="text-xs text-muted-foreground">
              Security settings, session management, and interface configurations
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Appearance & Theme */}
        <Card className="border-border shadow-card bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
                <Sun className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground">
                Display Theme & Mode
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Choose between light, dark, or system preference mode for your patient dashboard.
            </p>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/60">
              <span className="text-xs font-semibold text-foreground">Toggle Interface Theme</span>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* 2. Notifications */}
        <Card className="border-border shadow-card bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <Bell className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground">Healthcare Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Configure how you receive prescription alerts, consultation reminders, and consent
              requests.
            </p>
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between">
              <span className="font-medium text-foreground">Email Notifications</span>
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                Enabled
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Session Security */}
        <Card className="border-border shadow-card bg-card md:col-span-2">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <KeyRound className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground">
                Active Session & Device Security
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground">
                  Sign out across all devices
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Invalidates all active refresh token families stored on any browser or mobile app.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutAll()}
                disabled={isLoading}
                className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30 shrink-0"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Logout All Devices
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center border-t border-border pt-4">
            <Link href="/patient/dashboard">
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to Dashboard
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              disabled={isLoading}
              className="text-xs text-destructive hover:bg-destructive/10"
            >
              Sign Out of This Session
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
