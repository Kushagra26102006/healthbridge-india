'use client';

import React from 'react';
import Link from 'next/link';
import {
  Settings,
  ShieldCheck,
  Building2,
  Network,
  KeyRound,
  Bell,
  Sun,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { InteractionPreferencesControl } from '@/components/motion';
import { RolePrivacyBanner } from '@/components/security/RolePrivacyBanner';

export default function LaboratorySettingsPage() {
  const sections = [
    {
      title: 'Facility Profile & Credentials',
      description:
        'Update laboratory details, facility address, contact info, and statutory registration documents.',
      href: '/laboratory/profile',
      icon: ShieldCheck,
      tone: 'bg-secondary/12 text-secondary',
      cta: 'Manage Lab Profile',
    },
    {
      title: 'Collection Center Network',
      description:
        'Configure phlebotomy centers, operating windows, and specimen transit routing.',
      href: '/laboratory/collection-centers',
      icon: Building2,
      tone: 'bg-primary/12 text-primary',
      cta: 'Configure Centers',
    },
    {
      title: 'Laboratory Departments',
      description:
        'Organize Hematology, Biochemistry, Pathology, Microbiology, and diagnostic sections.',
      href: '/laboratory/departments',
      icon: Network,
      tone: 'bg-indigo-500/12 text-indigo-600 dark:text-indigo-400',
      cta: 'Manage Departments',
    },
    {
      title: 'Staff Role Permissions',
      description:
        'Review access matrices for technicians, reviewers, pathologists, and lab administrators.',
      href: '/laboratory/staff/permissions',
      icon: KeyRound,
      tone: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
      cta: 'Inspect Permissions',
    },
    {
      title: 'Notification Preferences',
      description:
        'Configure alerts for new physician orders, critical lab results, and QC exceptions.',
      href: '/laboratory/notifications/preferences',
      icon: Bell,
      tone: 'bg-cyan-500/12 text-cyan-700 dark:text-cyan-400',
      cta: 'Configure Alerts',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
          <Settings className="w-3.5 h-3.5" aria-hidden="true" />
          <span>LIMS Configuration &amp; Preferences</span>
        </div>
        <h1 className="text-page-heading">Laboratory Settings &amp; Workspace</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage laboratory profile, collection centers, departments, permissions, display theme,
          and interaction feedback preferences.
        </p>
      </div>

      <RolePrivacyBanner role="LABORATORY" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="p-5 flex flex-col justify-between hover-lift">
              <div className="space-y-2.5">
                <div
                  className={`w-10 h-10 rounded-md flex items-center justify-center ${item.tone}`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h2 className="text-card-heading">{item.title}</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
              <div className="mt-4 pt-3.5 border-t border-border/70">
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <span>{item.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </Card>
          );
        })}

        {/* Display Theme */}
        <Card className="hover-lift">
          <CardHeader className="pb-3 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-amber-500/12 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sun className="h-4 w-4" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-semibold">Workspace Theme</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Switch between Light, Dark, or System display modes for high-clarity lab benches.
            </p>
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border/70">
              <span className="font-medium text-foreground">Display Mode</span>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 lg:col-span-3">
          <InteractionPreferencesControl />
        </div>
      </div>
    </div>
  );
}
