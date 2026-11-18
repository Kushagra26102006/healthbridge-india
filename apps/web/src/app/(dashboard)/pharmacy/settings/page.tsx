'use client';

import React from 'react';
import Link from 'next/link';
import {
  Settings,
  Building2,
  FileText,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
  Laptop,
  Bell,
  ArrowRight,
  Sun,
} from 'lucide-react';
import {
  usePharmacyProfile,
  usePharmacyOperatingHours,
  usePharmacyServices,
  usePharmacyStaffList,
  usePharmacySessions,
} from '@/features/pharmacy/hooks/use-pharmacy';
import { PharmacySettingsNav } from '@/components/pharmacy/settings/PharmacySettingsNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { InteractionPreferencesControl } from '@/components/motion';
import { HealthcareStatusBadge } from '@/components/healthcare';

export default function PharmacySettingsPage() {
  const { data: profile } = usePharmacyProfile();
  const { data: operatingHours } = usePharmacyOperatingHours();
  const { data: services } = usePharmacyServices();
  const { data: staffData } = usePharmacyStaffList();
  const { data: sessions } = usePharmacySessions();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
          <Settings className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Configuration, Operations &amp; Security</span>
        </div>
        <h1 className="text-page-heading">Pharmacy Portal Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage establishment details, statutory licenses, operating hours, dispensary staff,
          display theme, and account security.
        </p>
      </div>

      <PharmacySettingsNav />

      {/* Settings Cards Grid (100% Semantic Light & Dark Mode) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card className="p-5 flex flex-col justify-between hover-lift">
          <div>
            <div className="w-10 h-10 rounded-md bg-primary/12 text-primary flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-card-heading">General Information</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Establishment name, store branding, contact phone, dispensary email, and address.
            </p>
            <div className="mt-3 text-xs bg-muted/40 p-2.5 rounded-md border border-border/70">
              <span className="font-semibold text-foreground block truncate">
                {profile?.pharmacyName || 'HealthBridge Pharmacy'}
              </span>
              <span className="text-muted-foreground truncate block">{profile?.email || 'N/A'}</span>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-border/70">
            <Link
              href="/pharmacy/settings/general"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>Manage General Info</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover-lift">
          <div>
            <div className="w-10 h-10 rounded-md bg-secondary/12 text-secondary flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-card-heading">Business &amp; Licensing</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Drug license credentials, GSTIN registration, and statutory verification documents.
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <HealthcareStatusBadge status={profile?.verificationStatus || 'PENDING'} size="sm" />
              <span className="text-xs font-mono text-muted-foreground truncate">
                {profile?.pharmacyLicenseNumber || 'DL-PENDING'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-border/70">
            <Link
              href="/pharmacy/settings/business"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
            >
              <span>View Statutory Credentials</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover-lift">
          <div>
            <div className="w-10 h-10 rounded-md bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-card-heading">Operating Hours</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Weekly dispensary schedule, break intervals, closures, and timezone configuration.
            </p>
            <div className="mt-3 flex items-center gap-2.5 flex-wrap">
              <StatusIndicator
                status={operatingHours?.isOpenNow ? 'online' : 'offline'}
                label={operatingHours?.isOpenNow ? 'Open Now' : 'Closed'}
                size="sm"
              />
              <span className="text-xs text-muted-foreground">
                {operatingHours?.timezone || 'Asia/Kolkata'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-border/70">
            <Link
              href="/pharmacy/settings/operating-hours"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>Configure Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover-lift">
          <div>
            <div className="w-10 h-10 rounded-md bg-cyan-500/12 text-cyan-700 dark:text-cyan-400 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-card-heading">Services &amp; Fulfillment</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Prescription dispensing, in-store pickup, chronic refills, and delivery policies.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {services?.dispensingEnabled && (
                <Badge variant="neutral" size="sm">
                  Dispensing
                </Badge>
              )}
              {services?.inStorePickupEnabled && (
                <Badge variant="neutral" size="sm">
                  Pickup Ready
                </Badge>
              )}
              {services?.chronicRefillProgramEnabled && (
                <Badge variant="neutral" size="sm">
                  Chronic Refills
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-border/70">
            <Link
              href="/pharmacy/settings/services"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>Manage Services</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover-lift">
          <div>
            <div className="w-10 h-10 rounded-md bg-amber-500/12 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-card-heading">Staff Management</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Dispensary staff invitations, pharmacist credentials, and role-based permissions.
            </p>
            <div className="mt-3 text-xs text-muted-foreground tabular-nums">
              <strong className="text-foreground">{staffData?.total || 0}</strong> registered staff
              members
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-border/70">
            <Link
              href="/pharmacy/settings/staff"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>Manage Staff</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover-lift">
          <div>
            <div className="w-10 h-10 rounded-md bg-red-500/12 text-error flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-card-heading">Account Security</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Update portal credentials, enforce password complexity, and protect session tokens.
            </p>
          </div>
          <div className="mt-4 pt-3.5 border-t border-border/70">
            <Link
              href="/pharmacy/settings/security"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>Security Settings</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover-lift">
          <div>
            <div className="w-10 h-10 rounded-md bg-secondary/12 text-secondary flex items-center justify-center mb-3">
              <Laptop className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-card-heading">Active Sessions</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Inspect connected pharmacy terminals and revoke unrecognized sessions.
            </p>
            <div className="mt-3 text-xs text-muted-foreground tabular-nums">
              <strong className="text-foreground">{sessions?.length || 1}</strong> active session(s)
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-border/70">
            <Link
              href="/pharmacy/settings/sessions"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>Inspect Sessions</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between hover-lift">
          <div>
            <div className="w-10 h-10 rounded-md bg-primary/12 text-primary flex items-center justify-center mb-3">
              <Bell className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-card-heading">Notifications &amp; Alerts</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Configure low-stock, expiry, prescription, and order notification preferences.
            </p>
          </div>
          <div className="mt-4 pt-3.5 border-t border-border/70">
            <Link
              href="/pharmacy/settings/notifications"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>Notification Preferences</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </Card>

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
              Switch between Light, Dark, or System display modes across all pharmacy tools.
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
