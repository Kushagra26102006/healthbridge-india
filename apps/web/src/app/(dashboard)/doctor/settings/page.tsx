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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
      description: 'Manage clinical biography, spoken languages, qualifications, and upload SMC certificates',
      href: '/doctor/settings/professional',
      icon: UserCheck,
      badge: profile?.verificationStatus || 'VERIFIED',
      badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      color: 'text-blue-600 bg-blue-500/10',
    },
    {
      title: 'Practice & Facility Settings',
      description: 'Configure associated hospital, consultation modes, fees, slot durations, and buffer times',
      href: '/doctor/settings/practice',
      icon: Building2,
      badge: practiceSettings?.facilityName || 'Affiliated Facility',
      badgeColor: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
      color: 'text-teal-600 bg-teal-500/10',
    },
    {
      title: 'Security & Password Credentials',
      description: 'Update account password with live complexity meter and review ABDM security policies',
      href: '/doctor/settings/security',
      icon: Lock,
      badge: 'Protected',
      badgeColor: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      color: 'text-indigo-600 bg-indigo-500/10',
    },
    {
      title: 'Active Sessions & Workstations',
      description: 'Inspect active browser logins and terminate unrecognized clinic workstations',
      href: '/doctor/settings/sessions',
      icon: Laptop,
      badge: `${sessions.length} Active`,
      badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
      color: 'text-amber-600 bg-amber-500/10',
    },
    {
      title: 'Notification Preferences',
      description: 'Configure routing channels (In-App, Email, SMS) for appointments, check-ins, and reminders',
      href: '/doctor/settings/notifications',
      icon: Bell,
      badge: 'Configured',
      badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
      color: 'text-purple-600 bg-purple-500/10',
    },
    {
      title: 'Weekly Consultation Schedule',
      description: 'Configure 7-day recurring clinic shifts, break intervals, and blocked leave dates',
      href: '/doctor/schedule',
      icon: Clock,
      badge: 'Manage Slots',
      badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
      color: 'text-blue-600 bg-blue-500/10',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          Doctor Practice & Account Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage clinical credentials, practice facilities, consultation preferences, security safeguards, and notifications
        </p>
      </div>

      <SettingsNav />

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {settingsCards.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
            >
              <Card className="h-full border border-border/80 bg-card hover:border-blue-500/40 hover:shadow-md transition-all">
                <CardContent className="p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h3>
                        {item.badge && (
                          <Badge className={`text-[10px] font-semibold border ${item.badgeColor}`}>
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* ABDM Compliance Banner */}
      <Card className="border border-border/80 bg-gradient-to-r from-card via-card to-teal-500/5 shadow-sm">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-foreground">
                ABDM Healthcare Professionals Registry (HPR) Verified
              </h4>
              <p className="text-muted-foreground">
                Your medical practice settings adhere to National Health Authority standards. All clinical documents and encounters are encrypted and digitally signed.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="text-xs h-8 shrink-0">
            <Link href="/doctor/profile">View Public Profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
