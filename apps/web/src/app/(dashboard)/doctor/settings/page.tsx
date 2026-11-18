'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Building2,
  Lock,
  Laptop,
  Bell,
  Clock,
  ChevronRight,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { InteractionPreferencesControl } from '@/components/motion';
import { SettingsNav } from '@/components/doctor/settings';
import {
  useDoctorProfile,
  useDoctorSessions,
  useDoctorPracticeSettings,
} from '@/features/doctor/hooks/use-doctor';

export default function DoctorSettingsHubPage() {
  const { profile } = useDoctorProfile();
  const { sessions } = useDoctorSessions();
  const { practiceSettings } = useDoctorPracticeSettings();

  const settingsCards = [
    {
      title: 'Professional Profile & Credentials',
      description:
        'Manage clinical biography, spoken languages, qualifications, and upload medical registration certificates',
      href: '/doctor/settings/professional',
      icon: UserCheck,
      badge: profile?.verificationStatus || 'PROFILE',
      badgeVariant: (profile?.verificationStatus === 'VERIFIED' ? 'success' : 'info') as
        | 'success'
        | 'info',
      color: 'text-primary bg-primary/12',
    },
    {
      title: 'Practice & Facility Settings',
      description:
        'Configure associated hospital, consultation modes, fees, slot durations, and buffer times',
      href: '/doctor/settings/practice',
      icon: Building2,
      badge: practiceSettings?.facilityName || 'Affiliated Facility',
      badgeVariant: 'teal' as const,
      color: 'text-secondary bg-secondary/12',
    },
    {
      title: 'Security & Password Credentials',
      description:
        'Update account password with live complexity checks and review clinical security safeguards',
      href: '/doctor/settings/security',
      icon: Lock,
      badge: 'Protected',
      badgeVariant: 'info' as const,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/12',
    },
    {
      title: 'Active Sessions & Workstations',
      description:
        'Inspect active clinic browser sessions and terminate unrecognized workstations immediately',
      href: '/doctor/settings/sessions',
      icon: Laptop,
      badge: `${sessions.length} Active`,
      badgeVariant: 'warning' as const,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/12',
    },
    {
      title: 'Notification Preferences',
      description:
        'Configure delivery channels (In-App, Email, SMS) for appointments, patient check-ins, and reminders',
      href: '/doctor/settings/notifications',
      icon: Bell,
      badge: 'Channels',
      badgeVariant: 'neutral' as const,
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/12',
    },
    {
      title: 'Weekly Consultation Schedule',
      description:
        'Configure recurring weekly availability windows, break intervals, and blocked leave dates',
      href: '/doctor/schedule',
      icon: Clock,
      badge: 'Schedule',
      badgeVariant: 'info' as const,
      color: 'text-primary bg-primary/12',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl pb-12">
      <div>
        <h1 className="text-page-heading">Doctor Practice &amp; Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage clinical credentials, hospital affiliation, availability, display theme, sound
          preferences, and account security
        </p>
      </div>

      <SettingsNav />

      {/* Practice & Account Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {settingsCards.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group block focus-ring rounded-lg">
              <Card className="h-full hover-lift">
                <CardContent className="p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`p-2.5 rounded-md shrink-0 mt-0.5 ${item.color}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </h2>
                        <Badge variant={item.badgeVariant} size="sm">
                          {item.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
                    aria-hidden="true"
                  />
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {/* Display Theme & Appearance */}
        <Card className="hover-lift">
          <CardHeader className="pb-3 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-amber-500/12 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sun className="h-4 w-4" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-semibold">Workspace Display Theme</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Choose Light, Dark, or System display mode optimized for extended clinical review.
            </p>
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border/70">
              <span className="font-medium text-foreground">Interface Theme</span>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Optional Sound & Haptic Preferences */}
        <InteractionPreferencesControl />
      </div>

      {/* Clinical Data Governance Note */}
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-md bg-secondary/12 text-secondary shrink-0 mt-0.5">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h3 className="font-semibold text-sm text-foreground">
                Consent-Scoped Clinical Access &amp; Auditability
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Patient record access inside the Doctor Workspace is restricted to authorized
                encounters and active patient consent artefacts, with full access audit logging.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href="/doctor/profile">View Public Profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
