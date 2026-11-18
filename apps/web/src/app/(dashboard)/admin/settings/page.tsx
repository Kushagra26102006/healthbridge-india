'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  UserCheck,
  Bell,
  Palette,
  ShieldCheck,
  Globe,
  KeyRound,
  LogOut,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { InteractionPreferencesControl } from '@/components/motion/FeedbackControls';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

export default function AdminSettingsPage() {
  const { user, logoutAll, isLoading } = useAuth();
  const { toast } = useToast();
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  const handleRevokeAllSessions = async () => {
    try {
      await logoutAll();
      toast({
        variant: 'info',
        title: 'All sessions signed out',
        description: 'Every active administrator refresh session has been invalidated.',
      });
    } catch {
      toast({
        variant: 'error',
        title: 'Session revocation failed',
        description: 'Unable to sign out all devices right now. Please retry.',
      });
    } finally {
      setRevokeDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-secondary" aria-hidden="true" />
          <span>Administrator &amp; System Settings</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your administrator account preferences, appearance, notifications, platform governance modules, and session security.
        </p>
      </div>

      {/* Admin Profile Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Administrator Profile</span>
          </CardTitle>
          <CardDescription>Authenticated platform governance identity</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar name={user?.name || 'Platform Admin'} size="lg" status="online" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {user?.name || 'Platform Administrator'}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <Badge variant="primary" size="sm">
                  ROLE: {user?.role || 'ADMIN'}
                </Badge>
                {user?.emailVerified && (
                  <Badge variant="success" size="sm">
                    Email Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/roles">
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              <span>View Role Policies</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Theme & Accessibility Feedback Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-secondary" aria-hidden="true" />
              <span>Workspace Appearance</span>
            </CardTitle>
            <CardDescription>
              Switch between Light, Dark, and System themes across all Control Center views
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              Theme preference persists locally and respects OS contrast preferences.
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sound &amp; Haptic Interaction Preferences</CardTitle>
            <CardDescription>
              Optional subtle interaction audio/vibration feedback (respects reduced-motion)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InteractionPreferencesControl />
          </CardContent>
        </Card>
      </div>

      {/* Governance Configuration Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'Notification Preferences',
            description: 'Configure operational alert channels and quiet hours',
            href: '/admin/notifications/preferences',
            icon: Bell,
          },
          {
            title: 'ABDM Platform Configuration',
            description: 'Inspect sandbox onboarding readiness and FHIR validation',
            href: '/admin/integrations/abdm',
            icon: Globe,
          },
          {
            title: 'Data Protection & Key Rotation',
            description: 'Monitor KMS provider health, private storage AV, and DR',
            href: '/admin/security/data-protection',
            icon: ShieldCheck,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-border bg-card p-4 shadow-xs hover:border-primary/40 hover-lift transition-all focus-ring flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <ArrowRight
                  className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Account Security & Session Management */}
      <Card className="border-rose-200/70 dark:border-rose-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-4 w-4 text-error" aria-hidden="true" />
            <span>Account Security &amp; Session Management</span>
          </CardTitle>
          <CardDescription>
            Protect privileged administrative sessions. Sensitive security operations require explicit confirmation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground max-w-xl">
            Revoking all sessions immediately invalidates every active refresh token across browsers and devices associated with your administrator account.
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setRevokeDialogOpen(true)}
            disabled={isLoading}
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign Out All Devices</span>
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={revokeDialogOpen}
        onClose={() => !isLoading && setRevokeDialogOpen(false)}
        title="Sign Out All Administrator Devices?"
        description="This action revokes all active refresh tokens for your administrator account and ends your current session."
      >
        <p className="text-xs text-muted-foreground leading-relaxed">
          You will be redirected to the login screen and required to re-authenticate before accessing administrative controls again.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRevokeDialogOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => void handleRevokeAllSessions()}
            disabled={isLoading}
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Confirm Global Sign-Out</span>
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
